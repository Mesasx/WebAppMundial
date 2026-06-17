"use client";
import { useState } from "react";
import type { GameProps } from "@/app/play/[id]/GameClient";
import { INTRO_SLIDES } from "@/lib/narrative";

export function Intro({ act, busy }: GameProps) {
  const [i, setI] = useState(0);
  const slide = INTRO_SLIDES[i];
  const last = i === INTRO_SLIDES.length - 1;

  return (
    <main className="max-w-2xl mx-auto px-4 py-10 sm:py-16">
      <div className="card p-8 sm:p-12 text-center min-h-[60vh] flex flex-col justify-center animate-fade-in" key={i}>
        <div className="text-7xl mb-6">{slide.emoji}</div>
        <h1 className="text-3xl font-black mb-4">{slide.title}</h1>
        <p className="text-lg text-slate-300 leading-relaxed">{slide.text}</p>
      </div>

      <div className="flex items-center justify-between mt-6">
        <div className="flex gap-1.5">
          {INTRO_SLIDES.map((_, idx) => (
            <div key={idx} className={`h-1.5 rounded-full transition-all ${idx === i ? "w-6 bg-pitch-500" : "w-1.5 bg-ink-600"}`} />
          ))}
        </div>
        {last ? (
          <button className="btn-primary" disabled={busy} onClick={() => act({ type: "advanceIntro" })}>
            🎰 Ir al draft
          </button>
        ) : (
          <button className="btn-ghost" onClick={() => setI(i + 1)}>Siguiente →</button>
        )}
      </div>
      {!last && (
        <button onClick={() => act({ type: "advanceIntro" })} className="block mx-auto mt-4 text-xs text-slate-500 hover:text-slate-300">
          Saltar introducción
        </button>
      )}
    </main>
  );
}
