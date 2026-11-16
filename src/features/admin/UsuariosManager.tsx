import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  UserPlus,
  Users,
  ShieldCheck,
  CheckCircle2,
  Ban,
  Pencil,
  Trash2,
  X,
  Search,
  AlertCircle,
} from 'lucide-react';
import { api, UsuarioSistemaDto } from '../../services/api';

type PerfilOption = 'Admin' | 'Secretaria' | 'Mesario' | 'Publico';

function normalizeRoleToOption(role: string): PerfilOption {
  const upper = role.toUpperCase();
  if (upper === 'ADMIN') return 'Admin';
  if (upper === 'SECRETARIA') return 'Secretaria';
  if (upper === 'MESARIO') return 'Mesario';
  return 'Publico';
}

export const UsuariosManager: React.FC = () => {
  const queryClient = useQueryClient();

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [role, setRole] = useState<PerfilOption>('Mesario');
  const [busca, setBusca] = useState('');
  const [filtroRole, setFiltroRole] = useState<string>('TODOS');
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: api.getUsuarios,
    retry: false,
  });

  const limparFormulario = () => {
    setEditandoId(null);
    setNome('');
    setEmail('');
    setSenha('');
    setRole('Mesario');
    setErro(null);
  };

  const iniciarEdicao = (u: UsuarioSistemaDto) => {
    setEditandoId(u.id);
    setNome(u.nome);
    setEmail(u.email);
    setSenha('');
    setRole(normalizeRoleToOption(u.role));
    setErro(null);
  };

  const criarMutation = useMutation({
    mutationFn: api.cadastrarUsuario,
    onSuccess: () => {
      limparFormulario();
      setSucesso('Usuário cadastrado com sucesso!');
      setTimeout(() => setSucesso(null), 4000);
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
    onError: (e: Error) => {
      setErro(e.message || 'Erro ao cadastrar usuário.');
    },
  });

  const atualizarMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: { nome: string; email: string; role: PerfilOption; novaSenha?: string };
    }) => api.atualizarUsuario(id, payload),
    onSuccess: () => {
      limparFormulario();
      setSucesso('Dados do usuário atualizados com sucesso!');
      setTimeout(() => setSucesso(null), 4000);
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
    onError: (e: Error) => {
      setErro(e.message || 'Erro ao atualizar usuário.');
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) => api.alterarStatusUsuario(id, ativo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
  });

  const removerMutation = useMutation({
    mutationFn: (id: string) => api.removerUsuario(id),
    onSuccess: () => {
      setSucesso('Usuário removido com sucesso.');
      setTimeout(() => setSucesso(null), 4000);
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
    onError: (e: Error) => {
      setErro(e.message || 'Erro ao remover usuário.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!nome.trim() || !email.trim()) {
      setErro('Informe o nome completo e o e-mail do usuário.');
      return;
    }

    if (editandoId) {
      if (senha && senha.length < 4) {
        setErro('A nova senha deve ter no mínimo 4 caracteres.');
        return;
      }
      atualizarMutation.mutate({
        id: editandoId,
        payload: {
          nome: nome.trim(),
          email: email.trim(),
          role,
          novaSenha: senha ? senha : undefined,
        },
      });
    } else {
      if (senha.length < 4) {
        setErro('Informe uma senha com no mínimo 4 caracteres.');
        return;
      }
      criarMutation.mutate({ nome: nome.trim(), email: email.trim(), senha, role });
    }
  };

  const usuariosFiltrados = usuarios.filter((u) => {
    const matchRole = filtroRole === 'TODOS' || u.role.toUpperCase() === filtroRole;
    const termo = busca.toLowerCase().trim();
    const matchBusca =
      !termo || u.nome.toLowerCase().includes(termo) || u.email.toLowerCase().includes(termo);
    return matchRole && matchBusca;
  });

  return (
    <div className="space-y-6">
      {sucesso && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{sucesso}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário de Cadastro / Edição por Perfil */}
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm h-fit"
        >
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              {editandoId ? (
                <Pencil className="w-5 h-5 text-amber-500" />
              ) : (
                <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              )}
              <h3 className="font-bold text-slate-900 dark:text-white">
                {editandoId ? 'Editar Usuário' : 'Novo Usuário do Sistema'}
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
              Nome Completo
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Sensei Marcos"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              E-mail de Acesso
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@judoo.com"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              {editandoId ? 'Nova Senha (deixe em branco para manter a atual)' : 'Senha de Acesso'}
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder={editandoId ? '•••••••• (opcional)' : 'Mínimo 4 caracteres'}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Nível de Acesso (Perfil)
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as PerfilOption)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white"
            >
              <option value="Admin">ADMIN — Controle total (usuários, categorias, campeonatos e lutas)</option>
              <option value="Secretaria">SECRETARIA — Cadastro de atletas, pesagem e inscrições</option>
              <option value="Mesario">MESARIO — Operação de placar e cronômetro no tatame</option>
              <option value="Publico">PUBLICO — Consulta de chaves e placar ao vivo</option>
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
              ? 'Salvar Alterações'
              : 'Cadastrar Usuário'}
          </button>
        </form>

        {/* Lista de Usuários */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-bold text-slate-900 dark:text-white">Usuários da Aplicação</h3>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {usuariosFiltrados.length}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar nome ou e-mail..."
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <select
                value={filtroRole}
                onChange={(e) => setFiltroRole(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <option value="TODOS">Todos os Perfis</option>
                <option value="ADMIN">ADMIN</option>
                <option value="SECRETARIA">SECRETARIA</option>
                <option value="MESARIO">MESARIO</option>
                <option value="PUBLICO">PUBLICO</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <p className="text-sm text-slate-400 py-6 text-center">Carregando usuários...</p>
          ) : usuariosFiltrados.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">
              Nenhum usuário encontrado com os filtros informados.
            </p>
          ) : (
            <div className="space-y-2.5">
              {usuariosFiltrados.map((u) => {
                const roleBadgeClass =
                  u.role === 'ADMIN'
                    ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/50'
                    : u.role === 'SECRETARIA'
                    ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50'
                    : u.role === 'MESARIO'
                    ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/50'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';

                return (
                  <div
                    key={u.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border transition-all ${
                      editandoId === u.id
                        ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/20'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white flex flex-wrap items-center gap-2">
                        <span>{u.nome}</span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full border flex items-center gap-1 ${roleBadgeClass}`}
                        >
                          <ShieldCheck className="w-3 h-3" /> {u.role}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{u.email}</div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => iniciarEdicao(u)}
                        title="Editar Usuário"
                        className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                      >
                        <Pencil className="w-3.5 h-3.5 text-amber-500" />
                        <span>Editar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => statusMutation.mutate({ id: u.id, ativo: !u.ativo })}
                        className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                          u.ativo
                            ? 'border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                            : 'border-slate-300 dark:border-slate-700 text-slate-500 bg-slate-100 dark:bg-slate-800'
                        }`}
                      >
                        {u.ativo ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                        <span>{u.ativo ? 'Ativo' : 'Inativo'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Deseja realmente remover o usuário "${u.nome}"?`)) {
                            removerMutation.mutate(u.id);
                          }
                        }}
                        title="Remover Usuário"
                        className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
