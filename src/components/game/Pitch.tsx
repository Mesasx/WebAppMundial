"use client";
import { useEffect, useRef, useState } from "react";
import type { MatchEvent, Player, Team } from "@/lib/types";
import { FORMATION_COORDS } from "@/lib/engine/formations";

// Representación 2D sencilla del partido: fichas (puntos) en formación, un balón
// que se mueve y eventos narrados minuto a minuto con estadísticas en vivo.
export function Pitch({
  home,
  away,
  events,
  players,
  finalHome,
  finalAway,
  onFinish,
}: {
  home: Team;
  away: Team;
  events: MatchEvent[];
  players: Record<string, Player>;
  finalHome: number;
  finalAway: number;
  onFinish: () => void;
}) {
  const [clock, setClock] = useState(0);
  const [ball, setBall] = useState({ x: 50, y: 50 });
  const [hg, setHg] = useState(0);
  const [ag, setAg] = useState(0);
  const [log, setLog] = useState<MatchEvent[]>([]);
  const [flash, setFlash] = useState<string | null>(null);
  const shown = useRef(new Set<number>());
  const maxMin = events.reduce((m, e) => Math.max(m, e.minute), 90);

  useEffect(() => {
    const timer = setInterval(() => {
      setClock((c) => {
        const next = c + 1;
        if (next > maxMin + 1) {
          clearInterval(timer);
          onFinish();
          return c;
        }
        return next;
      });
      setBall({ x: 12 + Math.random() * 76, y: 15 + Math.random() * 70 });
    }, 220);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    events.forEach((e, i) => {
      if (e.minute <= clock && !shown.current.has(i)) {
        shown.current.add(i);
        setLog((l) => [e, ...l].slice(0, 40));
        if (e.type === "goal") {
          if (e.teamId === home.id) { setHg((g) => g + 1); setBall({ x: 95, y: 50 }); }
          else { setAg((g) => g + 1); setBall({ x: 5, y: 50 }); }
          setFlash(`⚽ GOL ${e.minute}'`);
          setTimeout(() => setFlash(null), 900);
        } else if (e.type === "red") {
          setFlash("🟥 ROJA");
          setTimeout(() => setFlash(null), 800);
        } else if (e.type === "penalty") {
          setFlash("⚠️ PENALTI");
          setTimeout(() => setFlash(null), 800);
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clock]);

  const homeCoords = FORMATION_COORDS[home.formation] ?? FORMATION_COORDS["4-3-3"];
  const awayCoords = (FORMATION_COORDS[away.formation] ?? FORMATION_COORDS["4-3-3"]).map((c) => ({ x: 100 - c.x, y: c.y }));
  const homeLineup = home.lineup.map((id) => players[id]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2 px-1">
        <TeamScore flag={home.flag} name={home.name} goals={hg} />
        <div className="text-center">
          <div className="text-3xl font-black tabular-nums">{hg} - {ag}</div>
          <div className="text-xs text-slate-400">{Math.min(clock, maxMin)}'</div>
        </div>
        <TeamScore flag={away.flag} name={away.name} goals={ag} right />
      </div>

      <div className="relative aspect-[16/10] rounded-xl overflow-hidden border border-ink-600 field-stripes">
        {/* líneas del campo */}
        <div className="absolute inset-3 border-2 border-white/30 rounded" />
        <div className="absolute left-1/2 top-3 bottom-3 w-0.5 bg-white/30 -translate-x-1/2" />
        <div className="absolute left-1/2 top-1/2 h-16 w-16 border-2 border-white/30 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute left-3 top-1/2 h-24 w-12 border-2 border-white/30 border-l-0 -translate-y-1/2" />
        <div className="absolute right-3 top-1/2 h-24 w-12 border-2 border-white/30 border-r-0 -translate-y-1/2" />

        {/* fichas locales */}
        {homeCoords.map((c, i) => (
          <Dot key={`h${i}`} x={c.x} y={c.y} color="bg-pitch-400" label={homeLineup[i]?.position} />
        ))}
        {/* fichas visitantes (anónimas) */}
        {awayCoords.map((c, i) => (
          <Dot key={`a${i}`} x={c.x} y={c.y} color="bg-accent-info" />
        ))}

        {/* balón */}
        <div
          className="absolute h-3 w-3 rounded-full bg-white shadow-lg transition-all duration-200 ease-linear -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${ball.x}%`, top: `${ball.y}%` }}
        />

        {flash && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-4xl font-black text-white drop-shadow-lg animate-pop bg-black/40 px-6 py-3 rounded-2xl">{flash}</div>
          </div>
        )}
      </div>

      <div className="mt-3 card p-3 h-40 overflow-y-auto">
        <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Narración en vivo</div>
        {log.length === 0 && <p className="text-slate-500 text-sm">El balón rueda...</p>}
        {log.map((e, i) => (
          <div key={i} className="text-sm py-0.5 border-b border-ink-700/40 last:border-0">
            <span className="text-slate-500 mr-2 tabular-nums">{e.minute}'</span>
            {e.text}
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamScore({ flag, name, goals, right }: { flag: string; name: string; goals: number; right?: boolean }) {
  return (
    <div className={`flex items-center gap-2 min-w-0 ${right ? "flex-row-reverse text-right" : ""}`}>
      <span className="text-2xl">{flag}</span>
      <span className="font-bold truncate max-w-[30vw]">{name}</span>
    </div>
  );
}

function Dot({ x, y, color, label }: { x: number; y: number; color: string; label?: string }) {
  return (
    <div className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center" style={{ left: `${x}%`, top: `${y}%` }}>
      <div className={`h-3.5 w-3.5 rounded-full ${color} ring-2 ring-black/30`} />
      {label && <span className="text-[8px] text-white/70 mt-0.5 font-bold">{label}</span>}
    </div>
  );
}
