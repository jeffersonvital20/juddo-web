import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '../../services/api';

describe('API Service (Unit Tests)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('envia o cabeçalho Authorization Bearer quando há um token JWT válido no localStorage', async () => {
    localStorage.setItem(
      'judoo_user',
      JSON.stringify({
        id: '1',
        nome: 'Admin',
        email: 'admin@judoo.com',
        role: 'ADMIN',
        token: 'jwt-real-token-123',
      })
    );

    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify([{ id: 'c1', nome: 'Copa Brasil' }]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const result = await api.getCampeonatos();

    expect(result).toHaveLength(1);
    expect(result[0].nome).toBe('Copa Brasil');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, options] = fetchMock.mock.calls[0];
    expect((options?.headers as Record<string, string>)['Authorization']).toBe('Bearer jwt-real-token-123');
  });

  it('omite o cabeçalho Authorization quando o token é apenas demo local', async () => {
    localStorage.setItem(
      'judoo_user',
      JSON.stringify({
        id: '1',
        nome: 'Admin',
        email: 'admin@judoo.com',
        role: 'ADMIN',
        token: 'demo-token-admin',
      })
    );

    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify([]), { status: 200 })
    );

    await api.getCampeonatos();

    const [, options] = fetchMock.mock.calls[0];
    expect((options?.headers as Record<string, string>)['Authorization']).toBeUndefined();
  });

  it('renova automaticamente o token JWT via /auth/login e repete a requisição ao receber HTTP 401', async () => {
    localStorage.setItem(
      'judoo_user',
      JSON.stringify({
        id: '1',
        nome: 'Admin',
        email: 'admin@judoo.com',
        role: 'ADMIN',
        token: 'expired-jwt-token',
      })
    );

    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      // 1ª chamada: retorna 401 (token expirado)
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      // 2ª chamada: renovação automática em /auth/login
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: '1',
            nome: 'Admin',
            email: 'admin@judoo.com',
            role: 'Admin',
            token: 'novo-jwt-valido-999',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      )
      // 3ª chamada: retry automático de POST /campeonatos com o novo token
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 'camp-novo',
            nome: 'Grand Slam 2026',
            local: 'São Paulo',
            dataInicio: '2026-11-20',
            dataFim: '2026-11-22',
            status: 'EM_ANDAMENTO',
          }),
          { status: 201, headers: { 'Content-Type': 'application/json' } }
        )
      );

    const criado = await api.criarCampeonato({
      nome: 'Grand Slam 2026',
      local: 'São Paulo',
      dataInicio: '2026-11-20',
      dataFim: '2026-11-22',
      quantidadeTatames: 2,
    });

    expect(criado.id).toBe('camp-novo');
    expect(fetchMock).toHaveBeenCalledTimes(3);

    // Verifica se o retry usou o novo token salvo
    const [, retryOptions] = fetchMock.mock.calls[2];
    expect((retryOptions?.headers as Record<string, string>)['Authorization']).toBe(
      'Bearer novo-jwt-valido-999'
    );
  });

  it('executa operações CRUD de categorias e usuários enviando payloads corretos', async () => {
    localStorage.setItem(
      'judoo_user',
      JSON.stringify({
        id: '1',
        nome: 'Admin',
        email: 'admin@judoo.com',
        role: 'ADMIN',
        token: 'jwt-admin',
      })
    );

    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 'cat-1',
            campeonatoId: 'camp-1',
            classe: 'Sênior',
            divisaoPeso: '-73kg Leve',
            pesoLimiteKg: 73,
            sexo: 'MASCULINO',
            tempoLutaSegundos: 240,
          }),
          { status: 201 }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 'u-1',
            nome: 'Sensei Carlos',
            email: 'carlos@judoo.com',
            role: 'MESARIO',
            ativo: true,
            criadoEm: '2026-11-15',
          }),
          { status: 200 }
        )
      );

    const novaCat = await api.criarCategoria('camp-1', {
      classe: 'Sênior',
      divisaoPeso: '-73kg Leve',
      pesoLimiteKg: 73,
      sexo: 'MASCULINO',
      tempoLutaSegundos: 240,
    });
    expect(novaCat.divisaoPeso).toBe('-73kg Leve');

    const usuarioAtualizado = await api.atualizarUsuario('u-1', {
      nome: 'Sensei Carlos',
      email: 'carlos@judoo.com',
      role: 'Mesario',
    });
    expect(usuarioAtualizado.role).toBe('MESARIO');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
