import { Wordmark } from "@/components/Landing";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 right-[12%] h-72 w-72 rounded-full bg-pitch-500/20 blur-3xl animate-glow" />
        <div className="absolute bottom-0 -left-16 h-64 w-64 rounded-full bg-accent-gold/10 blur-3xl animate-glow" style={{ animationDelay: "2s" }} />
      </div>
      <div className="w-full max-w-md animate-fade-in">
        <div className="flex justify-center mb-6">
          <Wordmark />
        </div>
        <div className="card p-7 shadow-xl">
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-accent-cream/55 text-sm mb-5">{subtitle}</p>
          {children}
        </div>
      </div>
    </main>
  );
}
