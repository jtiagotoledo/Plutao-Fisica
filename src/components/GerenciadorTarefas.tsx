'use client';

import { useState, useEffect } from 'react';
import { fetchWithAdmin } from '@/lib/api';

interface Tarefa {
  _id: string;
  titulo: string;
  classe: string;
  pdfUrl?: string;
  createdAt?: string;
}

export default function GerenciadorTarefas() {
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  // Estados do Formulário
  const [editingId, setEditingId] = useState<string | null>(null);
  const [titulo, setTitulo] = useState('');
  const [classe, setClasse] = useState('');
  const [arquivo, setArquivo] = useState<File | null>(null);

  const carregarTarefas = async () => {
    try {
      setLoading(true);
      const res = await fetchWithAdmin('/professor/tarefas');
      if (res.ok) {
        const data = await res.json();
        setTarefas(data);
      } else {
        setMensagem({ tipo: 'erro', texto: 'Erro ao carregar lista de tarefas.' });
      }
    } catch {
      setMensagem({ tipo: 'erro', texto: 'Falha de conexão com a API.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarTarefas();
  }, []);

  // Prepara o formulário para edição
  const handleEditClick = (tarefa: Tarefa) => {
    setEditingId(tarefa._id);
    setTitulo(tarefa.titulo);
    setClasse(tarefa.classe);
    setArquivo(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cancela a edição
  const handleCancelEdit = () => {
    setEditingId(null);
    setTitulo('');
    setClasse('');
    setArquivo(null);
  };

  // Deletar Tarefa
  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza de que deseja excluir esta tarefa?')) return;

    try {
      const res = await fetchWithAdmin(`/professor/tarefas/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setMensagem({ tipo: 'sucesso', texto: 'Tarefa excluída com sucesso!' });
        carregarTarefas();
      } else {
        setMensagem({ tipo: 'erro', texto: 'Erro ao excluir a tarefa.' });
      }
    } catch {
      setMensagem({ tipo: 'erro', texto: 'Falha ao conectar com o servidor.' });
    }
  };

  // Submit (Criar ou Atualizar)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMensagem(null);

    try {
      let urlDoPdf = '';

      // Upload do PDF (se houver novo arquivo)
      if (arquivo) {
        const formData = new FormData();
        formData.append('pdf', arquivo);

        const adminKey = typeof window !== 'undefined' ? localStorage.getItem('x-admin-key') : '';
        const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

        const uploadRes = await fetch(`${BASE_URL}/professor/upload-pdf`, {
          method: 'POST',
          headers: {
            ...(adminKey ? { 'x-admin-key': adminKey } : {}),
          },
          body: formData,
        });

        if (!uploadRes.ok) throw new Error('Falha ao enviar o arquivo PDF.');

        const uploadData = await uploadRes.json();
        urlDoPdf = uploadData.pdfUrl;
      }

      if (editingId) {
        // --- MODO EDIÇÃO (PUT) ---
        const payload: { titulo: string; classe: string; pdfUrl?: string } = {
          titulo,
          classe: classe.trim().toUpperCase(),
        };
        if (urlDoPdf) payload.pdfUrl = urlDoPdf;

        const res = await fetchWithAdmin(`/professor/tarefas/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          setMensagem({ tipo: 'sucesso', texto: 'Tarefa atualizada com sucesso!' });
          handleCancelEdit();
          carregarTarefas();
        } else {
          throw new Error('Erro ao atualizar a tarefa.');
        }
      } else {
        // --- MODO CRIAÇÃO (POST) ---
        const listaTurmas = classe.split(',').map((t) => t.trim().toUpperCase()).filter(Boolean);

        if (listaTurmas.length === 0) throw new Error('Informe ao menos uma turma válida.');

        const requisicoes = listaTurmas.map((turmaNome) =>
          fetchWithAdmin('/professor/tarefas', {
            method: 'POST',
            body: JSON.stringify({
              titulo,
              classe: turmaNome,
              pdfUrl: urlDoPdf,
            }),
          })
        );

        const respostas = await Promise.all(requisicoes);
        if (respostas.every((res) => res.ok)) {
          setMensagem({ tipo: 'sucesso', texto: 'Tarefa(s) cadastrada(s) com sucesso!' });
          handleCancelEdit();
          carregarTarefas();
        } else {
          throw new Error('Erro ao cadastrar tarefa.');
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro na operação.';
      setMensagem({ tipo: 'erro', texto: errorMessage });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
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

      {/* Formulário */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">
          {editingId ? 'Editar Tarefa' : 'Cadastrar Nova Tarefa'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Título da Tarefa
              </label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Exercícios de Óptica"
                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {editingId ? 'Turma' : 'Turmas (ex: 1A, 1B)'}
              </label>
              <input
                type="text"
                value={classe}
                onChange={(e) => setClasse(e.target.value)}
                placeholder="Ex: 1A, 1B"
                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Arquivo PDF {editingId ? '(Deixe em branco para manter o atual)' : '(Opcional)'}
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setArquivo(e.target.files?.[0] || null)}
              className="w-full px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 dark:file:bg-zinc-700 dark:file:text-zinc-200"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium text-sm rounded-lg transition-colors"
            >
              {submitting ? 'Processando...' : editingId ? 'Salvar Alterações' : 'Publicar Tarefa'}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2.5 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium text-sm rounded-lg transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Tabela com Ações */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Tarefas Publicadas</h2>

        {loading ? (
          <p className="text-sm text-zinc-500 py-4 text-center">Carregando tarefas...</p>
        ) : tarefas.length === 0 ? (
          <p className="text-sm text-zinc-500 py-4 text-center">Nenhuma tarefa cadastrada até o momento.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-300">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="px-4 py-3">Título</th>
                  <th className="px-4 py-3">Classe</th>
                  <th className="px-4 py-3">Arquivo</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {tarefas.map((tarefa) => (
                  <tr key={tarefa._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white">{tarefa.titulo}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded border border-zinc-200 dark:border-zinc-700">
                        {tarefa.classe}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {tarefa.pdfUrl ? (
                        <a
                          href={tarefa.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                        >
                          Ver PDF
                        </a>
                      ) : (
                        <span className="text-xs text-zinc-400">Sem PDF</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {/* Botão Editar */}
                        <button
                          onClick={() => handleEditClick(tarefa)}
                          title="Editar tarefa"
                          className="p-1.5 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>

                        {/* Botão Excluir */}
                        <button
                          onClick={() => handleDelete(tarefa._id)}
                          title="Excluir tarefa"
                          className="p-1.5 text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
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