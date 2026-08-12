'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import imageCompression from 'browser-image-compression';
import { BASE_URL, fetchWithStudent } from '@/lib/api';

interface Tarefa {
  tarefaId: string;
  titulo: string;
  classe: string;
  pdfUrl?: string;
  dataCriacao?: string;
  entregue: boolean;
  conteudo?: string[] | string | null;
  dataEntrega?: string | null;
}

interface EstudanteInfo {
  id: string;
  nome: string;
  classe: string;
  numero: number;
}

function PainelAlunoContent() {
  const searchParams = useSearchParams();
  const [hash, setHash] = useState<string>('');
  const [autenticado, setAutenticado] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [compressing, setCompressing] = useState<boolean>(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  const [estudante, setEstudante] = useState<EstudanteInfo | null>(null);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);

  // Modal para visualizar e excluir a entrega
  const [modalVisualizacao, setModalVisualizacao] = useState<{
    tarefaId: string;
    titulo: string;
    conteudo: string[] | string;
    dataEntrega?: string | null;
  } | null>(null);

  // Estados para envio da resolução
  const [tarefaAtivaId, setTarefaAtivaId] = useState<string | null>(null);
  const [fotos, setFotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    const urlHash = searchParams.get('hash');
    const localHash = localStorage.getItem('x-student-hash');

    const codigoFinal = (urlHash || localHash || '').trim().toUpperCase();
    if (codigoFinal) {
      setHash(codigoFinal);
      autenticarEObterPainel(codigoFinal);
    }
  }, [searchParams]);

  const autenticarEObterPainel = async (codigoHash: string) => {
    try {
      setLoading(true);
      setMensagem(null);

      const res = await fetchWithStudent('/estudante/painel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hash: codigoHash }),
      });

      if (res.ok) {
        const data = await res.json();
        setEstudante(data.estudante);
        setTarefas(data.tarefas);
        localStorage.setItem('x-student-hash', codigoHash);
        setAutenticado(true);
      } else {
        const err = await res.json();
        setMensagem({ tipo: 'erro', texto: err.erro || 'Código (hash) não encontrado.' });
        localStorage.removeItem('x-student-hash');
        setAutenticado(false);
      }
    } catch {
      setMensagem({ tipo: 'erro', texto: 'Falha ao conectar com o servidor.' });
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hash.trim()) {
      autenticarEObterPainel(hash.trim().toUpperCase());
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('x-student-hash');
    setHash('');
    setAutenticado(false);
    setEstudante(null);
    setTarefas([]);
  };

  const handleSelectFotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (files.length + fotos.length > 2) {
      alert('Você pode enviar no máximo 2 fotos por entrega.');
      return;
    }

    const options = {
      maxSizeMB: 0.09,
      maxWidthOrHeight: 1280,
      useWebWorker: true,
    };

    try {
      setCompressing(true);
      const fotosProcessadas: File[] = [];

      for (const file of files) {
        if (file.size <= 100 * 1024) {
          fotosProcessadas.push(file);
        } else {
          const compressedFile = await imageCompression(file, options);
          const nomeFormatado = file.name.replace(/\.[^/.]+$/, '') + '.jpg';
          const fileComExtensao = new File([compressedFile], nomeFormatado, {
            type: 'image/jpeg',
          });
          fotosProcessadas.push(fileComExtensao);
        }
      }

      const novasFotos = [...fotos, ...fotosProcessadas].slice(0, 2);
      setFotos(novasFotos);
      setPreviews(novasFotos.map((file) => URL.createObjectURL(file)));
    } catch (error) {
      console.error('Erro ao comprimir imagem:', error);
      alert('Não foi possível processar essa imagem. Tente outra foto.');
    } finally {
      setCompressing(false);
    }
  };

  const handleRemoveFoto = (index: number) => {
    const novasFotos = fotos.filter((_, i) => i !== index);
    setFotos(novasFotos);
    setPreviews(novasFotos.map((file) => URL.createObjectURL(file)));
  };

  const handleEnviarEntrega = async (tarefaId: string) => {
    if (fotos.length === 0) {
      alert('Selecione ao menos 1 foto da sua resolução.');
      return;
    }

    try {
      setSubmitting(true);
      setMensagem(null);

      const formData = new FormData();
      formData.append('hash', hash);
      formData.append('tarefaId', tarefaId);
      fotos.forEach((foto) => formData.append('fotos', foto));

      const formattedBaseUrl = BASE_URL.replace(/\/$/, '');
      const uploadUrl = formattedBaseUrl.endsWith('/api')
        ? `${formattedBaseUrl}/estudante/entregas`
        : `${formattedBaseUrl}/api/estudante/entregas`;

      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'x-student-hash': hash,
        },
        body: formData,
      });

      if (res.ok) {
        setMensagem({ tipo: 'sucesso', texto: 'Resolução enviada com sucesso!' });
        setFotos([]);
        setPreviews([]);
        setTarefaAtivaId(null);
        autenticarEObterPainel(hash);
      } else {
        const err = await res.json();
        setMensagem({ tipo: 'erro', texto: err.erro || 'Erro ao enviar a resolução.' });
      }
    } catch {
      setMensagem({ tipo: 'erro', texto: 'Falha na conexão ao enviar a resolução.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Função para EXCLUIR a entrega
  const handleExcluirEntrega = async (tarefaId: string) => {
    if (!confirm('Tem certeza de que deseja apagar essa resolução enviada?')) {
      return;
    }

    try {
      setDeleting(true);

      const res = await fetchWithStudent('/estudante/entregar', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hash, tarefaId }),
      });

      if (res.ok) {
        setMensagem({ tipo: 'sucesso', texto: 'Resolução removida com sucesso!' });
        setModalVisualizacao(null);
        autenticarEObterPainel(hash);
      } else {
        const err = await res.json();
        alert(err.erro || 'Erro ao excluir resolução.');
      }
    } catch {
      alert('Falha de conexão ao excluir a resolução.');
    } finally {
      setDeleting(false);
    }
  };

  const extrairFotosArray = (conteudo?: string[] | string | null): string[] => {
    if (!conteudo) return [];
    if (Array.isArray(conteudo)) return conteudo;
    return [conteudo];
  };

  if (!autenticado) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <h1 className="text-xl font-bold text-center text-zinc-900 dark:text-white mb-2">
            Plutão Física — Área do Aluno
          </h1>
          <p className="text-xs text-center text-zinc-500 dark:text-zinc-400 mb-6">
            Insira o seu código de acesso (Hash de 4 caracteres)
          </p>

          {mensagem && (
            <div className="mb-4 p-3 rounded-xl text-xs font-medium bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/40">
              {mensagem.texto}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={hash}
                onChange={(e) => setHash(e.target.value.toUpperCase())}
                placeholder="Ex: A1B2"
                maxLength={4}
                className="w-full px-3 py-3 text-center text-xl font-mono font-bold tracking-widest bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase dark:text-white"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-white font-medium text-sm rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Acessando...' : 'Acessar Minhas Tarefas'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Modal para Visualização e Exclusão com Botão Lixeira */}
      {modalVisualizacao && (
        <div
          onClick={() => setModalVisualizacao(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-2xl w-full bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-white text-base">
                  {modalVisualizacao.titulo}
                </h3>
                {modalVisualizacao.dataEntrega && (
                  <p className="text-xs text-zinc-500">
                    Enviado em: {new Date(modalVisualizacao.dataEntrega).toLocaleString('pt-BR')}
                  </p>
                )}
              </div>

              {/* Botão de Excluir (Lixeira) + Botão Fechar */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleExcluirEntrega(modalVisualizacao.tarefaId)}
                  disabled={deleting}
                  title="Apagar esta resolução"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-950/60 dark:hover:bg-red-900/80 dark:text-red-400 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  {deleting ? 'Apagando...' : 'Excluir Entrega'}
                </button>

                <button
                  onClick={() => setModalVisualizacao(null)}
                  className="text-zinc-500 hover:text-zinc-800 dark:hover:text-white p-1 rounded-lg cursor-pointer text-lg font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-zinc-500 font-medium">Resolução enviada:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto p-1">
                {extrairFotosArray(modalVisualizacao.conteudo).map((url, idx) => (
                  <div
                    key={idx}
                    className="relative bg-zinc-950 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 flex items-center justify-center p-2"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Foto ${idx + 1}`}
                      className="max-h-64 w-auto object-contain rounded-lg"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cabeçalho do Aluno */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Olá, {estudante?.nome}</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Turma: <span className="font-semibold text-amber-500">{estudante?.classe}</span> | Nº: {estudante?.numero}
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="text-xs text-zinc-500 hover:text-red-500 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
        >
          Sair
        </button>
      </div>

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

      {/* Lista de Tarefas */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-zinc-900 dark:text-white">Suas Tarefas</h2>

        {tarefas.length === 0 ? (
          <p className="text-xs text-zinc-500 text-center py-8">Nenhuma tarefa cadastrada para a sua turma.</p>
        ) : (
          tarefas.map((tarefa) => (
            <div
              key={tarefa.tarefaId}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4"
            >
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-white text-sm">{tarefa.titulo}</h3>
                  {tarefa.pdfUrl && (
                    <a
                      href={tarefa.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-xs text-amber-600 dark:text-amber-400 hover:underline font-medium"
                    >
                      📄 Visualizar PDF da Tarefa
                    </a>
                  )}
                </div>

                {tarefa.entregue && tarefa.conteudo ? (
                  <button
                    onClick={() =>
                      setModalVisualizacao({
                        tarefaId: tarefa.tarefaId,
                        titulo: tarefa.titulo,
                        conteudo: tarefa.conteudo!,
                        dataEntrega: tarefa.dataEntrega,
                      })
                    }
                    title="Clique para visualizar o que foi enviado"
                    className="px-2.5 py-1 text-xs font-semibold rounded-full whitespace-nowrap bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    ✓ Entregue (Ver)
                  </button>
                ) : (
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-full whitespace-nowrap bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400">
                    Pendente
                  </span>
                )}
              </div>

              {tarefaAtivaId === tarefa.tarefaId ? (
                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                  <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Anexe até 2 fotos da sua resolução (otimização automática):
                  </p>

                  {fotos.length < 2 && (
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleSelectFotos}
                      disabled={compressing}
                      className="w-full text-xs text-zinc-600 dark:text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-amber-50 file:text-amber-700 dark:file:bg-zinc-800 dark:file:text-zinc-200 cursor-pointer disabled:opacity-50"
                    />
                  )}

                  {compressing && (
                    <p className="text-xs text-amber-500 font-medium animate-pulse">
                      Otimizando foto(s)... aguarde.
                    </p>
                  )}

                  {previews.length > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      {previews.map((src, index) => (
                        <div
                          key={index}
                          className="relative rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-950"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} alt={`Preview ${index + 1}`} className="w-full h-28 object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveFoto(index)}
                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-500 cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleEnviarEntrega(tarefa.tarefaId)}
                      disabled={submitting || compressing || fotos.length === 0}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      {submitting ? 'Enviando...' : `Confirmar Envio (${fotos.length}/2)`}
                    </button>

                    <button
                      onClick={() => {
                        setTarefaAtivaId(null);
                        setFotos([]);
                        setPreviews([]);
                      }}
                      className="px-3 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium rounded-lg hover:bg-zinc-300 transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setTarefaAtivaId(tarefa.tarefaId);
                    setFotos([]);
                    setPreviews([]);
                  }}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-white text-xs font-medium rounded-xl transition-colors cursor-pointer"
                >
                  {tarefa.entregue ? 'Reenviar Resolução (Máx 2 fotos)' : 'Enviar Resolução (Máx 2 fotos)'}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function PainelAluno() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-zinc-500">Carregando área do aluno...</div>}>
      <PainelAlunoContent />
    </Suspense>
  );
}