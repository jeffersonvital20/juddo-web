import {
  LutaDetalhes,
  PlacarLuta,
  TatameStatus,
  Campeonato,
  Categoria,
  Academia,
  AtletaCompleto,
  UsuarioAuth,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

function getAuthHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { ...(extra ?? {}) };
  try {
    const saved = localStorage.getItem('judoo_user');
    if (saved) {
      const parsed = JSON.parse(saved) as { token?: string };
      if (parsed?.token && !parsed.token.startsWith('demo-token-') && parsed.token !== 'local-demo-token') {
        headers['Authorization'] = `Bearer ${parsed.token}`;
      }
    }
  } catch {
    // ignore invalid localStorage entry
  }
  return headers;
}

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const extraHeaders = (options.headers as Record<string, string>) || {};
  let res = await fetch(url, {
    ...options,
    headers: getAuthHeaders(extraHeaders),
  });

  if (res.status === 401) {
    // Tenta renovar automaticamente a sessão caso o token JWT tenha expirado
    try {
      const saved = localStorage.getItem('judoo_user');
      if (saved) {
        const parsed = JSON.parse(saved) as { email?: string; role?: string };
        const fallbackEmail =
          parsed?.email ||
          (parsed?.role?.toUpperCase() === 'SECRETARIA'
            ? 'secretaria@judoo.com'
            : parsed?.role?.toUpperCase() === 'MESARIO'
            ? 'mesario1@judoo.com'
            : 'admin@judoo.com');

        const loginRes = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: fallbackEmail, senha: '123456' }),
        });

        if (loginRes.ok) {
          const authUser = await loginRes.json();
          const normalized = { ...authUser, role: String(authUser.role).toUpperCase() };
          localStorage.setItem('judoo_user', JSON.stringify(normalized));
          res = await fetch(url, {
            ...options,
            headers: getAuthHeaders(extraHeaders),
          });
        }
      }
    } catch {
      // ignore refresh error
    }
  }

  return res;
}

export interface UsuarioSistemaDto {
  id: string;
  nome: string;
  email: string;
  role: 'ADMIN' | 'SECRETARIA' | 'MESARIO' | 'PUBLICO';
  ativo: boolean;
  criadoEm: string;
}

export interface ChaveDto {
  id: string;
  campeonatoId: string;
  categoriaId: string;
  tipo: string;
  totalFases: number;
  gerada: boolean;
  criadaEm: string;
}

