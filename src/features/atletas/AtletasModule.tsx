import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { AtletaCompleto, Academia } from '../../types';
import {
  Users,
  UserPlus,
  Search,
  Building2,
  CheckCircle2,
} from 'lucide-react';

const ATLETAS_MOCK: AtletaCompleto[] = [
  { id: '1', academiaId: '20000000-0000-0000-0000-000000000001', nome: 'Gabriel Santos', registroFederacao: 'CBJ-98214', dataNascimento: '1999-05-14', sexo: 'MASCULINO', nomeAcademia: 'Esporte Clube Pinheiros', siglaAcademia: 'ECP' },
  { id: '2', academiaId: '20000000-0000-0000-0000-000000000002', nome: 'Lucas Oliveira', registroFederacao: 'CBJ-84192', dataNascimento: '2001-08-22', sexo: 'MASCULINO', nomeAcademia: 'Minas Tênis Clube', siglaAcademia: 'MTC' },
  { id: '3', academiaId: '20000000-0000-0000-0000-000000000003', nome: 'Matheus Takaki', registroFederacao: 'CBJ-73129', dataNascimento: '2000-01-10', sexo: 'MASCULINO', nomeAcademia: 'Sogipa Judô', siglaAcademia: 'SOG' },
  { id: '4', academiaId: '20000000-0000-0000-0000-000000000004', nome: 'Rafael Silva', registroFederacao: 'CBJ-61204', dataNascimento: '1998-11-30', sexo: 'MASCULINO', nomeAcademia: 'Instituto Reação', siglaAcademia: 'IRC' },
];

const ACADEMIAS_MOCK: Academia[] = [
  { id: '20000000-0000-0000-0000-000000000001', nome: 'Esporte Clube Pinheiros', sigla: 'ECP', cidade: 'São Paulo', estado: 'SP' },
  { id: '20000000-0000-0000-0000-000000000002', nome: 'Minas Tênis Clube', sigla: 'MTC', cidade: 'Belo Horizonte', estado: 'MG' },
  { id: '20000000-0000-0000-0000-000000000003', nome: 'Sogipa Judô', sigla: 'SOG', cidade: 'Porto Alegre', estado: 'RS' },
  { id: '20000000-0000-0000-0000-000000000004', nome: 'Instituto Reação', sigla: 'IRC', cidade: 'Rio de Janeiro', estado: 'RJ' },
];

