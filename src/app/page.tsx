import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export default async function Landing() {
  const user = await getCurrentUser();
  return (
    <main className="min-h-screen">
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="font-black text-xl tracking-tight">
          ⚽ Manager <span className="text-pitch-400">Mundial</span>
        </div>
        <div className="flex gap-2">
          {user ? (
            <Link href="/careers" className="btn-primary">Mis carreras</Link>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">Entrar</Link>
              <Link href="/register" className="btn-primary">Crear cuenta</Link>
            </>
          )}
        </div>
      </nav>

      <section className="max-w-5xl mx-auto px-6 pt-12 pb-20 text-center">
        <div className="chip bg-pitch-500/15 text-pitch-400 mb-6">UNIVERSO ALTERNATIVO · MUNDIAL 2026</div>
        <h1 className="text-4xl sm:text-6xl font-black leading-tight">
          El mundo perdió sus selecciones.
          <br />
          <span className="text-pitch-400">Reconstruye la tuya.</span>
        </h1>
        <p className="mt-6 text-lg text-slate-300 max-w-2xl mx-auto">
          Una crisis global ha reiniciado las nacionalidades de todos los futbolistas.
          A 14 días del Mundial, te nombran seleccionador de la nada. Haz tu draft,
          convence a los cracks, gestiona el vestuario y conquista el torneo.
        </p>
        <div className="mt-8 flex gap-3 justify-center">
          <Link href={user ? "/careers/new" : "/register"} className="btn-primary text-lg px-7 py-3">
            🚀 Empezar carrera
          </Link>
          {user && <Link href="/careers" className="btn-ghost text-lg px-7 py-3">Continuar</Link>}
        </div>

        <div className="mt-16 grid sm:grid-cols-3 gap-4 text-left">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-5">
              <div className="text-3xl">{f.emoji}</div>
              <div className="font-bold mt-2">{f.title}</div>
              <div className="text-sm text-slate-400 mt-1">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-center text-xs text-slate-600 pb-8 px-6">
        Juego de ficción. No afiliado a ninguna marca, federación ni competición oficial.
        Identidad mediante banderas de países. Medias y datos generados por la app.
      </footer>
    </main>
  );
}

const FEATURES = [
  { emoji: "🎰", title: "Draft con tensión", desc: "Elige 11 jugadores a mano de una pool con estrellas limitadas. Equilibra tu plantilla de 26." },
  { emoji: "💬", title: "Convence a los cracks", desc: "Chat de negociación: promete titularidad, capitanía o gloria. Cada palabra cuenta." },
  { emoji: "⚽", title: "Simula el Mundial", desc: "48 selecciones, grupos y eliminatorias. Partidos rápidos o con decisiones en directo." },
  { emoji: "📰", title: "Drama y narrativa", desc: "Lesiones, rumores, héroes inesperados, ruedas de prensa y un epílogo memorable." },
  { emoji: "📈", title: "Gestión profunda", desc: "Moral, química, fatiga, entrenamientos y progresión de tus jugadores en el torneo." },
  { emoji: "🏆", title: "Tu leyenda", desc: "Varias carreras, palmarés, premios individuales y la historia de una nueva nación." },
];
