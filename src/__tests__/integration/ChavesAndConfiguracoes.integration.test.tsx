import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChavesBracketView } from '../../features/admin/ChavesBracketView';
import { ConfiguracoesAdminModule } from '../../features/admin/ConfiguracoesAdminModule';
import { AuthProvider } from '../../context/AuthContext';
import { api } from '../../services/api';

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{ui}</AuthProvider>
    </QueryClientProvider>
  );
}

describe('Chaves (Formato Copa + Yuko) & Configurações Admin (Integration Tests)', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(
      'judoo_user',
      JSON.stringify({
        id: 'adm-1',
        nome: 'Coordenador Admin',
        email: 'admin@judoo.com',
        role: 'ADMIN',
        token: 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTl9.sig',
      })
    );
    vi.restoreAllMocks();
  });

  it('exibe as fases da Copa (Semifinais até Grande Final), pontuação Yuko e avanço do vencedor para a próxima fase', async () => {
    vi.spyOn(api, 'getCampeonatos').mockResolvedValue([
      {
        id: 'camp-1',
        nome: 'Copa Nacional 2026',
        local: 'São Paulo',
        dataInicio: '2026-11-15',
        dataFim: '2026-11-16',
        status: 'EM_ANDAMENTO',
      },
    ]);

    vi.spyOn(api, 'getCategorias').mockResolvedValue([
      {
        id: 'cat-73',
        campeonatoId: 'camp-1',
        classe: 'Sênior',
        divisaoPeso: '-73kg Leve',
        pesoLimiteKg: 73,
        sexo: 'MASCULINO',
        tempoLutaSegundos: 240,
      },
    ]);

    vi.spyOn(api, 'getTatames').mockResolvedValue([
      { id: 'tat-1', numero: 1, nome: 'Shiai-Jo A', status: 'Disponivel' },
    ]);

    vi.spyOn(api, 'getChaves').mockResolvedValue([
      {
        id: 'chave-73',
        campeonatoId: 'camp-1',
        categoriaId: 'cat-73',
        tipo: 'ELIMINATORIA_SIMPLES',
        totalFases: 2,
        gerada: true,
        criadaEm: '2026-11-15',
      },
    ]);

    vi.spyOn(api, 'getTodasLutas').mockResolvedValue([
      // Semifinal 1 (Finalizada -> Gabriel venceu por Yuko e avançou para a Final)
      {
        id: 'luta-semi-1',
        chaveId: 'chave-73',
        tatameId: 'tat-1',
        atletaBranco: { id: 'a1', nome: 'Gabriel Santos', siglaAcademia: 'ECP' },
        atletaAzul: { id: 'a2', nome: 'Lucas Oliveira', siglaAcademia: 'MTC' },
        placar: {
          lutaId: 'luta-semi-1',
          ipponBranco: 0,
          wazaAriBranco: 1,
          yukoBranco: 2,
          shidoBranco: 0,
          ipponAzul: 0,
          wazaAriAzul: 1,
          yukoAzul: 0,
          shidoAzul: 1,
          osaekomiAtivo: false,
          osaekomiTempoSegundos: 0,
          cronometroSegundos: 0,
          emGoldenScore: false,
          cronometroRodando: false,
          sonoMama: false,
          ultimaAtualizacao: '2026-11-15',
        },
        status: 'Finalizada',
        tipoVitoria: 'Yuko',
        emGoldenScore: false,
        tempoLutaSegundos: 240,
        fase: 2,
        ordemNaChave: 1,
        vencedorId: 'a1',
      },
      // Grande Final (Fase 1 -> Gabriel já classificado no lado Branco, aguardando vencedor da Semifinal 2 no lado Azul)
      {
        id: 'luta-final',
        chaveId: 'chave-73',
        tatameId: 'tat-1',
        atletaBranco: { id: 'a1', nome: 'Gabriel Santos', siglaAcademia: 'ECP' },
        atletaAzul: undefined,
        status: 'Agendada',
        emGoldenScore: false,
        tempoLutaSegundos: 240,
        fase: 1,
        ordemNaChave: 1,
      },
    ]);

    renderWithProviders(<ChavesBracketView />);

    await waitFor(() => {
      // Verifica fases da Copa
      expect(screen.getByText('Semifinais')).toBeInTheDocument();
      expect(screen.getByText('Grande Final (Disputa de Ouro)')).toBeInTheDocument();

      // Verifica exibição da pontuação Yuko (Y:2)
      expect(screen.getByText('I:0 W:1 Y:2 S:0')).toBeInTheDocument();

      // Verifica badge de Classificado e slot Aguardando Vencedor na Final
      expect(screen.getByText('Classificado')).toBeInTheDocument();
      expect(screen.getByText('Aguardando Vencedor...')).toBeInTheDocument();
    });
  });

  it('permite ao Admin gerenciar usuários e configurar novas categorias de lutadores no módulo de Configurações', async () => {
    vi.spyOn(api, 'getUsuarios').mockResolvedValue([
      {
        id: 'u-1',
        nome: 'Coordenador Geral (Admin)',
        email: 'admin@judoo.com',
        role: 'ADMIN',
        ativo: true,
        criadoEm: '2026-11-15',
      },
    ]);

    vi.spyOn(api, 'getCampeonatos').mockResolvedValue([
      {
        id: 'camp-1',
        nome: 'Grand Prix 2026',
        local: 'Bahia',
        dataInicio: '2026-11-15',
        dataFim: '2026-11-16',
        status: 'EM_ANDAMENTO',
      },
    ]);

    vi.spyOn(api, 'getCategorias').mockResolvedValue([
      {
        id: 'cat-1',
        campeonatoId: 'camp-1',
        classe: 'Sênior',
        divisaoPeso: '-60kg Ligeiro',
        pesoLimiteKg: 60,
        sexo: 'MASCULINO',
        tempoLutaSegundos: 240,
      },
    ]);

    const cadastrarUsuarioSpy = vi.spyOn(api, 'cadastrarUsuario').mockResolvedValue({
      id: 'u-novo',
      nome: 'Sensei Takeshi',
      email: 'takeshi@judoo.com',
      role: 'MESARIO',
      ativo: true,
      criadoEm: '2026-11-15',
    });

    const criarCategoriaSpy = vi.spyOn(api, 'criarCategoria').mockResolvedValue({
      id: 'cat-nova',
      campeonatoId: 'camp-1',
      classe: 'Sub-21',
      divisaoPeso: '-81kg Meio-Médio',
      pesoLimiteKg: 81,
      sexo: 'MASCULINO',
      tempoLutaSegundos: 240,
    });

    renderWithProviders(<ConfiguracoesAdminModule />);

    // 1. Aba de Usuários da Aplicação
    await waitFor(() => {
      expect(screen.getByText('Coordenador Geral (Admin)')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Ex: Sensei Marcos'), {
      target: { value: 'Sensei Takeshi' },
    });
    fireEvent.change(screen.getByPlaceholderText('usuario@judoo.com'), {
      target: { value: 'takeshi@judoo.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Mínimo 4 caracteres'), {
      target: { value: '123456' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Cadastrar Usuário/i }));

    await waitFor(() => {
      expect(cadastrarUsuarioSpy).toHaveBeenCalled();
      expect(cadastrarUsuarioSpy.mock.calls[0][0]).toEqual({
        nome: 'Sensei Takeshi',
        email: 'takeshi@judoo.com',
        senha: '123456',
        role: 'Mesario',
      });
    });

    // 2. Alterna para a Aba de Categorias dos Lutadores
    fireEvent.click(screen.getByRole('button', { name: /Categorias dos Lutadores/i }));

    await waitFor(() => {
      expect(screen.getByText('-60kg Ligeiro')).toBeInTheDocument();
    });

    const inputClasse = screen.getByPlaceholderText('Ex: Sênior, Sub-21, Sub-18...');
    fireEvent.change(inputClasse, { target: { value: 'Sub-21' } });

    fireEvent.change(screen.getByPlaceholderText('Ex: -73kg Leve, -90kg Médio, +100kg Pesado'), {
      target: { value: '-81kg Meio-Médio' },
    });

    const inputPeso = screen.getByDisplayValue('73');
    fireEvent.change(inputPeso, { target: { value: '81' } });

    fireEvent.click(screen.getByRole('button', { name: /Adicionar Categoria/i }));

    await waitFor(() => {
      expect(criarCategoriaSpy).toHaveBeenCalled();
      expect(criarCategoriaSpy.mock.calls[0][0]).toBe('camp-1');
      expect(criarCategoriaSpy.mock.calls[0][1]).toEqual({
        classe: 'Sub-21',
        divisaoPeso: '-81kg Meio-Médio',
        pesoLimiteKg: 81,
        sexo: 'MASCULINO',
        tempoLutaSegundos: 240,
      });
    });
  });
});
