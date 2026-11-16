import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Scale,
  Plus,
  Pencil,
  Trash2,
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { api } from '../../services/api';
import { Categoria } from '../../types';

const CLASSES_SUGERIDAS = [
  'Sênior',
  'Sub-21 (Júnior)',
  'Sub-18 (Cadete)',
  'Sub-15 (Infanto-Juvenil)',
  'Sub-13 (Infantil)',
  'Veteranos (Master)',
];

const GRADE_FIJ_MASCULINA = [
  { divisaoPeso: '-60kg Ligeiro', pesoLimiteKg: 60 },
  { divisaoPeso: '-66kg Meio-Leve', pesoLimiteKg: 66 },
  { divisaoPeso: '-73kg Leve', pesoLimiteKg: 73 },
  { divisaoPeso: '-81kg Meio-Médio', pesoLimiteKg: 81 },
  { divisaoPeso: '-90kg Médio', pesoLimiteKg: 90 },
  { divisaoPeso: '-100kg Meio-Pesado', pesoLimiteKg: 100 },
  { divisaoPeso: '+100kg Pesado', pesoLimiteKg: 160 },
];

const GRADE_FIJ_FEMININA = [
  { divisaoPeso: '-48kg Ligeiro', pesoLimiteKg: 48 },
  { divisaoPeso: '-52kg Meio-Leve', pesoLimiteKg: 52 },
  { divisaoPeso: '-57kg Leve', pesoLimiteKg: 57 },
  { divisaoPeso: '-63kg Meio-Médio', pesoLimiteKg: 63 },
  { divisaoPeso: '-70kg Médio', pesoLimiteKg: 70 },
  { divisaoPeso: '-78kg Meio-Pesado', pesoLimiteKg: 78 },
  { divisaoPeso: '+78kg Pesado', pesoLimiteKg: 140 },
];

