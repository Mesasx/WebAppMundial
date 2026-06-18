"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { post } from "@/lib/client";
import { realNationOptions } from "@/data/countries";
import { DIFFICULTY_INFO, NATION_NAME_IDEAS } from "@/lib/narrative";

const NATIONS = realNationOptions();

export default function NewCareerPage() {
  const router = useRouter();
  const [baseCountry, setBase] = useState("España");
  const [nationName, setName] = useState("");
  const [difficulty, setDiff] = useState("normal");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const baseNation = NATIONS.find((n) => n.name === baseCountry);
  const effectiveName = nationName.trim() || baseCountry;

  async function create() {
    setError("");
    setLoading(true);
    try {
      const { id } = await post<{ id: string }>("/api/careers", {
        nationName: effectiveName,
        baseCountry,
        flag: baseNation?.flag ?? "🏳️",
        difficulty,
      });
      router.push(`/play/${id}`);
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/careers" className="text-sm text-slate-400 hover:text-white">← Mis carreras</Link>
      <h1 className="text-3xl font-black mt-3 mb-1">Crea tu selección</h1>
      <p className="text-slate-400 mb-6">En este universo, tu selección nace de cero. Elige una base y ponle el nombre que quieras.</p>

      <div className="card p-5 mb-4">
        <label className="text-sm font-semibold">País base (identidad y bandera)</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 max-h-64 overflow-y-auto pr-1">
          {NATIONS.map((n) => (
            <button
              key={n.name}
              onClick={() => setBase(n.name)}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm border transition ${
                baseCountry === n.name ? "border-pitch-500 bg-pitch-500/10" : "border-ink-600 bg-ink-900/40 hover:border-ink-500"
              }`}
            >
              <span className="text-xl">{n.flag}</span>
              <span className="truncate">{n.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card p-5 mb-4">
        <label className="text-sm font-semibold">Nombre de la selección</label>
        <input
          className="input mt-2"
          placeholder={baseCountry}
          value={nationName}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
        />
        <div className="flex flex-wrap gap-2 mt-3">
          {NATION_NAME_IDEAS.map((idea) => (
            <button key={idea} onClick={() => setName(idea)} className="chip bg-ink-700 text-slate-300 hover:bg-ink-600">{idea}</button>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Jugará con la bandera de {baseNation?.flag} {baseCountry}, pero la plantilla la construyes tú: no tiene por qué tener jugadores de ese país.
        </p>
      </div>

      <div className="card p-5 mb-6">
        <label className="text-sm font-semibold">Dificultad</label>
        <div className="grid sm:grid-cols-2 gap-2 mt-3">
          {Object.entries(DIFFICULTY_INFO).map(([key, info]) => (
            <button
              key={key}
              onClick={() => setDiff(key)}
              className={`rounded-xl px-4 py-3 text-left border transition ${
                difficulty === key ? "border-pitch-500 bg-pitch-500/10" : "border-ink-600 bg-ink-900/40 hover:border-ink-500"
              }`}
            >
              <div className="font-semibold">{info.label}</div>
              <div className="text-xs text-slate-400">{info.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-accent-danger text-sm mb-3">{error}</p>}
      <button onClick={create} disabled={loading} className="btn-primary w-full text-lg py-3">
        {loading ? "Generando universo..." : `🚀 Empezar como ${baseNation?.flag} ${effectiveName}`}
      </button>
    </main>
  );
}
