import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="px-6 sm:px-10 py-6">
        <span className="font-display text-2xl tracking-tight text-stone-900">
          Armand
        </span>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6 sm:px-10">
        <div className="max-w-2xl w-full text-center">
          <h1 className="font-display text-4xl sm:text-5xl leading-[1.1] text-stone-900 mb-6">
            Dites-moi ce qui vous fait perdre du temps.
          </h1>
          <p className="text-base sm:text-lg leading-relaxed text-stone-500 mb-10 max-w-xl mx-auto">
            Décrivez une tâche que vous répétez régulièrement. Armand va
            comprendre comment vous travaillez et chercher comment vous
            simplifier la vie.
          </p>
          <button
            onClick={() => navigate("/conversation")}
            className="group inline-flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-stone-50 px-7 py-3.5 rounded-full text-[15px] font-medium transition-colors"
          >
            Commencer
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 sm:px-10 py-6 text-center">
        <p className="text-xs text-stone-400">
          Prototype — vos réponses restent confidentielles.
        </p>
      </footer>
    </div>
  );
}