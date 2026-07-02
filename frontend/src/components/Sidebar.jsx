const suggestions = [
  "Load https://github.com/user/repo",
  "Explain the main entry point",
  "Analyze this repository",
  "Find all API routes",
  "Generate a README",
  "Suggest improvements",
];

export default function Sidebar({ activeRepo, onSuggestion }) {
  return (
    <aside className="w-64 flex-shrink-0 bg-zinc-900 border-r border-zinc-800 flex flex-col">
      <div className="p-5 border-b border-zinc-800">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-violet-500" />
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
            Active Repo
          </span>
        </div>
        <p className="text-sm text-white font-medium mt-2 truncate">
          {activeRepo ?? (
            <span className="text-zinc-500 italic">None loaded</span>
          )}
        </p>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">
          Quick Actions
        </p>
        <div className="flex flex-col gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => onSuggestion(s)}
              className="text-left text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg px-3 py-2 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-zinc-800">
        <p className="text-xs text-zinc-600 text-center">
          Multi-Agent Codebase Assistant
        </p>
      </div>
    </aside>
  );
}
