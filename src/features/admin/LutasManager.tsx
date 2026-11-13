import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import {
  Swords,
  Plus,
  Play,
  Radio,
  Zap,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const LutasManager: React.FC = () => {
  const queryClient = useQueryClient();
  const [modalAberto, setModalAberto] = useState(false);
  const [modalGerarAberto, setModalGerarAberto] = useState(false);

  const [campeonatoId, setCampeonatoId] = useState<string>(
    localStorage.getItem('judoo_active_campeonato') || '10000000-0000-0000-0000-000000000001'
  );
  const [tatameFiltro, setTatameFiltro] = useState<string>('todos');

  // Form State Luta Manual
  const [atletaBrancoId, setAtletaBrancoId] = useState('');
  const [atletaAzulId, setAtletaAzulId] = useState('');
  const [tatameId, setTatameId] = useState('');
  const [fase, setFase] = useState(1);

  // Form Gerar Grade Automática
  const [categoriaGerarId, setCategoriaGerarId] = useState('');
  const [tatameGerarId, setTatameGerarId] = useState('');

  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);

  // Queries
  const { data: campeonatos = [] } = useQuery({
    queryKey: ['campeonatos'],
    queryFn: () => api.getCampeonatos(),
  });

  const { data: lutas = [], isLoading } = useQuery({
    queryKey: ['todas-lutas', campeonatoId],
    queryFn: () => api.getTodasLutas(campeonatoId),
    refetchInterval: 3000,
  });

  const { data: atletas = [] } = useQuery({
    queryKey: ['atletas', campeonatoId],
    queryFn: () => api.getAtletas(campeonatoId),
  });

  const { data: tatames = [] } = useQuery({
    queryKey: ['tatames', campeonatoId],
    queryFn: () => api.getTatames(campeonatoId),
    refetchInterval: 5000,
  });

  const { data: categorias = [] } = useQuery({
    queryKey: ['categorias', campeonatoId],
    queryFn: () => api.getCategorias(campeonatoId),
  });

  // Mutações
  const mutationCriarLuta = useMutation({
    mutationFn: (payload: any) => api.criarLuta(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todas-lutas', campeonatoId] });
      setModalAberto(false);
      setMensagemSucesso('Luta agendada com sucesso!');
      setTimeout(() => setMensagemSucesso(null), 4000);
    },
    onError: (err: any) => {
      setMensagemErro(err?.message || 'Erro ao agendar luta.');
    },
  });

  const mutationGerarGrade = useMutation({
    mutationFn: async () => {
      if (!categoriaGerarId) throw new Error('Selecione uma categoria.');
      return await api.gerarGradeLutas(campeonatoId, {
        categoriaId: categoriaGerarId,
        tatameId: tatameGerarId || undefined,
      });
    },
    onSuccess: (novas) => {
      queryClient.invalidateQueries({ queryKey: ['todas-lutas', campeonatoId] });
      queryClient.invalidateQueries({ queryKey: ['chaves', campeonatoId] });
      queryClient.invalidateQueries({ queryKey: ['tatames', campeonatoId] });
      setModalGerarAberto(false);
      setMensagemSucesso(`Grade gerada com sucesso! ${novas.length} combates cadastrados.`);
      setTimeout(() => setMensagemSucesso(null), 5000);
    },
    onError: (err: any) => {
      setMensagemErro(err?.message || 'Erro ao gerar grade de lutas.');
    },
  });

  const mutationStatus = useMutation({
    mutationFn: ({ lutaId, status }: { lutaId: string; status: string }) =>
      api.alterarStatusLuta(lutaId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todas-lutas', campeonatoId] });
    },
  });

  const mutationTatame = useMutation({
    mutationFn: ({ lutaId, tatameId }: { lutaId: string; tatameId: string }) =>
      api.atribuirTatameLuta(lutaId, { tatameId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todas-lutas', campeonatoId] });
    },
  });

  const mutationDefinirLutaAtualTatame = useMutation({
    mutationFn: ({ tatameId, lutaId }: { tatameId: string; lutaId: string }) =>
      api.definirLutaAtualTatame(tatameId, { lutaId, iniciarLuta: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tatames', campeonatoId] });
      queryClient.invalidateQueries({ queryKey: ['todas-lutas', campeonatoId] });
      setMensagemSucesso('Luta enviada para o placar da mesa do tatame!');
      setTimeout(() => setMensagemSucesso(null), 4000);
    },
    onError: (err: any) => {
      setMensagemErro(err?.message || 'Falha ao sincronizar com tatame.');
    },
  });

  const handleAgendarLuta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!atletaBrancoId || !atletaAzulId || atletaBrancoId === atletaAzulId) return;

    mutationCriarLuta.mutate({
      chaveId: '50000000-0000-0000-0000-000000000001',
      tatameId: tatameId || undefined,
      atletaBrancoId,
      atletaAzulId,
      fase,
      ordemNaChave: 1,
    });
  };

  const lutasFiltradas = lutas.filter((l) => {
    if (tatameFiltro === 'todos') return true;
    if (tatameFiltro === 'sem_tatame') return !l.tatameId;
    return l.tatameId === tatameFiltro;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Swords className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Gerenciador de Lutas & Fila dos Tatames
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
            Agende novos combates, gere grades oficiais, faça chamadas de atletas e envie os confrontos para os tatames ativos.
          </p>
        </div>

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

          <button
            onClick={() => {
              if (categorias.length > 0) setCategoriaGerarId(categorias[0].id);
              if (tatames.length > 0) setTatameGerarId(tatames[0].id);
              setModalGerarAberto(true);
            }}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-md shadow-amber-500/20 transition-all shrink-0"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>Gerar Grade Automática</span>
          </button>

          <button
            onClick={() => {
              if (atletas.length >= 2) {
                setAtletaBrancoId(atletas[0].id);
                setAtletaAzulId(atletas[1].id);
              }
              if (tatames.length > 0) {
                setTatameId(tatames[0].id);
              }
              setModalAberto(true);
            }}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-md shadow-blue-600/30 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Agendar Luta Manual</span>
          </button>
        </div>
      </div>

      {/* Alertas */}
      {mensagemSucesso && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{mensagemSucesso}</span>
        </div>
      )}

      {mensagemErro && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{mensagemErro}</span>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-500">Filtrar Tatame:</span>
          <select
            value={tatameFiltro}
            onChange={(e) => setTatameFiltro(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200"
          >
            <option value="todos">Todos os Tatames ({lutas.length})</option>
            <option value="sem_tatame">Sem Tatame Atribuído</option>
            {tatames.map((t) => (
              <option key={t.id} value={t.id}>
                Tatame {t.numero} ({t.nome})
              </option>
            ))}
          </select>
        </div>

        <span className="text-slate-400 font-mono text-[11px]">
          Mostrando {lutasFiltradas.length} de {lutas.length} combates
        </span>
      </div>

      {/* Lista de Lutas */}
      <div className="space-y-3">
        {isLoading && (
          <div className="p-8 text-center text-slate-400 text-sm">Carregando combates...</div>
        )}

        {!isLoading && lutasFiltradas.length === 0 && (
          <div className="p-8 text-center text-slate-400 text-sm bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            Nenhuma luta encontrada com o filtro selecionado.
          </div>
        )}

        {lutasFiltradas.map((l) => (
          <div
            key={l.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            {/* Confronto */}
            <div className="flex items-center gap-4 flex-1">
              {/* Atleta Branco */}
              <div className="flex items-center gap-2.5 flex-1 justify-end text-right">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">
                    {l.atletaBranco?.nome || 'Atleta Shiro'}
                  </div>
                  <div className="text-[11px] text-slate-500">{l.atletaBranco?.siglaAcademia || 'Clube'}</div>
                </div>
                <span className="w-3.5 h-3.5 rounded-full bg-white border border-slate-400 shadow-sm shrink-0"></span>
              </div>

              <span className="font-black text-xs text-slate-400 px-2 uppercase">VS</span>

              {/* Atleta Azul */}
              <div className="flex items-center gap-2.5 flex-1">
                <span className="w-3.5 h-3.5 rounded-full bg-blue-600 shadow-sm shrink-0"></span>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">
                    {l.atletaAzul?.nome || 'Atleta Ao'}
                  </div>
                  <div className="text-[11px] text-blue-600 dark:text-blue-400 font-bold">{l.atletaAzul?.siglaAcademia || 'Clube'}</div>
                </div>
              </div>
            </div>

            {/* Status, Tatame e Ações */}
            <div className="flex flex-wrap items-center gap-2 justify-end">
              {l.status !== 'Finalizada' && (
                <select
                  value={l.tatameId || ''}
                  onChange={(e) => mutationTatame.mutate({ lutaId: l.id, tatameId: e.target.value })}
                  className="text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-800 dark:text-slate-200"
                >
                  <option value="">Sem Tatame</option>
                  {tatames.map((t) => (
                    <option key={t.id} value={t.id}>
                      Tatame {t.numero}
                    </option>
                  ))}
                </select>
              )}

              <span
                className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full border ${
                  l.status === 'EmAndamento'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 animate-pulse'
                    : l.status === 'Chamada'
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                    : l.status === 'Finalizada'
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                    : 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                }`}
              >
                {l.status}
              </span>

              {/* Ações de Status */}
              {l.status === 'Agendada' && (
                <button
                  onClick={() => mutationStatus.mutate({ lutaId: l.id, status: 'Chamada' })}
                  className="text-xs font-bold bg-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-500/30 px-3 py-1.5 rounded-lg border border-amber-500/30 flex items-center gap-1"
                >
                  <Radio className="w-3.5 h-3.5" /> Chamar
                </button>
              )}

              {/* Botão de Enviar como Luta Atual do Tatame */}
              {l.status !== 'Finalizada' && (
                <button
                  onClick={() => {
                    const tatameAlvo = l.tatameId || (tatames.length > 0 ? tatames[0].id : null);
                    if (tatameAlvo) {
                      mutationDefinirLutaAtualTatame.mutate({ tatameId: tatameAlvo, lutaId: l.id });
                    }
                  }}
                  className="text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 px-3 py-1.5 rounded-lg flex items-center gap-1 shadow"
                  title="Define esta luta como a luta atual da mesa do tatame"
                >
                  <Play className="w-3.5 h-3.5" /> Iniciar no Tatame
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Gerar Grade Automática */}
      {modalGerarAberto && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Gerar Grade Regulamentar de Lutas
            </h3>
            <p className="text-slate-500 text-xs">
              O sistema pegará todos os lutadores inscritos na categoria selecionada e gerará o chaveamento oficial da FIJ automaticamente.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                mutationGerarGrade.mutate();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Categoria de Peso
                </label>
                <select
                  value={categoriaGerarId}
                  onChange={(e) => setCategoriaGerarId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-200"
                >
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.classe} {cat.divisaoPeso} ({cat.sexo === 'FEMININO' ? 'F' : 'M'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tatame Principal de Alocação (Opcional)
                </label>
                <select
                  value={tatameGerarId}
                  onChange={(e) => setTatameGerarId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-200"
                >
                  <option value="">Distribuir entre os tatames</option>
                  {tatames.map((t) => (
                    <option key={t.id} value={t.id}>
                      Tatame {t.numero} ({t.nome})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalGerarAberto(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={mutationGerarGrade.isPending}
                  className="px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow disabled:opacity-50"
                >
                  {mutationGerarGrade.isPending ? 'Gerando...' : 'Confirmar & Gerar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Agendar Luta Manual */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Swords className="w-5 h-5 text-blue-600" />
              Agendar Combate Manual
            </h3>

            <form onSubmit={handleAgendarLuta} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Atleta Shiro (Judogi Branco)
                </label>
                <select
                  value={atletaBrancoId}
                  onChange={(e) => setAtletaBrancoId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-200"
                >
                  {atletas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nome} ({a.siglaAcademia || 'Clube'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Atleta Ao (Judogi Azul)
                </label>
                <select
                  value={atletaAzulId}
                  onChange={(e) => setAtletaAzulId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-200"
                >
                  {atletas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nome} ({a.siglaAcademia || 'Clube'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tatame
                  </label>
                  <select
                    value={tatameId}
                    onChange={(e) => setTatameId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-200"
                  >
                    <option value="">A definir</option>
                    {tatames.map((t) => (
                      <option key={t.id} value={t.id}>
                        Tatame {t.numero}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Fase
                  </label>
                  <select
                    value={fase}
                    onChange={(e) => setFase(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-200"
                  >
                    <option value={1}>Final</option>
                    <option value={2}>Semifinal</option>
                    <option value={3}>Quartas</option>
                    <option value={4}>Oitavas</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={mutationCriarLuta.isPending}
                  className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow disabled:opacity-50"
                >
                  {mutationCriarLuta.isPending ? 'Agendando...' : 'Confirmar Combate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
