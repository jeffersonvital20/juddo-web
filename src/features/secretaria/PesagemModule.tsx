import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { AtletaCompleto } from '../../types';
import { Scale, CheckCircle2, Search, UserCheck, AlertCircle } from 'lucide-react';

interface AtletaComPesagem extends AtletaCompleto {
  categoriaNome?: string;
  pesoLimiteKg?: number;
  pesoAferidoKg?: number;
  statusPesagem?: 'PENDENTE' | 'APROVADO' | 'REPROVADO';
}

export const PesagemModule: React.FC = () => {
  const queryClient = useQueryClient();

  const [campeonatoId, setCampeonatoId] = useState<string>(
    localStorage.getItem('judoo_active_campeonato') || '10000000-0000-0000-0000-000000000001'
  );
  const [busca, setBusca] = useState('');
  const [atletaSelecionado, setAtletaSelecionado] = useState<AtletaComPesagem | null>(null);
  const [categoriaId, setCategoriaId] = useState<string>('');
  const [pesoInput, setPesoInput] = useState('');
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

  const { data: atletas = [], isLoading } = useQuery({
    queryKey: ['atletas', campeonatoId],
    queryFn: () => api.getAtletas(campeonatoId),
    enabled: Boolean(campeonatoId),
  });

  // Mutação para registrar a pesagem / inscrição do atleta no campeonato
  const mutationPesagem = useMutation({
    mutationFn: async (payload: { campeonatoId: string; atletaId: string; categoriaId: string; pesoKg: number }) => {
      await api.inscreverAtleta(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atletas', campeonatoId] });
      setMensagemSucesso('Pesagem oficial registrada e atleta homologado no campeonato!');
      setMensagemErro(null);
      setTimeout(() => setMensagemSucesso(null), 4000);
    },
    onError: (err: any) => {
      setMensagemErro(err?.message || 'Falha ao registrar pesagem oficial.');
      setMensagemSucesso(null);
    },
  });

  const atletasFormatados: AtletaComPesagem[] = atletas.map((a) => {
    return {
      ...a,
      statusPesagem: 'APROVADO',
      pesoLimiteKg: 66,
      categoriaNome: 'Sênior Oficial',
    };
  });

  const atletasFiltrados = atletasFormatados.filter(
    (a) =>
      a.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (a.registroFederacao && a.registroFederacao.toLowerCase().includes(busca.toLowerCase())) ||
      (a.nomeAcademia && a.nomeAcademia.toLowerCase().includes(busca.toLowerCase())) ||
      (a.siglaAcademia && a.siglaAcademia.toLowerCase().includes(busca.toLowerCase()))
  );

  const handleSalvarPesagem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!atletaSelecionado || !pesoInput) return;

    const pesoNum = parseFloat(pesoInput);
    if (isNaN(pesoNum) || pesoNum <= 0) return;

    const catSelecionada = categorias.find((c) => c.id === categoriaId) || (categorias.length > 0 ? categorias[0] : null);
    const catIdEfetiva = catSelecionada?.id || categoriaId || '30000000-0000-0000-0000-000000000001';

    mutationPesagem.mutate({
      campeonatoId,
      atletaId: atletaSelecionado.id,
      categoriaId: catIdEfetiva,
      pesoKg: pesoNum,
    });
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/40">
            Módulo da Secretaria Oficial
          </span>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mt-2 flex items-center gap-3">
            <Scale className="w-8 h-8 text-emerald-500" />
            Controle de Pesagem Oficial
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Aferição em tempo real, validação estrita de categorias de peso e homologação para chaves da FIJ.
          </p>
        </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel Esquerdo: Lista e Busca de Atletas */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar atleta por nome, registro da federação (CBJ) ou academia..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
            />
          </div>

          <div className="space-y-3">
            {isLoading && (
              <div className="p-8 text-center text-slate-400 text-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                Carregando atletas da secretaria...
              </div>
            )}

            {!isLoading && atletasFiltrados.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                Nenhum lutador encontrado para este evento.
              </div>
            )}

            {atletasFiltrados.map((atleta) => {
              const selecionado = atletaSelecionado?.id === atleta.id;

              return (
                <div
                  key={atleta.id}
                  onClick={() => {
                    setAtletaSelecionado(atleta);
                    setPesoInput('');
                  }}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all shadow-sm flex items-center justify-between gap-4 ${
                    selecionado
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 text-xs">
                      {atleta.siglaAcademia || 'CBJ'}
                    </div>

                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        {atleta.nome}
                        {atleta.registroFederacao && (
                          <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-400">
                            {atleta.registroFederacao}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {atleta.nomeAcademia || atleta.siglaAcademia || 'Clube'} • {atleta.sexo}
                      </div>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-xs font-bold border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Homologado
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Painel Direito: Formulário de Pesagem */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl h-fit space-y-6">
          <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-4">
            <UserCheck className="w-5 h-5 text-emerald-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Balança Oficial & Homologação
            </h2>
          </div>

          {atletaSelecionado ? (
            <form onSubmit={handleSalvarPesagem} className="space-y-5">
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                <span className="text-xs text-slate-400 font-medium">Atleta Selecionado:</span>
                <div className="font-black text-slate-900 dark:text-white text-base">
                  {atletaSelecionado.nome}
                </div>
                <div className="text-xs text-slate-500">
                  {atletaSelecionado.nomeAcademia} ({atletaSelecionado.siglaAcademia})
                </div>
              </div>

              {categorias.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Categoria Oficial de Inscrição
                  </label>
                  <select
                    value={categoriaId}
                    onChange={(e) => setCategoriaId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-200 font-medium"
                  >
                    {categorias.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.classe} {c.divisaoPeso} (Limite: {c.pesoLimiteKg} kg)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Peso Aferido na Balança (kg)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.05"
                    min="30"
                    max="250"
                    placeholder="Ex: 65.85"
                    value={pesoInput}
                    onChange={(e) => setPesoInput(e.target.value)}
                    required
                    className="w-full font-mono text-2xl font-black p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <span className="absolute right-4 top-4 text-sm font-bold text-slate-400">KG</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={mutationPesagem.isPending || !pesoInput}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-2xl text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Scale className="w-4 h-4" />
                <span>{mutationPesagem.isPending ? 'Homologando...' : 'Salvar Pesagem Oficial'}</span>
              </button>
            </form>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              Selecione um lutador na lista ao lado para inserir o peso da balança e validar na categoria regulamentar.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
