"use client";
import { useState } from "react";
import type { GameProps } from "@/app/play/[id]/GameClient";
import type { Player } from "@/lib/types";
import { PlayerCard } from "@/components/PlayerCard";
import { Bar, Stat } from "@/components/ui";
import { Match } from "./Match";
import { ALL_FORMATIONS, FORMATION_LABELS, FORMATIONS } from "@/lib/engine/formations";
import { PLAYSTYLE_LABELS, ratingColor } from "@/lib/labels";
import { TRAININGS } from "@/lib/engine/training";

const TABS = [
  { id: "partido", label: "⚽ Partido" },
  { id: "calendario", label: "📅 Calendario" },
  { id: "plantilla", label: "👥 Plantilla" },
  { id: "tactica", label: "🎯 Táctica" },
  { id: "entreno", label: "🏃 Entreno" },
  { id: "clasificacion", label: "📊 Grupos" },
  { id: "cuadro", label: "🏆 Cuadro" },
  { id: "noticias", label: "📰 Noticias" },
  { id: "stats", label: "📈 Stats" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function Hub(props: GameProps) {
  const [tab, setTab] = useState<TabId>("partido");
  return (
    <main className="max-w-6xl mx-auto px-4 py-4">
      <ObjectiveBar {...props} />
      <nav className="flex gap-1.5 overflow-x-auto pb-2 mb-4 -mx-1 px-1 sticky top-[57px] z-20">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`chip whitespace-nowrap px-3 py-1.5 ${tab === t.id ? "bg-pitch-500 text-ink-900" : "bg-ink-800 text-slate-300 hover:bg-ink-700"}`}>
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "partido" && <Match {...props} />}
      {tab === "calendario" && <Calendar {...props} />}
      {tab === "plantilla" && <Squad {...props} />}
      {tab === "tactica" && <Tactics {...props} />}
      {tab === "entreno" && <Training {...props} />}
      {tab === "clasificacion" && <Standings {...props} />}
      {tab === "cuadro" && <Bracket {...props} />}
      {tab === "noticias" && <News {...props} />}
      {tab === "stats" && <Stats {...props} />}
    </main>
  );
}

function ObjectiveBar({ state }: GameProps) {
  return (
    <div className="card px-4 py-2 mb-3 flex items-center justify-between text-sm">
      <span className="text-slate-300">🎯 Objetivo: <b>{state.objective.label}</b> <span className="text-slate-500">(mín. {state.objective.targetRound})</span></span>
      <span className="text-xs text-slate-400">Vestuario {state.dressingRoom} · Reputación {state.coachReputation}</span>
    </div>
  );
}

// ----------------------------- Plantilla -----------------------------
function Squad({ state, act, busy }: GameProps) {
  const user = state.teams[state.userTeamId];
  const squad = user.squad.map((id) => state.players[id]).filter(Boolean) as Player[];
  const starters = new Set(user.lineup);
  const sorted = [...squad].sort((a, b) => (starters.has(b.id) ? 1 : 0) - (starters.has(a.id) ? 1 : 0) || b.overall - a.overall);

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <Stat label="Plantilla" value={`${squad.length}`} />
        <Stat label="Media" value={user.rating} />
        <Stat label="Química" value={user.chemistry} />
        <Stat label="Capitán" value={user.captainId ? state.players[user.captainId]?.name.split(" ").slice(-1)[0] ?? "-" : "-"} />
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {sorted.map((p) => (
          <PlayerCard key={p.id} player={p}
            action={
              <div className="flex flex-col gap-1 items-end">
                {starters.has(p.id) && <span className="chip bg-pitch-500/20 text-pitch-400">XI</span>}
                {user.captainId === p.id && <span className="chip bg-accent-gold/20 text-accent-gold">©</span>}
                <button className="text-[10px] text-slate-400 hover:text-white" disabled={busy} onClick={() => act({ type: "setCaptain", playerId: p.id })}>capitán</button>
              </div>
            }
          />
        ))}
      </div>
    </div>
  );
}

