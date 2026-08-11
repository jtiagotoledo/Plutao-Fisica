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

  // Prepara o formulário para edição
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

  // Leitura de arquivo CSV/TXT para a caixa de texto
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const conteudo = event.target?.result as string;
      if (conteudo) {
        setTextoCopiado(conteudo);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  // Exportar dados exibidos na tabela para CSV (compatível com Excel)
  const handleExportarCSV = () => {
    if (estudantes.length === 0) return;

    const cabecalho = 'Numero;Nome;Classe;Hash\n';
    const linhas = estudantes
      .map((est) => `${est.numero};"${est.nome}";${est.classe};${est.hash || ''}`)
      .join('\n');

    const blob = new Blob(['\uFEFF' + cabecalho + linhas], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `hashes_turma_${filtroClasse.toUpperCase() || 'alunos'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Submit Cadastro Individual ou Edição
  const handleIndividualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMensagem(null);

    try {
      if (editingId) {
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
        let colunas: string[] = [];

        if (linha.includes('\t')) {
          colunas = linha.split('\t').map((c) => c.trim().replace(/^"|"$/g, ''));
        } else if (linha.includes(';')) {
          colunas = linha.split(';').map((c) => c.trim().replace(/^"|"$/g, ''));
        } else {
          colunas = linha.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
        }

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
        throw new Error('Nenhum estudante válido foi reconhecido no texto/arquivo informado.');
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
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  abaAtiva === 'individual'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                Individual
              </button>
              <button
                onClick={() => setAbaAtiva('lote')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Classe / Turma para este lote
                </label>
                <input
                  type="text"
                  value={classeLote}
                  onChange={(e) => setClasseLote(e.target.value)}
                  placeholder="Ex: 1A"
                  className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Carregar de arquivo CSV / TXT (Opcional)
                </label>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="w-full px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-amber-50 file:text-amber-700 dark:file:bg-zinc-700 dark:file:text-zinc-200 cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Prévia do Conteúdo (Você também pode colar direto da sua planilha)
              </label>
              <textarea
                rows={6}
                value={textoCopiado}
                onChange={(e) => setTextoCopiado(e.target.value)}
                placeholder={`Formatos Aceitos:\n6;Helena Ramos\n7;Igor Santos\n\nou simplesmente cole as colunas de Número e Nome direto do Excel.`}
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

          <div className="flex items-center gap-3">
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

            {/* Botão de Exportar CSV para Excel */}
            {estudantes.length > 0 && (
              <button
                onClick={handleExportarCSV}
                title="Baixar planilha CSV pronta para o Excel"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Baixar CSV (Excel)
              </button>
            )}
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