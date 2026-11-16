import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

const AuthTestConsumer: React.FC = () => {
  const { user, isAuthenticated, login, loginRapido, logout } = useAuth();

  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'LOGADO' : 'DESLOGADO'}</div>
      <div data-testid="user-name">{user?.nome || 'NENHUM'}</div>
      <div data-testid="user-role">{user?.role || 'SEM_ROLE'}</div>
      <button onClick={() => login('secretaria@judoo.com', '123456')}>Login Secretaria</button>
      <button onClick={() => loginRapido('ADMIN')}>Quick Admin</button>
      <button onClick={logout}>Sair</button>
    </div>
  );
};

describe('AuthContext (Unit Tests)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('inicia deslogado quando não há sessão salva no localStorage', () => {
    render(
      <AuthProvider>
        <AuthTestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('auth-status')).toHaveTextContent('DESLOGADO');
    expect(screen.getByTestId('user-role')).toHaveTextContent('SEM_ROLE');
  });

  it('realiza login via API, normaliza o perfil para maiúsculas e salva no localStorage', async () => {
    const user = userEvent.setup();
    vi.spyOn(api, 'login').mockResolvedValue({
      id: 'u-sec',
      nome: 'Secretaria Oficial',
      email: 'secretaria@judoo.com',
      role: 'SECRETARIA',
      token: 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTl9.sig',
    });

    render(
      <AuthProvider>
        <AuthTestConsumer />
      </AuthProvider>
    );

    await user.click(screen.getByText('Login Secretaria'));

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('LOGADO');
      expect(screen.getByTestId('user-name')).toHaveTextContent('Secretaria Oficial');
      expect(screen.getByTestId('user-role')).toHaveTextContent('SECRETARIA');
    });

    const saved = JSON.parse(localStorage.getItem('judoo_user') || '{}');
    expect(saved.email).toBe('secretaria@judoo.com');
    expect(saved.role).toBe('SECRETARIA');
  });

  it('permite login rápido por perfil e encerra a sessão com logout', async () => {
    const user = userEvent.setup();
    vi.spyOn(api, 'login').mockResolvedValue({
      id: 'u-adm',
      nome: 'Coordenador Geral (Admin)',
      email: 'admin@judoo.com',
      role: 'ADMIN',
      token: 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTl9.sig',
    });

    render(
      <AuthProvider>
        <AuthTestConsumer />
      </AuthProvider>
    );

    await user.click(screen.getByText('Quick Admin'));

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('LOGADO');
      expect(screen.getByTestId('user-role')).toHaveTextContent('ADMIN');
    });

    await user.click(screen.getByText('Sair'));

    expect(screen.getByTestId('auth-status')).toHaveTextContent('DESLOGADO');
    expect(localStorage.getItem('judoo_user')).toBeNull();
  });
});
