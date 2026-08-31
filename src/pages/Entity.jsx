import React, { useEffect, useRef, useState } from "react";
import { ArrowUp, Paperclip, RotateCcw } from "lucide-react";
import EntityMessage from "@/components/entity/EntityMessage";

const INITIAL_MESSAGE = "Bonjour, moi c’est Entity. Et toi ?";

async function invokeEntity(messages) {
  const response = await fetch("/api/entity", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error || "Erreur serveur");
  return data;
}

export default function Entity() {
  const [messages, setMessages] = useState([{ role: "assistant", content: INITIAL_MESSAGE }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend(e) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    try {
      const data = await invokeEntity(nextMessages);
      setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Je n'ai pas pu répondre cette fois. Réessaie dans un instant." }]);
      console.error("Entité:", error);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleReset() {
    setMessages([{ role: "assistant", content: INITIAL_MESSAGE }]);
    setInput("");
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  return (
    <div className="min-h-screen bg-[#11110f] text-stone-100 flex flex-col">
      <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#11110f]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15"><span className="h-1.5 w-1.5 rounded-full bg-stone-200" /></div>
            <div><div className="text-[14px] font-medium tracking-wide text-stone-100">L'Entité</div><div className="text-[10px] tracking-[0.16em] text-stone-600 uppercase">conversation</div></div>
          </div>
          <button type="button" onClick={handleReset} className="inline-flex h-9 items-center gap-2 rounded-full px-3 text-xs text-stone-500 transition-colors hover:bg-white/[0.05] hover:text-stone-300" title="Nouvelle conversation"><RotateCcw className="h-3.5 w-3.5" /><span className="hidden sm:inline">Nouveau</span></button>
        </div>
      </header>

      <main ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-5 sm:px-8">
          <div className="space-y-7 pb-36 pt-10">
            {messages.map((message, index) => <EntityMessage key={`${message.role}-${index}`} role={message.role} content={message.content} />)}
            {loading && <div className="flex items-center gap-2 px-1 py-3 text-stone-600"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-stone-500" /><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-stone-600 [animation-delay:150ms]" /><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-stone-700 [animation-delay:300ms]" /></div>}
          </div>
        </div>
      </main>

      <div className="sticky bottom-0 z-20 bg-gradient-to-t from-[#11110f] via-[#11110f] to-transparent px-4 pb-5 pt-8 sm:px-6 sm:pb-7">
        <form onSubmit={handleSend} className="mx-auto max-w-3xl">
          <div className="rounded-[26px] border border-white/[0.1] bg-[#1a1a17] p-2 shadow-2xl shadow-black/20 transition-colors focus-within:border-white/[0.18]">
            <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }} rows={1} placeholder="Répondre…" disabled={loading} className="max-h-40 min-h-[54px] w-full resize-none bg-transparent px-4 pb-2 pt-3 text-[15px] leading-6 text-stone-100 outline-none placeholder:text-stone-600" />
            <div className="flex items-center justify-between px-1 pb-1">
              <button type="button" className="flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-full text-stone-600" title="Ajout de fichiers — prochaine étape" aria-label="Ajouter un fichier" disabled><Paperclip className="h-4 w-4" /></button>
              <button type="submit" disabled={!input.trim() || loading} className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-[#11110f] transition-all hover:bg-white disabled:scale-95 disabled:bg-stone-700 disabled:text-stone-500" aria-label="Envoyer"><ArrowUp className="h-4 w-4" /></button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
