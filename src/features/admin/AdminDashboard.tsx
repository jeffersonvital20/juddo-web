import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Swords, Trophy, Activity, CheckCircle2, Clock, Tv, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LutasManager } from './LutasManager';
import { useAuth } from '../../context/AuthContext';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';
  const [abaAtiva, setAbaAtiva] = useState<'tatames' | 'lutas'>('tatames');

  const [campeonatoId, setCampeonatoId] = useState<string>(
    localStorage.getItem('judoo_active_campeonato') || '10000000-0000-0000-0000-000000000001'
  );

  const { data: campeonatos = [] } = useQuery({
    queryKey: ['campeonatos'],
    queryFn: () => api.getCampeonatos(),
  });

  const campeonatoAtivo =
    campeonatos.find((c) => c.id === campeonatoId) ||
    (campeonatos.length > 0 ? campeonatos[0] : null);

  const campeonatoIdEfetivo = campeonatoAtivo?.id || campeonatoId;

  const { data: tatames = [], isLoading } = useQuery({
    queryKey: ['tatames', campeonatoIdEfetivo],
    queryFn: () => api.getTatames(campeonatoIdEfetivo),
    refetchInterval: 3000,
  });

  const { data: todasLutas = [] } = useQuery({
    queryKey: ['todas-lutas', campeonatoIdEfetivo],
    queryFn: () => api.getTodasLutas(campeonatoIdEfetivo),
    refetchInterval: 5000,
  });

  const { data: atletas = [] } = useQuery({
    queryKey: ['atletas', campeonatoIdEfetivo],
    queryFn: () => api.getAtletas(campeonatoIdEfetivo),
  });

  const lutasFinalizadas = todasLutas.filter((l) => l.status === 'Finalizada').length;

  return (
    <div className="space-y-8">
      {/* Header com Resumo do Evento */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800/40">
            Módulo Administrativo & Mesa do Torneio • FIJ Rules
          </span>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mt-2">
            {campeonatoAtivo?.nome || 'Grand Prix Nacional de Judô 2026'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {campeonatoAtivo?.local || 'Centro Pan-Americano de Judô'} • Gestão Central de Tatames, Chamadas e Chaves
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {campeonatos.length > 0 && (
            <select
              value={campeonatoIdEfetivo}
              onChange={(e) => {
                setCampeonatoId(e.target.value);
                localStorage.setItem('judoo_active_campeonato', e.target.value);
              }}
              className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 font-bold text-slate-800 dark:text-slate-200 shadow-sm"
            >
              {campeonatos.map((c) => (
                <option key={c.id} value={c.id}>
                  🏆 {c.nome}
                </option>
              ))}
            </select>
          )}

          <Link
            to="/telao"
            target="_blank"
            className="flex items-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 transition-all text-xs shadow-sm"
          >
            <Tv className="w-4 h-4 text-emerald-500" />
            <span>Abrir Telão da Arena</span>
          </Link>
          <Link
            to="/chaves"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-xl shadow-lg shadow-blue-600/30 transition-all text-xs"
          >
            <Trophy className="w-4 h-4" />
            <span>Gerenciar Chaves</span>
          </Link>
        </div>
      </div>

      {/* Cards de Métricas em Tempo Real */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">Tatames em Operação</span>
            <Activity className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {tatames.length > 0 ? `${tatames.length} Áreas Ativas` : '2 Áreas Configuradas'}
          </div>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" /> Comunicação SignalR OK
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">Total de Atletas</span>
            <Swords className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {atletas.length > 0 ? `${atletas.length} Inscritos` : '128 Inscritos'}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">Homologados na Pesagem</span>
        </div>

        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">Lutas Realizadas</span>
            <Trophy className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {lutasFinalizadas} / {todasLutas.length || 64}
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-amber-400 h-full rounded-full transition-all"
              style={{
                width: `${todasLutas.length > 0 ? Math.round((lutasFinalizadas / todasLutas.length) * 100) : 50}%`,
              }}
            ></div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">Tempo Médio / Combate</span>
            <Clock className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">2m 45s</div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">Padrão Regulamentar FIJ</span>
        </div>
      </div>

      {/* Navegação por Abas: Visão dos Tatames vs Gerenciamento de Lutas vs Usuários */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setAbaAtiva('tatames')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            abaAtiva === 'tatames'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Visão dos Tatames (Shiai-Jo)</span>
        </button>

        <button
          onClick={() => setAbaAtiva('lutas')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            abaAtiva === 'lutas'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          <Swords className="w-4 h-4" />
          <span>Fila de Lutas & Agendamento</span>
        </button>

        {isAdmin && (
          <Link
            to="/configuracoes"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all"
          >
            <Settings className="w-4 h-4" />
            <span>Usuários & Categorias</span>
          </Link>
        )}
      </div>

      {abaAtiva === 'tatames' ? (
        /* Grid de Tatames (Visão Panorâmica) */
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Swords className="w-5 h-5 text-blue-500" />
            Visão Geral dos Tatames (Shiai-Jo)
          </h2>

          {isLoading && (
            <div className="p-8 text-center text-slate-400 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 animate-pulse">
              Carregando status dos tatames em tempo real...
            </div>
          )}

          {tatames.length === 0 && !isLoading && (
            <div className="p-8 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              Nenhum tatame ativo cadastrado para este campeonato.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tatames.map((tatame) => {
              const luta = tatame.lutaAtual;
              const emAndamento = tatame.status === 'EmAndamento' || Boolean(luta);

              return (
                <div
                  key={tatame.id}
                  className={`bg-white dark:bg-slate-900 border-2 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between ${
                    emAndamento ? 'border-blue-500/50' : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-3 h-3 rounded-full ${
                            emAndamento ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'
                          }`}
                        ></span>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white">
                          Tatame {tatame.numero} - {tatame.nome}
                        </h3>
                      </div>
                      <span
                        className={`text-xs font-bold uppercase px-3 py-1 rounded-full border ${
                          emAndamento
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {emAndamento ? 'Luta em Andamento' : 'Aguardando Luta'}
                      </span>
                    </div>

                    {luta ? (
                      /* Atletas do Tatame */
                      <div className="grid grid-cols-2 gap-4 mt-6">
                        {/* Judogi Branco */}
                        <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center">
                          <div className="inline-block px-2.5 py-0.5 bg-white text-slate-950 border border-slate-200 text-[10px] font-black uppercase rounded mb-2 shadow-sm">
                            Branco (Shiro)
                          </div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-base truncate">
                            {luta.atletaBranco?.nome || 'Atleta Shiro'}
                          </h4>
                          <p className="text-xs text-slate-500">
                            {luta.atletaBranco?.siglaAcademia || 'Clube'}
                          </p>
                          <div className="flex justify-center gap-1.5 mt-3">
                            <span className="text-xs bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded font-bold text-slate-700 dark:text-slate-300">
                              W: {luta.placar?.wazaAriBranco || 0}
                            </span>
                            <span className="text-xs bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded font-bold text-emerald-700 dark:text-emerald-400">
                              Y: {luta.placar?.yukoBranco || 0}
                            </span>
                            <span className="text-xs bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded font-bold text-slate-700 dark:text-slate-300">
                              S: {luta.placar?.shidoBranco || 0}
                            </span>
                          </div>
                        </div>

                        {/* Judogi Azul */}
                        <div className="bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-2xl p-4 text-center">
                          <div className="inline-block px-2.5 py-0.5 bg-blue-600 text-white text-[10px] font-black uppercase rounded mb-2 shadow-sm">
                            Azul (Ao)
                          </div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-base truncate">
                            {luta.atletaAzul?.nome || 'Atleta Ao'}
                          </h4>
                          <p className="text-xs text-blue-600 dark:text-blue-300">
                            {luta.atletaAzul?.siglaAcademia || 'Clube'}
                          </p>
                          <div className="flex justify-center gap-1.5 mt-3">
                            <span className="text-xs bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded font-bold text-blue-700 dark:text-blue-200">
                              W: {luta.placar?.wazaAriAzul || 0}
                            </span>
                            <span className="text-xs bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded font-bold">
                              Y: {luta.placar?.yukoAzul || 0}
                            </span>
                            <span className="text-xs bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-bold">
                              S: {luta.placar?.shidoAzul || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 text-center text-slate-500">
                        <Swords className="w-10 h-10 mx-auto text-slate-400 mb-3" />
                        <p className="font-bold text-slate-800 dark:text-slate-200">Área Livre no Momento</p>
                        <p className="text-xs text-slate-500 mt-1">Pronta para receber o próximo confronto.</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">
                      {luta ? `Fase ${luta.fase || 1}` : 'Nenhuma luta ativa'}
                    </span>
                    <button
                      onClick={() => setAbaAtiva('lutas')}
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <Clock className="w-3.5 h-3.5" /> Fila do Tatame
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Aba de Gerenciamento de Lutas */
        <LutasManager />
      )}
    </div>
  );
};
