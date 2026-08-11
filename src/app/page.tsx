import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-[85vh] flex flex-col items-center justify-center px-4 py-12">
      <div className="text-center max-w-xl mx-auto space-y-4 mb-10">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
          Plutão Física
        </h1>
        <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400">
          Plataforma de gestão e entrega de atividades de física.
        </p>
      </div>

      <div className="w-full max-w-md">
        <Link
          href="/aluno"
          className="group block p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-amber-500 dark:hover:border-amber-500 rounded-3xl shadow-sm hover:shadow-lg transition-all cursor-pointer text-center"
        >
          <div className="inline-flex p-4 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>

          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
            Área do Aluno
          </h2>

          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">
            Acesse suas tarefas com seu código de 4 caracteres e envie as resoluções.
          </p>

          <span className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-white font-medium text-sm rounded-xl transition-colors">
            Acessar Minhas Tarefas →
          </span>
        </Link>
      </div>
    </main>
  );
}