import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Trophy, GitBranch, ShieldCheck, Zap, AlertCircle, CheckCircle2, Play } from 'lucide-react';

export const ChavesBracketView: React.FC = () => {
  const queryClient = useQueryClient();

  const [campeonatoId, setCampeonatoId] = useState<string>(
    localStorage.getItem('judoo_active_campeonato') || '10000000-0000-0000-0000-000000000001'
  );
  const [categoriaSelecionadaId, setCategoriaSelecionadaId] = useState<string>('');
  const [tatameSelecionadoId, setTatameSelecionadoId] = useState<string>('');
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);

  // Queries
  const { data: campeonatos = [] } = useQuery({
    queryKey: ['campeonatos'],
    queryFn: () => api.getCampeonatos(),
  });

  const { data: categorias = [] } = useQuery({
    queryKey: ['categorias', campeonatoId],
    queryFn: () => api.getCategorias(campeonatoId),
    enabled: Boolean(campeonatoId),
  });

  const { data: tatames = [] } = useQuery({
    queryKey: ['tatames', campeonatoId],
    queryFn: () => api.getTatames(campeonatoId),
    enabled: Boolean(campeonatoId),
  });

  const { data: todasLutas = [], isLoading: carregandoLutas } = useQuery({
    queryKey: ['todas-lutas', campeonatoId],
    queryFn: () => api.getTodasLutas(campeonatoId),
    enabled: Boolean(campeonatoId),
    refetchInterval: 4000,
  });

  // Categoria ativa (primeira disponível caso não selecionada)
  const categoriaAtiva =
    categorias.find((c) => c.id === categoriaSelecionadaId) ||
    (categorias.length > 0 ? categorias[0] : null);

  const categoriaIdEfetivo = categoriaAtiva?.id || categoriaSelecionadaId;

  // Filtrar lutas desta categoria
  // No backend, cada luta tem ChaveId vinculado à Categoria
  const lutasDaCategoria = todasLutas;

  // Agrupamento por Fase (1 = Final, 2 = Semifinais, 3 = Quartas de Final, etc.)
  const fases = Array.from(new Set(lutasDaCategoria.map((l) => l.fase || 1))).sort((a, b) => b - a);

  // Mutação para Gerar Grade Automática
  const mutationGerarGrade = useMutation({
    mutationFn: async () => {
      if (!campeonatoId || !categoriaIdEfetivo) {
        throw new Error('Selecione um campeonato e uma categoria válida.');
      }
      return await api.gerarGradeLutas(campeonatoId, {
        categoriaId: categoriaIdEfetivo,
        tatameId: tatameSelecionadoId || undefined,
      });
    },
    onSuccess: (novasLutas) => {
      queryClient.invalidateQueries({ queryKey: ['todas-lutas', campeonatoId] });
      queryClient.invalidateQueries({ queryKey: ['chaves', campeonatoId] });
      queryClient.invalidateQueries({ queryKey: ['tatames', campeonatoId] });
      setMensagemSucesso(`Grade gerada com sucesso! ${novasLutas.length} combates criados.`);
      setMensagemErro(null);
      setTimeout(() => setMensagemSucesso(null), 5000);
    },
    onError: (err: any) => {
      setMensagemErro(err?.message || 'Erro ao gerar grade de lutas. Verifique se há atletas suficientes inscritos.');
      setMensagemSucesso(null);
    },
  });

  // Mutação para enviar luta ao tatame
  const mutationDefinirLutaAtual = useMutation({
    mutationFn: async ({ tatameId, lutaId }: { tatameId: string; lutaId: string }) => {
      await api.definirLutaAtualTatame(tatameId, { lutaId, iniciarLuta: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tatames', campeonatoId] });
      queryClient.invalidateQueries({ queryKey: ['todas-lutas', campeonatoId] });
      setMensagemSucesso('Luta enviada para o tatame como combate em andamento!');
      setTimeout(() => setMensagemSucesso(null), 4000);
    },
    onError: (err: any) => {
      setMensagemErro(err?.message || 'Falha ao atribuir luta ao tatame.');
    },
  });

  const getNomeFase = (faseNum: number) => {
    switch (faseNum) {
      case 1:
        return 'Grande Final (Disputa de Ouro)';
      case 2:
        return 'Semifinais';
      case 3:
        return 'Quartas de Final';
      case 4:
        return 'Oitavas de Final';
      default:
        return `Fase Eliminatória ${faseNum}`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800/40">
            Chaveamento Oficial FIJ
          </span>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mt-2 flex items-center gap-3">
            <GitBranch className="w-8 h-8 text-amber-500" />
            Chaves & Brackets de Combate
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Geração automática de chaves eliminatórias regulamentares, acompanhamento de fases e envio aos tatames.
          </p>
        </div>

        {/* Seletores de Campeonato e Tatame */}
        <div className="flex flex-wrap items-center gap-2">
          {campeonatos.length > 0 && (
            <select
              value={campeonatoId}
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

          {tatames.length > 0 && (
            <select
              value={tatameSelecionadoId}
              onChange={(e) => setTatameSelecionadoId(e.target.value)}
              className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 font-medium text-slate-800 dark:text-slate-200 shadow-sm"
            >
              <option value="">Todos os Tatames</option>
              {tatames.map((t) => (
                <option key={t.id} value={t.id}>
                  Tatame {t.numero} ({t.nome})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Alertas */}
      {mensagemSucesso && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>{mensagemSucesso}</span>
        </div>
      )}

      {mensagemErro && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <span>{mensagemErro}</span>
        </div>
      )}

      {/* Barra de Categorias & Ação de Geração */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          {categorias.map((cat) => {
            const isAtiva = (categoriaAtiva?.id === cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => setCategoriaSelecionadaId(cat.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                  isAtiva
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/60'
                }`}
              >
                {cat.classe} {cat.divisaoPeso} ({cat.sexo === 'FEMININO' ? 'F' : 'M'})
              </button>
            );
          })}
        </div>

        <button
          onClick={() => mutationGerarGrade.mutate()}
          disabled={mutationGerarGrade.isPending || !categoriaIdEfetivo}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md shadow-amber-500/20 transition-all shrink-0 disabled:opacity-50"
        >
          <Zap className="w-4 h-4 fill-white" />
          <span>{mutationGerarGrade.isPending ? 'Montando Chaves...' : 'Gerar Grade Automática'}</span>
        </button>
      </div>

      {/* Árvore de Confrontos (Bracket Visualizer) */}
      <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 lg:p-8 shadow-xl overflow-x-auto">
        {carregandoLutas && (
          <div className="p-12 text-center text-slate-400 text-sm">
            Carregando confrontos oficiais...
          </div>
        )}

        {!carregandoLutas && lutasDaCategoria.length === 0 && (
          <div className="p-12 text-center space-y-4">
            <GitBranch className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
              Nenhuma chave gerada para esta categoria
            </h3>
            <p className="text-slate-500 text-xs max-w-md mx-auto">
              Cadastre os lutadores da categoria na pesagem e clique no botão acima "Gerar Grade Automática" para montar o chaveamento oficial da FIJ.
            </p>
            <button
              onClick={() => mutationGerarGrade.mutate()}
              disabled={mutationGerarGrade.isPending}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow"
            >
              <Zap className="w-4 h-4" /> Gerar Chaves Agora
            </button>
          </div>
        )}

        {!carregandoLutas && lutasDaCategoria.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
            {fases.map((faseNum) => {
              const lutasFase = lutasDaCategoria.filter((l) => (l.fase || 1) === faseNum);
              const isFinal = (faseNum === 1);

              return (
                <div key={faseNum} className="space-y-4">
                  <h3
                    className={`text-xs font-bold uppercase tracking-wider border-b pb-2 flex items-center justify-between ${
                      isFinal
                        ? 'text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/40'
                        : 'text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      {isFinal ? <Trophy className="w-4 h-4 text-amber-500" /> : <ShieldCheck className="w-4 h-4 text-blue-500" />}
                      {getNomeFase(faseNum)}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 font-normal">
                      {lutasFase.length} {lutasFase.length === 1 ? 'luta' : 'lutas'}
                    </span>
                  </h3>

                  <div className="space-y-3">
                    {lutasFase.map((luta) => {
                      const emAndamento = luta.status === 'EmAndamento';
                      const finalizada = luta.status === 'Finalizada';
                      const tatameAtual = tatames.find((t) => t.id === luta.tatameId);

                      return (
                        <div
                          key={luta.id}
                          className={`rounded-2xl border transition-all overflow-hidden shadow-sm ${
                            isFinal
                              ? 'border-amber-500/60 bg-amber-500/5'
                              : emAndamento
                              ? 'border-emerald-500 bg-emerald-500/5 ring-2 ring-emerald-500/20'
                              : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90'
                          }`}
                        >
                          {/* Cabeçalho da Luta */}
                          <div className="bg-slate-100 dark:bg-slate-950 px-3.5 py-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              {tatameAtual ? `Tatame ${tatameAtual.numero}` : 'Tatame a Definir'}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                emAndamento
                                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 animate-pulse'
                                  : finalizada
                                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                                  : 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                              }`}
                            >
                              {luta.status}
                            </span>
                          </div>

                          {/* Atleta Branco (Shiro) */}
                          <div className="p-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60">
                            <div className="flex items-center gap-2">
                              <span className="w-3.5 h-3.5 rounded-full bg-white border border-slate-400 shadow-sm shrink-0"></span>
                              <div className="truncate">
                                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                  {luta.atletaBranco?.nome || 'Atleta Shiro'}
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  {luta.atletaBranco?.siglaAcademia || 'Clube'}
                                </div>
                              </div>
                            </div>
                            <span className="font-mono text-xs font-black text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">
                              {luta.placar ? `I:${luta.placar.ipponBranco} W:${luta.placar.wazaAriBranco} S:${luta.placar.shidoBranco}` : '-'}
                            </span>
                          </div>

                          {/* Atleta Azul (Ao) */}
                          <div className="p-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-3.5 h-3.5 rounded-full bg-blue-600 shadow-sm shrink-0"></span>
                              <div className="truncate">
                                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                  {luta.atletaAzul?.nome || 'Atleta Ao'}
                                </div>
                                <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                                  {luta.atletaAzul?.siglaAcademia || 'Clube'}
                                </div>
                              </div>
                            </div>
                            <span className="font-mono text-xs font-black text-blue-600 dark:text-blue-300 bg-blue-100 dark:bg-blue-950 px-2 py-0.5 rounded">
                              {luta.placar ? `I:${luta.placar.ipponAzul} W:${luta.placar.wazaAriAzul} S:${luta.placar.shidoAzul}` : '-'}
                            </span>
                          </div>

                          {/* Botão de Enviar para Tatame se não finalizada */}
                          {!finalizada && tatames.length > 0 && (
                            <div className="p-2 bg-slate-100/50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                              <button
                                onClick={() =>
                                  mutationDefinirLutaAtual.mutate({
                                    tatameId: luta.tatameId || tatames[0].id,
                                    lutaId: luta.id,
                                  })
                                }
                                className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                              >
                                <Play className="w-3 h-3" /> Iniciar na Mesa
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
