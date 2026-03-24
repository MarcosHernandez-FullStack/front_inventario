import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Categoria } from '../../../models/categoria.model';

export interface ProductoFormData {
  nombre:      string;
  descripcion: string;
  precio:      number;
  cantidad:    number;
  idCategoria: number;
}

@Component({
  selector: 'app-form-producto',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './form-producto.html',
})
export class FormProductoComponent {
  @Input() modoEdicion = false;
  @Input() categorias: Categoria[] = [];
  @Input() set initialData(val: ProductoFormData | null) {
    this.form.set(val ? { ...val } : { nombre: '', descripcion: '', precio: 0, cantidad: 0, idCategoria: 0 });
    this.tocado.set(new Set());
  }

  @Output() guardado  = new EventEmitter<ProductoFormData>();
  @Output() cancelado = new EventEmitter<void>();

  form   = signal<ProductoFormData>({ nombre: '', descripcion: '', precio: 0, cantidad: 0, idCategoria: 0 });
  tocado = signal<Set<string>>(new Set());

  errores = computed(() => {
    const f = this.form();
    const e: Record<string, string> = {};
    if (!f.nombre.trim())                e['nombre']      = 'El nombre es requerido.';
    else if (f.nombre.trim().length < 2) e['nombre']      = 'Mínimo 2 caracteres.';
    else if (f.nombre.length > 150)      e['nombre']      = 'Máximo 150 caracteres.';
    if (f.descripcion && f.descripcion.length > 500) e['descripcion'] = 'Máximo 500 caracteres.';
    if (f.precio <= 0)                   e['precio']      = 'El precio debe ser mayor a 0.';
    else if (f.precio > 99999.99)        e['precio']      = 'El precio no puede superar S/ 99,999.99.';
    if (f.cantidad < 0)                  e['cantidad']    = 'La cantidad no puede ser negativa.';
    else if (f.cantidad > 99999)         e['cantidad']    = 'La cantidad no puede superar 99,999.';
    else if (!Number.isInteger(f.cantidad)) e['cantidad'] = 'La cantidad debe ser un número entero.';
    if (f.idCategoria <= 0)              e['idCategoria'] = 'Selecciona una categoría.';
    return e;
  });

  formValido = computed(() => Object.keys(this.errores()).length === 0);

  tocar(campo: string) { this.tocado.update(s => new Set(s).add(campo)); }
  err(campo: string)   { return this.tocado().has(campo) ? this.errores()[campo] : ''; }

  patch(field: keyof ProductoFormData, value: unknown) {
    this.form.update(f => ({ ...f, [field]: value }));
    this.tocar(field);
  }

  guardar() {
    this.tocado.set(new Set(['nombre', 'precio', 'cantidad', 'idCategoria']));
    if (!this.formValido()) return;
    this.guardado.emit(this.form());
  }
}
