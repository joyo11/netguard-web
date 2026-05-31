"use client";

// Rich markdown renderer for AI responses. Styled to match the NetGuard
// palette (cream text on charcoal, teal accents, mono for code). Tight
// vertical rhythm — chat replies should feel like a quick paragraph,
// not a blog post.

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

const components: Components = {
  p: ({ children }) => (
    <p className="text-[14px] leading-relaxed text-ng-ink/90 [&:not(:first-child)]:mt-2.5">
      {children}
    </p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-ng-ink">{children}</strong>
  ),
  em: ({ children }) => <em className="italic text-ng-ink/90">{children}</em>,
  ul: ({ children }) => (
    <ul className="mt-2 space-y-1 pl-1 text-[14px] leading-relaxed text-ng-ink/90">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mt-2 list-decimal space-y-1 pl-5 text-[14px] leading-relaxed text-ng-ink/90">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="flex gap-2">
      <span className="select-none text-ng-teal/70">•</span>
      <span className="flex-1">{children}</span>
    </li>
  ),
  h1: ({ children }) => (
    <h1 className="mt-3 text-[16px] font-semibold tracking-[-0.01em] text-ng-ink">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-3 text-[15px] font-semibold tracking-[-0.01em] text-ng-ink">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-2.5 text-[14px] font-semibold uppercase tracking-[0.06em] text-ng-sub">
      {children}
    </h3>
  ),
  code: ({ className, children }) => {
    const isInline = !className?.includes("language-");
    if (isInline) {
      return (
        <code className="tnum rounded bg-white/[0.07] px-1 py-px font-mono text-[12.5px] text-ng-ink">
          {children}
        </code>
      );
    }
    return (
      <code className={`${className} block font-mono text-[12px] text-ng-sub`}>
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="mt-2 overflow-x-auto rounded-lg border border-white/[0.06] bg-[#080b10] p-3 leading-relaxed">
      {children}
    </pre>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-ng-teal underline decoration-ng-teal/40 underline-offset-2 hover:decoration-ng-teal"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mt-2 border-l-2 border-ng-teal/40 pl-3 text-[13.5px] italic text-ng-sub">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-3 border-white/[0.06]" />,
  table: ({ children }) => (
    <div className="mt-2 overflow-x-auto rounded-lg border border-white/[0.07]">
      <table className="w-full text-[13px]">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-white/[0.03] text-[11px] uppercase tracking-[0.1em] text-ng-faint">
      {children}
    </thead>
  ),
  th: ({ children }) => <th className="px-3 py-2 text-left font-medium">{children}</th>,
  td: ({ children }) => (
    <td className="border-t border-white/[0.05] px-3 py-2 text-ng-ink/90">{children}</td>
  ),
};

export function Markdown({ children }: { children: string }) {
  return (
    <div className="ng-md">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
