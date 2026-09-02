import React from "react";
import {
  Target, ListChecks, Zap, User, Clock, LayoutGrid, Database,
  Gauge, AlertTriangle, ShieldCheck, ShieldQuestion, Search
} from "lucide-react";

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

function FeasItem({ label, tone, children }) {
  const tones = {
    green: "border-emerald-200 bg-emerald-50/60 text-emerald-900",
    amber: "border-amber-200 bg-amber-50/60 text-amber-900",
    slate: "border-stone-200 bg-stone-50 text-stone-700",
    red: "border-red-200 bg-red-50/60 text-red-900"
  };
  return (
    <div className={`rounded-xl border px-4 py-3 ${tones[tone]}`}>
      <p className="text-[11px] font-semibold tracking-[0.1em] uppercase mb-1 opacity-80">
        {label}
      </p>
      <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{children}</p>
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

      {/* Faisabilité réelle */}
      <div className="border-t border-stone-200/70 pt-5">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-4 h-4 text-amber-700" strokeWidth={1.75} />
          <h3 className="text-[11px] font-semibold tracking-[0.12em] uppercase text-stone-500">
            Faisabilité réelle
          </h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <FeasItem label="Faisable directement" tone="green">
            {proposal.faisable_directement}
          </FeasItem>
          <FeasItem label="Faisable sous conditions" tone="amber">
            {proposal.faisable_sous_conditions}
          </FeasItem>
          <FeasItem label="À vérifier" tone="slate">
            {proposal.a_verifier}
          </FeasItem>
          <FeasItem label="Non réalisable de manière fiable" tone="red">
            {proposal.non_realisable}
          </FeasItem>
        </div>
      </div>

      {/* Solution existante ou nouvel outil */}
      <div className="border-t border-stone-200/70 pt-5">
        <div className="flex items-center gap-2 mb-2">
          <Search className="w-4 h-4 text-amber-700" strokeWidth={1.75} />
          <h3 className="text-[11px] font-semibold tracking-[0.12em] uppercase text-stone-500">
            Faut-il vraiment construire un nouvel outil ?
          </h3>
        </div>
        <p className="text-[15px] font-medium text-stone-900 mb-1">
          {proposal.conclusion_outil}
        </p>
        <p className="text-[15px] leading-relaxed text-stone-700 whitespace-pre-wrap mb-3">
          {proposal.solution_existante}
        </p>
        <p className="text-[13px] text-stone-500 italic flex items-start gap-1.5">
          <ShieldQuestion className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          Une recherche des solutions existantes serait nécessaire avant de
          décider de construire cet outil.
        </p>
      </div>
    </div>
  );
}