'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function PainelProfessorContent() {
  const searchParams = useSearchParams();
  const [adminKey, setAdminKey] = useState<string>('');
  const [autenticado, setAutenticado] = useState<boolean>(false);
  const [inputKey, setInputKey] = useState<string>('');

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

  if (!autenticado) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white mb-2 text-center">
            Área Restrita do Professor
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 text-center">
            Insira sua chave de acesso ou utilize a URL com parâmetro ?key=
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
                placeholder="Ex: SuaChaveSuperSegura"
                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg transition-colors"
            >
              Autenticar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Painel de Gestão - Plutão Física
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Gerencie tarefas, turmas e visualize as entregas dos alunos.
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="self-start sm:self-auto px-3 py-1.5 text-xs text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 rounded-md hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
        >
          Sair da Sessão
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
          <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">Cadastrar Tarefa</h3>
          <p className="text-xs text-zinc-500 mb-4">Envie um PDF para uma ou várias turmas (1A, 1B, etc).</p>
          <button className="w-full py-2 text-xs font-medium bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg">
            Nova Tarefa
          </button>
        </div>

        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
          <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">Cadastrar Estudantes</h3>
          <p className="text-xs text-zinc-500 mb-4">Gere o hash de 4 caracteres para novos alunos individualmente ou em lote.</p>
          <button className="w-full py-2 text-xs font-medium bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg">
            Gerenciar Alunos
          </button>
        </div>

        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
          <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">Matriz de Entregas</h3>
          <p className="text-xs text-zinc-500 mb-4">Acompanhe o status e as fotos enviadas pelos alunos por turma.</p>
          <button className="w-full py-2 text-xs font-medium bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg">
            Ver Entregas
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PainelProfessor() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm">Carregando painel...</div>}>
      <PainelProfessorContent />
    </Suspense>
  );
}