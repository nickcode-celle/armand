import React from "react";
import { ExternalLink, Check, Minus, Sparkles, ArrowRight } from "lucide-react";

function SolutionCard({ solution }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          {solution.logo_url && (
            <img
              src={solution.logo_url}
              alt={solution.nom}
              className="h-9 w-auto max-w-[140px] object-contain"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
          )}
          <div>
          <h3 className="font-display text-xl text-stone-900">{solution.nom}</h3>
          <p className="text-sm font-medium text-amber-700 mt-1">
            {solution.prix || "Tarif non communiqué"}
          </p>
          </div>
        </div>
        {solution.site_officiel && (
          <a
            href={solution.site_officiel}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-900"
          >
            Site officiel <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      <p className="text-[15px] leading-relaxed text-stone-700 mb-4">
        {solution.resume}
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">
            Ce qui te convient
          </p>
          <div className="space-y-2">
            {solution.positifs?.map((item, i) => (
              <div key={i} className="flex gap-2 text-sm text-stone-700">
                <Check className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">
            Ce qui te conviendra moins
          </p>
          <div className="space-y-2">
            {solution.negatifs?.map((item, i) => (
              <div key={i} className="flex gap-2 text-sm text-stone-700">
                <Minus className="w-4 h-4 mt-0.5 shrink-0 text-amber-700" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ToolProposal({ proposal }) {
  const armand = proposal.solution_armand;

  return (
    <div className="space-y-5">
      <div className="bg-white border border-stone-200/80 rounded-2xl p-6 sm:p-8 shadow-sm">
        <p className="font-display text-xl sm:text-2xl leading-relaxed text-stone-900">
          {proposal.introduction}
        </p>
      </div>

      {proposal.solutions_existantes?.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold tracking-[0.12em] uppercase text-stone-500 px-1">
            Les solutions que j'ai trouvées
          </p>
          {proposal.solutions_existantes.map((solution, i) => (
            <SolutionCard key={i} solution={solution} />
          ))}
        </div>
      )}

      {armand?.pertinente && (
        <div className="rounded-2xl bg-stone-900 text-stone-100 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold tracking-[0.12em] uppercase text-amber-400">
              La solution ARMAND
            </span>
          </div>

          <h2 className="font-display text-2xl sm:text-3xl mb-2">{armand.nom}</h2>

          {armand.prix && (
            <p className="text-amber-400 font-medium mb-4">{armand.prix}</p>
          )}

          <p className="text-[15px] leading-relaxed text-stone-300 mb-5">
            {armand.resume}
          </p>

          <div className="space-y-2">
            {armand.avantages?.map((item, i) => (
              <div key={i} className="flex gap-2 text-[15px]">
                <Check className="w-4 h-4 mt-0.5 shrink-0 text-amber-400" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200/70 rounded-2xl p-6">
        <p className="text-xs font-semibold tracking-[0.12em] uppercase text-amber-800 mb-2">
          Mon conseil
        </p>
        <p className="text-[16px] leading-relaxed font-medium text-stone-900 mb-4">
          {proposal.recommandation}
        </p>
        <button
          type="button"
          className="inline-flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white px-5 py-3 rounded-xl text-[15px] font-medium transition-colors"
        >
          <span>{proposal.question_finale}</span>
          <ArrowRight className="w-4 h-4 shrink-0" />
        </button>
      </div>
    </div>
  );
}
