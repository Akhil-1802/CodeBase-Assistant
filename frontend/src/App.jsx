import { useState, useRef, useEffect } from "react";
import Message from "./components/Message";
import TypingIndicator from "./components/TypingIndicator";
import Sidebar from "./components/Sidebar";

const WELCOME = {
  role: "agent",
  content:
    "Hi! I'm your **Codebase Assistant**. Load a GitHub repository to get started, or ask me any programming question.\n\nExample: `Load https://github.com/user/repo`",
};

export default function App() {
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeRepo, setActiveRepo] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text) {
    const query = text.trim();
    if (!query || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: query }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query }),
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const data = await res.json();

      if (data.active_repo) setActiveRepo(data.active_repo);

      setMessages((prev) => [
        ...prev,
        { role: "agent", content: data.response, intent: data.intent },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "agent",
          content: `**Error:** ${err.message}. Make sure the backend is running on port 8000.`,
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden">
      <Sidebar activeRepo={activeRepo} onSuggestion={(s) => sendMessage(s)} />

      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <header className="flex-shrink-0 h-14 bg-zinc-900 border-b border-zinc-800 flex items-center px-6 gap-3">
          <div className="w-3 h-3 rounded-full bg-violet-500 animate-pulse" />
          <h1 className="font-semibold text-white">Agent Chat</h1>
          {activeRepo && (
            <span className="ml-auto text-xs bg-zinc-800 text-violet-300 px-3 py-1 rounded-full border border-zinc-700">
              {activeRepo}
            </span>
          )}
        </header>

        {/* Messages */}
        <main className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {messages.map((msg, i) => (
            <Message key={i} role={msg.role} content={msg.content} intent={msg.intent} />
          ))}
          {loading && <TypingIndicator />}
          <div ref={bottomRef} />
        </main>

        {/* Input */}
        <footer className="flex-shrink-0 bg-zinc-900 border-t border-zinc-800 p-4">
          <div className="flex items-end gap-3 bg-zinc-800 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-violet-500 transition-all">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your codebase or load a repo..."
              className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 resize-none outline-none max-h-36 leading-relaxed"
              style={{ overflowY: input.split("\n").length > 4 ? "auto" : "hidden" }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="flex-shrink-0 w-9 h-9 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.668 5.647H10.5a.75.75 0 0 1 0 1.5H3.947l-1.668 5.647a.75.75 0 0 0 .826.95 28.897 28.897 0 0 0 15.208-8.291.75.75 0 0 0 0-1.112A28.897 28.897 0 0 0 3.105 2.288Z" />
              </svg>
            </button>
          </div>
          <p className="text-center text-xs text-zinc-600 mt-2">
            Press Enter to send · Shift+Enter for new line
          </p>
        </footer>
      </div>
    </div>
  );
}
