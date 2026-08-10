'use client';

import { useState, useEffect } from 'react';
import { fetchWithAdmin } from '@/lib/api';

interface Estudante {
  _id?: string;
  nome: string;
  classe: string;
  numero: number;
  hash?: string;
}

export default function GerenciadorEstudantes() {
  const [estudantes, setEstudantes] = useState<Estudante[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  // Filtro de Busca por Turma
  const [filtroClasse, setFiltroClasse] = useState<string>('');

  // Controle de abas
  const [abaAtiva, setAbaAtiva] = useState<'individual' | 'lote'>('individual');

  // Estado para edição
  const [editingId, setEditingId] = useState<string | null>(null);

  // Cadastro Individual
  const [nome, setNome] = useState('');
  const [classe, setClasse] = useState('');
  const [numero, setNumero] = useState('');

  // Cadastro em Lote
  const [classeLote, setClasseLote] = useState('');
  const [textoCopiado, setTextoCopiado] = useState('');

  // Busca estudantes apenas quando houver filtro de turma preenchido
  const carregarEstudantes = async (classeFiltro = filtroClasse) => {
    const turmaLimpa = classeFiltro.trim().toUpperCase();

    if (!turmaLimpa) {
      setEstudantes([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetchWithAdmin(`/professor/estudantes?classe=${turmaLimpa}`);

      if (res.ok) {
        const data = await res.json();
        setEstudantes(data);
      } else {
        setMensagem({ tipo: 'erro', texto: 'Erro ao buscar estudantes da turma.' });
      }
    } catch {
      setMensagem({ tipo: 'erro', texto: 'Falha de conexão com a API.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarEstudantes(filtroClasse);
  }, [filtroClasse]);

  // Prepara o formulário individual para edição
  const handleEditClick = (estudante: Estudante) => {
    setEditingId(estudante._id || null);
    setNome(estudante.nome);
    setClasse(estudante.classe);
    setNumero(String(estudante.numero));
    setAbaAtiva('individual');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cancela a edição
  const handleCancelEdit = () => {
    setEditingId(null);
    setNome('');
    setClasse('');
    setNumero('');
  };

  // Excluir Estudante
  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!confirm('Tem certeza de que deseja excluir este estudante?')) return;

    try {
      const res = await fetchWithAdmin(`/professor/estudantes/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setMensagem({ tipo: 'sucesso', texto: 'Estudante excluído com sucesso!' });
        carregarEstudantes();
      } else {
        setMensagem({ tipo: 'erro', texto: 'Erro ao excluir o estudante.' });
      }
    } catch {
      setMensagem({ tipo: 'erro', texto: 'Falha ao conectar com o servidor.' });
    }
  };

  // Submit Cadastro Individual ou Edição (PUT)
  const handleIndividualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMensagem(null);

    try {
      if (editingId) {
        // --- EDIÇÃO (PUT) ---
        const res = await fetchWithAdmin(`/professor/estudantes/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify({
            nome: nome.trim(),
            classe: classe.trim().toUpperCase(),
            numero: Number(numero),
          }),
        });

        if (res.ok) {
          setMensagem({ tipo: 'sucesso', texto: 'Estudante atualizado com sucesso!' });
          if (filtroClasse.trim().toUpperCase() === classe.trim().toUpperCase()) {
            carregarEstudantes(classe);
          }
          handleCancelEdit();
        } else {
          const err = await res.json();
          setMensagem({ tipo: 'erro', texto: err.message || 'Erro ao atualizar estudante.' });
        }
      } else {
        // --- CRIAÇÃO (POST) ---
        const payload: Estudante[] = [
          {
            nome: nome.trim(),
            classe: classe.trim().toUpperCase(),
            numero: Number(numero),
          },
        ];

        const res = await fetchWithAdmin('/professor/estudantes', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          setMensagem({ tipo: 'sucesso', texto: 'Estudante cadastrado com sucesso!' });
          if (filtroClasse.trim().toUpperCase() === classe.trim().toUpperCase()) {
            carregarEstudantes(classe);
          }
          setNome('');
          setClasse('');
          setNumero('');
        } else {
          const err = await res.json();
          setMensagem({ tipo: 'erro', texto: err.message || 'Erro ao cadastrar estudante.' });
        }
      }
    } catch {
      setMensagem({ tipo: 'erro', texto: 'Falha ao conectar com o servidor.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Cadastro em Lote
  const handleLoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMensagem(null);

    try {
      if (!classeLote.trim()) {
        throw new Error('Informe a turma/classe padrão para esta importação.');
      }

      const linhas = textoCopiado.split('\n').filter((l) => l.trim() !== '');
      const estudantesParaEnviar: Estudante[] = [];

      linhas.forEach((linha, index) => {
        const colunas = linha.includes('\t')
          ? linha.split('\t').map((c) => c.trim())
          : linha.split(',').map((c) => c.trim());

        if (colunas.length >= 2) {
          if (!isNaN(Number(colunas[0]))) {
            estudantesParaEnviar.push({
              numero: Number(colunas[0]),
              nome: colunas[1],
              classe: classeLote.trim().toUpperCase(),
            });
          } else {
            estudantesParaEnviar.push({
              nome: colunas[0],
              numero: !isNaN(Number(colunas[1])) ? Number(colunas[1]) : index + 1,
              classe: classeLote.trim().toUpperCase(),
            });
          }
        } else if (colunas.length === 1 && colunas[0] !== '') {
          estudantesParaEnviar.push({
            nome: colunas[0],
            numero: index + 1,
            classe: classeLote.trim().toUpperCase(),
          });
        }
      });

      if (estudantesParaEnviar.length === 0) {
        throw new Error('Nenhum estudante válido foi reconhecido no texto informado.');
      }

      const res = await fetchWithAdmin('/professor/estudantes', {
        method: 'POST',
        body: JSON.stringify(estudantesParaEnviar),
      });

      if (res.ok) {
        setMensagem({
          tipo: 'sucesso',
          texto: `Lote de ${estudantesParaEnviar.length} estudante(s) cadastrado com sucesso!`,
        });

        if (filtroClasse.trim().toUpperCase() === classeLote.trim().toUpperCase()) {
          carregarEstudantes(classeLote);
        }

        setTextoCopiado('');
        setClasseLote('');
      } else {
        const err = await res.json();
        setMensagem({ tipo: 'erro', texto: err.message || 'Erro ao importar lote.' });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha na importação.';
      setMensagem({ tipo: 'erro', texto: msg });
    } finally {
      setSubmitting(false);
    }
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

      {/* Formulário com Seleção de Abas */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
            {editingId ? 'Editar Estudante' : 'Cadastrar Estudantes'}
          </h2>

          {!editingId && (
            <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
              <button
                onClick={() => setAbaAtiva('individual')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  abaAtiva === 'individual'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                Individual
              </button>
              <button
                onClick={() => setAbaAtiva('lote')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  abaAtiva === 'lote'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                Importar Planilha (Lote)
              </button>
            </div>
          )}
        </div>

        {/* Aba 1: Cadastro Individual / Edição */}
        {abaAtiva === 'individual' && (
          <form onSubmit={handleIndividualSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Helena Ramos"
                  className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Classe / Turma
                </label>
                <input
                  type="text"
                  value={classe}
                  onChange={(e) => setClasse(e.target.value)}
                  placeholder="Ex: 1A"
                  className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Número de Chamada
                </label>
                <input
                  type="number"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  placeholder="Ex: 6"
                  className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white"
                  required
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white font-medium text-sm rounded-lg transition-colors cursor-pointer"
              >
                {submitting ? 'Processando...' : editingId ? 'Salvar Alterações' : 'Cadastrar Estudante'}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2.5 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium text-sm rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        )}

        {/* Aba 2: Importação em Lote */}
        {abaAtiva === 'lote' && !editingId && (
          <form onSubmit={handleLoteSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Classe / Turma para este lote
              </label>
              <input
                type="text"
                value={classeLote}
                onChange={(e) => setClasseLote(e.target.value)}
                placeholder="Ex: 1A"
                className="w-full max-w-xs px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Copie do Excel e cole abaixo (uma linha por aluno)
              </label>
              <textarea
                rows={6}
                value={textoCopiado}
                onChange={(e) => setTextoCopiado(e.target.value)}
                placeholder={`Formato Aceito:\n6\tHelena Ramos\n7\tIgor Santos\n\nou cole diretamente a lista do Excel.`}
                className="w-full px-3 py-2 text-sm font-mono bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white font-medium text-sm rounded-lg transition-colors cursor-pointer"
            >
              {submitting ? 'Processando Lote...' : 'Importar Todos os Estudantes'}
            </button>
          </form>
        )}
      </div>

      {/* Tabela de Estudantes Existentes */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Estudantes Cadastrados</h2>

          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Filtrar Turma:</label>
            <input
              type="text"
              value={filtroClasse}
              onChange={(e) => setFiltroClasse(e.target.value)}
              placeholder="Ex: 1A"
              className="px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white"
            />
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-zinc-500 py-4 text-center">Buscando alunos da turma...</p>
        ) : !filtroClasse.trim() ? (
          <p className="text-sm text-zinc-500 py-4 text-center">
            Digite o nome de uma turma (ex: 1A) no filtro acima para visualizar a lista de estudantes.
          </p>
        ) : estudantes.length === 0 ? (
          <p className="text-sm text-zinc-500 py-4 text-center">
            Nenhum estudante encontrado para a turma &quot;{filtroClasse.toUpperCase()}&quot;.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-300">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="px-4 py-3">Nº</th>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Classe</th>
                  <th className="px-4 py-3 font-mono">Hash (Código)</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {estudantes.map((est) => (
                  <tr key={est._id || `${est.classe}-${est.numero}`} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-3 font-semibold">{est.numero}</td>
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white">{est.nome}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded border border-zinc-200 dark:border-zinc-700">
                        {est.classe}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-amber-500 dark:text-amber-400 font-bold">
                      {est.hash || '—'}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {/* Botão Editar */}
                        <button
                          onClick={() => handleEditClick(est)}
                          title="Editar estudante"
                          className="p-1.5 text-zinc-500 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>

                        {/* Botão Excluir */}
                        <button
                          onClick={() => handleDelete(est._id)}
                          title="Excluir estudante"
                          className="p-1.5 text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
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