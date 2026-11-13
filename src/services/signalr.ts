import * as signalR from '@microsoft/signalr';
import { PlacarLuta } from '../types';

const HUB_URL = import.meta.env.VITE_HUB_URL || 'http://localhost:8080/hubs/tatame';

export class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private isConnecting = false;

  public async startConnection(tatameId?: string): Promise<signalR.HubConnection> {
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      if (tatameId) {
        await this.connection.invoke('EntrarNoTatame', tatameId);
      } else {
        await this.connection.invoke('EntrarNaArena');
      }
      return this.connection;
    }

    if (this.isConnecting && this.connection) {
      return this.connection;
    }

    this.isConnecting = true;

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        skipNegotiation: false,
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Information)
      .build();

    try {
      await this.connection.start();
      console.log('⚡ Conectado com sucesso ao SignalR Hub Judoo:', HUB_URL);

      if (tatameId) {
        await this.connection.invoke('EntrarNoTatame', tatameId);
      } else {
        await this.connection.invoke('EntrarNaArena');
      }
    } catch (err) {
      console.warn('⚠️ Não foi possível conectar ao WebSocket SignalR (a API pode estar inicializando):', err);
    } finally {
      this.isConnecting = false;
    }

    return this.connection;
  }

  public onPlacarAtualizado(callback: (placar: PlacarLuta | { tatameId: string; placar: PlacarLuta }) => void) {
    this.connection?.on('PlacarAtualizado', callback);
  }

  public onCronometroAtualizado(callback: (data: { tatameId: string; tempoSegundos: number; rodando: boolean; goldenScore: boolean }) => void) {
    this.connection?.on('CronometroAtualizado', callback);
  }

  public onLutaFinalizada(callback: (data: { tatameId: string; lutaId: string; vencedor?: string; tipoVitoria: string }) => void) {
    this.connection?.on('LutaFinalizada', callback);
  }

  public stopConnection() {
    this.connection?.stop();
    this.connection = null;
  }
}

export const signalRService = new SignalRService();
