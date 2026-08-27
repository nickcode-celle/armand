import React from "react";

const OPTIONS = [
  "Je ne paierais pas",
  "Moins de 10 € / mois",
  "10 à 30 € / mois",
  "30 à 50 € / mois",
  "50 à 100 € / mois",
  "Plus de 100 € / mois",
  "Je préférerais payer une seule fois"
];

export default function PricingQuestion({ onSelect, disabled }) {
  return (
    <div className="bg-white border border-stone-200/80 rounded-2xl p-6 sm:p-8 shadow-sm">
      <h3 className="font-display text-lg text-stone-900 mb-2">
        Valeur perçue
      </h3>
      <p className="text-[15px] leading-relaxed text-stone-600 mb-5">
        Si cet outil existait aujourd'hui et fonctionnait comme décrit,
        combien seriez-vous prêt à payer pour l'utiliser ?
      </p>
      <div className="grid gap-2">
        {OPTIONS.map((opt) => (
          <button
            key={opt}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(opt)}
            className="text-left px-4 py-3 rounded-xl border border-stone-200 hover:border-stone-400 hover:bg-stone-50 disabled:opacity-50 text-[15px] text-stone-700 transition-colors"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}