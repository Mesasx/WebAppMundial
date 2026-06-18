"use client";
import { useEffect, useRef, useState } from "react";
import type { GameProps } from "@/app/play/[id]/GameClient";
import type { Player } from "@/lib/types";
import { PlayerCard } from "@/components/PlayerCard";
import { Bar } from "@/components/ui";
import { RECRUIT_DIFF_LABELS } from "@/lib/labels";
import { APPROACHES, recruitDifficulty } from "@/lib/engine/recruitment";

export function Recruitment({ state, act, busy }: GameProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const user = state.teams[state.userTeamId];
  const freeAgents: Player[] = (state.freeAgents ?? [])
    .map((id) => state.players[id])
    .filter(Boolean)
    .filter((p) => !user.squad.includes(p.id))
    .sort((a, b) => b.overall - a.overall);

  const conv = selected ? state.conversations.find((c) => c.playerId === selected) : null;
  const selPlayer = selected ? state.players[selected] : null;
  const daysLeft = -state.day;

  async function open(id: string) {
    setSelected(id);
    if (!state.conversations.find((c) => c.playerId === id)) {
      await act({ type: "startConversation", playerId: id });
    }
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-black">💬 Reclutamiento</h1>
          <p className="text-slate-400 text-sm">Convence a agentes libres antes del cierre de listas. Plantilla: <b className="text-pitch-600">{user.squad.length}/26</b></p>
        </div>
        <div className="flex items-center gap-2">
          <span className="chip bg-accent-amber/20 text-accent-amber">⏳ {daysLeft} días para el cierre</span>
          <button className="btn-ghost text-sm" disabled={busy} onClick={() => act({ type: "advanceDay" })}>Avanzar día</button>
          <button className="btn-primary text-sm" disabled={busy} onClick={() => { if (confirm("¿Cerrar el plazo y empezar el Mundial? Tu plantilla quedará bloqueada.")) act({ type: "closeRecruitment" }); }}>
            Empezar Mundial →
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-4">
        <div>
          <h2 className="text-sm uppercase tracking-wide text-slate-500 mb-2">Agentes libres ({freeAgents.length})</h2>
          <div className="grid sm:grid-cols-2 gap-2 max-h-[68vh] overflow-y-auto pr-1">
            {freeAgents.map((p) => {
              const diff = recruitDifficulty(p);
              const info = RECRUIT_DIFF_LABELS[diff];
              return (
                <PlayerCard
                  key={p.id}
                  player={p}
                  selected={selected === p.id}
                  onClick={() => open(p.id)}
                  compact
                  action={<span className={`chip ${info.color}`}>{info.label}</span>}
                />
              );
            })}
            {freeAgents.length === 0 && <p className="text-slate-500 text-sm col-span-2 py-6 text-center">No quedan agentes libres. ¡Cierra el plazo!</p>}
          </div>
        </div>

        <aside className="lg:sticky lg:top-20 h-fit">
          {selPlayer && conv ? (
            <ChatPanel player={selPlayer} conv={conv} act={act} busy={busy} />
          ) : (
            <div className="card p-8 text-center text-slate-400">
              <div className="text-4xl mb-2">🤝</div>
              Selecciona un jugador para empezar a negociar.
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}

function ChatPanel({ player, conv, act, busy }: { player: Player; conv: any; act: GameProps["act"]; busy: boolean }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [conv.messages.length]);

  const recruited = conv.status === "recruited";
  const closed = conv.status === "rejected" || conv.status === "lost";

  return (
    <div className="card flex flex-col h-[68vh]">
      <div className="p-3 border-b border-ink-600/60 flex items-center gap-2">
        <span className="text-2xl">{player.originFlag}</span>
        <div className="flex-1 min-w-0">
          <div className="font-bold truncate">{player.name} · {player.overall}</div>
          <div className="text-xs text-slate-400 capitalize">{player.personality} · {player.position}</div>
        </div>
      </div>
      <div className="px-3 py-2">
        <Bar value={conv.disposition} label="Disposición a fichar" />
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {conv.messages.map((m: any, i: number) => (
          <div key={i} className={`flex ${m.from === "manager" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.from === "manager" ? "bg-pitch-500 text-white" : "bg-ink-700 text-slate-100"}`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-ink-600/60">
        {recruited ? (
          <div className="text-center text-pitch-400 font-semibold">✅ ¡Fichado! Ya está en tu plantilla.</div>
        ) : closed ? (
          <div className="text-center text-accent-danger font-semibold">❌ Negociación cerrada.</div>
        ) : (
          <div className="grid grid-cols-1 gap-1.5 max-h-44 overflow-y-auto">
            {APPROACHES.map((a) => (
              <button
                key={a.type}
                disabled={busy}
                onClick={() => act({ type: "sendApproach", playerId: player.id, approach: a.type })}
                className="text-left text-sm rounded-lg bg-ink-900/60 hover:bg-ink-700 px-3 py-2 transition"
              >
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
