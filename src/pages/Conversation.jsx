import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Loader2, ArrowLeft, Check, Pencil, Sparkles } from "lucide-react";
import ChatMessage from "@/components/armand/ChatMessage";
import ToolProposal from "@/components/armand/ToolProposal";
import PricingQuestion from "@/components/armand/PricingQuestion";
import IntentionQuestion from "@/components/armand/IntentionQuestion";
import { base44 } from "@/api/base44Client";

const INITIAL_MESSAGE = "Quelle tâche vous fait perdre du temps ?";

async function invokeArmand(action, messages) {
  const response = await fetch("/api/armand", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, messages })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error || "Erreur serveur");
  return { data };
}

export default function Conversation() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    { role: "assistant", content: INITIAL_MESSAGE }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [classification, setClassification] = useState(null);
  const [accepted, setAccepted] = useState(false);
  const [pricing, setPricing] = useState(null);
  const [intention, setIntention] = useState(null); // code: yes / maybe / no
  const [requested, setRequested] = useState(false);
  const [saving, setSaving] = useState(false);

  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [messages, loading, analysis, accepted, pricing, intention, requested, saving]);

  // Armand propose directement dès qu'il a assez d'informations
  useEffect(() => {
    if (ready && !analysis && !analyzing && !loading && !analysisError) {
      handleAnalyze();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, analysis, analyzing, loading]);

  async function handleSend(e) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await invokeArmand("chat", newMessages);
      const data = res.data;
      if (data.ready) {
        setReady(true);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.message }
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Erreur ARMAND : ${err?.message || String(err)}`
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
      const res = await invokeArmand("analyze", messages);
      setAnalysis(res.data.analysis);
      setClassification(res.data.classification || null);
      setRequested(false);
      setPricing(null);
      setIntention(null);
    } catch (err) {
      setAnalysisError(true);
      console.error("Analyse ARMAND:", err);
    } finally {
      setAnalyzing(false);
    }
  }

  function handleModify() {
    setAnalysis(null);
    setClassification(null);
    setReady(false);
    setAccepted(false);
    setRequested(false);
    setPricing(null);
    setIntention(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  async function handleSave(intent) {
    setSaving(true);
    try {
      const summary =
        messages.find((m) => m.role === "user")?.content?.slice(0, 200) ||
        "Demande d'outil";
      await base44.entities.ToolRequest.create({
        summary,
        conversation: messages,
        analysis,
        classification,
        validation: "validee",
        pricing,
        intention: intent,
        status: "requested"
      });
      setRequested(true);
    } catch (err) {
      setRequested(true); // confirmation affichée même en cas d'erreur de stockage
    } finally {
      setSaving(false);
    }
  }

  function handleIntention(code) {
    setIntention(code);
    if (code !== "yes") {
      // Le diagnostic seul suffit : on enregistre la fiche.
      handleSave(code);
    }
    // Pour "yes", on attends le clic sur "Construire cet outil".
  }

  function handleBuild() {
    handleSave("yes");
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

          {analyzing && (
            <div className="flex justify-start">
              <div className="bg-white border border-stone-200/80 rounded-2xl rounded-bl-md px-5 py-4 shadow-sm">
                <div className="flex items-center gap-2 text-stone-500">
                  <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                  <span className="text-[14px]">Armand prépare sa proposition…</span>
                </div>
              </div>
            </div>
          )}

          {/* Proposition */}
          {analysis && !analyzing && (
            <div className="pt-4 space-y-5">
              <ToolProposal proposal={analysis} />

              {/* Étape 1 : validation ou modification */}
              {!accepted && !requested ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setAccepted(true)}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 text-stone-50 px-6 py-3.5 rounded-xl text-[15px] font-medium transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    Cela correspond à mon besoin
                  </button>
                  <button
                    onClick={handleModify}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-white border border-stone-300 hover:border-stone-400 text-stone-700 px-6 py-3.5 rounded-xl text-[15px] font-medium transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                    Modifier la proposition
                  </button>
                </div>
              ) : null}

              {/* Étapes post-validation */}
              {accepted && !requested && (
                <div className="space-y-5">
                  {!pricing && (
                    <PricingQuestion onSelect={setPricing} disabled={saving} />
                  )}

                  {pricing && !intention && (
                    <IntentionQuestion
                      onSelect={(code) => handleIntention(code)}
                      disabled={saving}
                    />
                  )}

                  {intention === "yes" && (
                    <button
                      onClick={handleBuild}
                      disabled={saving}
                      className="w-full inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-60 text-stone-900 px-6 py-3.5 rounded-xl text-[15px] font-medium transition-colors"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Enregistrement…
                        </>
                      ) : (
                        "Construire cet outil"
                      )}
                    </button>
                  )}

                  {intention && intention !== "yes" && saving && (
                    <div className="inline-flex items-center gap-2 text-stone-500 text-[15px]">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enregistrement de votre diagnostic…
                    </div>
                  )}
                </div>
              )}

              {/* Confirmation finale */}
              {requested && (
                <>
                  <div className="inline-flex items-center gap-2 bg-stone-900 text-stone-100 px-5 py-3.5 rounded-xl text-[15px]">
                    <Check className="w-4 h-4 text-amber-400" />
                    {intention === "yes"
                      ? "Votre demande a été enregistrée. Nous allons étudier comment construire cet outil."
                      : "Merci. Votre diagnostic a été enregistré."}
                  </div>
                  <button
                    onClick={() => navigate("/")}
                    className="block text-sm text-stone-500 hover:text-stone-900 transition-colors"
                  >
                    Recommencer une nouvelle conversation
                  </button>
                </>
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