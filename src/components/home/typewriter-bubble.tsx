"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

/**
 * Streaming chat bubble with a typewriter reveal and markdown rendering.
 *
 * - `text` is the full buffer received so far (grows as tokens stream).
 * - `streaming` signals whether more tokens are still coming. While true
 *   we reveal at ~150 chars/sec to pace with incoming data; once false
 *   we drain any remaining buffer at ~500 chars/sec so the reader never
 *   has to wait after the API finishes.
 * - Revealed text is piped through ReactMarkdown + GFM so `**bold**`,
 *   `*italic*`, `- lists`, `` `code` ``, numbered lists, and blockquotes
 *   render properly instead of leaking markup.
 */
export function TypewriterBubble({
  text,
  streaming,
  className,
}: {
  text: string;
  streaming: boolean;
  className?: string;
}) {
  const [revealedCount, setRevealedCount] = useState(0);
  const textRef = useRef(text);
  textRef.current = text;

  useEffect(() => {
    if (revealedCount > text.length) {
      setRevealedCount(text.length);
      return;
    }
    if (revealedCount >= text.length) return;

    const remaining = text.length - revealedCount;
    const charsPerTick = streaming ? 2 : Math.max(4, Math.ceil(remaining / 40));
    const delay = streaming ? 13 : 8;

    const id = window.setTimeout(() => {
      setRevealedCount((prev) =>
        Math.min(textRef.current.length, prev + charsPerTick),
      );
    }, delay);
    return () => window.clearTimeout(id);
  }, [revealedCount, text, streaming]);

  const revealed = text.slice(0, revealedCount);
  const done = revealedCount >= text.length && !streaming;

  return (
    <div className={cn("space-y-2 text-sm leading-relaxed", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {revealed || (streaming ? "…" : "")}
      </ReactMarkdown>
      {!done && (
        <span
          aria-hidden
          className="ml-0.5 inline-block h-3.5 w-[3px] translate-y-[2px] animate-pulse rounded-sm bg-teal-500 align-baseline"
        />
      )}
    </div>
  );
}

const markdownComponents: Components = {
  p: ({ children }) => <p className="my-1.5 first:mt-0 last:mb-0">{children}</p>,
  strong: ({ children }) => (
    <strong className="font-semibold text-ink-950 dark:text-ink-50">
      {children}
    </strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => (
    <ul className="my-2 list-disc space-y-0.5 pl-5">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-2 list-decimal space-y-0.5 pl-5">{children}</ol>
  ),
  li: ({ children }) => <li className="marker:text-teal-500">{children}</li>,
  code: ({ children, className: codeClass }) => {
    const isBlock = codeClass && codeClass.startsWith("language-");
    if (isBlock) {
      return (
        <code className="block whitespace-pre-wrap rounded-md bg-black/5 p-2 font-mono text-[0.8rem] dark:bg-white/10">
          {children}
        </code>
      );
    }
    return (
      <code className="rounded bg-black/5 px-1 py-0.5 font-mono text-[0.85em] dark:bg-white/10">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="my-2 overflow-x-auto rounded-md bg-black/5 p-3 font-mono text-[0.8rem] leading-relaxed dark:bg-white/10">
      {children}
    </pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-teal-500 pl-3 italic text-ink-700 dark:text-ink-200">
      {children}
    </blockquote>
  ),
  h1: ({ children }) => (
    <h3 className="mt-3 mb-1.5 text-base font-semibold">{children}</h3>
  ),
  h2: ({ children }) => (
    <h3 className="mt-3 mb-1.5 text-base font-semibold">{children}</h3>
  ),
  h3: ({ children }) => (
    <h4 className="mt-2.5 mb-1 text-sm font-semibold">{children}</h4>
  ),
  h4: ({ children }) => (
    <h4 className="mt-2.5 mb-1 text-sm font-semibold">{children}</h4>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-teal-700 underline-offset-2 hover:underline dark:text-teal-400"
    >
      {children}
    </a>
  ),
  hr: () => <hr className="my-3 border-border" />,
};