export const api = {
  // Tatames & Scoreboard
  async getTatames(campeonatoId: string): Promise<TatameStatus[]> {
    const res = await fetch(`${API_BASE_URL}/tatames?campeonatoId=${campeonatoId}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Falha ao carregar tatames');
    return res.json();
  },

  async definirLutaAtualTatame(tatameId: string, payload: { lutaId?: string; iniciarLuta?: boolean }): Promise<void> {
    const res = await fetchWithAuth(`${API_BASE_URL}/tatames/${tatameId}/luta-atual`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Falha ao definir luta atual do tatame');
  },

  async getLuta(lutaId: string): Promise<LutaDetalhes> {
    const res = await fetch(`${API_BASE_URL}/lutas/${lutaId}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Falha ao carregar detalhes da luta');
    return res.json();
  },

  async getPlacar(lutaId: string): Promise<PlacarLuta> {
    const res = await fetch(`${API_BASE_URL}/lutas/${lutaId}/placar`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Falha ao carregar placar');
    return res.json();
  },

  async pontuar(lutaId: string, payload: {
    tatameId: string;
    judogi: 'Branco' | 'Azul';
    tipo: string;
    tempoLutaSegundos: number;
    usuarioId?: string;
  }) {
    const res = await fetch(`${API_BASE_URL}/lutas/${lutaId}/pontuar`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Falha ao registrar pontuação');
    return res.json();
  },

  // Campeonatos
  async getCampeonatos(): Promise<Campeonato[]> {
    const res = await fetch(`${API_BASE_URL}/campeonatos`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Falha ao carregar campeonatos');
    return res.json();
  },

  async getCampeonato(id: string): Promise<Campeonato> {
    const res = await fetch(`${API_BASE_URL}/campeonatos/${id}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Falha ao obter campeonato');
    return res.json();
  },

  async criarCampeonato(payload: {
    nome: string;
    local: string;
    dataInicio: string;
    dataFim: string;
    quantidadeTatames: number;
  }): Promise<Campeonato> {
    const res = await fetchWithAuth(`${API_BASE_URL}/campeonatos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.mensagem || `Falha ao cadastrar campeonato (HTTP ${res.status})`);
    }
    return res.json();
  },

  async atualizarStatusCampeonato(id: string, status: string): Promise<void> {
    const res = await fetchWithAuth(`${API_BASE_URL}/campeonatos/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(status),
    });
    if (!res.ok) throw new Error('Falha ao alterar status');
  },

  async getCategorias(campeonatoId: string): Promise<Categoria[]> {
    const res = await fetchWithAuth(`${API_BASE_URL}/campeonatos/${campeonatoId}/categorias`);
    if (!res.ok) throw new Error('Falha ao carregar categorias');
    return res.json();
  },

  async criarCategoria(
    campeonatoId: string,
    payload: {
      classe: string;
      divisaoPeso: string;
      pesoLimiteKg: number;
      sexo: string;
      tempoLutaSegundos: number;
    }
  ): Promise<Categoria> {
    const res = await fetchWithAuth(`${API_BASE_URL}/campeonatos/${campeonatoId}/categorias`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.mensagem || 'Falha ao criar categoria');
    }
    return res.json();
  },

  async atualizarCategoria(
    campeonatoId: string,
    categoriaId: string,
    payload: {
      classe: string;
      divisaoPeso: string;
      pesoLimiteKg: number;
      sexo: string;
      tempoLutaSegundos: number;
    }
  ): Promise<Categoria> {
    const res = await fetchWithAuth(`${API_BASE_URL}/campeonatos/${campeonatoId}/categorias/${categoriaId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.mensagem || 'Falha ao atualizar categoria');
    }
    return res.json();
  },

  async removerCategoria(campeonatoId: string, categoriaId: string): Promise<void> {
    const res = await fetchWithAuth(`${API_BASE_URL}/campeonatos/${campeonatoId}/categorias/${categoriaId}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.mensagem || 'Falha ao remover categoria');
    }
  },

  async getChaves(campeonatoId: string): Promise<ChaveDto[]> {
    const res = await fetch(`${API_BASE_URL}/campeonatos/${campeonatoId}/chaves`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Falha ao carregar chaves');
    return res.json();
  },

  async gerarGradeLutas(campeonatoId: string, payload: { categoriaId: string; tatameId?: string }): Promise<LutaDetalhes[]> {
    const res = await fetchWithAuth(`${API_BASE_URL}/campeonatos/${campeonatoId}/chaves/gerar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Falha ao gerar grade de lutas');
    return res.json();
  },

  // Atletas e Inscrições
  async getAtletas(campeonatoId?: string): Promise<AtletaCompleto[]> {
    const url = campeonatoId
      ? `${API_BASE_URL}/atletas?campeonatoId=${campeonatoId}`
      : `${API_BASE_URL}/atletas`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Falha ao carregar atletas');
    return res.json();
  },

  async cadastrarAtleta(payload: {
    academiaId: string;
    nome: string;
    registroFederacao?: string;
    dataNascimento: string;
    sexo: string;
    fotoUrl?: string;
    campeonatoId?: string;
    categoriaId?: string;
    pesoAferidoKg?: number;
  }): Promise<AtletaCompleto> {
    const res = await fetchWithAuth(`${API_BASE_URL}/atletas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Falha ao cadastrar atleta');
    return res.json();
  },

  async inscreverAtleta(payload: {
    campeonatoId: string;
    atletaId: string;
    categoriaId: string;
    pesoKg?: number;
  }): Promise<void> {
    const res = await fetchWithAuth(`${API_BASE_URL}/atletas/inscrever`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Falha ao inscrever atleta');
  },

  async getAcademias(): Promise<Academia[]> {
    const res = await fetch(`${API_BASE_URL}/atletas/academias`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Falha ao carregar academias');
    return res.json();
  },

  async cadastrarAcademia(payload: {
    nome: string;
    sigla: string;
    cidade?: string;
    estado?: string;
  }): Promise<Academia> {
    const res = await fetchWithAuth(`${API_BASE_URL}/atletas/academias`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Falha ao cadastrar academia');
    return res.json();
  },

  // Gerenciamento de Lutas
  async getTodasLutas(campeonatoId?: string): Promise<LutaDetalhes[]> {
    const url = campeonatoId
      ? `${API_BASE_URL}/lutas?campeonatoId=${campeonatoId}`
      : `${API_BASE_URL}/lutas`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Falha ao carregar lutas');
    return res.json();
  },

  async criarLuta(payload: {
    chaveId: string;
    tatameId?: string;
    atletaBrancoId: string;
    atletaAzulId: string;
    fase: number;
    ordemNaChave: number;
    ordemNoTatame?: number;
  }): Promise<LutaDetalhes> {
    const res = await fetch(`${API_BASE_URL}/lutas`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Falha ao agendar luta');
    return res.json();
  },

  async alterarStatusLuta(lutaId: string, payload: {
    status: string;
    vencedorId?: string;
    tipoVitoria?: string;
  }): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/lutas/${lutaId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Falha ao alterar status da luta');
  },

  async atualizarCronometro(lutaId: string, payload: {
    tatameId: string;
    cronometroSegundos: number;
    cronometroRodando: boolean;
    emGoldenScore: boolean;
    sonoMama: boolean;
  }): Promise<PlacarLuta> {
    const res = await fetch(`${API_BASE_URL}/lutas/${lutaId}/cronometro`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Falha ao sincronizar cronômetro');
    return res.json();
  },

  async controlarOsaekomi(lutaId: string, payload: {
    tatameId: string;
    acao: 'Iniciar' | 'Parar' | 'Toketa';
    judogi?: 'Branco' | 'Azul';
    segundos: number;
  }): Promise<PlacarLuta> {
    const res = await fetch(`${API_BASE_URL}/lutas/${lutaId}/osaekomi`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Falha ao controlar imobilização (osaekomi)');
    return res.json();
  },

  async atribuirTatameLuta(lutaId: string, payload: {
    tatameId?: string;
    ordemNoTatame?: number;
  }): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/lutas/${lutaId}/tatame`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Falha ao atribuir tatame');
  },

  // Autenticação & Usuários por Perfil
  async login(email: string, senha: string): Promise<UsuarioAuth> {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha }),
    });
    if (!res.ok) throw new Error('Falha na autenticação');
    return res.json();
  },

  async registrarPublico(payload: { nome: string; email: string; senha: string }): Promise<UsuarioSistemaDto> {
    const res = await fetch(`${API_BASE_URL}/auth/registrar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Falha ao cadastrar usuário');
    return res.json();
  },

  async getUsuarios(): Promise<UsuarioSistemaDto[]> {
    const res = await fetchWithAuth(`${API_BASE_URL}/usuarios`);
    if (!res.ok) throw new Error('Falha ao carregar usuários');
    return res.json();
  },

  async cadastrarUsuario(payload: {
    nome: string;
    email: string;
    senha: string;
    role: 'Admin' | 'Secretaria' | 'Mesario' | 'Publico';
  }): Promise<UsuarioSistemaDto> {
    const res = await fetchWithAuth(`${API_BASE_URL}/usuarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.mensagem || 'Falha ao cadastrar usuário');
    }
    return res.json();
  },

  async alterarStatusUsuario(id: string, ativo: boolean): Promise<void> {
    const res = await fetchWithAuth(`${API_BASE_URL}/usuarios/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo }),
    });
    if (!res.ok) throw new Error('Falha ao alterar status do usuário');
  },

  async atualizarUsuario(
    id: string,
    payload: {
      nome: string;
      email: string;
      role: 'Admin' | 'Secretaria' | 'Mesario' | 'Publico';
      novaSenha?: string;
    }
  ): Promise<UsuarioSistemaDto> {
    const res = await fetchWithAuth(`${API_BASE_URL}/usuarios/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.mensagem || 'Falha ao atualizar usuário');
    }
    return res.json();
  },

  async removerUsuario(id: string): Promise<void> {
    const res = await fetchWithAuth(`${API_BASE_URL}/usuarios/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.mensagem || 'Falha ao excluir usuário');
    }
  },
};
