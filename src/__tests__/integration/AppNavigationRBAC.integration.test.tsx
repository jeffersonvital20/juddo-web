import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from '../../App';
import { ThemeProvider } from '../../context/ThemeContext';
import { AuthProvider } from '../../context/AuthContext';
import { api } from '../../services/api';

function renderAppWithRoute(initialRoute = '/') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={[initialRoute]}>
            <App />
          </MemoryRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

describe('App Navigation & RBAC (Integration Tests)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.spyOn(api, 'getCampeonatos').mockResolvedValue([]);
    vi.spyOn(api, 'getUsuarios').mockResolvedValue([]);
    vi.spyOn(api, 'getCategorias').mockResolvedValue([]);
  });

  it('quando deslogado, não exibe itens de menu e apresenta a explicação sobre o sistema', () => {
    renderAppWithRoute('/');

    // Não deve exibir os links de módulos no menu superior
    expect(screen.queryByText('Painel Geral')).not.toBeInTheDocument();
    expect(screen.queryByText('Campeonatos')).not.toBeInTheDocument();
    expect(screen.queryByText('Pesagem')).not.toBeInTheDocument();
    expect(screen.queryByText('Configurações')).not.toBeInTheDocument();

    // Deve exibir a seção explicativa Sobre o Sistema
    expect(screen.getByText(/Sobre o Sistema/i)).toBeInTheDocument();
    expect(
      screen.getByText(/plataforma completa para organização, operação e transmissão de torneios de Judô/i)
    ).toBeInTheDocument();
  });

  it('exibe apenas os itens permitidos para o perfil SECRETARIA e oculta Configurações (exclusivo Admin)', () => {
    localStorage.setItem(
      'judoo_user',
      JSON.stringify({
        id: 'sec-1',
        nome: 'Maria Secretaria',
        email: 'secretaria@judoo.com',
        role: 'SECRETARIA',
        token: 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTl9.sig',
      })
    );

    renderAppWithRoute('/');

    expect(screen.getAllByText('Campeonatos').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Lutadores').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Pesagem').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Chaves').length).toBeGreaterThan(0);

    // Não pode mostrar Painel Geral nem Configurações
    expect(screen.queryByText('Painel Geral')).not.toBeInTheDocument();
    expect(screen.queryByText('Configurações')).not.toBeInTheDocument();
  });

  it('libera o item Configurações exclusivamente para ADMIN e renderiza o gerenciamento de usuários e categorias', async () => {
    localStorage.setItem(
      'judoo_user',
      JSON.stringify({
        id: 'adm-1',
        nome: 'Admin Geral',
        email: 'admin@judoo.com',
        role: 'ADMIN',
        token: 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTl9.sig',
      })
    );

    renderAppWithRoute('/configuracoes');

    expect(screen.getAllByText('Configurações').length).toBeGreaterThan(0);

    await waitFor(() => {
      expect(screen.getByText('Administração & Configurações')).toBeInTheDocument();
      expect(screen.getByText('Novo Usuário do Sistema')).toBeInTheDocument();
    });
  });
});
