"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { post } from "@/lib/client";
import { AuthShell } from "@/components/AuthShell";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await post("/api/auth/login", { email, password });
      router.push("/careers");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Bienvenido de vuelta" subtitle="Tus selecciones te esperan.">
      <form onSubmit={submit} className="space-y-3">
        <input className="input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="input" type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="text-sm text-accent-danger">{error}</p>}
        <button className="btn-primary w-full" disabled={loading}>{loading ? "Entrando..." : "Entrar"}</button>
      </form>
      <p className="text-sm text-slate-400 mt-4 text-center">
        ¿No tienes cuenta? <Link href="/register" className="text-pitch-400 font-semibold">Regístrate</Link>
      </p>
    </AuthShell>
  );
}
