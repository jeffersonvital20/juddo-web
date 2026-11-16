import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Trophy,
  Tv,
  Monitor,
  Lock,
  ArrowRight,
  ShieldCheck,
  Zap,
  UserCheck,
  LogIn,
  LogOut,
  Scale,
  GitBranch,
  Swords,
  Download,
} from 'lucide-react';

export const HomeLandingPage: React.FC = () => {
  const { user, login, loginRapido, logout } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const getDefaultRouteForRole = (role?: string) => {
    const r = role?.toUpperCase();
    if (r === 'SECRETARIA') return '/pesagem';
    if (r === 'PUBLICO') return '/chaves';
    return '/admin';
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErro('Por favor, informe seu e-mail.');
      return;
    }
    setCarregando(true);
    setErro('');
    try {
      const loggedUser = await login(email, senha);
      navigate(getDefaultRouteForRole(loggedUser.role));
    } catch {
      setErro('Erro ao realizar login.');
    } finally {
      setCarregando(false);
    }
  };

  const handleQuickLogin = (role: 'ADMIN' | 'SECRETARIA' | 'MESARIO' | 'PUBLICO') => {
    loginRapido(role);
    navigate(getDefaultRouteForRole(role));
  };

  return (
    <div className="space-y-16 py-4">
      {/* ========================================================================= */}
      {/* HERO SECTION & SOBRE O SISTEMA */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900/40 via-slate-900 to-slate-950 border border-slate-200 dark:border-slate-800 p-8 sm:p-12 shadow-2xl">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 dark:bg-blue-950/80 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-widest shadow-sm">
            <Zap className="w-3.5 h-3.5" />
            Sobre o Sistema • Regulamento Oficial FIJ 2026
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
            Judoo — Gestão de Campeonatos de Judô em{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-400">
              Tempo Real
            </span>
          </h1>

          <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg max-w-3xl mx-auto leading-relaxed">
            O <strong>Judoo</strong> é uma plataforma completa para organização, operação e transmissão de torneios de Judô seguindo as regras da Federação Internacional de Judô (FIJ). Do credenciamento e pesagem oficial dos atletas até o sorteio de chaves, controle de súmula nos tatames e exibição ao vivo no telão da arena, todas as etapas funcionam integradas e sincronizadas em tempo real.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            {!user ? (
              <a
                href="#login-section"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3.5 rounded-xl shadow-lg shadow-blue-600/30 transition-all text-sm"
              >
                <LogIn className="w-4 h-4" />
                <span>Fazer Login para Acessar os Módulos</span>
              </a>
            ) : (
              <button
                onClick={() => navigate(getDefaultRouteForRole(user.role))}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3.5 rounded-xl shadow-lg shadow-blue-600/30 transition-all text-sm"
              >
                <span>Acessar Meu Painel ({user.role})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <a
              href="#como-funciona"
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-bold px-6 py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 transition-all text-sm"
            >
              <span>Conhecer Funcionalidades</span>
            </a>

            <a
              href="/downloads/judoo-desktop-windows-x64.zip"
              download="judoo-desktop-windows-x64.zip"
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-3.5 rounded-xl shadow-lg shadow-amber-500/20 transition-all text-sm"
              title="Baixar aplicativo para a Mesa do Mesário (Windows x64)"
            >
              <Download className="w-4 h-4" />
              <span>Baixar App Desktop (Mesa)</span>
            </a>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* O QUE O SISTEMA FAZ (FLUXO DO CAMPEONATO) */}
      {/* ========================================================================= */}
      <section id="como-funciona" className="space-y-8 scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Como Funciona
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            Tudo o que seu Torneio Precisa em um Único Lugar
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
            O acesso aos módulos do menu é liberado automaticamente de acordo com o nível de permissão do seu perfil após o login.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Etapa 1 */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-lg space-y-3">
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              1. Eventos & Inscrições
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
              Cadastro de campeonatos, academias/clubes filiados e inscrição de judocas nas categorias de idade e divisões de peso oficiais.
            </p>
          </div>

          {/* Etapa 2 */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-lg space-y-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              2. Pesagem Oficial
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
              Aferição rápida na balança pela Secretaria, validando automaticamente se o atleta está dentro do limite de peso da sua categoria.
            </p>
          </div>

          {/* Etapa 3 */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-lg space-y-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <GitBranch className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              3. Chaves & Brackets
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
              Geração automática das chaves eliminatórias com distribuição dos confrontos por fases (Oitavas, Quartas, Semifinal e Final) e alocação nos tatames.
            </p>
          </div>

          {/* Etapa 4 */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-lg space-y-3">
            <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Swords className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              4. Placar & Telão Ao Vivo
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
              Controle em tempo real de Ippon, Waza-ari, Shido, Osaekomi (imobilização) e Golden Score, refletindo instantaneamente nos telões da arena.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3 PILARES DO ECOSSISTEMA MULTI-REPO */}
      {/* ========================================================================= */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Três Aplicações Integradas para seu Evento
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Cada perfil tem uma ferramenta especializada desenhada para máxima eficiência operacional.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: judoo-web (Gestão e Secretaria) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">judoo-web (Administração)</h3>
              <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                Painel central para cadastro de campeonatos, categorias de peso oficiais, inscrição de atletas, módulo de pesagem rápida da Secretaria e geração de chaves eliminatórias.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <span>React 18 • Vite • Tailwind • TanStack Query</span>
            </div>
          </div>

          {/* Card 2: Telão da Arena */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Tv className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Telão Oficial da Arena</h3>
              <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                Transmissão em alta resolução para telões e streaming. Layout cinematográfico Shiro (Branco) vs Ao (Azul), cronômetro principal, barra animada de Osaekomi e cartões de Shido da FIJ.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span>WebSockets SignalR • Baixa Latência</span>
            </div>
          </div>

          {/* Card 3: judoo-desktop (Tauri Mesa do Mesário) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Monitor className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">judoo-desktop (Mesa do Tatame)</h3>
              <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                App Desktop nativo em Tauri para a mesa do mesário com atalhos de teclado ergonômicos (Espaço, O, P, Toketa, Sono-Mama), sem risco de travamento de navegador.
              </p>
            </div>
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center justify-between">
                <span>Rust • Tauri v2 • Zustand</span>
                <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded font-mono font-bold">v1.0.0</span>
              </div>
              <a
                href="/downloads/judoo-desktop-windows-x64.zip"
                download="judoo-desktop-windows-x64.zip"
                className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow transition-all text-xs"
              >
                <Download className="w-4 h-4" />
                <span>Baixar para Windows (x64)</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* ÁREA DE LOGIN E ACESSO RÁPIDO */}
      {/* ========================================================================= */}
      <section id="login-section" className="scroll-mt-24">
        <div className="bg-white dark:bg-slate-900 border-2 border-blue-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Lado Esquerdo: Formulário de Autenticação */}
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-950 px-3 py-1 rounded-full border border-blue-500/20">
                  Portal de Acesso
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
                  Entrar no Judoo
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                  Faça login com seu perfil para gerenciar campeonatos, inscrever atletas ou operar a mesa.
                </p>
              </div>

              {user ? (
                <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{user.nome}</div>
                      <div className="text-xs text-slate-500">{user.email}</div>
                    </div>
                    <span className="ml-auto text-xs font-black uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-md border border-blue-500/20">
                      {user.role}
                    </span>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => navigate(getDefaultRouteForRole(user.role))}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow"
                    >
                      <span>Ir para o Painel</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={logout}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold flex items-center gap-1.5"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sair</span>
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleLogin} className="space-y-4">
                  {erro && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold">
                      {erro}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                      E-mail Institucional
                    </label>
                    <input
                      type="email"
                      placeholder="ex: admin@judoo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                      Senha de Acesso
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={carregando}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{carregando ? 'Autenticando...' : 'Entrar no Sistema'}</span>
                  </button>
                </form>
              )}
            </div>

            {/* Lado Direito: Acesso Rápido de 1 Clique (Perfis de Demonstração) */}
            <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Acesso Rápido por Perfil (1 Clique)
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Selecione abaixo para testar instantaneamente os módulos correspondentes com as permissões da Federação:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* Admin */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('ADMIN')}
                  className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 rounded-xl text-left transition-all group shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase">ADMIN</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-transform group-hover:translate-x-1" />
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">Coordenador Geral</div>
                  <div className="text-[11px] text-slate-500">Gestão de campeonatos, tatames e chaves</div>
                </button>

                {/* Secretaria */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('SECRETARIA')}
                  className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 rounded-xl text-left transition-all group shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase">SECRETARIA</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 transition-transform group-hover:translate-x-1" />
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">Pesagem & Atletas</div>
                  <div className="text-[11px] text-slate-500">Inscrições e aferição de balança oficial</div>
                </button>

                {/* Mesário */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('MESARIO')}
                  className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500 rounded-xl text-left transition-all group shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase">MESÁRIO</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-500 transition-transform group-hover:translate-x-1" />
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">Mesa do Tatame</div>
                  <div className="text-[11px] text-slate-500">Controle de lutas e cronômetro</div>
                </button>

                {/* Público */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('PUBLICO')}
                  className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500 rounded-xl text-left transition-all group shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-purple-600 dark:text-purple-400 uppercase">PÚBLICO</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-500 transition-transform group-hover:translate-x-1" />
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">Arena & Telão</div>
                  <div className="text-[11px] text-slate-500">Visualização de chaves e transmissão</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
