// /api/chat — streams Claude responses with function-calling tools that
// query the authed user's traffic in Supabase. Agentic loop: Claude can
// call tools, we run them locally, feed results back, until it finalizes.
//
// SSE event types emitted to the client:
//   { type: "text", delta: string }       — token from Claude's answer
//   { type: "tool_start", name, label }   — Claude is about to use a tool
//   { type: "tool_done", name }           — tool finished (compact UX hint)
//   { type: "done" }                      — message complete
//   { type: "error", message }            — fatal error

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import {
  findByHost,
  getAlerts,
  getSummary,
  queryTraffic,
  type ConnectionState,
} from "@/data/traffic";

export const runtime = "nodejs";

const MODEL = "claude-sonnet-4-6";

const BASE_SYSTEM_PROMPT = `You are NetGuard's AI security co-pilot. The user is a privacy-conscious technical individual watching their own machine's network traffic.

Style:
- Plain English, calm and confident, never panicky.
- Lead with the answer, then the reasoning. Short paragraphs.
- Reference specific data (process names, IPs, ports, byte counts) from tool results. Never invent.
- When you flag something, classify it as "safe", "watch", or "alert" with one-line reasoning.
- For destructive suggestions (blocking, killing), recommend but never claim to act. The user takes the action.

Punctuation rules (strict):
- Do NOT use em-dashes (—) or en-dashes (–) anywhere in your replies. Use a comma, period, colon, or parentheses instead.
- Avoid "X — Y" constructions entirely. If you'd reach for a dash, rewrite the sentence.
- Regular hyphens in compound words (e.g. "co-pilot", "real-time") are fine.

Use tools to ground every answer in real data. Don't speculate when a tool can answer.`;

const ONBOARDING_SUFFIX = `\n\nIMPORTANT: The user has not installed the NetGuard agent yet — there is zero traffic data to query. Any question about traffic should NOT use tools (they will return empty). Instead, in a friendly one-paragraph reply, explain that you need their agent running to see anything, and point them to /install where the install command is waiting. After they install the agent and traffic starts flowing, the tools will return real data.`;

const TOOLS: Anthropic.Tool[] = [
  {
    name: "get_summary",
    description:
      "Get current network summary: total connections, alerts count, watchlist count, agent uptime, hostname. Use first for 'what's happening' style questions.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_alerts",
    description:
      "Get all connections currently flagged as 'alert' or 'watch', grouped by host:port with counts. Use for 'anything suspicious' type questions.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "query_traffic",
    description:
      "Query the connection log. Filter by state ('safe'|'watch'|'alert'), by app substring (e.g. 'chrome'), or by time window. Returns up to 40 matching connections.",
    input_schema: {
      type: "object",
      properties: {
        state: { type: "string", enum: ["safe", "watch", "alert"] },
        app: { type: "string", description: "Case-insensitive substring match against the app name" },
        sinceMinutes: { type: "number", description: "Only return connections from the last N minutes (default 60)" },
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
        pattern: { type: "string", description: "Substring of the host (e.g. 'adcorp', '185.143') or a 2-letter country code (e.g. 'RO')" },
      },
      required: ["pattern"],
    },
  },
];

async function runTool(
  userId: string,
  name: string,
  input: Record<string, unknown>
): Promise<unknown> {
  switch (name) {
    case "get_summary":
      return await getSummary(userId);
    case "get_alerts":
      return await getAlerts(userId);
    case "query_traffic":
      return await queryTraffic(userId, {
        state: input.state as ConnectionState | undefined,
        app: input.app as string | undefined,
        sinceMinutes: input.sinceMinutes as number | undefined,
      });
    case "find_by_host":
      return await findByHost(userId, input.pattern as string);
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
      `data: ${JSON.stringify({ type: "error", message: "Server is missing ANTHROPIC_API_KEY" })}\n\n`,
      { status: 200, headers: { "Content-Type": "text/event-stream" } }
    );
  }

  // Verify the user is signed in.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response(
      `data: ${JSON.stringify({ type: "error", message: "Sign in to chat with NetGuard." })}\n\n`,
      { status: 200, headers: { "Content-Type": "text/event-stream" } }
    );
  }

  let body: { messages: ClientMessage[] };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  // Check whether the user has any traffic yet — drives the onboarding-mode
  // system prompt suffix.
  const summary = await getSummary(user.id);
  const isOnboarding = summary.totalConnections24h === 0;
  const systemPrompt = isOnboarding ? BASE_SYSTEM_PROMPT + ONBOARDING_SUFFIX : BASE_SYSTEM_PROMPT;

  const client = new Anthropic({ apiKey });

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
                text: systemPrompt,
                cache_control: { type: "ephemeral" },
              },
            ],
            tools: TOOLS.map((t, i) =>
              i === TOOLS.length - 1 ? { ...t, cache_control: { type: "ephemeral" } } : t
            ) as Anthropic.Tool[],
            messages: convo,
          });

          for (const block of response.content) {
            if (block.type === "text") {
              const words = block.text.split(/(\s+)/);
              for (const w of words) if (w) sse({ type: "text", delta: w });
            }
          }

          const toolUses = response.content.filter(
            (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
          );

          if (toolUses.length === 0 || response.stop_reason !== "tool_use") {
            sse({ type: "done" });
            controller.close();
            return;
          }

          convo = [...convo, { role: "assistant", content: response.content }];

          const toolResults: Anthropic.ToolResultBlockParam[] = [];
          for (const tu of toolUses) {
            sse({ type: "tool_start", name: tu.name, label: toolLabel(tu.name) });
            const result = await runTool(user.id, tu.name, tu.input as Record<string, unknown>);
            sse({ type: "tool_done", name: tu.name });
            toolResults.push({
              type: "tool_result",
              tool_use_id: tu.id,
              content: JSON.stringify(result),
            });
          }

          convo = [...convo, { role: "user", content: toolResults }];
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
