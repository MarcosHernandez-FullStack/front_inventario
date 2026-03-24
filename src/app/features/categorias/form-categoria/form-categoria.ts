import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-form-categoria',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './form-categoria.html',
})
export class FormCategoriaComponent {
  @Input() modoEdicion = false;
  @Input() set nombreInicial(val: string) { this.nombre.set(val ?? ''); }

  @Output() guardado  = new EventEmitter<{ nombre: string }>();
  @Output() cancelado = new EventEmitter<void>();

  nombre = signal('');
  tocado = signal<Set<string>>(new Set());

  errNombre = computed(() => {
    const v = this.nombre();
    if (!v.trim())           return 'El nombre es requerido.';
    if (v.trim().length < 2) return 'Mínimo 2 caracteres.';
    if (v.length > 100)      return 'Máximo 100 caracteres.';
    return '';
  });

  formValido  = computed(() => !this.errNombre());
  mostrarErr  = () => this.tocado().has('nombre');

  tocar() { this.tocado.update(s => new Set(s).add('nombre')); }

  guardar() {
    this.tocado.set(new Set(['nombre']));
    if (!this.formValido()) return;
    this.guardado.emit({ nombre: this.nombre() });
  }
}
