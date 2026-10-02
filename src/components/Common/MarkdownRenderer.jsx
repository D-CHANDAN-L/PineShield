import React from 'react';
import ReactMarkdown from 'react-markdown';

/**
 * PineShield Markdown Renderer
 * Renders bold text, headers, lists, code, and links cleanly according to PineShield styling.
 */
export default function MarkdownRenderer({ content, className = '' }) {
  if (!content) return null;

  return (
    <div className={`prose-sm text-slate-800 dark:text-slate-200 leading-relaxed ${className}`}>
      <ReactMarkdown
        components={{
          h1: ({ node, ...props }) => (
            <h1 className="text-base font-bold text-slate-900 dark:text-white mt-3 mb-1.5 flex items-center gap-1.5" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mt-2.5 mb-1 flex items-center gap-1.5" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-2 mb-1 uppercase tracking-wider flex items-center gap-1.5" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="my-1.5 leading-relaxed text-xs sm:text-sm" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc pl-5 my-2 space-y-1 text-xs sm:text-sm" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal pl-5 my-2 space-y-1 text-xs sm:text-sm" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="leading-snug pl-0.5" {...props} />
          ),
          strong: ({ node, ...props }) => (
            <strong className="font-bold text-slate-900 dark:text-white" {...props} />
          ),
          em: ({ node, ...props }) => (
            <em className="italic text-slate-600 dark:text-slate-300" {...props} />
          ),
          code: ({ node, inline, ...props }) => (
            <code className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 text-xs font-mono text-emerald-600 dark:text-emerald-400" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-2 border-emerald-500 pl-3 my-2 text-xs italic text-slate-500 dark:text-slate-400" {...props} />
          ),
          a: ({ node, ...props }) => (
            <a className="text-sky-600 dark:text-sky-400 hover:underline font-medium" target="_blank" rel="noopener noreferrer" {...props} />
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
