import Link from 'next/link';
import { 
  FileText, 
  Sun, 
  AlertTriangle, 
  FileCheck, 
  UserCheck, 
  Image as ImageIcon,
  Clock,
  ArrowLeft 
} from 'lucide-react';

export default function OrientacoesAluno() {
  const orientacoes = [
    {
      icon: <FileText className="w-6 h-6 text-amber-500 shrink-0" />,
      titulo: '1. Resolução Manuscrita',
      descricao: 'Envie foto da tarefa feita à mão em seu caderno ou folha de respostas.',
    },
    {
      icon: <Sun className="w-6 h-6 text-amber-500 shrink-0" />,
      titulo: '2. Enquadramento e Iluminação',
      descricao: 'Fotografe de cima para baixo (visão superior), sem sombras cobrindo os cálculos e com boa iluminação para leitura.',
    },
    {
      icon: <ImageIcon className="w-6 h-6 text-amber-500 shrink-0" />,
      titulo: '3. Limite de Fotos',
      descricao: 'É possível enviar até duas fotos por tarefa. Organize seus exercícios para caber nesse limite.',
    },
    {
      icon: <FileCheck className="w-6 h-6 text-amber-500 shrink-0" />,
      titulo: '4. Formatos Compatíveis',
      descricao: 'Envie imagens nos formatos JPG, PNG ou WebP.',
    },
    {
      icon: <UserCheck className="w-6 h-6 text-amber-500 shrink-0" />,
      titulo: '5. Autoria e Letra Própria',
      descricao: 'A resolução deve ser de sua autoria e estar manuscrita com a sua própria letra.',
    },
    {
      icon: <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />,
      titulo: '6. Inoperação do Sistema',
      descricao: 'Em caso de indisponibilidade ou falha no site, entregue a tarefa manuscrita pessoalmente ao professor.',
    },
    {
      icon: <Clock className="w-6 h-6 text-amber-500 shrink-0" />,
      titulo: '7. Prazo de Envio',
      descricao: 'A tarefa deve ser enviada preferencialmente em até uma semana após ser trabalhada em sala de aula, porém, ela permanecerá aberta para envio mesmo após este prazo.',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-4 pb-4 border-b border-zinc-800">
        <Link
          href="/aluno"
          className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Orientações de Envio</h1>
          <p className="text-xs text-zinc-400">Guia prático para envio correto das atividades de física</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {orientacoes.map((item, index) => (
          <div
            key={index}
            className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-3 shadow-sm hover:border-zinc-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-zinc-800 rounded-xl">{item.icon}</div>
              <h2 className="font-bold text-zinc-100 text-sm">{item.titulo}</h2>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">{item.descricao}</p>
          </div>
        ))}
      </div>

      <div className="pt-4">
        <Link
          href="/aluno"
          className="block w-full py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm text-center rounded-xl transition-colors"
        >
          Voltar para Envio de Tarefas
        </Link>
      </div>
    </div>
  );
}