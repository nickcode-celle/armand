import React from 'react';
import EmaeaRuntimeHost from './EmaeaRuntimeHost.jsx';

/**
 * Présentation graphique existante, conservée comme simple enveloppe.
 * Toute la logique de runtime, restauration et naissance quotidienne vit dans EmaeaRuntimeHost.
 */
export default function EmaeaBody({entityId}){
  return <div className="relative mx-auto h-[42vh] min-h-[320px] max-h-[520px] w-full overflow-hidden rounded-[28px] border border-white/[0.06] bg-[#1d1f22]" aria-label="EMÆÄ">
    <EmaeaRuntimeHost entityId={entityId} className="absolute inset-0"/>
  </div>;
}
