import React from "react";
import { cn } from "@/lib/utils";

export default function ChatMessage({ role, content }) {
  const isUser = role === "user";
  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] sm:max-w-[75%] px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed whitespace-pre-wrap",
          isUser
            ? "bg-stone-900 text-stone-50 rounded-br-md"
            : "bg-white text-stone-700 border border-stone-200/80 rounded-bl-md shadow-sm"
        )}
      >
        {!isUser && (
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="font-display text-[13px] tracking-wide text-stone-400">
              Armand
            </span>
          </div>
        )}
        {content}
      </div>
    </div>
  );
}