'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BASE_URL, fetchWithStudent} from '@/lib/api';

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
    const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

    const [estudante, setEstudante] = useState<EstudanteInfo | null>(null);
    const [tarefas, setTarefas] = useState<Tarefa[]>([]);

    // Estados para gerenciar o upload de até 2 fotos por tarefa
    const [tarefaAtivaId, setTarefaAtivaId] = useState<string | null>(null);
    const [fotos, setFotos] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);

    // Carrega hash da URL ou LocalStorage
    useEffect(() => {
        const urlHash = searchParams.get('hash');
        const localHash = localStorage.getItem('x-student-hash');

        const codigoFinal = (urlHash || localHash || '').trim().toUpperCase();
        if (codigoFinal) {
            setHash(codigoFinal);
            autenticarEObterPainel(codigoFinal);
        }
    }, [searchParams]);

    // Busca dados do aluno e tarefas
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

    // Seleção de fotos com trava de no máximo 2 fotos e 100KB por foto
    const handleSelectFotos = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);

        if (files.length + fotos.length > 2) {
            alert('Você pode enviar no máximo 2 fotos por entrega.');
            return;
        }

        // Valida se alguma foto excede 100 KB
        const fotoGrande = files.find((f) => f.size > 100 * 1024);
        if (fotoGrande) {
            alert(`A imagem "${fotoGrande.name}" excede o limite máximo de 100 KB.`);
            return;
        }

        const novasFotos = [...fotos, ...files].slice(0, 2);
        setFotos(novasFotos);
        setPreviews(novasFotos.map((file) => URL.createObjectURL(file)));
    };

    const handleRemoveFoto = (index: number) => {
        const novasFotos = fotos.filter((_, i) => i !== index);
        setFotos(novasFotos);
        setPreviews(novasFotos.map((file) => URL.createObjectURL(file)));
    };

    // Envio direto multipart/form-data da entrega com até 2 fotos
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

            const res = await fetch(`${BASE_URL}/estudante/entregas`, {
                method: 'POST',
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

    // --- Tela de Entrada (Hash) ---
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

    // --- Painel Principal do Aluno ---
    return (
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
            {/* Cabeçalho do Aluno */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <div>
                    <h1 className="text-xl font-bold text-zinc-100 dark:text-white">Olá, {estudante?.nome}</h1>
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
                    className={`p-4 rounded-xl text-sm font-medium border ${mensagem.tipo === 'sucesso'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/40'
                            : 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/40'
                        }`}
                >
                    {mensagem.texto}
                </div>
            )}

            {/* Lista de Tarefas */}
            <div className="space-y-4">
                <h2 className="text-base font-bold text-zinc-100 dark:text-white">Suas Tarefas</h2>

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

                                <span
                                    className={`px-2.5 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${tarefa.entregue
                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400'
                                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400'
                                        }`}
                                >
                                    {tarefa.entregue ? '✓ Entregue' : 'Pendente'}
                                </span>
                            </div>

                            {/* Formulário de Envio de Fotos (Abre ao clicar) */}
                            {tarefaAtivaId === tarefa.tarefaId ? (
                                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                                    <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                                        Anexe até 2 fotos da sua resolução (Máx: 100 KB por foto):
                                    </p>

                                    {fotos.length < 2 && (
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleSelectFotos}
                                            className="w-full text-xs text-zinc-600 dark:text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-amber-50 file:text-amber-700 dark:file:bg-zinc-800 dark:file:text-zinc-200 cursor-pointer"
                                        />
                                    )}

                                    {/* Previews das fotos selecionadas */}
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
                                            disabled={submitting || fotos.length === 0}
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