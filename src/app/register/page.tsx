"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { post } from "@/lib/client";
import { AuthShell } from "@/components/AuthShell";

export default function RegisterPage() {
  const router = useRouter();
  const [displayName, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await post("/api/auth/register", { displayName, email, password });
      router.push("/careers/new");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Crea tu cuenta" subtitle="Empieza tu primera carrera de seleccionador.">
      <form onSubmit={submit} className="space-y-3">
        <input className="input" placeholder="Nombre de entrenador" value={displayName} onChange={(e) => setName(e.target.value)} required />
        <input className="input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="input" type="password" placeholder="Contraseña (mín. 6)" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="text-sm text-accent-danger">{error}</p>}
        <button className="btn-primary w-full" disabled={loading}>{loading ? "Creando..." : "Crear cuenta"}</button>
      </form>
      <p className="text-sm text-slate-400 mt-4 text-center">
        ¿Ya tienes cuenta? <Link href="/login" className="text-pitch-400 font-semibold">Entra</Link>
      </p>
    </AuthShell>
  );
}
