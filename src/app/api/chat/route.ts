// /api/chat — streams Claude responses with function-calling tools that
// query the (currently mock) traffic data. Agentic loop: Claude can call
// tools, we run them locally, feed results back, until it finalizes.
//
// SSE event types emitted to the client:
//   { type: "text", delta: string }       — token from Claude's answer
//   { type: "tool_start", name, label }   — Claude is about to use a tool
//   { type: "tool_done", name }           — tool finished (compact UX hint)
//   { type: "done" }                      — message complete
//   { type: "error", message }            — fatal error

import Anthropic from "@anthropic-ai/sdk";
import {
  findByHost,
  getAlerts,
  getSummary,
  queryTraffic,
  type ConnectionState,
} from "@/data/mock";

// Streaming responses run in Node runtime — no Edge limits + the SDK is happier.
export const runtime = "nodejs";

const MODEL = "claude-sonnet-4-6";

const SYSTEM_PROMPT = `You are NetGuard's AI security co-pilot. The user is a privacy-conscious technical individual watching their own machine's network traffic.

Style:
- Plain English, calm and confident, never panicky.
- Lead with the answer, then the reasoning. Short paragraphs.
- Reference specific data — process names, IPs, ports, byte counts — from tool results, never invent.
- When you flag something, classify it as "safe", "watch", or "alert" with one-line reasoning.
- For destructive suggestions (blocking, killing), recommend but never claim to act. The user takes the action.

Use tools to ground every answer in real data. Don't speculate when a tool can answer.`;

const TOOLS: Anthropic.Tool[] = [
  {
    name: "get_summary",
    description:
      "Get current network summary: total connections, alerts count, watchlist count, agent uptime, hostname. Use first for 'what's happening' style questions.",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_alerts",
    description:
      "Get all connections currently flagged as 'alert' or 'watch', grouped by host:port with counts. Use for 'anything suspicious' type questions.",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "query_traffic",
    description:
      "Query the connection log. Filter by state ('safe'|'watch'|'alert'), by app substring (e.g. 'chrome'), or both. Returns up to 40 matching connections.",
    input_schema: {
      type: "object",
      properties: {
        state: {
          type: "string",
          enum: ["safe", "watch", "alert"],
          description: "Filter to a specific state",
        },
        app: {
          type: "string",
          description: "Case-insensitive substring match against the app name",
        },
        sinceMinutes: {
          type: "number",
          description: "Only return connections from the last N minutes (informational; mock data spans ~15 min)",
        },
      },
    },
  },
  {
    name: "find_by_host",
    description:
      "Find connections whose host matches a pattern, or whose country code matches the pattern exactly. Use for 'what's been talking to X' style questions.",
    input_schema: {
      type: "object",
      properties: {
        pattern: {
          type: "string",
          description: "Substring of the host (e.g. 'adcorp', '185.143') or a 2-letter country code (e.g. 'RO')",
        },
      },
      required: ["pattern"],
    },
  },
];

function runTool(name: string, input: Record<string, unknown>): unknown {
  switch (name) {
    case "get_summary":
      return getSummary();
    case "get_alerts":
      return getAlerts();
    case "query_traffic":
      return queryTraffic({
        state: input.state as ConnectionState | undefined,
        app: input.app as string | undefined,
        sinceMinutes: input.sinceMinutes as number | undefined,
      });
    case "find_by_host":
      return findByHost(input.pattern as string);
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

function toolLabel(name: string): string {
  switch (name) {
    case "get_summary":   return "Pulling network summary…";
    case "get_alerts":    return "Checking alerts and watchlist…";
    case "query_traffic": return "Querying the connection log…";
    case "find_by_host":  return "Searching connections by host…";
    default:              return "Working…";
  }
}

type ClientMessage = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      `event: error\ndata: ${JSON.stringify({ message: "Server is missing ANTHROPIC_API_KEY" })}\n\n`,
      { status: 200, headers: { "Content-Type": "text/event-stream" } }
    );
  }

  let body: { messages: ClientMessage[] };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  // Convert incoming thread to Anthropic message format. Empty assistant
  // content (placeholders) are dropped — only real history is sent.
  const messages: Anthropic.MessageParam[] = body.messages
    .filter((m) => m.content && m.content.trim().length > 0)
    .map((m) => ({ role: m.role, content: m.content }));

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sse = (obj: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      };

      try {
        // Agentic loop: keep calling Claude until it stops requesting tools.
        let safety = 0;
        let convo = messages.slice();

        while (safety < 6) {
          safety += 1;

          const response = await client.messages.create({
            model: MODEL,
            max_tokens: 1024,
            system: [
              {
                type: "text",
                text: SYSTEM_PROMPT,
                cache_control: { type: "ephemeral" },
              },
            ],
            tools: TOOLS.map((t, i) =>
              i === TOOLS.length - 1
                ? { ...t, cache_control: { type: "ephemeral" } }
                : t
            ) as Anthropic.Tool[],
            messages: convo,
          });

          // Stream out any text blocks Claude produced this turn.
          for (const block of response.content) {
            if (block.type === "text") {
              // Approximate streaming by chunking on word boundaries.
              const words = block.text.split(/(\s+)/);
              for (const w of words) {
                if (w) sse({ type: "text", delta: w });
              }
            }
          }

          // If Claude wants to use tools, run them and feed results back.
          const toolUses = response.content.filter(
            (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
          );

          if (toolUses.length === 0 || response.stop_reason !== "tool_use") {
            // Done — Claude returned a final answer.
            sse({ type: "done" });
            controller.close();
            return;
          }

          // Append Claude's assistant message (with tool_use blocks) to history.
          convo = [
            ...convo,
            { role: "assistant", content: response.content },
          ];

          // Run each tool and emit progress events.
          const toolResults: Anthropic.ToolResultBlockParam[] = [];
          for (const tu of toolUses) {
            sse({
              type: "tool_start",
              name: tu.name,
              label: toolLabel(tu.name),
            });

            const result = runTool(tu.name, tu.input as Record<string, unknown>);

            sse({ type: "tool_done", name: tu.name });

            toolResults.push({
              type: "tool_result",
              tool_use_id: tu.id,
              content: JSON.stringify(result),
            });
          }

          convo = [
            ...convo,
            { role: "user", content: toolResults },
          ];
        }

        sse({ type: "error", message: "Tool loop exceeded safety limit" });
        controller.close();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        sse({ type: "error", message });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
