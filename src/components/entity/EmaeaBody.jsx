import React,{useMemo}from"react";
import EmaeaRuntimeHost from"./EmaeaRuntimeHost.jsx";
import"./entity-stage-wallpaper.css";
const WALLPAPER_KEY="emaea-wallpaper";
function selectedBackgroundKey(){return localStorage.getItem(WALLPAPER_KEY)||"original"}
export default function EmaeaBody({entityId}){const controls=useMemo(()=>({ambient:.50,lighting:.90,satellites:.86}),[]);const backgroundKey=selectedBackgroundKey();return <div className="emaea-stage" aria-label="EMÆÄ"><EmaeaRuntimeHost key={backgroundKey} entityId={entityId} controls={controls} className="absolute inset-0"/></div>}
