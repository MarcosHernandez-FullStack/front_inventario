import { Injectable, signal } from '@angular/core';

export interface ConfirmOpciones {
  titulo:            string;
  mensaje:           string;
  tipo?:             'warning' | 'danger' | 'success' | 'info';
  textoBtnAceptar?:  string;
  textoBtnCancelar?: string;
}

interface ConfirmEstado extends ConfirmOpciones {
  resolver: (v: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  estado = signal<ConfirmEstado | null>(null);

  mostrar(opciones: ConfirmOpciones): Promise<boolean> {
    return new Promise(resolver => {
      this.estado.set({ ...opciones, resolver });
    });
  }

  responder(valor: boolean) {
    const e = this.estado();
    if (e) {
      e.resolver(valor);
      this.estado.set(null);
    }
  }
}
