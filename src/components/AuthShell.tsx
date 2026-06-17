import Link from "next/link";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="block text-center font-black text-2xl mb-6">⚽ Manager <span className="text-pitch-400">Mundial</span></Link>
        <div className="card p-7">
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-slate-400 text-sm mb-5">{subtitle}</p>
          {children}
        </div>
      </div>
    </main>
  );
}
