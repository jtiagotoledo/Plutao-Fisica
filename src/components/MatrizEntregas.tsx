'use client';

import { useState, useEffect } from 'react';
import { BASE_URL, fetchWithAdmin } from '@/lib/api';

interface ColunaTarefa {
  id: string;
  titulo: string;
}

interface AlunoRelatorio {
  estudanteId: string;
  numero: number;
  nome: string;
  entregas: Record<
    string,
    {
      entregue: boolean;
      conteudo: string[] | string | null;
      dataEntrega?: string | null;
    }
  >;
}

export function MatrizEntregas() {
  const [turma, setTurma] = useState<string>('1A');
  const [colunasTarefas, setColunasTarefas] = useState<ColunaTarefa[]>([]);
  const [alunos, setAlunos] = useState<AlunoRelatorio[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal para Visualizar a Entrega
  const [modalData, setModalData] = useState<{
    estudanteNome: string;
    tarefaTitulo: string;
    fotos: string[];
    dataEnvio?: string | null;
  } | null>(null);

  useEffect(() => {
    carregarRelatorio();
  }, [turma]);

  const carregarRelatorio = async () => {
    try {
      setLoading(true);

      const res = await fetchWithAdmin(`/professor/entregas-turma?classe=${turma}`);

      if (res.ok) {
        const data = await res.json();
        setColunasTarefas(Array.isArray(data.colunasTarefas) ? data.colunasTarefas : []);
        setAlunos(Array.isArray(data.alunos) ? data.alunos : []);
      } else {
        const resFallback = await fetchWithAdmin(`/professor/entregas?classe=${turma}`);
        if (resFallback.ok) {
          const dataFallback = await resFallback.json();
          if (dataFallback.colunasTarefas && dataFallback.alunos) {
            setColunasTarefas(dataFallback.colunasTarefas);
            setAlunos(dataFallback.alunos);
          } else {
            setColunasTarefas([]);
            setAlunos([]);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar relatório da matriz:', error);
      setColunasTarefas([]);
      setAlunos([]);
    } finally {
      setLoading(false);
    }
  };

  const formatarUrlImagem = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const cleanBase = BASE_URL.replace(/\/api$/, '').replace(/\/$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${cleanBase}${cleanPath}`;
  };

  const extrairFotos = (conteudo: string[] | string | null): string[] => {
    if (!conteudo) return [];
    if (Array.isArray(conteudo)) {
      return conteudo.map(formatarUrlImagem);
    }
    return [formatarUrlImagem(conteudo)];
  };

  const handleAbrirEntrega = (
    aluno: AlunoRelatorio,
    tarefa: ColunaTarefa,
    entregaInfo: { conteudo: string[] | string | null; dataEntrega?: string | null }
  ) => {
    const fotos = extrairFotos(entregaInfo.conteudo);
    setModalData({
      estudanteNome: aluno.nome,
      tarefaTitulo: tarefa.titulo,
      fotos,
      dataEnvio: entregaInfo.dataEntrega,
    });
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6">
      {/* Modal de Visualização */}
      {modalData && (
        <div
          onClick={() => setModalData(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-3xl w-full bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-white text-base">
                  {modalData.estudanteNome}
                </h3>
                <p className="text-xs text-amber-500 font-medium">{modalData.tarefaTitulo}</p>
                {modalData.dataEnvio && (
                  <p className="text-xs text-zinc-400 mt-1">
                    Entregue em: {new Date(modalData.dataEnvio).toLocaleString('pt-BR')}
                  </p>
                )}
              </div>
              <button
                onClick={() => setModalData(null)}
                className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white p-1 rounded-lg cursor-pointer text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-zinc-500 font-medium">Fotos da Resolução:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[65vh] overflow-y-auto p-1">
                {modalData.fotos.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative bg-zinc-950 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 flex items-center justify-center p-2 group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Resolução ${idx + 1}`}
                      className="max-h-80 w-auto object-contain rounded-lg"
                    />
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-2 right-2 bg-black/70 hover:bg-black text-white text-[10px] px-2 py-1 rounded-md backdrop-blur-sm transition-opacity opacity-80 group-hover:opacity-100"
                    >
                      🔍 Expandir Foto
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtro por Turma */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Matriz de Entregas</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Acompanhe o status e clique sobre a entrega para visualizar a resolução.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
            Filtrar Turma:
          </label>
          <input
            type="text"
            value={turma}
            onChange={(e) => setTurma(e.target.value.toUpperCase())}
            placeholder="Ex: 1A"
            className="px-3 py-1.5 text-xs font-bold bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 w-24 uppercase"
          />
        </div>
      </div>

      {/* Tabela da Matriz */}
      {loading ? (
        <p className="text-xs text-zinc-500 text-center py-8">Carregando matriz de entregas...</p>
      ) : alunos.length === 0 ? (
        <p className="text-xs text-zinc-500 text-center py-8">
          Nenhum estudante/entrega encontrado para a turma {turma}.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-semibold uppercase">
                <th className="py-3 px-3 w-12">Nº</th>
                <th className="py-3 px-3">Estudante</th>
                {colunasTarefas.map((tarefa) => (
                  <th key={tarefa.id} className="py-3 px-3 text-center min-w-30">
                    {tarefa.titulo}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {alunos.map((aluno) => (
                <tr
                  key={aluno.estudanteId}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                >
                  <td className="py-3 px-3 font-mono font-medium text-zinc-500">{aluno.numero}</td>
                  <td className="py-3 px-3 font-semibold text-zinc-900 dark:text-zinc-100">
                    {aluno.nome}
                  </td>

                  {colunasTarefas.map((tarefa) => {
                    const statusEntrega = aluno.entregas[tarefa.id];

                    return (
                      <td key={tarefa.id} className="py-3 px-3 text-center">
                        {statusEntrega && statusEntrega.entregue ? (
                          <button
                            onClick={() => handleAbrirEntrega(aluno, tarefa, statusEntrega)}
                            title="Clique para visualizar a resolução"
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/80 transition-all cursor-pointer shadow-sm hover:scale-105"
                          >
                            ✓ OK
                          </button>
                        ) : (
                          <span className="text-zinc-300 dark:text-zinc-700 font-bold">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default MatrizEntregas;