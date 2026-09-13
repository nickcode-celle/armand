import React,{useMemo}from"react";
import EmaeaRuntimeHost from"./EmaeaRuntimeHost.jsx";
export default function EmaeaBody({entityId,backgroundSrc}){const controls=useMemo(()=>({ambient:.50,lighting:.90,satellites:.86}),[]);return <div className="emaea-stage" aria-label="EMÆÄ"><EmaeaRuntimeHost entityId={entityId} controls={controls} backgroundSrc={backgroundSrc} className="absolute inset-0"/></div>}
