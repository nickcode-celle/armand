import React from "react";

const INTENTIONS = [
  { code: "yes", label: "Oui, cela m'intéresse réellement" },
  { code: "maybe", label: "Peut-être, je voudrais d'abord en savoir plus" },
  { code: "no", label: "Non, le diagnostic me suffit" }
];

export default function IntentionQuestion({ onSelect, disabled }) {
  return (
    <div className="bg-white border border-stone-200/80 rounded-2xl p-6 sm:p-8 shadow-sm">
      <h3 className="font-display text-lg text-stone-900 mb-2">
        Souhaitez-vous que cet outil soit réellement construit ?
      </h3>
      <p className="text-[15px] leading-relaxed text-stone-600 mb-5">
        Votre réponse nous aide à prioriser les besoins réels.
      </p>
      <div className="grid gap-2">
        {INTENTIONS.map((it) => (
          <button
            key={it.code}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(it.code, it.label)}
            className="text-left px-4 py-3 rounded-xl border border-stone-200 hover:border-stone-400 hover:bg-stone-50 disabled:opacity-50 text-[15px] text-stone-700 transition-colors"
          >
            {it.label}
          </button>
        ))}
      </div>
    </div>
  );
}