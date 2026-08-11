'use client';

import { useState, useEffect } from 'react';
import { fetchWithAdmin } from '@/lib/api';

interface ColunaTarefa {
  id: string;
  titulo: string;
  dataCriacao?: string;
}

interface EntregaInfo {
  entregue: boolean;
  conteudo: string | null;
  dataEntrega: string | null;
}

interface AlunoMatriz {
  estudanteId: string;
  numero: number;
  nome: string;
  entregas: Record<string, EntregaInfo>;
}

interface RespostaMatriz {
  classe: string;
  colunasTarefas: ColunaTarefa[];
  alunos: AlunoMatriz[];
}

export default function MatrizEntregas() {
  const [dados, setDados] = useState<RespostaMatriz | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  // Filtro por Classe
  const [filtroClasse, setFiltroClasse] = useState<string>('');

  // Modal para visualizar foto/conteúdo enviado pelo aluno
  const [conteudoModal, setConteudoModal] = useState<{ aluno: string; tarefa: string; url: string } | null>(null);

  const carregarMatriz = async (classeFiltro = filtroClasse) => {
    const turmaLimpa = classeFiltro.trim().toUpperCase();

    if (!turmaLimpa) {
      setDados(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setMensagem(null);
      const res = await fetchWithAdmin(`/professor/entregas?classe=${turmaLimpa}`);

      if (res.ok) {
        const data: RespostaMatriz = await res.json();
        setDados(data);
      } else {
        setMensagem({ tipo: 'erro', texto: 'Erro ao carregar a matriz de entregas.' });
      }
    } catch {
      setMensagem({ tipo: 'erro', texto: 'Falha de conexão com a API.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarMatriz(filtroClasse);
  }, [filtroClasse]);

  // Função para exportar a Matriz de Entregas para CSV (Compatível com Excel)
  const handleExportarCSV = () => {
    if (!dados || dados.alunos.length === 0) return;

    // 1. Monta o Cabeçalho: Numero;Nome;[Título Tarefa 1];[Título Tarefa 2]...
    const titulosTarefas = dados.colunasTarefas.map((t) => `"${t.titulo}"`).join(';');
    const cabecalho = `Numero;Nome;${titulosTarefas}\n`;

    // 2. Monta as Linhas dos Alunos
    const linhas = dados.alunos
      .map((aluno) => {
        const statusTarefas = dados.colunasTarefas
          .map((tarefa) => {
            const entrega = aluno.entregas[tarefa.id];
            return entrega?.entregue ? 'ok' : 'não fez';
          })
          .join(';');

        return `${aluno.numero};"${aluno.nome}";${statusTarefas}`;
      })
      .join('\n');

    // 3. Cria o arquivo com UTF-8 BOM (\uFEFF) para abrir perfeitamente no Excel
    const blob = new Blob(['\uFEFF' + cabecalho + linhas], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `matriz_entregas_turma_${dados.classe}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 mt-12">
      {mensagem && (
        <div
          className={`p-4 rounded-xl text-sm font-medium border ${
            mensagem.tipo === 'sucesso'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/40'
              : 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/40'
          }`}
        >
          {mensagem.texto}
        </div>
      )}

      {/* Modal para Visualização de Imagem / Solução */}
      {conteudoModal && (
        <div
          onClick={() => setConteudoModal(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-3xl w-full bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-white">{conteudoModal.aluno}</h3>
                <p className="text-xs text-zinc-500">{conteudoModal.tarefa}</p>
              </div>
              <button
                onClick={() => setConteudoModal(null)}
                className="text-zinc-500 hover:text-zinc-800 dark:hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {conteudoModal.url.match(/\.(jpeg|jpg|gif|png|webp)/i) || conteudoModal.url.startsWith('http') ? (
              <div className="flex justify-center bg-zinc-950/50 rounded-xl p-2 max-h-[70vh] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={conteudoModal.url}
                  alt="Solução Enviada"
                  className="max-h-[65vh] w-auto object-contain rounded-lg"
                />
              </div>
            ) : (
              <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-xl font-mono text-sm break-all text-zinc-800 dark:text-zinc-200">
                {conteudoModal.url}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabela Matriz */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Matriz de Entregas</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Acompanhe o status e visualize as entregas da turma em tempo real.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Filtrar Turma:</label>
              <input
                type="text"
                value={filtroClasse}
                onChange={(e) => setFiltroClasse(e.target.value)}
                placeholder="Ex: 1A"
                className="px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              />
            </div>

            {/* Botão para Exportar CSV */}
            {dados && dados.alunos.length > 0 && (
              <button
                onClick={handleExportarCSV}
                title="Exportar Matriz de Entregas para Excel"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Baixar CSV (Excel)
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-zinc-500 py-4 text-center">Buscando entregas da turma...</p>
        ) : !filtroClasse.trim() ? (
          <p className="text-sm text-zinc-500 py-4 text-center">
            Digite o nome de uma turma (ex: 1A) no filtro acima para carregar a matriz de entregas.
          </p>
        ) : !dados || dados.alunos.length === 0 ? (
          <p className="text-sm text-zinc-500 py-4 text-center">
            Nenhum estudante cadastrado para a turma &quot;{filtroClasse.toUpperCase()}&quot;.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-300">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="px-3 py-3 w-12 text-center">Nº</th>
                  <th className="px-4 py-3 min-w-45">Estudante</th>

                  {/* Colunas Dinâmicas com os Títulos das Tarefas */}
                  {dados.colunasTarefas.map((tarefa) => (
                    <th key={tarefa.id} className="px-3 py-3 text-center min-w-30">
                      <span className="line-clamp-2" title={tarefa.titulo}>
                        {tarefa.titulo}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {dados.alunos.map((aluno) => (
                  <tr key={aluno.estudanteId} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="px-3 py-3 font-semibold text-center">{aluno.numero}</td>
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white whitespace-nowrap">
                      {aluno.nome}
                    </td>

                    {/* Células de Entregas por Tarefa */}
                    {dados.colunasTarefas.map((tarefa) => {
                      const statusEntrega = aluno.entregas[tarefa.id];

                      return (
                        <td key={tarefa.id} className="px-3 py-3 text-center whitespace-nowrap">
                          {statusEntrega?.entregue ? (
                            <button
                              onClick={() =>
                                statusEntrega.conteudo &&
                                setConteudoModal({
                                  aluno: aluno.nome,
                                  tarefa: tarefa.titulo,
                                  url: statusEntrega.conteudo,
                                })
                              }
                              title={
                                statusEntrega.dataEntrega
                                  ? `Entregue em: ${new Date(statusEntrega.dataEntrega).toLocaleString('pt-BR')}`
                                  : 'Entregue'
                              }
                              className="inline-flex items-center justify-center px-2 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors cursor-pointer"
                            >
                              ✓ OK
                            </button>
                          ) : (
                            <span className="inline-block px-2 py-1 text-xs text-zinc-400 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg">
                              —
                            </span>
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
    </div>
  );
}