import React, { useState } from 'react';
import { ShieldCheck, Users, Scale } from 'lucide-react';
import { UsuariosManager } from './UsuariosManager';
import { CategoriasManager } from './CategoriasManager';

export const ConfiguracoesAdminModule: React.FC = () => {
  const [abaAtiva, setAbaAtiva] = useState<'usuarios' | 'categorias'>('usuarios');

  return (
    <div className="space-y-8">
      {/* Cabeçalho do Módulo exclusivo do Admin */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-3 py-1 rounded-full border border-purple-200 dark:border-purple-800/40">
            <ShieldCheck className="w-3.5 h-3.5" />
            Acesso Exclusivo do Administrador
          </span>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mt-2">
            Administração & Configurações
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Gerencie as contas de acesso dos usuários por perfil e configure as categorias de peso e classes dos lutadores.
          </p>
        </div>

        {/* Seletor de Abas */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <button
            type="button"
            onClick={() => setAbaAtiva('usuarios')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              abaAtiva === 'usuarios'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Usuários da Aplicação</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva('categorias')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              abaAtiva === 'categorias'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Categorias dos Lutadores</span>
          </button>
        </div>
      </div>

      {/* Conteúdo da Aba Selecionada */}
      {abaAtiva === 'usuarios' ? <UsuariosManager /> : <CategoriasManager />}
    </div>
  );
};
