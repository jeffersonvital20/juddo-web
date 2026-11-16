import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CampeonatosModule } from '../../features/campeonatos/CampeonatosModule';
import { PesagemModule } from '../../features/secretaria/PesagemModule';
import { api } from '../../services/api';

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('Campeonatos & Pesagem Flow (Integration Tests)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('cadastra e salva um novo campeonato na API e o define como evento ativo', async () => {
    vi.spyOn(api, 'getCampeonatos').mockResolvedValue([
      {
        id: 'camp-1',
        nome: 'Grand Prix Nacional de Judô 2026',
        local: 'Lauro de Freitas/BA',
        dataInicio: '2026-11-07',
        dataFim: '2026-11-09',
        status: 'EM_ANDAMENTO',
      },
    ]);

    const criarSpy = vi.spyOn(api, 'criarCampeonato').mockResolvedValue({
      id: 'camp-novo-99',
      nome: 'Copa Interclubes 2026',
      local: 'Ginásio do Ibirapuera - SP',
      dataInicio: '2026-12-01',
      dataFim: '2026-12-03',
      status: 'EM_ANDAMENTO',
    });

    renderWithQuery(<CampeonatosModule />);

    await waitFor(() => {
      expect(screen.getByText('Grand Prix Nacional de Judô 2026')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Novo Campeonato/i }));

    fireEvent.change(screen.getByPlaceholderText(/ex: Copa Pan-Americana de Judô 2026/i), {
      target: { value: 'Copa Interclubes 2026' },
    });
    fireEvent.change(screen.getByPlaceholderText(/ex: Centro Pan-Americano/i), {
      target: { value: 'Ginásio do Ibirapuera - SP' },
    });

    const dateInputs = document.querySelectorAll('input[type="date"]');
    fireEvent.change(dateInputs[0] as HTMLElement, { target: { value: '2026-12-01' } });
    fireEvent.change(dateInputs[1] as HTMLElement, { target: { value: '2026-12-03' } });

    fireEvent.click(screen.getByRole('button', { name: /Criar Evento/i }));

    await waitFor(() => {
      expect(criarSpy).toHaveBeenCalled();
      const payload = criarSpy.mock.calls[0][0];
      expect(payload.nome).toBe('Copa Interclubes 2026');
      expect(payload.local).toBe('Ginásio do Ibirapuera - SP');
      expect(payload.dataInicio).toBe('2026-12-01');
      expect(payload.dataFim).toBe('2026-12-03');
      expect(localStorage.getItem('judoo_active_campeonato')).toBe('camp-novo-99');
      expect(screen.getByText(/Campeonato salvo com sucesso no banco de dados!/i)).toBeInTheDocument();
    });
  });

  it('lista todos os atletas cadastrados na Pesagem e realiza a inscrição e aferição de peso no campeonato', async () => {
    localStorage.setItem('judoo_active_campeonato', 'camp-1');

    vi.spyOn(api, 'getCampeonatos').mockResolvedValue([
      {
        id: 'camp-1',
        nome: 'Copa Brasil 2026',
        local: 'São Paulo',
        dataInicio: '2026-11-15',
        dataFim: '2026-11-16',
        status: 'EM_ANDAMENTO',
      },
    ]);

    vi.spyOn(api, 'getCategorias').mockResolvedValue([
      {
        id: 'cat-66',
        campeonatoId: 'camp-1',
        classe: 'Sênior',
        divisaoPeso: '-66kg Meio-Leve',
        pesoLimiteKg: 66,
        sexo: 'MASCULINO',
        tempoLutaSegundos: 240,
      },
    ]);

    vi.spyOn(api, 'getAtletas').mockImplementation(async (campeonatoId?: string) => {
      if (campeonatoId) return []; // Ainda não inscrito no campeonato
      return [
        {
          id: 'atl-1',
          academiaId: 'ac-1',
          nome: 'Gabriel Santos',
          registroFederacao: 'CBJ-98214',
          dataNascimento: '1999-05-14',
          sexo: 'MASCULINO',
          nomeAcademia: 'Esporte Clube Pinheiros',
          siglaAcademia: 'ECP',
        },
      ];
    });

    const inscreverSpy = vi.spyOn(api, 'inscreverAtleta').mockResolvedValue();

    renderWithQuery(<PesagemModule />);

    await waitFor(() => {
      expect(screen.getByText('Gabriel Santos')).toBeInTheDocument();
      expect(screen.getByText('Aguardando Pesagem')).toBeInTheDocument();
    });

    // Seleciona o atleta na lista
    fireEvent.click(screen.getByText('Gabriel Santos'));

    // Preenche o peso na balança
    const inputPeso = screen.getByPlaceholderText('Ex: 65.85');
    fireEvent.change(inputPeso, { target: { value: '65.4' } });

    // Submete a inscrição e pesagem
    fireEvent.click(screen.getByRole('button', { name: /Inscrever & Salvar Pesagem/i }));

    await waitFor(() => {
      expect(inscreverSpy).toHaveBeenCalled();
      const payload = inscreverSpy.mock.calls[0][0];
      expect(payload.atletaId).toBe('atl-1');
      expect(payload.pesoKg).toBe(65.4);
      expect(
        screen.getByText(/Atleta inscrito no campeonato e pesagem oficial homologada!/i)
      ).toBeInTheDocument();
    });
  });
});
