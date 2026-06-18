"use client";
import { useCallback, useState } from "react";
import Link from "next/link";
import type { CareerState } from "@/lib/types";
import type { Action, ActionResult } from "@/lib/actions";
import { post } from "@/lib/client";
import { Toast } from "@/components/ui";
import { Intro } from "@/components/game/Intro";
import { Draft } from "@/components/game/Draft";
import { Recruitment } from "@/components/game/Recruitment";
import { Hub } from "@/components/game/Hub";
import { Epilogue } from "@/components/game/Epilogue";

export interface GameProps {
  state: CareerState;
  act: (action: Action) => Promise<{ result: ActionResult; state: CareerState } | null>;
  busy: boolean;
}

export function GameClient({ careerId, initialState }: { careerId: string; initialState: CareerState }) {
  const [state, setState] = useState<CareerState>(initialState);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  const act = useCallback(
    async (action: Action) => {
      setBusy(true);
      try {
        const data = await post<{ result: ActionResult; state: CareerState }>(`/api/careers/${careerId}/action`, action);
        setState(data.state);
        if (data.result?.message) setToast(data.result.message);
        return data;
      } catch (err) {
        setToast((err as Error).message);
        return null;
      } finally {
        setBusy(false);
      }
    },
    [careerId],
  );

  const props: GameProps = { state, act, busy };

  return (
    <div className="min-h-screen">
      <TopBar state={state} />
      <div className="animate-fade-in">
        {state.phase === "intro" && <Intro {...props} />}
        {state.phase === "draft" && <Draft {...props} />}
        {state.phase === "recruitment" && <Recruitment {...props} />}
        {(state.phase === "groups" || state.phase === "knockouts") && <Hub {...props} />}
        {state.phase === "finished" && <Epilogue {...props} />}
      </div>
      {toast && <Toast msg={toast} onClose={() => setToast("")} />}
    </div>
  );
}

function TopBar({ state }: { state: CareerState }) {
  const user = state.teams[state.userTeamId];
  return (
    <header className="sticky top-0 z-30 border-b border-ink-600/60 bg-ink-900/80 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/careers" className="text-slate-400 hover:text-pitch-600 shrink-0">←</Link>
          <span className="text-2xl shrink-0">{user.flag}</span>
          <div className="min-w-0">
            <div className="font-bold truncate">{user.name}</div>
            <div className="text-[11px] text-slate-400">Media {user.rating} · Química {user.chemistry}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <Meta label="Día" value={state.day < 0 ? `${state.day}` : `+${state.day}`} />
          <Meta label="Afición" value={`${state.fanConfidence}`} />
          <Meta label="Federación" value={`${state.boardConfidence}`} />
        </div>
      </div>
    </header>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center hidden sm:block">
      <div className="text-[10px] uppercase text-slate-500">{label}</div>
      <div className="font-bold">{value}</div>
    </div>
  );
}