// ----------------------------- Táctica -----------------------------
function Tactics({ state, act, busy }: GameProps) {
  const user = state.teams[state.userTeamId];
  const slots = FORMATIONS[user.formation];
  const lineup = user.lineup.map((id) => state.players[id]).filter(Boolean) as Player[];
  const bench = user.squad.map((id) => state.players[id]).filter((p): p is Player => Boolean(p) && !user.lineup.includes(p.id));
  const [swapSlot, setSwapSlot] = useState<number | null>(null);

  function swapIn(playerId: string) {
    if (swapSlot === null) return;
    const newLineup = [...user.lineup];
    const existingIdx = newLineup.indexOf(playerId);
    if (existingIdx >= 0) newLineup[existingIdx] = newLineup[swapSlot];
    newLineup[swapSlot] = playerId;
    act({ type: "setLineup", lineup: newLineup });
    setSwapSlot(null);
  }

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <div className="card p-4">
        <h3 className="font-bold mb-2">Formación</h3>
        <div className="flex flex-wrap gap-1.5 mb-1">
          {ALL_FORMATIONS.map((f) => (
            <button key={f} disabled={busy} onClick={() => act({ type: "setFormation", formation: f })}
              className={`chip ${user.formation === f ? "bg-pitch-500 text-ink-900" : "bg-ink-700 text-slate-300"}`}>{f}</button>
          ))}
        </div>
        <p className="text-[11px] text-slate-500 mb-4">{FORMATION_LABELS[user.formation]}</p>

        <h3 className="font-bold mb-2">Estilo de juego</h3>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(PLAYSTYLE_LABELS)).map((s) => (
            <button key={s} disabled={busy} onClick={() => act({ type: "setPlaystyle", playstyle: s as any })}
              className={`chip ${user.playstyle === s ? "bg-pitch-500 text-ink-900" : "bg-ink-700 text-slate-300"}`}>{PLAYSTYLE_LABELS[s]}</button>
          ))}
        </div>

        <h3 className="font-bold mt-4 mb-2">Lanzadores</h3>
        <RoleSelect label="Penaltis" players={lineup} value={user.penaltyTakerId} onChange={(id) => act({ type: "setRoles", penaltyTakerId: id })} />
        <RoleSelect label="Faltas" players={lineup} value={user.freekickTakerId} onChange={(id) => act({ type: "setRoles", freekickTakerId: id })} />
        <RoleSelect label="Córners" players={lineup} value={user.cornerTakerId} onChange={(id) => act({ type: "setRoles", cornerTakerId: id })} />
      </div>

      <div className="card p-4">
        <h3 className="font-bold mb-2">Once inicial {swapSlot !== null && <span className="text-xs text-accent-amber">— elige un suplente abajo</span>}</h3>
        <div className="space-y-1 mb-4">
          {slots.map((slot, i) => {
            const p = lineup[i];
            return (
              <button key={i} onClick={() => setSwapSlot(swapSlot === i ? null : i)}
                className={`w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm ${swapSlot === i ? "bg-accent-amber/20 ring-1 ring-accent-amber" : "bg-ink-900/50 hover:bg-ink-700"}`}>
                <span className="text-xs font-bold w-9 text-slate-400">{slot}</span>
                <span className="text-lg">{p?.originFlag}</span>
                <span className="flex-1 truncate">{p?.name ?? "—"}</span>
                <span className={`font-bold ${ratingColor(p?.overall ?? 0)}`}>{p?.overall ?? ""}</span>
              </button>
            );
          })}
        </div>
        <h4 className="text-sm text-slate-400 mb-1">Suplentes</h4>
        <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
          {bench.map((p) => (
            <button key={p.id} disabled={swapSlot === null} onClick={() => swapIn(p.id)}
              className={`w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm bg-ink-900/40 ${swapSlot !== null ? "hover:bg-pitch-500/20" : "opacity-60"}`}>
              <span className="text-xs font-bold w-9 text-slate-500">{p.position}</span>
              <span className="text-lg">{p.originFlag}</span>
              <span className="flex-1 truncate">{p.name}</span>
              {p.injuredDays > 0 && <span className="text-[10px] text-accent-danger">🚑</span>}
              <span className="font-bold text-slate-300">{p.overall}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function RoleSelect({ label, players, value, onChange }: { label: string; players: Player[]; value: string | null; onChange: (id: string) => void }) {
  return (
    <div className="flex items-center gap-2 mb-1.5">
      <span className="text-xs text-slate-400 w-16">{label}</span>
      <select className="input py-1.5 text-sm" value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
        {players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
    </div>
  );
}

// ----------------------------- Entreno -----------------------------
function Training({ state, act, busy }: GameProps) {
  const user = state.teams[state.userTeamId];
  const squad = user.squad.map((id) => state.players[id]).filter(Boolean) as Player[];
  const [target, setTarget] = useState<string>(squad[0]?.id ?? "");
  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <div className="card p-4">
        <h3 className="font-bold mb-3">Sesión de entrenamiento</h3>
        <div className="grid grid-cols-2 gap-2">
          {TRAININGS.filter((t) => t.type !== "individual").map((t) => (
            <button key={t.type} disabled={busy} onClick={() => act({ type: "training", trainingType: t.type })}
              className="text-left rounded-xl bg-ink-900/50 hover:bg-ink-700 p-3 transition">
              <div className="font-semibold">{t.label}</div>
              <div className="text-[11px] text-slate-400">{t.desc}</div>
            </button>
          ))}
        </div>
        <div className="mt-3 rounded-xl bg-ink-900/50 p-3">
          <div className="font-semibold mb-1">Entrenamiento individual</div>
          <div className="flex gap-2">
            <select className="input py-1.5 text-sm" value={target} onChange={(e) => setTarget(e.target.value)}>
              {squad.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.overall}/{p.potential})</option>)}
            </select>
            <button className="btn-primary text-sm px-3" disabled={busy} onClick={() => act({ type: "training", trainingType: "individual", targetPlayerId: target })}>Entrenar</button>
          </div>
        </div>
      </div>
      <div className="card p-4">
        <h3 className="font-bold mb-3">Charla al equipo</h3>
        <div className="space-y-2">
          <button className="btn-ghost w-full justify-start" disabled={busy} onClick={() => act({ type: "teamTalk", tone: "motivar" })}>💪 Motivar (sube moral)</button>
          <button className="btn-ghost w-full justify-start" disabled={busy} onClick={() => act({ type: "teamTalk", tone: "exigir" })}>🔥 Exigir (arriesgado)</button>
          <button className="btn-ghost w-full justify-start" disabled={busy} onClick={() => act({ type: "teamTalk", tone: "calmar" })}>🧘 Calmar (baja tensión)</button>
        </div>
        <div className="mt-4 space-y-2">
          <Bar value={user.chemistry} label="Química del equipo" />
          <Bar value={avg(squad.map((p) => p.morale))} label="Moral media" />
          <Bar value={100 - avg(squad.map((p) => p.fatigue))} label="Frescura (100 - fatiga)" />
        </div>
      </div>
    </div>
  );
}

