import React from "react";

export default function EntityMessage({ role, content }) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={
          isUser
            ? "max-w-[85%] sm:max-w-[76%] rounded-3xl rounded-br-lg border border-white/[0.08] bg-white/[0.10] px-5 py-3.5 text-[15px] leading-7 text-stone-100 shadow-lg shadow-black/20"
            : "max-w-[92%] sm:max-w-[82%] rounded-3xl border border-emerald-400/55 bg-gradient-to-b from-emerald-950/80 to-emerald-900/55 px-4 py-3 text-[15px] leading-7 text-stone-100 shadow-[0_16px_45px_rgba(0,0,0,.22),0_0_26px_rgba(16,185,129,.06)]"
        }
      >
        {!isUser && (
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,.85)]" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-200">
              EMÆÄ
            </span>
          </div>
        )}
        <div className="whitespace-pre-wrap">{content}</div>
      </div>
    </div>
  );
}
