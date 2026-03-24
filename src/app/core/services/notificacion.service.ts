import { Injectable, inject, signal } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

export interface AlertaStock {
  mensaje:      string;
  reportadoPor: string;
  fecha:        string;
  productos:    { nombre: string; cantidad: number }[];
}

@Injectable({ providedIn: 'root' })
export class NotificacionService {
  private readonly authSvc = inject(AuthService);
  private connection: signalR.HubConnection | null = null;

  alertas      = signal<AlertaStock[]>([]);
  totalNoLeidas = signal(0);

  conectar() {
    if (this.connection) return;

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(environment.signalrUrl)
      .withAutomaticReconnect()
      .build();

    this.connection.on('StockBajo', (alerta: AlertaStock) => {
      this.alertas.update(a => [alerta, ...a]);
      this.totalNoLeidas.update(n => n + 1);
    });

    this.connection.start()
      .then(() => {
        const rol = this.authSvc.rol ?? '';
        return this.connection!.invoke('UnirseAlGrupo', rol);
      })
      .catch(err => console.error('SignalR error:', err));
  }

  desconectar() {
    this.connection?.stop();
    this.connection = null;
    this.alertas.set([]);
    this.totalNoLeidas.set(0);
  }

  marcarLeidas() {
    this.totalNoLeidas.set(0);
  }
}
