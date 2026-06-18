"use client";
import { useState } from "react";
import type { GameProps } from "@/app/play/[id]/GameClient";
import { INTRO_SLIDES } from "@/lib/narrative";
import { CharacterPortrait } from "@/components/CharacterPortrait";

export function Intro({ act, busy }: GameProps) {
  const [i, setI] = useState(0);
  const slide = INTRO_SLIDES[i];
  const last = i === INTRO_SLIDES.length - 1;

  return (
    <main className="relative max-w-3xl mx-auto px-4 py-8 sm:py-14 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-10 right-0 h-72 w-72 rounded-full bg-pitch-500/15 blur-3xl animate-glow" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-accent-gold/10 blur-3xl animate-glow" style={{ animationDelay: "2s" }} />
      </div>

      <div className="card p-6 sm:p-10 min-h-[58vh] flex flex-col justify-center animate-fade-in" key={i}>
        <div className={`flex flex-col ${slide.character ? "sm:flex-row sm:items-center sm:text-left text-center" : "text-center"} gap-6`}>
          {slide.character ? (
            <div className="shrink-0 mx-auto sm:mx-0">
              <CharacterPortrait character={slide.character} size={180} />
            </div>
          ) : (
            <div className="text-7xl mx-auto animate-float">{slide.emoji}</div>
          )}
          <div className="flex-1">
            <div className="chip bg-pitch-500/15 text-pitch-600 mb-3">{slide.emoji} CAPÍTULO {i + 1}</div>
            <h1 className="text-3xl sm:text-4xl font-semibold mb-3">{slide.title}</h1>
            <p className="text-lg text-accent-cream/75 leading-relaxed">{slide.text}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-6">
        <div className="flex gap-1.5">
          {INTRO_SLIDES.map((_, idx) => (
            <div key={idx} className={`h-1.5 rounded-full transition-all ${idx === i ? "w-6 bg-pitch-500" : "w-1.5 bg-[#e7ddd2]"}`} />
          ))}
        </div>
        <div className="flex gap-2">
          {i > 0 && <button className="btn-ghost" onClick={() => setI(i - 1)}>←</button>}
          {last ? (
            <button className="btn-primary" disabled={busy} onClick={() => act({ type: "advanceIntro" })}>🎰 Ir al draft</button>
          ) : (
            <button className="btn-ghost" onClick={() => setI(i + 1)}>Siguiente →</button>
          )}
        </div>
      </div>
      {!last && (
        <button onClick={() => act({ type: "advanceIntro" })} className="block mx-auto mt-4 text-xs text-slate-500 hover:text-pitch-600">
          Saltar introducción
        </button>
      )}
    </main>
  );
}
