import { Injectable, signal } from '@angular/core';

export interface Toast {
  mensaje: string;
  tipo: 'success' | 'error' | 'warning';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toast = signal<Toast | null>(null);
  private timer: ReturnType<typeof setTimeout> | null = null;

  mostrar(mensaje: string, tipo: Toast['tipo'] = 'success') {
    if (this.timer) clearTimeout(this.timer);
    this.toast.set({ mensaje, tipo });
    this.timer = setTimeout(() => this.toast.set(null), 3500);
  }

  cerrar() {
    if (this.timer) clearTimeout(this.timer);
    this.toast.set(null);
  }
}
