"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

const PHRASES = [
  "convences a los cracks",
  "haces tu draft",
  "gestionas el vestuario",
  "simulas cada partido",
  "conquistas el Mundial",
];

const FLAGS = ["🇦🇷", "🇧🇷", "🇫🇷", "🇪🇸", "🏴", "🇵🇹", "🇳🇱", "🇩🇪", "🇲🇦", "🇯🇵", "🇺🇸", "🇲🇽", "🇭🇷", "🇺🇾", "🇮🇹", "🇸🇳", "🇳🇴", "🇨🇴", "🇧🇪", "🇰🇷"];

export function Landing({ loggedIn }: { loggedIn: boolean }) {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Fondo animado */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 right-[8%] h-80 w-80 rounded-full bg-pitch-500/25 blur-3xl animate-glow" />
        <div className="absolute top-40 -left-20 h-72 w-72 rounded-full bg-accent-gold/15 blur-3xl animate-glow" style={{ animationDelay: "2s" }} />
      </div>

      <Nav loggedIn={loggedIn} />

      <section className="max-w-5xl mx-auto px-6 pt-10 sm:pt-16 pb-10 text-center">
        <div className="chip bg-pitch-500/15 text-pitch-400 mb-6 animate-fade-in">
          UNIVERSO ALTERNATIVO · MUNDIAL 2026
        </div>

        <h1 className="text-4xl sm:text-6xl font-semibold leading-[1.05] animate-fade-in">
          El mundo perdió sus selecciones.
          <br />
          <span className="text-gradient italic">Reconstruye la tuya.</span>
        </h1>

        <div className="mt-6 text-lg sm:text-2xl text-accent-cream/80 h-9 flex items-center justify-center gap-2">
          <span className="text-ink-500">Una crisis global. Tú</span>
          <RotatingPhrase />
        </div>

        <p className="mt-5 text-base text-accent-cream/60 max-w-2xl mx-auto leading-relaxed">
          A 14 días del Mundial, todos los futbolistas pierden su nacionalidad deportiva.
          Te nombran seleccionador de la nada: haz tu draft, convence a las estrellas una a una
          y lleva a una nación inventada hasta la gloria.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href={loggedIn ? "/careers/new" : "/register"} className="btn-primary text-lg px-8 py-3.5 group">
            <span className="transition-transform group-hover:-translate-x-0.5">⚽</span>
            Empezar mi carrera
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
          <Link href={loggedIn ? "/careers" : "/login"} className="btn-ghost text-lg px-8 py-3.5">
            {loggedIn ? "Mis carreras" : "Ya tengo cuenta"}
          </Link>
        </div>

        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-ink-500">
          <span>✓ 48 selecciones</span>
          <span>✓ Draft + reclutamiento</span>
          <span>✓ Simulación en vivo</span>
        </div>
      </section>

      {/* Marquesina de banderas */}
      <FlagMarquee />

      {/* Cómo se juega */}
      <section className="max-w-5xl mx-auto px-6 py-14">
        <h2 className="text-center text-2xl sm:text-3xl font-semibold mb-2">Una carrera en cinco gestos</h2>
        <p className="text-center text-accent-cream/55 mb-8">Engancha desde el primer minuto. Sin menús infinitos.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="card p-5 transition hover:-translate-y-1 hover:border-pitch-500/50 animate-fade-in"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="text-3xl mb-2">{f.emoji}</div>
              <div className="font-semibold text-lg">{f.title}</div>
              <div className="text-sm text-accent-cream/60 mt-1">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 pb-16 text-center">
        <div className="card p-8 sm:p-10 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-pitch-500/10 blur-2xl" />
          <h2 className="text-2xl sm:text-3xl font-semibold">¿Listo para escribir tu leyenda?</h2>
          <p className="text-accent-cream/60 mt-2 mb-6">Crea tu país, ficha a tus héroes y levanta la copa.</p>
          <Link href={loggedIn ? "/careers/new" : "/register"} className="btn-primary text-lg px-8 py-3.5">
            🚀 Crear mi selección
          </Link>
        </div>
      </section>

      <footer className="text-center text-xs text-ink-500 pb-10 px-6 max-w-2xl mx-auto">
        Juego de ficción. No afiliado a ninguna marca, federación ni competición oficial.
        Identidad mediante banderas de países. Medias y datos generados por la app.
      </footer>
    </main>
  );
}

function Nav({ loggedIn }: { loggedIn: boolean }) {
  return (
    <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
      <Wordmark />
      <div className="flex gap-2">
        {loggedIn ? (
          <Link href="/careers" className="btn-primary">Mis carreras</Link>
        ) : (
          <>
            <Link href="/login" className="btn-ghost">Entrar</Link>
            <Link href="/register" className="btn-primary">Crear cuenta</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export function Wordmark() {
  return (
    <Link href="/" className="font-display text-xl font-semibold tracking-tight flex items-center gap-1.5">
      <span className="grid place-items-center h-7 w-7 rounded-lg bg-pitch-500 text-white text-sm">⚽</span>
      Manager <span className="text-pitch-400 italic">Mundial</span>
    </Link>
  );
}

function RotatingPhrase() {
  const [i, setI] = useState(0);
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = setInterval(() => {
      setShow(false);
      setTimeout(() => {
        setI((v) => (v + 1) % PHRASES.length);
        setShow(true);
      }, 250);
    }, 2200);
    return () => clearInterval(t);
  }, []);
  return (
    <span className={`font-display italic font-semibold text-pitch-400 transition-all duration-300 ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"}`}>
      {PHRASES[i]}.
    </span>
  );
}

function FlagMarquee() {
  const row = [...FLAGS, ...FLAGS];
  return (
    <div className="relative overflow-hidden py-4 border-y border-ink-600/40 bg-ink-900/40">
      <div className="flex gap-6 w-max animate-marquee text-3xl select-none">
        {row.map((f, i) => (
          <span key={i} className="opacity-80 hover:opacity-100 transition">{f}</span>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#fdfbf7] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#fdfbf7] to-transparent" />
    </div>
  );
}

const FEATURES = [
  { emoji: "🎰", title: "Draft con tensión", desc: "Elige 11 estrellas de una pool limitada y equilibra tu plantilla de 26." },
  { emoji: "💬", title: "Convence a los cracks", desc: "Chat de negociación: promete titularidad, capitanía o gloria. Cada palabra cuenta." },
  { emoji: "⚽", title: "Simula el Mundial", desc: "48 selecciones, grupos y eliminatorias. Partidos rápidos o con decisiones en vivo." },
  { emoji: "📰", title: "Drama y narrativa", desc: "Lesiones, rumores, héroes inesperados y un epílogo memorable." },
  { emoji: "📈", title: "Gestión profunda", desc: "Moral, química, fatiga, entrenamientos y progresión de tus jugadores." },
  { emoji: "🏆", title: "Tu leyenda", desc: "Varias carreras, palmarés, premios individuales y el once ideal del torneo." },
];