const avg = (n: number[]) => (n.length ? n.reduce((a, b) => a + b, 0) / n.length : 0);

// ----------------------------- Calendario -----------------------------
function Calendar({ state }: GameProps) {
  const userMatches = state.matches.filter((m) => m.involvesUser);
  return (
    <div className="space-y-2">
      {userMatches.length === 0 && <p className="text-slate-400 text-center py-8">El calendario aparecerá al empezar el torneo.</p>}
      {userMatches.map((m) => {
        const home = state.teams[m.homeTeamId];
        const away = state.teams[m.awayTeamId];
        return (
          <div key={m.id} className="card px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-slate-400 w-28 shrink-0">{m.round}</span>
            <div className="flex items-center gap-2 flex-1 justify-center">
              <span>{home.flag} {home.name}</span>
              <span className="font-black tabular-nums px-2">{m.played ? `${m.homeGoals}-${m.awayGoals}` : "vs"}</span>
              <span>{away.name} {away.flag}</span>
            </div>
            <span className="w-10 text-right text-xs">{m.played ? "✓" : "⏳"}</span>
          </div>
        );
      })}
    </div>
  );
}

// ----------------------------- Clasificación -----------------------------
function Standings({ state }: GameProps) {
  const userGroup = state.groups.find((g) => g.teamIds.includes(state.userTeamId))?.id;
  return (
    <div className="grid md:grid-cols-2 gap-3">
      {state.groups.map((g) => (
        <div key={g.id} className={`card p-3 ${g.id === userGroup ? "border-pitch-500/50" : ""}`}>
          <div className="font-bold mb-2 text-sm">Grupo {g.id} {g.id === userGroup && <span className="text-pitch-400">· tú</span>}</div>
          <table className="w-full text-sm">
            <thead className="text-[10px] text-slate-500 uppercase">
              <tr><th className="text-left">Equipo</th><th>PJ</th><th>DG</th><th>Pts</th></tr>
            </thead>
            <tbody>
              {[...g.teamIds].map((id) => state.teams[id])
                .sort((a, b) => b.points - a.points || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf)
                .map((t, i) => (
                  <tr key={t.id} className={`${t.id === state.userTeamId ? "text-pitch-400 font-bold" : ""} ${i < 2 ? "" : "text-slate-400"}`}>
                    <td className="py-0.5 truncate">{i + 1}. {t.flag} {t.name}</td>
                    <td className="text-center">{t.played}</td>
                    <td className="text-center">{t.gf - t.ga}</td>
                    <td className="text-center font-bold">{t.points}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

// ----------------------------- Cuadro -----------------------------
function Bracket({ state }: GameProps) {
  if (state.knockout.length === 0) return <p className="text-slate-400 text-center py-8">El cuadro se generará al acabar la fase de grupos.</p>;
  const rounds: Array<["32" | "16" | "QF" | "SF" | "F" | "3rd", string]> = [
    ["32", "Dieciseisavos"], ["16", "Octavos"], ["QF", "Cuartos"], ["SF", "Semifinal"], ["3rd", "Tercer puesto"], ["F", "Final"],
  ];
  return (
    <div className="space-y-4">
      {rounds.map(([r, label]) => {
        const ties = state.knockout.filter((t) => t.round === r);
        if (ties.length === 0) return null;
        return (
          <div key={r}>
            <h3 className="text-sm uppercase tracking-wide text-slate-500 mb-2">{label}</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {ties.map((t) => {
                const h = t.homeTeamId ? state.teams[t.homeTeamId] : null;
                const a = t.awayTeamId ? state.teams[t.awayTeamId] : null;
                return (
                  <div key={t.id} className="card p-2 text-sm">
                    <TieRow team={h} win={t.winnerId === t.homeTeamId} user={t.homeTeamId === state.userTeamId} fallback={t.homeRef} />
                    <TieRow team={a} win={t.winnerId === t.awayTeamId} user={t.awayTeamId === state.userTeamId} fallback={t.awayRef} />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TieRow({ team, win, user, fallback }: { team: any; win: boolean; user: boolean; fallback: string }) {
  return (
    <div className={`flex items-center gap-1.5 py-0.5 ${win ? "font-bold" : "text-slate-400"} ${user ? "text-pitch-400" : ""}`}>
      <span>{team?.flag ?? "·"}</span>
      <span className="truncate flex-1">{team?.name ?? fallback ?? "Por definir"}</span>
      {win && <span>✓</span>}
    </div>
  );
}

// ----------------------------- Noticias -----------------------------
function News({ state }: GameProps) {
  return (
    <div className="space-y-2">
      {state.news.length === 0 && <p className="text-slate-400 text-center py-8">Sin noticias todavía.</p>}
      {state.news.map((n) => (
        <div key={n.id} className={`card p-3 border-l-4 ${n.tone === "good" ? "border-l-pitch-500" : n.tone === "bad" ? "border-l-accent-danger" : "border-l-ink-500"}`}>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 uppercase">
            <span className="chip bg-ink-700 text-slate-300">{n.category}</span>
            <span>Día {n.day < 0 ? n.day : `+${n.day}`}</span>
          </div>
          <div className="font-bold mt-1">{n.title}</div>
          <div className="text-sm text-slate-300">{n.body}</div>
        </div>
      ))}
    </div>
  );
}

// ----------------------------- Stats -----------------------------
function Stats({ state }: GameProps) {
  const user = state.teams[state.userTeamId];
  const squad = user.squad.map((id) => state.players[id]).filter(Boolean) as Player[];
  const scorers = [...squad].filter((p) => p.stats.goals > 0).sort((a, b) => b.stats.goals - a.stats.goals).slice(0, 8);
  const rated = [...squad].filter((p) => p.stats.matches > 0)
    .map((p) => ({ p, r: p.stats.ratingSum / p.stats.matches }))
    .sort((a, b) => b.r - a.r).slice(0, 8);
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="card p-4">
        <h3 className="font-bold mb-2">🥅 Goleadores de tu selección</h3>
        {scorers.length === 0 && <p className="text-slate-500 text-sm">Aún no hay goles.</p>}
        {scorers.map((p) => (
          <div key={p.id} className="flex items-center gap-2 py-1 text-sm border-b border-ink-700/40 last:border-0">
            <span>{p.originFlag}</span><span className="flex-1 truncate">{p.name}</span>
            <span className="font-bold">{p.stats.goals}⚽</span>
            <span className="text-slate-500 text-xs">{p.stats.assists}🅰️</span>
          </div>
        ))}
      </div>
      <div className="card p-4">
        <h3 className="font-bold mb-2">⭐ Mejor valorados</h3>
        {rated.length === 0 && <p className="text-slate-500 text-sm">Sin partidos disputados.</p>}
        {rated.map(({ p, r }) => (
          <div key={p.id} className="flex items-center gap-2 py-1 text-sm border-b border-ink-700/40 last:border-0">
            <span>{p.originFlag}</span><span className="flex-1 truncate">{p.name}</span>
            <span className="font-bold text-pitch-400">{r.toFixed(1)}</span>
            <span className="text-slate-500 text-xs">{p.stats.matches}PJ</span>
          </div>
        ))}
      </div>
    </div>
  );
}
