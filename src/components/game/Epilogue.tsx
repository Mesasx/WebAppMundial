"use client";
import Link from "next/link";
import type { GameProps } from "@/app/play/[id]/GameClient";
import type { Player } from "@/lib/types";
import { PlayerCard } from "@/components/PlayerCard";

export function Epilogue({ state }: GameProps) {
  const user = state.teams[state.userTeamId];
  const won = state.finalResult?.includes("Campeón");
  const aw = state.awards;
  const P = (id?: string): Player | undefined => (id ? state.players[id] : undefined);

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className={`card p-8 text-center mb-6 ${won ? "border-accent-gold/50" : ""}`}>
        <div className="text-6xl mb-3">{won ? "🏆" : "🎬"}</div>
        <h1 className="text-3xl font-black">{state.finalResult}</h1>
        <p className="text-slate-400 mt-1">{user.flag} {user.name}</p>
        {state.objective.met !== null && (
          <div className={`chip mt-3 ${state.objective.met ? "bg-pitch-500/20 text-pitch-400" : "bg-accent-danger/20 text-accent-danger"}`}>
            Objetivo ({state.objective.targetRound}): {state.objective.met ? "cumplido ✅" : "no cumplido ❌"}
          </div>
        )}
      </div>

      <h2 className="text-lg font-bold mb-2">📜 Epílogo</h2>
      <div className="space-y-3 mb-8">
        {(state.epilogue ?? []).map((e, i) => (
          <div key={i} className="card p-4">
            <div className="font-bold">{e.title}</div>
            <div className="text-sm text-slate-300 mt-1">{e.body}</div>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-bold mb-2">🏅 Premios del torneo</h2>
      <div className="grid sm:grid-cols-2 gap-2 mb-8">
        <Award title="🥇 Balón de Oro" p={P(aw.goldenBallId)} />
        <Award title="👟 Bota de Oro" p={P(aw.goldenBootId)} sub={P(aw.goldenBootId) ? `${P(aw.goldenBootId)!.stats.goals} goles` : ""} />
        <Award title="🧤 Guante de Oro" p={P(aw.goldenGloveId)} />
        <Award title="✨ Revelación" p={P(aw.revelationId)} />
      </div>

      {aw.bestXI && aw.bestXI.length > 0 && (
        <>
          <h2 className="text-lg font-bold mb-2">🌟 Once ideal del Mundial</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-8">
            {aw.bestXI.map((id) => state.players[id]).filter(Boolean).map((p) => (
              <PlayerCard key={p!.id} player={p as Player} compact />
            ))}
          </div>
        </>
      )}

      <div className="flex gap-3">
        <Link href="/careers" className="btn-ghost flex-1 justify-center">Mis carreras</Link>
        <Link href="/careers/new" className="btn-primary flex-1 justify-center">🚀 Nueva carrera</Link>
      </div>
    </main>
  );
}

function Award({ title, p, sub }: { title: string; p?: Player; sub?: string }) {
  return (
    <div className="card p-3 flex items-center gap-3">
      <div className="text-sm text-slate-400 w-28 shrink-0">{title}</div>
      {p ? (
        <div className="min-w-0">
          <div className="font-bold truncate">{p.originFlag} {p.name}</div>
          <div className="text-xs text-slate-500">{sub || `Media ${p.overall}`}</div>
        </div>
      ) : <div className="text-slate-600 text-sm">—</div>}
    </div>
  );
}
