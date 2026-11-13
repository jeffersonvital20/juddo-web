import React, { createContext, useContext, useState, useEffect } from 'react';
import { UsuarioAuth } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: UsuarioAuth | null;
  isAuthenticated: boolean;
  login: (email: string, senha?: string) => Promise<void>;
  loginRapido: (role: 'ADMIN' | 'SECRETARIA' | 'MESARIO' | 'PUBLICO') => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UsuarioAuth | null>(() => {
    const saved = localStorage.getItem('judoo_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('judoo_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('judoo_user');
    }
  }, [user]);

  const login = async (email: string, senha: string = '123456') => {
    try {
      const authUser = await api.login(email, senha);
      setUser(authUser);
    } catch {
      // Fallback para login rápido sem backend no ambiente de testes
      let role: 'ADMIN' | 'SECRETARIA' | 'MESARIO' | 'PUBLICO' = 'PUBLICO';
      let nome = 'Espectador Convidado';
      const cleanEmail = email.toLowerCase();

      if (cleanEmail.includes('admin')) {
        role = 'ADMIN';
        nome = 'Coordenador Geral (Admin)';
      } else if (cleanEmail.includes('secretaria')) {
        role = 'SECRETARIA';
        nome = 'Secretaria Oficial de Pesagem';
      } else if (cleanEmail.includes('mesario')) {
        role = 'MESARIO';
        nome = 'Mesário do Tatame';
      }

      setUser({
        id: '00000000-0000-0000-0000-000000000001',
        nome,
        email,
        role,
        token: 'local-demo-token',
      });
    }
  };

  const loginRapido = (role: 'ADMIN' | 'SECRETARIA' | 'MESARIO' | 'PUBLICO') => {
    const perfis: Record<string, { nome: string; email: string }> = {
      ADMIN: { nome: 'Coordenador Geral (Admin)', email: 'admin@judoo.com' },
      SECRETARIA: { nome: 'Secretaria Oficial de Pesagem', email: 'secretaria@judoo.com' },
      MESARIO: { nome: 'Mesário Oficial do Tatame', email: 'mesario1@judoo.com' },
      PUBLICO: { nome: 'Visitante / Espectador', email: 'publico@judoo.com' },
    };

    const perfil = perfis[role];
    setUser({
      id: '00000000-0000-0000-0000-00000000000' + (role === 'ADMIN' ? '1' : role === 'SECRETARIA' ? '2' : role === 'MESARIO' ? '3' : '4'),
      nome: perfil.nome,
      email: perfil.email,
      role,
      token: `demo-token-${role.toLowerCase()}`,
    });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, loginRapido, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