export const CategoriasManager: React.FC = () => {
  const queryClient = useQueryClient();

  const [campeonatoId, setCampeonatoId] = useState<string>(
    localStorage.getItem('judoo_active_campeonato') || '10000000-0000-0000-0000-000000000001'
  );

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [classe, setClasse] = useState('Sênior');
  const [divisaoPeso, setDivisaoPeso] = useState('');
  const [pesoLimiteKg, setPesoLimiteKg] = useState<string>('73');
  const [sexo, setSexo] = useState<'MASCULINO' | 'FEMININO'>('MASCULINO');
  const [tempoLutaSegundos, setTempoLutaSegundos] = useState<number>(240);

  const [filtroSexo, setFiltroSexo] = useState<'TODOS' | 'MASCULINO' | 'FEMININO'>('TODOS');
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const { data: campeonatos = [] } = useQuery({
    queryKey: ['campeonatos'],
    queryFn: () => api.getCampeonatos(),
  });

  const campeonatoAtivo =
    campeonatos.find((c) => c.id === campeonatoId) ||
    (campeonatos.length > 0 ? campeonatos[0] : null);

  const campeonatoIdEfetivo = campeonatoAtivo?.id || campeonatoId;

  const { data: categorias = [], isLoading } = useQuery({
    queryKey: ['categorias', campeonatoIdEfetivo],
    queryFn: () => api.getCategorias(campeonatoIdEfetivo),
    enabled: Boolean(campeonatoIdEfetivo),
  });

  const limparFormulario = () => {
    setEditandoId(null);
    setDivisaoPeso('');
    setPesoLimiteKg('73');
    setTempoLutaSegundos(240);
    setErro(null);
  };

  const iniciarEdicao = (cat: Categoria) => {
    setEditandoId(cat.id);
    setClasse(cat.classe);
    setDivisaoPeso(cat.divisaoPeso);
    setPesoLimiteKg(String(cat.pesoLimiteKg));
    setSexo(cat.sexo.toUpperCase() === 'FEMININO' ? 'FEMININO' : 'MASCULINO');
    setTempoLutaSegundos(cat.tempoLutaSegundos || 240);
    setErro(null);
  };

  const criarMutation = useMutation({
    mutationFn: (payload: {
      classe: string;
      divisaoPeso: string;
      pesoLimiteKg: number;
      sexo: string;
      tempoLutaSegundos: number;
    }) => api.criarCategoria(campeonatoIdEfetivo, payload),
    onSuccess: () => {
      limparFormulario();
      setSucesso('Categoria configurada com sucesso!');
      setTimeout(() => setSucesso(null), 4000);
      queryClient.invalidateQueries({ queryKey: ['categorias', campeonatoIdEfetivo] });
      queryClient.invalidateQueries({ queryKey: ['chaves', campeonatoIdEfetivo] });
    },
    onError: (e: Error) => {
      setErro(e.message || 'Erro ao criar categoria.');
    },
  });

  const atualizarMutation = useMutation({
    mutationFn: ({
      categoriaId,
      payload,
    }: {
      categoriaId: string;
      payload: {
        classe: string;
        divisaoPeso: string;
        pesoLimiteKg: number;
        sexo: string;
        tempoLutaSegundos: number;
      };
    }) => api.atualizarCategoria(campeonatoIdEfetivo, categoriaId, payload),
    onSuccess: () => {
      limparFormulario();
      setSucesso('Categoria atualizada com sucesso!');
      setTimeout(() => setSucesso(null), 4000);
      queryClient.invalidateQueries({ queryKey: ['categorias', campeonatoIdEfetivo] });
    },
    onError: (e: Error) => {
      setErro(e.message || 'Erro ao atualizar categoria.');
    },
  });

  const removerMutation = useMutation({
    mutationFn: (categoriaId: string) => api.removerCategoria(campeonatoIdEfetivo, categoriaId),
    onSuccess: () => {
      setSucesso('Categoria removida do campeonato.');
      setTimeout(() => setSucesso(null), 4000);
      queryClient.invalidateQueries({ queryKey: ['categorias', campeonatoIdEfetivo] });
      queryClient.invalidateQueries({ queryKey: ['chaves', campeonatoIdEfetivo] });
    },
    onError: (e: Error) => {
      setErro(e.message || 'Erro ao remover categoria.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    const pesoNum = parseFloat(pesoLimiteKg.replace(',', '.'));
    if (!classe.trim() || !divisaoPeso.trim()) {
      setErro('Informe a classe (ex.: Sênior) e a divisão de peso (ex.: -73kg Leve).');
      return;
    }
    if (isNaN(pesoNum) || pesoNum <= 0) {
      setErro('Informe um peso limite válido em kg.');
      return;
    }

    const payload = {
      classe: classe.trim(),
      divisaoPeso: divisaoPeso.trim(),
      pesoLimiteKg: pesoNum,
      sexo,
      tempoLutaSegundos: Number(tempoLutaSegundos) || 240,
    };

    if (editandoId) {
      atualizarMutation.mutate({ categoriaId: editandoId, payload });
    } else {
      criarMutation.mutate(payload);
    }
  };

  const handleImportarGradeFij = async (sexoAlvo: 'MASCULINO' | 'FEMININO') => {
    const grade = sexoAlvo === 'MASCULINO' ? GRADE_FIJ_MASCULINA : GRADE_FIJ_FEMININA;
    setErro(null);
    let criadas = 0;

    for (const item of grade) {
      const jaExiste = categorias.some(
        (c) =>
          c.classe.toLowerCase() === classe.trim().toLowerCase() &&
          c.sexo.toUpperCase() === sexoAlvo &&
          c.divisaoPeso.toLowerCase() === item.divisaoPeso.toLowerCase()
      );
      if (!jaExiste) {
        await api.criarCategoria(campeonatoIdEfetivo, {
          classe: classe.trim() || 'Sênior',
          divisaoPeso: item.divisaoPeso,
          pesoLimiteKg: item.pesoLimiteKg,
          sexo: sexoAlvo,
          tempoLutaSegundos: Number(tempoLutaSegundos) || 240,
        });
        criadas++;
      }
    }

    queryClient.invalidateQueries({ queryKey: ['categorias', campeonatoIdEfetivo] });
    queryClient.invalidateQueries({ queryKey: ['chaves', campeonatoIdEfetivo] });
    setSucesso(
      criadas > 0
        ? `${criadas} categorias FIJ (${sexoAlvo}) adicionadas para a classe ${classe}!`
        : `Todas as categorias FIJ (${sexoAlvo}) da classe ${classe} já estão cadastradas.`
    );
    setTimeout(() => setSucesso(null), 4000);
  };

  const categoriasFiltradas = categorias.filter((c) => {
    if (filtroSexo === 'TODOS') return true;
    return c.sexo.toUpperCase() === filtroSexo;
  });

  const formatarTempo = (seg: number) => {
    const m = Math.floor(seg / 60);
    const s = seg % 60;
    return s > 0 ? `${m}m ${s}s` : `${m} min`;
  };

  return (
    <div className="space-y-6">
      {/* Barra Superior de Seleção de Campeonato e Atalhos FIJ */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Campeonato Selecionado para Configuração de Categorias
            </label>
            <select
              value={campeonatoIdEfetivo}
              onChange={(e) => {
                setCampeonatoId(e.target.value);
                localStorage.setItem('judoo_active_campeonato', e.target.value);
              }}
              className="mt-0.5 text-sm font-bold bg-transparent text-slate-900 dark:text-white focus:outline-none cursor-pointer"
            >
              {campeonatos.map((c) => (
                <option key={c.id} value={c.id} className="bg-white dark:bg-slate-900">
                  {c.nome} ({c.status})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleImportarGradeFij('MASCULINO')}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border border-blue-200 dark:border-blue-800/60 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>+ Grade FIJ Masculina ({classe})</span>
          </button>
          <button
            type="button"
            onClick={() => handleImportarGradeFij('FEMININO')}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border border-pink-200 dark:border-pink-800/60 bg-pink-50 dark:bg-pink-950/50 text-pink-700 dark:text-pink-300 hover:bg-pink-100 dark:hover:bg-pink-900/50 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>+ Grade FIJ Feminina ({classe})</span>
          </button>
        </div>
      </div>

      {sucesso && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{sucesso}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário de Configuração de Categoria */}
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm h-fit"
        >
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              {editandoId ? (
                <Pencil className="w-5 h-5 text-amber-500" />
              ) : (
                <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              )}
              <h3 className="font-bold text-slate-900 dark:text-white">
                {editandoId ? 'Editar Categoria' : 'Nova Categoria de Lutadores'}
              </h3>
            </div>
            {editandoId && (
              <button
                type="button"
                onClick={limparFormulario}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Cancelar
              </button>
            )}
          </div>

          {erro && (
            <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl p-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Classe / Faixa Etária
            </label>
            <input
              type="text"
              list="classes-judo-list"
              value={classe}
              onChange={(e) => setClasse(e.target.value)}
              placeholder="Ex: Sênior, Sub-21, Sub-18..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white"
            />
            <datalist id="classes-judo-list">
              {CLASSES_SUGERIDAS.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Divisão de Peso (Nome da Categoria)
            </label>
            <input
              type="text"
              value={divisaoPeso}
              onChange={(e) => setDivisaoPeso(e.target.value)}
              placeholder="Ex: -73kg Leve, -90kg Médio, +100kg Pesado"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Peso Limite (kg)
              </label>
              <input
                type="number"
                step="0.1"
                min="15"
                max="250"
                value={pesoLimiteKg}
                onChange={(e) => setPesoLimiteKg(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Naipe (Sexo)
              </label>
              <select
                value={sexo}
                onChange={(e) => setSexo(e.target.value as 'MASCULINO' | 'FEMININO')}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white"
              >
                <option value="MASCULINO">Masculino</option>
                <option value="FEMININO">Feminino</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Tempo Regulamentar do Combate
            </label>
            <select
              value={tempoLutaSegundos}
              onChange={(e) => setTempoLutaSegundos(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white"
            >
              <option value={120}>2 minutos (120s — Infantil / Sub-13)</option>
              <option value={180}>3 minutos (180s — Sub-15 / Veteranos)</option>
              <option value={240}>4 minutos (240s — Padrão Oficial FIJ Sênior / Sub-21 / Sub-18)</option>
              <option value={300}>5 minutos (300s — Especial)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={criarMutation.isPending || atualizarMutation.isPending}
            className={`w-full disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-md ${
              editandoId
                ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
                : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'
            }`}
          >
            {criarMutation.isPending || atualizarMutation.isPending
              ? 'Salvando...'
              : editandoId
              ? 'Salvar Alterações da Categoria'
              : 'Adicionar Categoria'}
          </button>
        </form>

        {/* Lista de Categorias Configuradas */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-bold text-slate-900 dark:text-white">
                Categorias Configuradas dos Lutadores
              </h3>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {categoriasFiltradas.length}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {(['TODOS', 'MASCULINO', 'FEMININO'] as const).map((op) => (
                <button
                  key={op}
                  type="button"
                  onClick={() => setFiltroSexo(op)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    filtroSexo === op
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {op === 'TODOS' ? 'Todas' : op === 'MASCULINO' ? 'Masculino' : 'Feminino'}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <p className="text-sm text-slate-400 py-8 text-center">Carregando categorias...</p>
          ) : categoriasFiltradas.length === 0 ? (
            <div className="text-center py-8 text-slate-400 space-y-2">
              <Scale className="w-8 h-8 mx-auto opacity-50" />
              <p className="text-sm">Nenhuma categoria encontrada para este filtro.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {categoriasFiltradas.map((cat) => {
                const isFem = cat.sexo.toUpperCase() === 'FEMININO';
                return (
                  <div
                    key={cat.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                      editandoId === cat.id
                        ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/20'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {cat.classe}
                          </span>
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                              isFem
                                ? 'bg-pink-50 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800/50'
                                : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/50'
                            }`}
                          >
                            {isFem ? 'Feminino' : 'Masculino'}
                          </span>
                        </div>

                        <h4 className="font-black text-base text-slate-900 dark:text-white mt-1.5">
                          {cat.divisaoPeso}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => iniciarEdicao(cat)}
                          title="Editar Categoria"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                        >
                          <Pencil className="w-3.5 h-3.5 text-amber-500" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Deseja remover a categoria "${cat.classe} ${cat.divisaoPeso}"?`
                              )
                            ) {
                              removerMutation.mutate(cat.id);
                            }
                          }}
                          title="Remover Categoria"
                          className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/70 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold">
                        Limite: <strong className="text-slate-800 dark:text-slate-200">{cat.pesoLimiteKg} kg</strong>
                      </span>
                      <span className="flex items-center gap-1 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                        {formatarTempo(cat.tempoLutaSegundos || 240)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
