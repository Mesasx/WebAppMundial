"use client";
import { useState } from "react";
import type { GameProps } from "@/app/play/[id]/GameClient";
import type { Formation, MatchResult, Playstyle } from "@/lib/types";
import { ALL_FORMATIONS, FORMATION_LABELS } from "@/lib/engine/formations";
import { PLAYSTYLE_LABELS } from "@/lib/labels";
import { Pitch } from "./Pitch";

const AGGRESSION = [
  { v: -3, label: "🛡️ Proteger resultado" },
  { v: -1, label: "🐢 Bajar bloque" },
  { v: 0, label: "⚖️ Equilibrado" },
  { v: 1, label: "⚡ Presionar" },
  { v: 3, label: "🔥 Arriesgar todo" },
];

export function Match({ state, act, busy }: GameProps) {
  const user = state.teams[state.userTeamId];
  const pending = state.matches.find((m) => m.involvesUser && !m.played);
  const [formation, setFormation] = useState<Formation>(user.formation);
  const [playstyle, setPlaystyle] = useState<Playstyle>(user.playstyle);
  const [aggression, setAggression] = useState(0);
  const [watchId, setWatchId] = useState<string | null>(null);
  const [resultId, setResultId] = useState<string | null>(null);

  if (!pending) {
    const champ = state.knockout.find((t) => t.round === "F")?.winnerId;
    return (
      <div className="card p-8 text-center">
        <div className="text-4xl mb-2">{user.eliminated ? "😢" : "🏁"}</div>
        <p className="font-bold text-lg mb-1">
          {user.eliminated ? `${user.name} ya no está en el torneo` : "No tienes partidos pendientes"}
        </p>
        <p className="text-slate-400 text-sm mb-5">El Mundial continúa. Simula las rondas restantes para ver al campeón.</p>
        {!champ && (
          <button className="btn-primary" disabled={busy} onClick={() => act({ type: "simulateRound" })}>
            ⏩ Simular siguiente ronda
          </button>
        )}
      </div>
    );
  }

  const opp = pending.homeTeamId === user.id ? state.teams[pending.awayTeamId] : state.teams[pending.homeTeamId];

  // Mostrar replay visual
  if (watchId) {
    const m = state.matches.find((x) => x.id === watchId);
    if (m) {
      return (
        <Pitch
          home={state.teams[m.homeTeamId]}
          away={state.teams[m.awayTeamId]}
          events={m.events}
          players={state.players}
          finalHome={m.homeGoals}
          finalAway={m.awayGoals}
          onFinish={() => { setResultId(m.id); setWatchId(null); }}
        />
      );
    }
  }

  // Mostrar resultado/crónica
  if (resultId) {
    const m = state.matches.find((x) => x.id === resultId);
    if (m) return <MatchResultView m={m} state={state} onContinue={() => { setResultId(null); }} />;
  }

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">{pending.round}</div>
        <div className="flex items-center justify-around">
          <TeamBig flag={user.flag} name={user.name} rating={user.rating} />
          <div className="text-2xl text-slate-500 font-black">VS</div>
          <TeamBig flag={opp.flag} name={opp.name} rating={opp.rating} />
        </div>
        <div className="text-center text-xs text-slate-400 mt-3">
          Rival: {PLAYSTYLE_LABELS[opp.playstyle]} · DT {opp.coachName}
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <h3 className="font-bold">Plan de partido</h3>
        <div>
          <label className="text-xs text-slate-400">Formación</label>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {ALL_FORMATIONS.map((f) => (
              <button key={f} onClick={() => setFormation(f)} className={`chip ${formation === f ? "bg-pitch-500 text-white" : "bg-ink-700 text-slate-300"}`}>{f}</button>
            ))}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">{FORMATION_LABELS[formation]}</p>
        </div>
        <div>
          <label className="text-xs text-slate-400">Estilo</label>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {(Object.keys(PLAYSTYLE_LABELS) as Playstyle[]).map((s) => (
              <button key={s} onClick={() => setPlaystyle(s)} className={`chip ${playstyle === s ? "bg-pitch-500 text-white" : "bg-ink-700 text-slate-300"}`}>{PLAYSTYLE_LABELS[s]}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-400">Actitud</label>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {AGGRESSION.map((a) => (
              <button key={a.v} onClick={() => setAggression(a.v)} className={`chip ${aggression === a.v ? "bg-accent-amber text-white" : "bg-ink-700 text-slate-300"}`}>{a.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          className="btn-ghost py-3"
          disabled={busy}
          onClick={async () => {
            const r = await act({ type: "playMatch", formation, playstyle, aggression });
            if (r?.result.matchId) setResultId(r.result.matchId);
          }}
        >
          ⏩ Simular rápido
        </button>
        <button
          className="btn-primary py-3"
          disabled={busy}
          onClick={async () => {
            const r = await act({ type: "playMatch", formation, playstyle, aggression });
            if (r?.result.matchId) setWatchId(r.result.matchId);
          }}
        >
          📺 Ver partido (2D)
        </button>
      </div>
    </div>
  );
}

function TeamBig({ flag, name, rating }: { flag: string; name: string; rating: number }) {
  return (
    <div className="text-center">
      <div className="text-5xl">{flag}</div>
      <div className="font-bold mt-1 max-w-[28vw] truncate">{name}</div>
      <div className="text-xs text-slate-400">Media {rating}</div>
    </div>
  );
}

function MatchResultView({ m, state, onContinue }: { m: MatchResult; state: GameProps["state"]; onContinue: () => void }) {
  const c = m.chronicle;
  const mvp = c?.mvpPlayerId ? state.players[c.mvpPlayerId] : undefined;
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="card p-6 text-center">
        <div className="text-xs uppercase text-slate-500">{m.round}</div>
        <div className="flex items-center justify-center gap-4 my-3">
          <span className="text-3xl">{state.teams[m.homeTeamId].flag}</span>
          <span className="text-4xl font-black tabular-nums">{m.homeGoals} - {m.awayGoals}</span>
          <span className="text-3xl">{state.teams[m.awayTeamId].flag}</span>
        </div>
        {m.penaltyShootout && <div className="text-sm text-accent-amber">Penaltis: {m.homePenalties} - {m.awayPenalties}</div>}
        {m.extraTime && !m.penaltyShootout && <div className="text-xs text-slate-400">Tras la prórroga</div>}
        {c && <div className="font-bold text-lg mt-2">{c.headline}</div>}
      </div>

      {c && (
        <div className="card p-4 space-y-2 text-sm">
          <Row icon="🔑" label="Clave táctica" text={c.tacticalKey} />
          <Row icon="⏱️" label="Momento decisivo" text={c.decisiveMoment} />
          {mvp && <Row icon="⭐" label="MVP" text={`${mvp.name} (${mvp.overall})`} />}
          {c.summary && <Row icon="📝" label="Resumen" text={c.summary} />}
        </div>
      )}

      {m.stats && (
        <div className="card p-4 grid grid-cols-3 gap-2 text-center text-sm">
          <StatCol label="Posesión" home={`${m.stats.homePossession}%`} away={`${100 - m.stats.homePossession}%`} />
          <StatCol label="Tiros" home={m.stats.homeShots} away={m.stats.awayShots} />
          <StatCol label="A puerta" home={m.stats.homeShotsOnTarget} away={m.stats.awayShotsOnTarget} />
        </div>
      )}

      <div className="card p-4 max-h-56 overflow-y-auto">
        <div className="text-xs uppercase text-slate-500 mb-1">Eventos</div>
        {m.events.filter((e) => ["goal", "red", "penalty", "penalty_miss", "injury", "info"].includes(e.type)).map((e, i) => (
          <div key={i} className="text-sm py-0.5"><span className="text-slate-500 mr-2 tabular-nums">{e.minute}'</span>{e.text}</div>
        ))}
      </div>

      <button className="btn-primary w-full" onClick={onContinue}>Continuar →</button>
    </div>
  );
}

function Row({ icon, label, text }: { icon: string; label: string; text: string }) {
  return (
    <div className="flex gap-2">
      <span>{icon}</span>
      <div><span className="text-slate-400">{label}: </span>{text}</div>
    </div>
  );
}

function StatCol({ label, home, away }: { label: string; home: React.ReactNode; away: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-bold"><span className="text-pitch-400">{home}</span> · <span className="text-accent-info">{away}</span></div>
    </div>
  );
}
