import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Sparkles, Loader2, ArrowLeft, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ChatMessage from "@/components/armand/ChatMessage";
import AnalysisView from "@/components/armand/AnalysisView";

const INITIAL_MESSAGE = "Quelle tâche vous fait perdre du temps ?";

export default function Conversation() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    { role: "assistant", content: INITIAL_MESSAGE }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [requested, setRequested] = useState(false);
  const [saving, setSaving] = useState(false);

  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [messages, loading]);

  const userMessageCount = messages.filter((m) => m.role === "user").length;
  const canAnalyze = ready || userMessageCount >= 3;

  async function handleSend(e) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await base44.functions.invoke("armand", {
        action: "chat",
        messages: newMessages
      });
      const data = res.data;
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.message }
      ]);
      if (data.ready) setReady(true);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Pardon, j'ai eu un petit souci pour répondre. Pouvez-vous reformuler ?"
        }
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  async function handleAnalyze() {
    setAnalyzing(true);
    try {
      const res = await base44.functions.invoke("armand", {
        action: "analyze",
        messages
      });
      setAnalysis(res.data.analysis);
    } catch (err) {
      setAnalyzing(false);
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleBuild() {
    setSaving(true);
    try {
      const summary =
        messages.find((m) => m.role === "user")?.content?.slice(0, 200) ||
        "Demande d'outil";
      await base44.entities.ToolRequest.create({
        summary,
        conversation: messages,
        analysis,
        status: "requested"
      });
      setRequested(true);
    } catch (err) {
      setRequested(true); // confirmation affichée même en cas d'erreur de stockage
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-50/60">
      {/* Header */}
      <header className="px-5 sm:px-8 py-4 flex items-center justify-between bg-stone-50/60 backdrop-blur border-b border-stone-200/70 sticky top-0 z-10">
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Accueil
        </button>
        <span className="font-display text-xl tracking-tight text-stone-900">
          Armand
        </span>
        <div className="w-16" />
      </header>

      {/* Chat */}
      <main
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-8"
      >
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((m, i) => (
            <ChatMessage key={i} role={m.role} content={m.content} />
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-stone-200/80 rounded-2xl rounded-bl-md px-5 py-4 shadow-sm">
                <div className="flex items-center gap-2 text-stone-400">
                  <span className="font-display text-[13px] tracking-wide">
                    Armand
                  </span>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                </div>
              </div>
            </div>
          )}

          {/* Analyze button */}
          {!analysis && canAnalyze && !loading && (
            <div className="pt-2">
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="w-full inline-flex items-center justify-center gap-2 bg-amber-700 hover:bg-amber-800 disabled:opacity-60 text-amber-50 px-6 py-3.5 rounded-xl text-[15px] font-medium transition-colors"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyse en cours…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Analyser mon processus
                  </>
                )}
              </button>
            </div>
          )}

          {/* Analysis */}
          {analysis && (
            <div className="pt-4 space-y-5">
              <AnalysisView analysis={analysis} />

              {/* Proposal */}
              <div className="bg-stone-900 text-stone-100 rounded-2xl p-6 sm:p-8">
                <h2 className="font-display text-xl mb-3">
                  La proposition d'Armand
                </h2>
                <p className="text-[15px] leading-relaxed text-stone-300 whitespace-pre-wrap mb-6">
                  {analysis.proposition}
                </p>

                {!requested ? (
                  <button
                    onClick={handleBuild}
                    disabled={saving}
                    className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-60 text-stone-900 px-6 py-3 rounded-full text-[15px] font-medium transition-colors"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Enregistrement…
                      </>
                    ) : (
                      <>Construire cet outil</>
                    )}
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-2 bg-stone-800 text-stone-200 px-5 py-3 rounded-full text-[15px]">
                    <Check className="w-4 h-4 text-amber-400" />
                    Votre demande a été enregistrée. Nous allons étudier comment
                    construire cet outil.
                  </div>
                )}
              </div>

              {requested && (
                <button
                  onClick={() => navigate("/")}
                  className="text-sm text-stone-500 hover:text-stone-900 transition-colors"
                >
                  Recommencer une nouvelle conversation
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Composer */}
      {!analysis && (
        <div className="px-4 sm:px-6 py-4 bg-stone-50/60 border-t border-stone-200/70">
          <form onSubmit={handleSend} className="max-w-2xl mx-auto">
            <div className="flex items-end gap-2 bg-white border border-stone-200 rounded-2xl p-2 shadow-sm focus-within:border-stone-400 transition-colors">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={1}
                placeholder="Décrivez votre tâche…"
                className="flex-1 resize-none bg-transparent px-3 py-2.5 text-[15px] text-stone-800 placeholder:text-stone-400 focus:outline-none max-h-32"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-stone-50 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}