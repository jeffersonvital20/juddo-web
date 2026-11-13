import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Campeonato } from '../../types';
import {
  Trophy,
  Plus,
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  ChevronRight,
} from 'lucide-react';

const CAMPEONATOS_MOCK: Campeonato[] = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    nome: 'Grand Prix Nacional de Judô 2026',
    local: 'Centro Pan-Americano de Judô - Lauro de Freitas/BA',
    dataInicio: '2026-11-07',
    dataFim: '2026-11-09',
    status: 'EM_ANDAMENTO',
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    nome: 'Campeonato Brasileiro Interclubes Sub-18 e Sub-21',
    local: 'Ginásio do Ibirapuera - São Paulo/SP',
    dataInicio: '2026-12-05',
    dataFim: '2026-12-07',
    status: 'RASCUNHO',
  },
];

export const CampeonatosModule: React.FC = () => {
  const queryClient = useQueryClient();
  const [modalAberto, setModalAberto] = useState(false);
  const [campeonatoAtivoId, setCampeonatoAtivoId] = useState<string>(
    localStorage.getItem('judoo_active_campeonato') || '10000000-0000-0000-0000-000000000001'
  );

  // Form State
  const [nome, setNome] = useState('');
  const [local, setLocal] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [quantidadeTatames, setQuantidadeTatames] = useState(2);

  const { data: campeonatos = CAMPEONATOS_MOCK, isLoading } = useQuery({
    queryKey: ['campeonatos'],
    queryFn: async () => {
      try {
        return await api.getCampeonatos();
      } catch {
        return CAMPEONATOS_MOCK;
      }
    },
  });

  const mutationCriar = useMutation({
    mutationFn: (payload: { nome: string; local: string; dataInicio: string; dataFim: string; quantidadeTatames: number }) =>
      api.criarCampeonato(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campeonatos'] });
      setModalAberto(false);
      setNome('');
      setLocal('');
      setDataInicio('');
      setDataFim('');
    },
    onError: () => {
      // Fallback local se API offline
      const novo: Campeonato = {
        id: crypto.randomUUID(),
        nome,
        local,
        dataInicio,
        dataFim,
        status: 'EM_ANDAMENTO',
      };
      queryClient.setQueryData(['campeonatos'], (old: Campeonato[] = []) => [novo, ...old]);
      setModalAberto(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !local || !dataInicio || !dataFim) return;

    mutationCriar.mutate({
      nome,
      local,
      dataInicio,
      dataFim,
      quantidadeTatames,
    });
  };

  const handleSelecionarAtivo = (id: string) => {
    setCampeonatoAtivoId(id);
    localStorage.setItem('judoo_active_campeonato', id);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800/40">
            Módulo de Eventos & Torneios
          </span>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mt-2 flex items-center gap-3">
            <Trophy className="w-8 h-8 text-amber-500" />
            Cadastro & Gestão de Campeonatos
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Crie novos eventos oficiais de Judô, configure tatames e gere categorias de peso regulamentares da FIJ.
          </p>
        </div>

        <button
          onClick={() => setModalAberto(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-3 rounded-xl shadow-lg shadow-blue-600/30 transition-all text-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Campeonato</span>
        </button>
      </div>

      {/* Grid de Campeonatos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading && (
          <div className="col-span-2 text-center p-8 text-slate-400">
            Carregando campeonatos...
          </div>
        )}

        {campeonatos.map((c) => {
          const isAtivo = c.id === campeonatoAtivoId;

          return (
            <div
              key={c.id}
              className={`rounded-2xl border transition-all p-6 shadow-xl flex flex-col justify-between ${
                isAtivo
                  ? 'bg-blue-50/50 dark:bg-slate-900 border-blue-500 dark:border-blue-500 ring-2 ring-blue-500/20'
                  : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold uppercase px-3 py-1 rounded-full border ${
                      c.status === 'EM_ANDAMENTO'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {c.status === 'EM_ANDAMENTO' ? '• Em Andamento' : c.status}
                  </span>

                  {isAtivo && (
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 bg-blue-100 dark:bg-blue-950 px-2.5 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Evento Ativo
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white leading-snug">
                    {c.nome}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-2">
                    <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                    <span className="truncate">{c.local}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span>Início: <strong>{c.dataInicio.substring(0, 10)}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Clock className="w-4 h-4 text-indigo-500" />
                    <span>Fim: <strong>{c.dataFim.substring(0, 10)}</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-5 mt-5 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-400">
                  Categorias: <strong>Oficiais FIJ</strong>
                </span>

                <button
                  onClick={() => handleSelecionarAtivo(c.id)}
                  className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                    isAtivo
                      ? 'bg-blue-600 text-white shadow'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span>{isAtivo ? 'Selecionado' : 'Definir como Ativo'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Criação de Campeonato */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Trophy className="w-6 h-6 text-amber-500" />
                Cadastrar Novo Campeonato
              </h3>
              <button
                onClick={() => setModalAberto(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Nome do Torneio / Evento
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: Copa Pan-Americana de Judô 2026"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Local / Ginásio / Cidade
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: Centro Pan-Americano - Lauro de Freitas/BA"
                  value={local}
                  onChange={(e) => setLocal(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Data de Início
                  </label>
                  <input
                    type="date"
                    required
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Data de Término
                  </label>
                  <input
                    type="date"
                    required
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Quantidade de Tatames (Áreas de Combate)
                </label>
                <select
                  value={quantidadeTatames}
                  onChange={(e) => setQuantidadeTatames(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                >
                  <option value={1}>1 Tatame (Shiai-Jo A)</option>
                  <option value={2}>2 Tatames (Shiai-Jo A e B)</option>
                  <option value={4}>4 Tatames (Nacional / Grand Slam)</option>
                  <option value={6}>6 Tatames (Mundial / Pan-Americano)</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Categorias oficiais da FIJ (-60kg, -66kg, -73kg, -81kg, -52kg, etc.) serão configuradas automaticamente.
                </p>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="w-1/2 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={mutationCriar.isPending}
                  className="w-1/2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
                >
                  <Trophy className="w-4 h-4" />
                  <span>{mutationCriar.isPending ? 'Salvando...' : 'Criar Evento'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
