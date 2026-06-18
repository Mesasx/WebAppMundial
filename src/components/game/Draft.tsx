"use client";
import type { GameProps } from "@/app/play/[id]/GameClient";
import type { Player } from "@/lib/types";
import { PlayerCard } from "@/components/PlayerCard";

export function Draft({ state, act, busy }: GameProps) {
  const capOptions: Player[] = (state.draftCaptainOptions ?? []).map((id) => state.players[id]).filter(Boolean);
  const starOptions: Player[] = (state.draftStarOptions ?? []).map((id) => state.players[id]).filter(Boolean);
  const capPick = state.draftCaptainPick;
  const starPick = state.draftStarPick;
  const ready = Boolean(capPick && starPick);

  return (
    <main className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-5">
        <h1 className="text-2xl font-black">🎰 El Draft de la Reconstrucción</h1>
        <p className="text-slate-400 text-sm max-w-2xl">
          Con las nacionalidades reiniciadas, solo puedes asegurar dos grandes fichajes. Elige
          <b className="text-pitch-600"> tu capitán</b> entre 3 cracks (media ≥90) y una
          <b className="text-pitch-600"> estrella</b> (≥85). El resto de la plantilla (hasta 26) la
          completarán jugadores de media 67-84. Elige con cabeza: marcarán tu proyecto.
        </p>
      </div>

      <section className="mb-7">
        <div className="flex items-center gap-2 mb-3">
          <span className="chip bg-accent-gold/20 text-accent-gold">© CAPITÁN</span>
          <h2 className="font-bold">Elige 1 de 3 (media ≥90)</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          {capOptions.map((p) => (
            <PlayerCard
              key={p.id}
              player={p}
              selected={capPick === p.id}
              onClick={() => !busy && act({ type: "draftPickCaptain", playerId: p.id })}
            />
          ))}
        </div>
      </section>

      <section className="mb-7">
        <div className="flex items-center gap-2 mb-3">
          <span className="chip bg-pitch-500/20 text-pitch-400">★ ESTRELLA</span>
          <h2 className="font-bold">Elige 1 (media 85-89)</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {starOptions.map((p) => (
            <PlayerCard
              key={p.id}
              player={p}
              selected={starPick === p.id}
              onClick={() => !busy && act({ type: "draftPickStar", playerId: p.id })}
            />
          ))}
        </div>
      </section>

      <div className="sticky bottom-4">
        <div className="card p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-sm text-slate-300">
            {capPick ? <>Capitán: <b>{state.players[capPick]?.name}</b></> : "Elige capitán"}
            {" · "}
            {starPick ? <>Estrella: <b>{state.players[starPick]?.name}</b></> : "Elige estrella"}
          </div>
          <button
            className="btn-primary"
            disabled={busy || !ready}
            onClick={() => act({ type: "finalizeDraft" })}
          >
            {ready ? "✅ Confirmar y completar plantilla" : "Elige capitán y estrella"}
          </button>
        </div>
      </div>
    </main>
  );
}
