"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { del, post } from "@/lib/client";
import { DIFFICULTY_LABELS } from "@/lib/labels";

interface CareerRow {
  id: string;
  nationName: string;
  baseCountry: string;
  difficulty: string;
  phase: string;
  stageLabel: string;
  finished: boolean;
  result: string | null;
  updatedAt: string;
}

export function CareersList({ userName, careers, trophies }: { userName: string; careers: CareerRow[]; trophies: number }) {
  const router = useRouter();
  const [items, setItems] = useState(careers);
  const active = items.filter((c) => !c.finished);
  const finished = items.filter((c) => c.finished);

  async function remove(id: string) {
    if (!confirm("¿Eliminar esta carrera? No se puede deshacer.")) return;
    await del(`/api/careers/${id}`);
    setItems((prev) => prev.filter((c) => c.id !== id));
  }

  async function logout() {
    await post("/api/auth/logout", {});
    router.push("/");
    router.refresh();
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <header className="flex items-center justify-between mb-8">
        <Link href="/" className="font-black text-xl">⚽ Manager <span className="text-pitch-400">Mundial</span></Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400 hidden sm:block">👋 {userName}</span>
          <button onClick={logout} className="btn-ghost text-sm">Salir</button>
        </div>
      </header>

      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black">Mis carreras</h1>
          <p className="text-slate-400">🏆 Palmarés: {trophies} {trophies === 1 ? "Mundial" : "Mundiales"} ganados · {finished.length} carreras terminadas</p>
        </div>
        <Link href="/careers/new" className="btn-primary">+ Nueva carrera</Link>
      </div>

      {items.length === 0 && (
        <div className="card p-10 text-center">
          <div className="text-5xl mb-3">🌍</div>
          <p className="text-slate-300 font-semibold">Aún no tienes ninguna carrera.</p>
          <p className="text-slate-500 text-sm mb-5">El mundo necesita un nuevo seleccionador. ¿Aceptas el reto?</p>
          <Link href="/careers/new" className="btn-primary">Crear mi primera selección</Link>
        </div>
      )}

      {active.length > 0 && (
        <Section title="En curso">
          {active.map((c) => <CareerCard key={c.id} c={c} onDelete={remove} />)}
        </Section>
      )}
      {finished.length > 0 && (
        <Section title="Historial">
          {finished.map((c) => <CareerCard key={c.id} c={c} onDelete={remove} />)}
        </Section>
      )}
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-sm uppercase tracking-wide text-slate-500 mb-3">{title}</h2>
      <div className="grid sm:grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function CareerCard({ c, onDelete }: { c: CareerRow; onDelete: (id: string) => void }) {
  return (
    <div className="card p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-bold text-lg">{c.nationName}</div>
          <div className="text-xs text-slate-400">Base: {c.baseCountry} · {DIFFICULTY_LABELS[c.difficulty] ?? c.difficulty}</div>
        </div>
        <span className={`chip ${c.finished ? "bg-accent-gold/20 text-accent-gold" : "bg-pitch-500/15 text-pitch-400"}`}>
          {c.finished ? c.result ?? "Terminada" : c.stageLabel}
        </span>
      </div>
      <div className="flex gap-2">
        <Link href={`/play/${c.id}`} className="btn-primary flex-1 text-sm">
          {c.finished ? "Ver resumen" : "Continuar"}
        </Link>
        <button onClick={() => onDelete(c.id)} className="btn-danger text-sm px-3">🗑</button>
      </div>
    </div>
  );
}
