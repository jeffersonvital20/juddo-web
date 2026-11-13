import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { HomeLandingPage } from './features/home/HomeLandingPage';
import { AdminDashboard } from './features/admin/AdminDashboard';
import { CampeonatosModule } from './features/campeonatos/CampeonatosModule';
import { AtletasModule } from './features/atletas/AtletasModule';
import { PesagemModule } from './features/secretaria/PesagemModule';
import { ChavesBracketView } from './features/admin/ChavesBracketView';
import { TelaoArenaView } from './features/telao/TelaoArenaView';
import { useTheme } from './context/ThemeContext';
import { useAuth } from './context/AuthContext';
import {
  LayoutDashboard,
  Scale,
  GitBranch,
  Tv,
  Swords,
  Trophy,
  Users,
  Sun,
  Moon,
  LogOut,
  LogIn,
  Home,
} from 'lucide-react';

export const App: React.FC = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const isTelao = location.pathname.startsWith('/telao');

  // Se estiver no telão da arena, não renderiza a barra de navegação administrativa
  if (isTelao) {
    return (
      <Routes>
        <Route path="/telao" element={<TelaoArenaView />} />
      </Routes>
    );
  }

  const navLinks = [
    { to: '/', label: 'Início', icon: Home, exact: true },
    { to: '/admin', label: 'Painel Geral', icon: LayoutDashboard },
    { to: '/campeonatos', label: 'Campeonatos', icon: Trophy },
    { to: '/atletas', label: 'Lutadores', icon: Users },
    { to: '/pesagem', label: 'Pesagem', icon: Scale },
    { to: '/chaves', label: 'Chaves', icon: GitBranch },
  ];

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Top Navigation Bar */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 shadow-sm dark:shadow-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="bg-blue-600 group-hover:bg-blue-500 p-2 rounded-xl text-white shadow-lg shadow-blue-600/30 transition-all">
                <Swords className="w-5 h-5" />
              </div>
              <div className="flex items-center">
                <span className="text-xl font-black text-slate-900 dark:text-white tracking-wider">
                  JUDOO
                </span>
                <span className="ml-2 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800/40">
                  FIJ 2026
                </span>
                {import.meta.env.VITE_APP_ENV === 'staging' && (
                  <span
                    title="Ambiente de Homologação / Staging"
                    className="ml-2 text-[10px] font-black uppercase text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-700/60 flex items-center gap-1 shadow-sm"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                    Homologação
                  </span>
                )}
                {import.meta.env.VITE_APP_ENV === 'development' && (
                  <span
                    title="Ambiente de Desenvolvimento Local"
                    className="ml-2 text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-700/60 flex items-center gap-1"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Dev
                  </span>
                )}
              </div>
            </Link>

            {/* Links de Navegação Principal */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = link.exact
                  ? location.pathname === link.to
                  : location.pathname.startsWith(link.to);

                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}

              <Link
                to="/telao"
                target="_blank"
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-all border border-emerald-200 dark:border-emerald-800/40 ml-1"
              >
                <Tv className="w-4 h-4" />
                <span>Telão Arena</span>
              </Link>
            </nav>

            {/* Ações da Direita: Tema Claro/Escuro & Usuário */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Botão de Alternância de Tema */}
              <button
                type="button"
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-700 transition-all"
                aria-label="Alternar Tema"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-45" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-700 transition-transform hover:-rotate-12" />
                )}
              </button>

              {/* Informações do Usuário ou Login */}
              {user ? (
                <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                  <div className="hidden sm:block text-right">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[130px]">
                      {user.nome.split(' ')[0]}
                    </div>
                    <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800/40">
                      {user.role}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    title="Encerrar Sessão"
                    className="p-2 rounded-xl text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <a
                  href="/#login-section"
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-md shadow-blue-600/30 transition-all"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Entrar</span>
                </a>
              )}
            </div>
          </div>

          {/* Submenu Mobile */}
          <div className="flex lg:hidden overflow-x-auto py-2 gap-1 border-t border-slate-100 dark:border-slate-800 scrollbar-none">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = link.exact
                ? location.pathname === link.to
                : location.pathname.startsWith(link.to);

              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
            <Link
              to="/telao"
              target="_blank"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Telão</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<HomeLandingPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/campeonatos" element={<CampeonatosModule />} />
          <Route path="/atletas" element={<AtletasModule />} />
          <Route path="/pesagem" element={<PesagemModule />} />
          <Route path="/chaves" element={<ChavesBracketView />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 py-5 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-semibold">
            <Swords className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Judoo Enterprise • Sistema de Gestão de Torneios de Judô em Tempo Real</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Regulamento Oficial da Federação Internacional de Judô (FIJ 2026)
          </div>
        </div>
      </footer>
    </div>
  );
};
