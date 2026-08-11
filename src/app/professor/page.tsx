'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import GerenciadorTarefas from '@/components/GerenciadorTarefas';
import GerenciadorEstudantes from '@/components/GerenciadorEstudantes';
import MatrizEntregas from '@/components/MatrizEntregas';

type SecaoAtiva = 'tarefas' | 'estudantes' | 'entregas' | null;

function PainelProfessorContent() {
  const searchParams = useSearchParams();
  const [adminKey, setAdminKey] = useState<string>('');
  const [autenticado, setAutenticado] = useState<boolean>(false);
  const [inputKey, setInputKey] = useState<string>('');

  // Estado que controla qual seção está visível
  const [secaoAtiva, setSecaoAtiva] = useState<SecaoAtiva>(null);

  useEffect(() => {
    const urlKey = searchParams.get('key');
    const localKey = localStorage.getItem('x-admin-key');

    if (urlKey) {
      localStorage.setItem('x-admin-key', urlKey);
      setAdminKey(urlKey);
      setAutenticado(true);
    } else if (localKey) {
      setAdminKey(localKey);
      setAutenticado(true);
    }
  }, [searchParams]);

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputKey.trim()) {
      localStorage.setItem('x-admin-key', inputKey.trim());
      setAdminKey(inputKey.trim());
      setAutenticado(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('x-admin-key');
    setAdminKey('');
    setAutenticado(false);
  };

  // Alterna a exibição da seção clicada (se clicar na mesma, ela fecha)
  const toggleSecao = (secao: SecaoAtiva) => {
    setSecaoAtiva((prev) => (prev === secao ? null : secao));
  };

  if (!autenticado) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white mb-2 text-center">
            Área Restrita do Professor
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 text-center">
            Insira sua chave de acesso
          </p>

          <form onSubmit={handleManualLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Chave Administrativa (x-admin-key)
              </label>
              <input
                type="password"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-white font-medium text-sm rounded-lg transition-colors cursor-pointer"
            >
              Autenticar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 dark:text-white">
            Painel de Gestão - Plutão Física
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Gerencie tarefas, turmas e visualize as entregas dos alunos.
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="self-start sm:self-auto px-3 py-1.5 text-xs text-amber-500 dark:text-red-400 border border-zinc-200 dark:border-red-900/30 rounded-md hover:bg-zinc-100 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
        >
          Sair da Sessão
        </button>
      </div>

      {/* Grid de Cards com destaque visual quando selecionado */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Tarefas */}
        <div
          className={`p-6 bg-white dark:bg-zinc-900 border rounded-xl shadow-sm transition-all ${
            secaoAtiva === 'tarefas'
              ? 'border-blue-500 ring-2 ring-blue-500/20'
              : 'border-zinc-200 dark:border-zinc-800'
          }`}
        >
          <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">Cadastrar Tarefa</h3>
          <p className="text-xs text-zinc-500 mb-4">Envie um PDF para uma ou várias turmas (1A, 1B, etc).</p>
          <button
            onClick={() => toggleSecao('tarefas')}
            className={`w-full py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              secaoAtiva === 'tarefas'
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900'
            }`}
          >
            {secaoAtiva === 'tarefas' ? 'Ocultar Tarefas' : 'Nova Tarefa'}
          </button>
        </div>

        {/* Card 2: Estudantes */}
        <div
          className={`p-6 bg-white dark:bg-zinc-900 border rounded-xl shadow-sm transition-all ${
            secaoAtiva === 'estudantes'
              ? 'border-amber-500 ring-2 ring-amber-500/20'
              : 'border-zinc-200 dark:border-zinc-800'
          }`}
        >
          <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">Cadastrar Estudantes</h3>
          <p className="text-xs text-zinc-500 mb-4">Gere o hash de 4 caracteres para novos alunos individualmente ou em lote.</p>
          <button
            onClick={() => toggleSecao('estudantes')}
            className={`w-full py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              secaoAtiva === 'estudantes'
                ? 'bg-amber-500 text-white'
                : 'bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900'
            }`}
          >
            {secaoAtiva === 'estudantes' ? 'Ocultar Alunos' : 'Gerenciar Alunos'}
          </button>
        </div>

        {/* Card 3: Entregas */}
        <div
          className={`p-6 bg-white dark:bg-zinc-900 border rounded-xl shadow-sm transition-all ${
            secaoAtiva === 'entregas'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20'
              : 'border-zinc-200 dark:border-zinc-800'
          }`}
        >
          <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">Matriz de Entregas</h3>
          <p className="text-xs text-zinc-500 mb-4">Acompanhe o status e as fotos enviadas pelos alunos por turma.</p>
          <button
            onClick={() => toggleSecao('entregas')}
            className={`w-full py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              secaoAtiva === 'entregas'
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900'
            }`}
          >
            {secaoAtiva === 'entregas' ? 'Ocultar Entregas' : 'Ver Entregas'}
          </button>
        </div>
      </div>

      {/* Exibição Condicional do Módulo Selecionado */}
      {secaoAtiva === 'tarefas' && <GerenciadorTarefas />}
      {secaoAtiva === 'estudantes' && <GerenciadorEstudantes />}
      {secaoAtiva === 'entregas' && <MatrizEntregas />}
    </div>
  );
}

export default function PainelProfessor() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-zinc-500">Carregando painel...</div>}>
      <PainelProfessorContent />
    </Suspense>
  );
}