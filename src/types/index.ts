export type CorJudogi = 'Branco' | 'Azul';

export type TipoPontuacao = 
  | 'Yuko'
  | 'WazaAri' 
  | 'Ippon' 
  | 'Shido' 
  | 'CancelarYuko'
  | 'CancelarWazaAri' 
  | 'CancelarShido';

export type TipoVitoria = 
  | 'Ippon' 
  | 'WazaAriAwaseteIppon' 
  | 'WazaAri' 
  | 'Yuko'
  | 'HansokuMake' 
  | 'Decisao' 
  | 'WO' 
  | 'Desistencia';

export type StatusLuta = 
  | 'Agendada' 
  | 'Chamada' 
  | 'EmAndamento' 
  | 'Pausada' 
  | 'Finalizada' 
  | 'Cancelada';

export interface Atleta {
  id: string;
  nome: string;
  registroFederacao?: string;
  nomeAcademia?: string;
  siglaAcademia?: string;
}

export interface PlacarLuta {
  lutaId: string;
  ipponBranco: number;
  wazaAriBranco: number;
  yukoBranco?: number;
  shidoBranco: number;
  ipponAzul: number;
  wazaAriAzul: number;
  yukoAzul?: number;
  shidoAzul: number;
  osaekomiAtivo: boolean;
  osaekomiCor?: CorJudogi | null;
  osaekomiTempoSegundos: number;
  cronometroSegundos: number;
  emGoldenScore: boolean;
  cronometroRodando: boolean;
  sonoMama: boolean;
  ultimaAtualizacao: string;
}

export interface LutaDetalhes {
  id: string;
  chaveId: string;
  tatameId?: string;
  atletaBranco?: Atleta;
  atletaAzul?: Atleta;
  placar?: PlacarLuta;
  status: StatusLuta;
  tipoVitoria?: TipoVitoria;
  emGoldenScore: boolean;
  tempoLutaSegundos: number;
  fase: number;
  ordemNaChave: number;
  vencedorId?: string;
}

export interface TatameStatus {
  id: string;
  numero: number;
  nome: string;
  status: string;
  lutaAtualId?: string;
  lutaAtual?: LutaDetalhes;
}

export interface Campeonato {
  id: string;
  nome: string;
  local: string;
  dataInicio: string;
  dataFim: string;
  status: string;
  criadoEm?: string;
}

export interface Categoria {
  id: string;
  campeonatoId: string;
  classe: string;
  divisaoPeso: string;
  pesoLimiteKg: number;
  sexo: string;
  tempoLutaSegundos: number;
}

export interface Academia {
  id: string;
  nome: string;
  sigla: string;
  cidade?: string;
  estado?: string;
}

export interface AtletaCompleto {
  id: string;
  academiaId: string;
  nome: string;
  registroFederacao?: string;
  dataNascimento: string;
  sexo: string;
  fotoUrl?: string;
  nomeAcademia?: string;
  siglaAcademia?: string;
}

export interface UsuarioAuth {
  id: string;
  nome: string;
  email: string;
  role: 'ADMIN' | 'SECRETARIA' | 'MESARIO' | 'PUBLICO';
  token: string;
}
