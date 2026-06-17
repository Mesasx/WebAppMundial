"use client";
import clsx from "clsx";
import type { Player } from "@/lib/types";
import { POSITION_LABELS, ratingColor, TRAIT_COLORS } from "@/lib/labels";

// Carta de jugador PROPIA (no copia diseños con licencia). Muestra nombre,
// posición, media, bandera, club, edad, forma, moral y rasgo especial.
export function PlayerCard({
  player,
  onClick,
  selected,
  compact,
  action,
}: {
  player: Player;
  onClick?: () => void;
  selected?: boolean;
  compact?: boolean;
  action?: React.ReactNode;
}) {
  const ovr = player.overall;
  return (
    <div
      onClick={onClick}
      className={clsx(
        "card p-3 transition relative overflow-hidden",
        onClick && "cursor-pointer hover:border-pitch-500/60 hover:-translate-y-0.5",
        selected && "border-pitch-500 ring-2 ring-pitch-500/40",
      )}
    >
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-pitch-500/5" />
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center w-12 shrink-0">
          <div className={clsx("text-2xl font-black leading-none", ratingColor(ovr))}>{ovr}</div>
          <div className="text-[10px] font-bold text-slate-400 mt-0.5">{player.position}</div>
          <div className="text-xl mt-1">{player.originFlag}</div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-bold truncate">{player.name}</div>
          <div className="text-xs text-slate-400 truncate">
            {POSITION_LABELS[player.position]} · {player.age} años
          </div>
          <div className="text-xs text-slate-500 truncate">{player.club}</div>
          {!compact && (
            <div className="mt-2 grid grid-cols-3 gap-1.5 text-[10px]">
              <MiniStat label="FOR" value={player.form} />
              <MiniStat label="MOR" value={player.morale} />
              <MiniStat label="FAT" value={player.fatigue} invert />
            </div>
          )}
          {player.traits.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {player.traits.slice(0, compact ? 1 : 3).map((t) => (
                <span key={t} className={clsx("chip", TRAIT_COLORS[t])}>{t}</span>
              ))}
            </div>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {player.injuredDays > 0 && (
        <div className="mt-2 text-[11px] text-accent-danger font-semibold">🚑 Lesionado · {player.injuredDays}d</div>
      )}
    </div>
  );
}

function MiniStat({ label, value, invert }: { label: string; value: number; invert?: boolean }) {
  const good = invert ? value < 40 : value >= 60;
  return (
    <div className="text-center">
      <div className="text-slate-500">{label}</div>
      <div className={clsx("font-bold", good ? "text-pitch-400" : value >= 40 ? "text-accent-amber" : "text-accent-danger")}>
        {Math.round(value)}
      </div>
    </div>
  );
}
