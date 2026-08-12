'use client';

import Link from 'next/link';
import { Forward, MessageSquareWarning } from 'lucide-react';

interface SideBarCelularProps {
  setIsOpen: (value: boolean) => void;
}

export function SideBar() {
  return (
    <aside className="hidden md:block w-64 p-4 border-r border-zinc-800 bg-zinc-900 shrink-0 min-h-screen">
      <p className="text-zinc-100 text-xs font-semibold uppercase mb-4 px-3">Menu</p>
      <nav className="space-y-2">
        <Link
          href="/aluno"
          className="text-zinc-100 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center gap-3 transition-colors"
        >
          <Forward className="w-5 h-5 shrink-0 text-amber-500" />
          <span className="text-sm font-medium">Envio de Tarefa</span>
        </Link>
        <Link
          href="/aluno/orientacoes"
          className="text-zinc-100 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center gap-3 transition-colors"
        >
          <MessageSquareWarning className="w-5 h-5 shrink-0 text-amber-500" />
          <span className="text-sm font-medium">Orientações</span>
        </Link>
      </nav>
    </aside>
  );
}

export function SideBarCelular({ setIsOpen }: SideBarCelularProps) {
  return (
    <aside className="relative w-64 border-zinc-800 bg-zinc-900 border-r p-4 space-y-2 z-30 h-full shadow-xl">
      <p className="text-zinc-100 text-xs font-semibold uppercase mb-4 px-3 mt-4">Menu</p>

      <nav className="space-y-2">
        <Link
          href="/aluno"
          onClick={() => setIsOpen(false)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-amber-500 text-zinc-950 font-semibold transition-colors"
        >
          <Forward className="w-5 h-5 shrink-0 text-zinc-950" />
          <span className="text-sm">Envio de Tarefa</span>
        </Link>
        <Link
          href="/aluno/orientacoes"
          onClick={() => setIsOpen(false)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-zinc-800 text-zinc-100 hover:bg-zinc-700 font-medium transition-colors"
        >
          <MessageSquareWarning className="w-5 h-5 shrink-0 text-amber-500" />
          <span className="text-sm">Orientações</span>
        </Link>
      </nav>
    </aside>
  );
}