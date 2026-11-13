import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Users, ShieldCheck, CheckCircle2, Ban } from 'lucide-react';
import { api } from '../../services/api';

type PerfilOption = 'Admin' | 'Secretaria' | 'Mesario' | 'Publico';

export const UsuariosManager: React.FC = () => {
  const queryClient = useQueryClient();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [role, setRole] = useState<PerfilOption>('Mesario');
  const [erro, setErro] = useState<string | null>(null);

  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: api.getUsuarios,
    retry: false,
  });

  const criarMutation = useMutation({
    mutationFn: api.cadastrarUsuario,
    onSuccess: () => {
      setNome('');
      setEmail('');
      setSenha('');
      setErro(null);
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
    onError: (e: Error) => {
      setErro(e.message || 'Erro ao cadastrar usuário. Verifique se está autenticado como Admin.');
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) => api.alterarStatusUsuario(id, ativo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim() || senha.length < 4) {
      setErro('Preencha nome, e-mail e senha com no mínimo 4 caracteres.');
      return;
    }
    criarMutation.mutate({ nome, email, senha, role });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Formulário de Cadastro por Perfil */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm"
      >
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-bold text-slate-900 dark:text-white">Novo Usuário por Perfil</h3>
        </div>

        {erro && (
          <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl p-3">
            {erro}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Nome Completo</label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Sensei Marcos"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">E-mail de Acesso</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="usuario@judoo.com"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Senha</label>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Mínimo 4 caracteres"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Perfil de Permissão</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as PerfilOption)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white"
          >
            <option value="Admin">ADMIN — Controle total (campeonatos, usuários, grade e lutas)</option>
            <option value="Secretaria">SECRETARIA — Cadastro de atletas, inscrições e grade</option>
            <option value="Mesario">MESARIO — Operação do placar e cronômetro no tatame</option>
            <option value="Publico">PUBLICO — Consulta de chaves e placar ao vivo</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={criarMutation.isPending}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition-all"
        >
          {criarMutation.isPending ? 'Cadastrando...' : 'Cadastrar Usuário'}
        </button>
      </form>

      {/* Lista de Usuários */}
      <div className="lg:col-span-2 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-slate-900 dark:text-white">Usuários Cadastrados</h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">{usuarios.length} registros</span>
        </div>

        {isLoading ? (
          <p className="text-sm text-slate-400">Carregando usuários...</p>
        ) : usuarios.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhum usuário listado (autentique-se como Admin via API para visualizar).</p>
        ) : (
          <div className="space-y-2">
            {usuarios.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60"
              >
                <div>
                  <div className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{u.nome}</span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> {u.role}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{u.email}</div>
                </div>

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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
