import React, { useEffect, useState } from 'react';
import { signalRService } from '../../services/signalr';
import { api } from '../../services/api';
import { PlacarLuta, TatameStatus } from '../../types';
import { Wifi, WifiOff, Maximize2 } from 'lucide-react';

interface TelaoState {
  tatameId: string;
  tatameNome: string;
  categoria: string;
  atletaBranco: { nome: string; sigla: string; clube: string };
  atletaAzul: { nome: string; sigla: string; clube: string };
  placar: PlacarLuta;
  statusLuta: string;
}

const DEFAULT_STATE: TelaoState = {
  tatameId: '60000000-0000-0000-0000-000000000001',
  tatameNome: 'TATAME 1 • ÁREA DE COMBATE A',
  categoria: 'SÊNIOR MASCULINO -66KG (FINAL)',
  atletaBranco: {
    nome: 'GABRIEL SANTOS',
    sigla: 'ECP',
    clube: 'ESPORTE CLUBE PINHEIROS (SP)',
  },
  atletaAzul: {
    nome: 'LUCAS OLIVEIRA',
    sigla: 'MTC',
    clube: 'MINAS TÊNIS CLUBE (MG)',
  },
  placar: {
    lutaId: '70000000-0000-0000-0000-000000000001',
    ipponBranco: 0,
    wazaAriBranco: 0,
    yukoBranco: 0,
    shidoBranco: 0,
    ipponAzul: 0,
    wazaAriAzul: 0,
    yukoAzul: 0,
    shidoAzul: 0,
    osaekomiAtivo: false,
    osaekomiCor: null,
    osaekomiTempoSegundos: 0,
    cronometroSegundos: 240, // 04:00 padrão FIJ
    emGoldenScore: false,
    cronometroRodando: false,
    sonoMama: false,
    ultimaAtualizacao: new Date().toISOString(),
  },
  statusLuta: 'AGUARDANDO COMBATE',
};

