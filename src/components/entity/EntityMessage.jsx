import React from "react";

export default function EntityMessage({ role, content }) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={
          isUser
            ? "max-w-[85%] sm:max-w-[76%] rounded-3xl rounded-br-lg bg-white/[0.09] px-5 py-3.5 text-[15px] leading-7 text-stone-100"
            : "max-w-[92%] sm:max-w-[82%] px-1 py-2 text-[15px] leading-7 text-stone-200"
        }
      >
        {!isUser && (
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-stone-400" />
            <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-stone-500">
              Entité
            </span>
          </div>
        )}
        <div className="whitespace-pre-wrap">{content}</div>
      </div>
    </div>
  );
}
