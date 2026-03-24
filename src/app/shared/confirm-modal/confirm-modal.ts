import { Component, inject } from '@angular/core';
import { ConfirmService } from '../../core/services/confirm.service';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  templateUrl: './confirm-modal.html',
})
export class ConfirmModalComponent {
  readonly confirmSvc = inject(ConfirmService);

  get estado() { return this.confirmSvc.estado(); }

  get icono() {
    switch (this.estado?.tipo) {
      case 'danger':  return 'bi-exclamation-octagon-fill';
      case 'success': return 'bi-check-circle-fill';
      case 'info':    return 'bi-info-circle-fill';
      default:        return 'bi-exclamation-triangle-fill';
    }
  }

  get colorIcono() {
    switch (this.estado?.tipo) {
      case 'danger':  return '#dc2626';
      case 'success': return '#059669';
      case 'info':    return '#3b6cf8';
      default:        return '#f59e0b';
    }
  }

  get colorHeader() {
    switch (this.estado?.tipo) {
      case 'danger':  return '#fef2f2';
      case 'success': return '#ecfdf5';
      case 'info':    return '#eef2ff';
      default:        return '#fffbeb';
    }
  }

  aceptar()  { this.confirmSvc.responder(true);  }
  cancelar() { this.confirmSvc.responder(false); }
}
