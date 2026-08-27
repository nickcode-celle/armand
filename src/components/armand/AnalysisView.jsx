import React from "react";
import { Clock, Wrench, ListChecks, Sparkles, Lightbulb, FileText } from "lucide-react";

function Section({ icon: Icon, label, children }) {
  return (
    <div className="border-t border-stone-200/70 pt-5">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-amber-700" strokeWidth={1.75} />
        <h3 className="text-[11px] font-semibold tracking-[0.12em] uppercase text-stone-500">
          {label}
        </h3>
      </div>
      <p className="text-[15px] leading-relaxed text-stone-700 whitespace-pre-wrap">
        {children}
      </p>
    </div>
  );
}

export default function AnalysisView({ analysis }) {
  return (
    <div className="bg-white border border-stone-200/80 rounded-2xl p-6 sm:p-8 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <span className="font-display text-xl text-stone-900">Synthèse</span>
      </div>
      <p className="text-sm text-stone-500 mb-6">
        Voici ce qu'Armand a compris de votre situation.
      </p>

      <Section icon={FileText} label="Problème">
        {analysis.probleme}
      </Section>
      <Section icon={ListChecks} label="Processus actuel">
        {analysis.processus}
      </Section>
      <Section icon={Wrench} label="Outils utilisés">
        {analysis.outils}
      </Section>
      <Section icon={Clock} label="Temps estimé">
        {analysis.temps_estime}
      </Section>
      <Section icon={Sparkles} label="Tâches répétitives">
        {analysis.taches_repetitives}
      </Section>
      <Section icon={Lightbulb} label="Possibilités d'automatisation">
        {analysis.possibilites_automatisation}
      </Section>
      <Section icon={Lightbulb} label="Outil proposé">
        {analysis.outil_propose}
      </Section>
    </div>
  );
}