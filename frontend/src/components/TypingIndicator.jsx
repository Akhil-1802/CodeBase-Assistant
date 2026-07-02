export default function TypingIndicator() {
  return (
    <div className="flex gap-3 justify-start">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-sm font-bold">
        A
      </div>
      <div className="bg-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
        <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}
