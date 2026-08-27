import React from "react";
import { Target, ListChecks, Zap, User, Clock, LayoutGrid, Database, Gauge, AlertTriangle } from "lucide-react";

function Field({ icon: Icon, label, children }) {
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

export default function ToolProposal({ proposal }) {
  return (
    <div className="bg-white border border-stone-200/80 rounded-2xl p-6 sm:p-8 shadow-sm">
      <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-amber-700 mb-2">
        L'outil que je vous propose
      </p>
      <h2 className="font-display text-2xl text-stone-900 mb-1">
        {proposal.nom_provisoire}
      </h2>
      <p className="text-sm text-stone-500 mb-6">
        Voici l'outil imaginé à partir de ce que vous m'avez décrit.
      </p>

      <Field icon={Target} label="Problème résolu">
        {proposal.probleme_resolu}
      </Field>
      <Field icon={ListChecks} label="Fonctionnement">
        {proposal.fonctionnement}
      </Field>
      <Field icon={Zap} label="Ce qui serait automatisé">
        {proposal.automatise}
      </Field>
      <Field icon={User} label="Ce qui resterait à faire par l'utilisateur">
        {proposal.restant_a_faire}
      </Field>
      <Field icon={Clock} label="Temps potentiel économisé">
        {proposal.temps_economise}
      </Field>
      <Field icon={LayoutGrid} label="Interfaces nécessaires">
        {proposal.interfaces}
      </Field>
      <Field icon={Database} label="Données nécessaires">
        {proposal.donnees_necessaires}
      </Field>
      <Field icon={Gauge} label="Difficulté de construction">
        {proposal.difficulte}
      </Field>
      <Field icon={AlertTriangle} label="Limites">
        {proposal.limites}
      </Field>
    </div>
  );
}