export const AtletasModule: React.FC = () => {
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [modalClubeAberto, setModalClubeAberto] = useState(false);

  // Form Atleta
  const [nome, setNome] = useState('');
  const [registro, setRegistro] = useState('');
  const [academiaId, setAcademiaId] = useState('');
  const [dataNascimento, setDataNascimento] = useState('2000-01-01');
  const [sexo, setSexo] = useState('MASCULINO');

  // Form Novo Clube
  const [novoClubeNome, setNovoClubeNome] = useState('');
  const [novoClubeSigla, setNovoClubeSigla] = useState('');
  const [novoClubeCidade, setNovoClubeCidade] = useState('');
  const [novoClubeEstado, setNovoClubeEstado] = useState('SP');

  // Queries
  const { data: atletas = ATLETAS_MOCK, isLoading } = useQuery({
    queryKey: ['atletas'],
    queryFn: async () => {
      try {
        return await api.getAtletas();
      } catch {
        return ATLETAS_MOCK;
      }
    },
  });

  const { data: academias = ACADEMIAS_MOCK } = useQuery({
    queryKey: ['academias'],
    queryFn: async () => {
      try {
        return await api.getAcademias();
      } catch {
        return ACADEMIAS_MOCK;
      }
    },
  });

  const mutationCadastrar = useMutation({
    mutationFn: (payload: any) => api.cadastrarAtleta(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atletas'] });
      setModalAberto(false);
      setNome('');
      setRegistro('');
    },
    onError: () => {
      // Fallback local
      const cl = academias.find((a) => a.id === academiaId);
      const novo: AtletaCompleto = {
        id: crypto.randomUUID(),
        academiaId,
        nome,
        registroFederacao: registro,
        dataNascimento,
        sexo,
        nomeAcademia: cl?.nome || 'Clube de Judô',
        siglaAcademia: cl?.sigla || 'JUDO',
      };
      queryClient.setQueryData(['atletas'], (old: AtletaCompleto[] = []) => [novo, ...old]);
      setModalAberto(false);
    },
  });

  const mutationCriarClube = useMutation({
    mutationFn: (payload: { nome: string; sigla: string; cidade?: string; estado?: string }) =>
      api.cadastrarAcademia(payload),
    onSuccess: (novaAcademia) => {
      queryClient.invalidateQueries({ queryKey: ['academias'] });
      setAcademiaId(novaAcademia.id);
      setModalClubeAberto(false);
      setNovoClubeNome('');
      setNovoClubeSigla('');
    },
    onError: () => {
      const nova: Academia = {
        id: crypto.randomUUID(),
        nome: novoClubeNome,
        sigla: novoClubeSigla.toUpperCase(),
        cidade: novoClubeCidade,
        estado: novoClubeEstado,
      };
      queryClient.setQueryData(['academias'], (old: Academia[] = []) => [...old, nova]);
      setAcademiaId(nova.id);
      setModalClubeAberto(false);
    },
  });

  const handleSubmitAtleta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !academiaId) return;

    mutationCadastrar.mutate({
      academiaId,
      nome,
      registroFederacao: registro,
      dataNascimento,
      sexo,
    });
  };

  const handleSubmitClube = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoClubeNome || !novoClubeSigla) return;
    mutationCriarClube.mutate({
      nome: novoClubeNome,
      sigla: novoClubeSigla,
      cidade: novoClubeCidade,
      estado: novoClubeEstado,
    });
  };

  const atletasFiltrados = atletas.filter(
    (a) =>
      a.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (a.registroFederacao && a.registroFederacao.toLowerCase().includes(busca.toLowerCase())) ||
      (a.nomeAcademia && a.nomeAcademia.toLowerCase().includes(busca.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800/40">
            Módulo de Atletas & Agremiações
          </span>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mt-2 flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            Cadastro de Lutadores
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Cadastre os atletas de Judô e vincule-os ao clube de origem. A inscrição no campeonato e categoria é realizada no módulo de Pesagem.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setModalClubeAberto(true)}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm"
          >
            <Building2 className="w-4 h-4 text-emerald-500" />
            <span>Novo Clube</span>
          </button>

          <button
            onClick={() => {
              if (academias.length > 0 && !academiaId) {
                setAcademiaId(academias[0].id);
              }
              setModalAberto(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-3 rounded-xl shadow-lg shadow-blue-600/30 transition-all text-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>Cadastrar Lutador</span>
          </button>
        </div>
      </div>

      {/* Busca & Tabela */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome do judoca, registro CBJ ou agremiação..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm"
          />
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">Lutador / Judoca</th>
                  <th className="px-5 py-4">Clube / Academia</th>
                  <th className="px-4 py-4">Sexo</th>
                  <th className="px-4 py-4">Nascimento</th>
                  <th className="px-4 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                      Carregando judocas...
                    </td>
                  </tr>
                )}
                {atletasFiltrados.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-white text-base">
                        {a.nome}
                      </div>
                      <div className="text-xs text-slate-500">
                        {a.registroFederacao || 'Sem registro oficial'}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {a.nomeAcademia || 'Clube'}
                      </div>
                      <div className="text-xs text-blue-600 dark:text-blue-400 font-bold">
                        {a.siglaAcademia}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs font-bold text-slate-600 dark:text-slate-300">
                      {a.sexo}
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                      {a.dataNascimento ? a.dataNascimento.substring(0, 10) : '—'}
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Homologado
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal: Cadastro de Lutador */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-6 h-6 text-blue-600" />
                Cadastrar Novo Lutador
              </h3>
              <button
                onClick={() => setModalAberto(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitAtleta} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Nome Completo do Atleta
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: Mayra Aguiar"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Registro CBJ / FPJ
                  </label>
                  <input
                    type="text"
                    placeholder="ex: CBJ-99120"
                    value={registro}
                    onChange={(e) => setRegistro(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Sexo
                  </label>
                  <select
                    value={sexo}
                    onChange={(e) => setSexo(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="MASCULINO">Masculino</option>
                    <option value="FEMININO">Feminino</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Clube / Agremiação de Origem
                </label>
                <select
                  required
                  value={academiaId}
                  onChange={(e) => setAcademiaId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Selecione o Clube...</option>
                  {academias.map((ac) => (
                    <option key={ac.id} value={ac.id}>
                      {ac.nome} ({ac.sigla}) - {ac.estado}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Data de Nascimento
                </label>
                <input
                  type="date"
                  required
                  value={dataNascimento}
                  onChange={(e) => setDataNascimento(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
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
                  disabled={mutationCadastrar.isPending}
                  className="w-1/2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{mutationCadastrar.isPending ? 'Salvando...' : 'Confirmar'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Cadastro de Novo Clube */}
      {modalClubeAberto && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-500" />
                Cadastrar Agremiação / Clube
              </h3>
              <button
                onClick={() => setModalClubeAberto(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitClube} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Nome do Clube / Academia
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: Associação de Judô Bushido"
                  value={novoClubeNome}
                  onChange={(e) => setNovoClubeNome(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Sigla (3 a 5 letras)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    placeholder="ex: AJB"
                    value={novoClubeSigla}
                    onChange={(e) => setNovoClubeSigla(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white uppercase focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                    UF (Estado)
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    placeholder="ex: SP"
                    value={novoClubeEstado}
                    onChange={(e) => setNovoClubeEstado(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white uppercase focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Cidade
                </label>
                <input
                  type="text"
                  placeholder="ex: Santos"
                  value={novoClubeCidade}
                  onChange={(e) => setNovoClubeCidade(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalClubeAberto(false)}
                  className="w-1/2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={mutationCriarClube.isPending}
                  className="w-1/2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
                >
                  <Building2 className="w-4 h-4" />
                  <span>{mutationCriarClube.isPending ? 'Salvando...' : 'Salvar Clube'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
