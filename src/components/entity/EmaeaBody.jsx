import React,{useMemo}from"react";
import EmaeaRuntimeHost from"./EmaeaRuntimeHost.jsx";
const WALLPAPER_KEY="emaea-wallpaper";
function selectedBackground(){const id=localStorage.getItem(WALLPAPER_KEY)||"original";const match=/^bg-(\d{2})$/.exec(id);return match?`/assets/emaea/backgrounds/emaea-bg-${match[1]}.jpg`:null}
export default function EmaeaBody({entityId}){const controls=useMemo(()=>({ambient:.50,lighting:.90,satellites:.86}),[]);const backgroundSrc=selectedBackground();return <div className="emaea-stage" aria-label="EMÆÄ"><EmaeaRuntimeHost entityId={entityId} controls={controls} backgroundSrc={backgroundSrc} className="absolute inset-0"/></div>}
