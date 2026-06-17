"use client";
import { useMemo, useState } from "react";
import type { GameProps } from "@/app/play/[id]/GameClient";
import type { Player, Position } from "@/lib/types";
import { POSITIONS } from "@/lib/types";
import { PlayerCard } from "@/components/PlayerCard";
import { POSITION_LABELS } from "@/lib/labels";

const CRACK = 86;
const MANUAL = 11;

export function Draft({ state, act, busy }: GameProps) {
  const [filter, setFilter] = useState<Position | "ALL">("ALL");
  const [q, setQ] = useState("");

  const pool: Player[] = (state.draftPool ?? []).map((id) => state.players[id]).filter(Boolean);
  const picks: Player[] = (state.draftPicks ?? []).map((id) => state.players[id]).filter(Boolean);
  const pickedIds = new Set(picks.map((p) => p.id));
  const cracks = picks.filter((p) => p.overall >= CRACK).length;

  const visible = useMemo(() => {
    return pool
      .filter((p) => !pickedIds.has(p.id))
      .filter((p) => filter === "ALL" || p.position === filter || p.secondaryPositions.includes(filter))
      .filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => b.overall - a.overall);
  }, [pool, filter, q, pickedIds]);

  return (
    <main className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-4">
        <h1 className="text-2xl font-black">🎰 Draft inicial</h1>
        <p className="text-slate-400 text-sm">
          Elige <b className="text-white">{MANUAL} jugadores</b> a mano. El resto, hasta 26, se completará solo (mínimo 2 por posición).
          Cuidado: <b className="text-accent-amber">máximo 2 cracks</b> (media ≥ {CRACK}). Construye un equipo equilibrado.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        <div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            <Chip active={filter === "ALL"} onClick={() => setFilter("ALL")}>Todos</Chip>
            {POSITIONS.map((pos) => (
              <Chip key={pos} active={filter === pos} onClick={() => setFilter(pos)}>{pos}</Chip>
            ))}
          </div>
          <input className="input mb-3" placeholder="Buscar jugador..." value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="grid sm:grid-cols-2 gap-2 max-h-[65vh] overflow-y-auto pr-1">
            {visible.map((p) => {
              const blocked = p.overall >= CRACK && cracks >= 2;
              const full = picks.length >= MANUAL;
              return (
                <PlayerCard
                  key={p.id}
                  player={p}
                  onClick={() => !busy && !blocked && !full && act({ type: "draftPick", playerId: p.id })}
                  action={
                    <span className={`chip ${p.overall >= CRACK ? "bg-accent-gold/20 text-accent-gold" : "bg-ink-700 text-slate-400"}`}>
                      {p.overall >= CRACK ? "CRACK" : "+"}
                    </span>
                  }
                />
              );
            })}
            {visible.length === 0 && <p className="text-slate-500 text-sm col-span-2 py-6 text-center">Sin jugadores en este filtro.</p>}
          </div>
        </div>

        <aside className="lg:sticky lg:top-20 h-fit">
          <div className="card p-4">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-bold">Tu selección</h2>
              <span className="text-sm text-slate-400">{picks.length}/{MANUAL}</span>
            </div>
            <div className="text-xs text-slate-500 mb-3">Cracks usados: <b className={cracks >= 2 ? "text-accent-amber" : "text-pitch-400"}>{cracks}/2</b></div>
            <div className="space-y-1.5 max-h-[45vh] overflow-y-auto pr-1">
              {picks.length === 0 && <p className="text-slate-500 text-sm py-4 text-center">Toca jugadores para ficharlos.</p>}
              {picks.map((p) => (
                <div key={p.id} className="flex items-center gap-2 bg-ink-900/60 rounded-lg px-2 py-1.5">
                  <span className="text-xs font-bold w-7 text-slate-400">{p.position}</span>
                  <span className="text-lg">{p.originFlag}</span>
                  <span className="text-sm truncate flex-1">{p.name}</span>
                  <span className="font-bold text-sm">{p.overall}</span>
                  <button onClick={() => act({ type: "draftRemove", playerId: p.id })} className="text-slate-500 hover:text-accent-danger">×</button>
                </div>
              ))}
            </div>
            <button
              className="btn-primary w-full mt-4"
              disabled={busy || picks.length !== MANUAL}
              onClick={() => act({ type: "finalizeDraft" })}
            >
              {picks.length === MANUAL ? "✅ Confirmar plantilla" : `Elige ${MANUAL - picks.length} más`}
            </button>
          </div>
        </aside>
      </div>
    </main>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`chip ${active ? "bg-pitch-500 text-ink-900" : "bg-ink-700 text-slate-300 hover:bg-ink-600"}`}>
      {children}
    </button>
  );
}
