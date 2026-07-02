import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const INTENT_LABELS = {
  repo_load: { label: "Repo Load", color: "text-emerald-400 bg-emerald-950 border-emerald-800" },
  explain: { label: "Explain", color: "text-blue-400 bg-blue-950 border-blue-800" },
  analyze: { label: "Analyze", color: "text-yellow-400 bg-yellow-950 border-yellow-800" },
  document: { label: "Document", color: "text-orange-400 bg-orange-950 border-orange-800" },
  suggest_changes: { label: "Suggest Changes", color: "text-pink-400 bg-pink-950 border-pink-800" },
  search: { label: "Search", color: "text-cyan-400 bg-cyan-950 border-cyan-800" },
  general: { label: "General", color: "text-zinc-400 bg-zinc-800 border-zinc-700" },
};

export default function Message({ role, content, intent }) {
  const isUser = role === "user";
  const intentMeta = intent ? INTENT_LABELS[intent] : null;

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-sm font-bold">
          A
        </div>
      )}

      <div className={`max-w-[78%] flex flex-col gap-1.5 ${isUser ? "items-end" : "items-start"}`}>
        {intentMeta && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${intentMeta.color}`}>
            {intentMeta.label}
          </span>
        )}

        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "bg-violet-600 text-white rounded-tr-sm"
              : "bg-zinc-800 text-zinc-100 rounded-tl-sm"
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{content}</p>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ className, children, ...props }) {
                  const isBlock = className?.startsWith("language-");
                  return isBlock ? (
                    <pre className="bg-zinc-900 rounded-lg p-3 mt-2 mb-2 overflow-x-auto text-xs border border-zinc-700">
                      <code className={className} {...props}>{children}</code>
                    </pre>
                  ) : (
                    <code className="bg-zinc-700 px-1 py-0.5 rounded text-violet-300 text-xs" {...props}>
                      {children}
                    </code>
                  );
                },
                pre({ children }) {
                  return <>{children}</>;
                },
                p({ children }) {
                  return <p className="mb-2 last:mb-0">{children}</p>;
                },
                ul({ children }) {
                  return <ul className="list-disc list-outside ml-4 space-y-1 mb-2">{children}</ul>;
                },
                ol({ children }) {
                  return <ol className="list-decimal list-outside ml-4 space-y-1 mb-2">{children}</ol>;
                },
                li({ children }) {
                  return <li className="text-zinc-200">{children}</li>;
                },
                h1({ children }) {
                  return <h1 className="text-base font-bold mb-2 text-white border-b border-zinc-700 pb-1">{children}</h1>;
                },
                h2({ children }) {
                  return <h2 className="text-sm font-semibold mt-3 mb-1.5 text-white">{children}</h2>;
                },
                h3({ children }) {
                  return <h3 className="text-sm font-semibold mt-2 mb-1 text-violet-300">{children}</h3>;
                },
                strong({ children }) {
                  return <strong className="font-semibold text-white">{children}</strong>;
                },
                hr() {
                  return <hr className="border-zinc-700 my-3" />;
                },
                blockquote({ children }) {
                  return (
                    <blockquote className="border-l-2 border-violet-500 pl-3 text-zinc-300 italic my-2">
                      {children}
                    </blockquote>
                  );
                },
                table({ children }) {
                  return (
                    <div className="overflow-x-auto my-2">
                      <table className="text-xs border-collapse w-full">{children}</table>
                    </div>
                  );
                },
                th({ children }) {
                  return <th className="border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-left font-semibold text-violet-300">{children}</th>;
                },
                td({ children }) {
                  return <td className="border border-zinc-700 px-3 py-1.5 text-zinc-300">{children}</td>;
                },
              }}
            >
              {content}
            </ReactMarkdown>
          )}
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-white text-sm font-bold">
          U
        </div>
      )}
    </div>
  );
}