export const TelaoArenaView: React.FC = () => {
  const [state, setState] = useState<TelaoState>(DEFAULT_STATE);
  const [tatames, setTatames] = useState<TatameStatus[]>([]);
  const [tatameSelecionadoId, setTatameSelecionadoId] = useState<string>(
    '60000000-0000-0000-0000-000000000001'
  );
  const [isConnected, setIsConnected] = useState(false);

  // Carrega tatames reais do campeonato ativo (ou busca o campeonato ativo caso o localStorage esteja desatualizado)
  useEffect(() => {
    let mounted = true;

    async function fetchTatames() {
      try {
        let campId = localStorage.getItem('judoo_active_campeonato') || '10000000-0000-0000-0000-000000000001';
        try {
          const campeonatos = await api.getCampeonatos();
          if (campeonatos && campeonatos.length > 0) {
            const existe = campeonatos.some((c) => c.id === campId);
            if (!existe) {
              const ativo = campeonatos.find((c) => c.status === 'EM_ANDAMENTO') || campeonatos[0];
              campId = ativo.id;
              localStorage.setItem('judoo_active_campeonato', campId);
            }
          }
        } catch {
          // ignora se falhar getCampeonatos
        }

        const res = await api.getTatames(campId);
        if (!mounted || !res || res.length === 0) return;

        setTatames(res);
        setTatameSelecionadoId((atual) =>
          res.some((t) => t.id === atual) ? atual : res[0].id
        );
      } catch {
        // Fallback local se API offline
      }
    }

    fetchTatames();
    // Atualiza os metadados de tatames periodicamente para refletir trocas de luta feitas na mesa
    const poll = setInterval(fetchTatames, 4000);
    return () => {
      mounted = false;
      clearInterval(poll);
    };
  }, []);

  // Contagem local de 1s no Telão sincronizada com os eventos de início/pausa/ajuste da Mesa
  useEffect(() => {
    if (!state.placar.cronometroRodando) return;

    const timer = setInterval(() => {
      setState((prev) => {
        const p = prev.placar;
        if (!p.cronometroRodando) return prev;

        let novoTempo = p.cronometroSegundos;
        let novoOsaekomi = p.osaekomiTempoSegundos;

        if (!p.sonoMama) {
          if (p.emGoldenScore) {
            novoTempo += 1;
          } else if (novoTempo > 0) {
            novoTempo -= 1;
          }
        }

        if (p.osaekomiAtivo && novoOsaekomi < 20) {
          novoOsaekomi += 1;
        }

        return {
          ...prev,
          placar: {
            ...p,
            cronometroSegundos: novoTempo,
            osaekomiTempoSegundos: novoOsaekomi,
          },
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [state.placar.cronometroRodando]);

  // Inicializa SignalR e sincroniza com Tatame selecionado
  useEffect(() => {
    let active = true;

    async function initSignalR() {
      try {
        await signalRService.startConnection(tatameSelecionadoId);
        if (active) setIsConnected(true);

        signalRService.onPlacarAtualizado((payload: any) => {
          if (!active) return;
          const placarData: PlacarLuta = payload.placar || payload.Placar || payload;
          setState((prev) => ({
            ...prev,
            placar: {
              ...prev.placar,
              ...placarData,
              // Preserva o estado de execução do cronômetro caso o evento de pontuação não tenha parado a luta
              cronometroSegundos:
                typeof placarData.cronometroSegundos === 'number'
                  ? placarData.cronometroSegundos
                  : prev.placar.cronometroSegundos,
              cronometroRodando:
                typeof placarData.cronometroRodando === 'boolean'
                  ? placarData.cronometroRodando
                  : prev.placar.cronometroRodando,
            },
          }));
        });

        signalRService.onCronometroAtualizado((data: any) => {
          if (!active) return;
          const tempo = data.tempoSegundos ?? data.TempoSegundos;
          const rodando = data.rodando ?? data.Rodando;
          const golden = data.goldenScore ?? data.GoldenScore;
          const sonoMama = data.sonoMama ?? data.SonoMama;

          setState((prev) => ({
            ...prev,
            statusLuta: rodando ? 'EM ANDAMENTO' : prev.statusLuta === 'AGUARDANDO COMBATE' ? 'PAUSADA' : prev.statusLuta,
            placar: {
              ...prev.placar,
              cronometroSegundos: typeof tempo === 'number' ? tempo : prev.placar.cronometroSegundos,
              cronometroRodando: typeof rodando === 'boolean' ? rodando : prev.placar.cronometroRodando,
              emGoldenScore: typeof golden === 'boolean' ? golden : prev.placar.emGoldenScore,
              sonoMama: typeof sonoMama === 'boolean' ? sonoMama : prev.placar.sonoMama,
            },
          }));
        });

        signalRService.onLutaIniciada((payload: any) => {
          if (!active) return;
          const luta = payload?.luta || payload?.Luta || payload;
          if (luta?.id || luta?.Id) {
            const lutaId = luta.id || luta.Id;
            api.getLuta(lutaId)
              .then((detalhes) => {
                if (!active || !detalhes) return;
                setState((prev) => ({
                  ...prev,
                  categoria: `FASE ${detalhes.fase || 1} • LUTA #${detalhes.ordemNaChave || 1}`,
                  atletaBranco: detalhes.atletaBranco
                    ? {
                        nome: detalhes.atletaBranco.nome.toUpperCase(),
                        sigla: (detalhes.atletaBranco.siglaAcademia || 'CBJ').toUpperCase(),
                        clube: (detalhes.atletaBranco.nomeAcademia || 'AGREMIAÇÃO OFICIAL').toUpperCase(),
                      }
                    : prev.atletaBranco,
                  atletaAzul: detalhes.atletaAzul
                    ? {
                        nome: detalhes.atletaAzul.nome.toUpperCase(),
                        sigla: (detalhes.atletaAzul.siglaAcademia || 'CBJ').toUpperCase(),
                        clube: (detalhes.atletaAzul.nomeAcademia || 'AGREMIAÇÃO OFICIAL').toUpperCase(),
                      }
                    : prev.atletaAzul,
                  placar: detalhes.placar || {
                    ...prev.placar,
                    lutaId: detalhes.id,
                    cronometroSegundos: detalhes.tempoLutaSegundos || 240,
                    cronometroRodando: false,
                    emGoldenScore: detalhes.emGoldenScore || false,
                    ipponBranco: 0,
                    wazaAriBranco: 0,
                    shidoBranco: 0,
                    ipponAzul: 0,
                    wazaAriAzul: 0,
                    shidoAzul: 0,
                    osaekomiAtivo: false,
                    osaekomiTempoSegundos: 0,
                  },
                  statusLuta: detalhes.status ? detalhes.status.toUpperCase() : 'EM ANDAMENTO',
                }));
              })
              .catch(() => {});
          }
        });

        signalRService.onLutaFinalizada((data: any) => {
          if (!active) return;
          const vencedor = data.vencedor ?? data.Vencedor;
          const tipoVitoria = data.tipoVitoria ?? data.TipoVitoria;
          setState((prev) => ({
            ...prev,
            placar: {
              ...prev.placar,
              cronometroRodando: false,
              osaekomiAtivo: false,
            },
            statusLuta: `VENCEDOR: ${vencedor || 'Atleta'} (${tipoVitoria})`,
          }));
        });
      } catch (err) {
        console.warn('Erro ao conectar SignalR no Telão:', err);
      }
    }

    initSignalR();

    return () => {
      active = false;
      signalRService.stopConnection();
    };
  }, [tatameSelecionadoId]);

  // Atualiza metadados do tatame e atletas quando a lista de tatames muda
  useEffect(() => {
    const tatameAtual = tatames.find((t) => t.id === tatameSelecionadoId);
    if (!tatameAtual) return;

    const luta = tatameAtual.lutaAtual;
    setState((prev) => {
      const mudouLuta = luta && luta.id !== prev.placar.lutaId;
      return {
        ...prev,
        tatameId: tatameAtual.id,
        tatameNome: `TATAME ${tatameAtual.numero} • ${tatameAtual.nome.toUpperCase()}`,
        categoria: luta ? `FASE ${luta.fase || 1} • LUTA #${luta.ordemNaChave || 1}` : prev.categoria,
        atletaBranco: luta?.atletaBranco
          ? {
              nome: luta.atletaBranco.nome.toUpperCase(),
              sigla: (luta.atletaBranco.siglaAcademia || 'CBJ').toUpperCase(),
              clube: (luta.atletaBranco.nomeAcademia || 'AGREMIAÇÃO OFICIAL').toUpperCase(),
            }
          : prev.atletaBranco,
        atletaAzul: luta?.atletaAzul
          ? {
              nome: luta.atletaAzul.nome.toUpperCase(),
              sigla: (luta.atletaAzul.siglaAcademia || 'CBJ').toUpperCase(),
              clube: (luta.atletaAzul.nomeAcademia || 'AGREMIAÇÃO OFICIAL').toUpperCase(),
            }
          : prev.atletaAzul,
        // Se mudou a luta (ou se o cronômetro não está rodando localmente), sincroniza o placar do backend
        placar:
          mudouLuta && luta?.placar
            ? luta.placar
            : mudouLuta && luta
            ? {
                ...prev.placar,
                lutaId: luta.id,
                cronometroSegundos: luta.tempoLutaSegundos || 240,
                cronometroRodando: false,
                emGoldenScore: luta.emGoldenScore || false,
                ipponBranco: 0,
                wazaAriBranco: 0,
                shidoBranco: 0,
                ipponAzul: 0,
                wazaAriAzul: 0,
                shidoAzul: 0,
                osaekomiAtivo: false,
                osaekomiTempoSegundos: 0,
              }
            : !prev.placar.cronometroRodando && luta?.placar
            ? luta.placar
            : prev.placar,
        statusLuta: luta?.status ? luta.status.toUpperCase() : 'AGUARDANDO COMBATE',
      };
    });
  }, [tatameSelecionadoId, tatames]);

  // Formatação de minutos e segundos
  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(Math.abs(totalSeconds) / 60);
    const secs = Math.abs(totalSeconds) % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const { placar } = state;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between p-4 sm:p-8 select-none overflow-hidden font-sans">
      {/* Barra de Topo da Arena */}
      <header className="flex items-center justify-between border-b-2 border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="w-3.5 h-3.5 rounded-full bg-red-600 animate-pulse"></span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-widest text-white uppercase">
              {state.tatameNome}
            </h1>
          </div>
          <p className="text-amber-400 font-extrabold text-sm sm:text-base tracking-wider mt-1 uppercase">
            {state.categoria}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {tatames.length > 0 && (
            <select
              value={tatameSelecionadoId}
              onChange={(e) => setTatameSelecionadoId(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-bold text-white uppercase tracking-wider"
            >
              {tatames.map((t) => (
                <option key={t.id} value={t.id}>
                  Tatame {t.numero}
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-full text-xs font-bold">
            {isConnected ? (
              <>
                <Wifi className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">SIGNALR LIVE (WS)</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-amber-500" />
                <span className="text-slate-400">CONECTANDO...</span>
              </>
            )}
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 transition-all"
            title="Tela Cheia"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ÁREA PRINCIPAL DO PLACAR (FIJ OFFICIAL SCOREBOARD LAYOUT) */}
      <main className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-auto py-4">
        {/* LADO BRANCO (SHIRO) */}
        <section className="bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border-4 border-slate-200 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
          {/* Header Atleta */}
          <div className="border-b-2 border-slate-700/80 pb-5">
            <div className="inline-block bg-white text-black font-black text-xs sm:text-sm px-3 py-1 rounded tracking-widest uppercase mb-2">
              SHIRO • BRANCO
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight truncate">
              {state.atletaBranco.nome}
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="font-extrabold text-blue-400 text-lg">{state.atletaBranco.sigla}</span>
              <span className="text-slate-400 text-xs sm:text-sm truncate">{state.atletaBranco.clube}</span>
            </div>
          </div>

          {/* Pontuações Técnicas (Ippon, Waza-ari & Yuko) */}
          <div className="grid grid-cols-3 gap-4 my-6">
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-center">
              <span className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-widest">IPPON</span>
              <div className="font-mono-scoreboard text-5xl sm:text-7xl font-black text-amber-400">
                {placar.ipponBranco}
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-center">
              <span className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-widest">WAZA-ARI</span>
              <div className="font-mono-scoreboard text-5xl sm:text-7xl font-black text-white">
                {placar.wazaAriBranco}
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-center">
              <span className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-widest">YUKO</span>
              <div className="font-mono-scoreboard text-5xl sm:text-7xl font-black text-emerald-400">
                {placar.yukoBranco ?? 0}
              </div>
            </div>
          </div>

          {/* Faltas Disciplinares (Shido) */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-slate-400 tracking-wider">PENALIDADES (SHIDO)</span>
            <div className="flex items-center gap-3">
              {[1, 2, 3].map((num) => (
                <div
                  key={num}
                  className={`w-7 h-10 sm:w-8 sm:h-12 rounded-lg border-2 flex items-center justify-center font-bold text-xs transition-all ${
                    placar.shidoBranco >= num
                      ? num === 3
                        ? 'bg-red-600 border-red-500 text-white animate-pulse shadow-lg shadow-red-600/50'
                        : 'bg-amber-400 border-amber-300 text-black shadow-lg shadow-amber-400/40'
                      : 'bg-slate-900 border-slate-700 text-slate-600'
                  }`}
                >
                  {placar.shidoBranco >= num ? 'S' : ''}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* LADO AZUL (AO) */}
        <section className="bg-gradient-to-b from-blue-950 via-blue-950/80 to-slate-950 border-4 border-blue-600 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
          {/* Header Atleta */}
          <div className="border-b-2 border-blue-800/80 pb-5">
            <div className="inline-block bg-blue-600 text-white font-black text-xs sm:text-sm px-3 py-1 rounded tracking-widest uppercase mb-2">
              AO • AZUL
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight truncate">
              {state.atletaAzul.nome}
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="font-extrabold text-blue-300 text-lg">{state.atletaAzul.sigla}</span>
              <span className="text-slate-400 text-xs sm:text-sm truncate">{state.atletaAzul.clube}</span>
            </div>
          </div>

          {/* Pontuações Técnicas (Ippon, Waza-ari & Yuko) */}
          <div className="grid grid-cols-3 gap-4 my-6">
            <div className="bg-slate-950/80 border border-blue-900/60 rounded-2xl p-4 text-center">
              <span className="text-xs sm:text-sm font-black text-blue-300 uppercase tracking-widest">IPPON</span>
              <div className="font-mono-scoreboard text-5xl sm:text-7xl font-black text-amber-400">
                {placar.ipponAzul}
              </div>
            </div>

            <div className="bg-slate-950/80 border border-blue-900/60 rounded-2xl p-4 text-center">
              <span className="text-xs sm:text-sm font-black text-blue-300 uppercase tracking-widest">WAZA-ARI</span>
              <div className="font-mono-scoreboard text-5xl sm:text-7xl font-black text-white">
                {placar.wazaAriAzul}
              </div>
            </div>

            <div className="bg-slate-950/80 border border-blue-900/60 rounded-2xl p-4 text-center">
              <span className="text-xs sm:text-sm font-black text-blue-300 uppercase tracking-widest">YUKO</span>
              <div className="font-mono-scoreboard text-5xl sm:text-7xl font-black text-emerald-400">
                {placar.yukoAzul ?? 0}
              </div>
            </div>
          </div>

          {/* Faltas Disciplinares (Shido) */}
          <div className="bg-slate-950/60 border border-blue-900/60 rounded-2xl p-4 flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-blue-300 tracking-wider">PENALIDADES (SHIDO)</span>
            <div className="flex items-center gap-3">
              {[1, 2, 3].map((num) => (
                <div
                  key={num}
                  className={`w-7 h-10 sm:w-8 sm:h-12 rounded-lg border-2 flex items-center justify-center font-bold text-xs transition-all ${
                    placar.shidoAzul >= num
                      ? num === 3
                        ? 'bg-red-600 border-red-500 text-white animate-pulse shadow-lg shadow-red-600/50'
                        : 'bg-amber-400 border-amber-300 text-black shadow-lg shadow-amber-400/40'
                      : 'bg-slate-900 border-slate-700 text-slate-600'
                  }`}
                >
                  {placar.shidoAzul >= num ? 'S' : ''}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ÁREA INFERIOR: CRONÔMETRO CENTRAL E OSAEKOMI */}
      <footer className="border-t-2 border-slate-800 pt-4 flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Status Geral da Luta */}
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-lg font-black tracking-widest text-slate-200">
            {state.statusLuta}
          </span>
        </div>

        {/* Cronômetro Principal (Regulamentar FIJ) */}
        <div className="bg-slate-900/90 border-2 border-slate-700 px-8 py-3 rounded-2xl flex items-center gap-6 shadow-2xl">
          {placar.emGoldenScore && (
            <div className="bg-amber-500 text-black font-black text-xs sm:text-sm px-3 py-1 rounded-lg uppercase tracking-wider animate-bounce">
              GOLDEN SCORE (GS)
            </div>
          )}

          <div
            className={`font-mono-scoreboard text-5xl sm:text-7xl font-black tracking-widest ${
              placar.emGoldenScore
                ? 'text-amber-400'
                : placar.cronometroSegundos <= 30
                ? 'text-red-500 animate-pulse'
                : 'text-white'
            }`}
          >
            {formatTimer(placar.cronometroSegundos)}
          </div>
        </div>

        {/* Cronômetro de Imobilização (Osaekomi) */}
        <div className="flex items-center gap-4">
          {placar.osaekomiAtivo ? (
            <div
              className={`border-2 rounded-2xl px-6 py-2.5 flex items-center gap-4 animate-pulse shadow-lg ${
                placar.osaekomiCor === 'Branco'
                  ? 'bg-slate-100 border-white text-black shadow-white/30'
                  : 'bg-blue-600 border-blue-400 text-white shadow-blue-500/50'
              }`}
            >
              <div className="text-right">
                <div className="text-[10px] font-black uppercase tracking-widest">OSAEKOMI</div>
                <div className="text-xs font-bold">{placar.osaekomiCor?.toUpperCase()}</div>
              </div>
              <div className="font-mono-scoreboard text-4xl sm:text-5xl font-black">
                {placar.osaekomiTempoSegundos.toString().padStart(2, '0')}"
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl px-5 py-2.5 text-center text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider block">OSAEKOMI</span>
              <span className="font-mono text-2xl font-bold">TOKETA (PARADO)</span>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};
