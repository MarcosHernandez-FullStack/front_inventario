import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { Producto } from '../../../models/producto.model';
import { Categoria } from '../../../models/categoria.model';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { ToastService } from '../../../core/services/toast.service';
import { FormProductoComponent, ProductoFormData } from '../form-producto/form-producto';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-lista-productos',
  standalone: true,
  imports: [FormsModule, DecimalPipe, FormProductoComponent],
  templateUrl: './lista-productos.html',
})
export class ListaProductosComponent implements OnInit {
  private readonly http       = inject(HttpClient);
  private readonly authSvc    = inject(AuthService);
  private readonly confirmSvc = inject(ConfirmService);
  private readonly toastSvc   = inject(ToastService);
  private readonly api        = `${environment.apiUrl}/productos`;

  productos    = signal<Producto[]>([]);
  categorias   = signal<Categoria[]>([]);
  busqueda     = signal('');
  paginaActual = signal(1);
  readonly porPagina = 5;
  cargando     = signal(false);
  error        = signal('');
  modalAbierto = signal(false);
  modoEdicion  = signal(false);
  idEditando   = signal<number | null>(null);
  formInicial  = signal<ProductoFormData | null>(null);

  productosFiltrados = computed(() => {
    const q = this.busqueda().toLowerCase();
    const lista = [...this.productos()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    return q ? lista.filter(p =>
      p.nombre.toLowerCase().includes(q) ||
      (p.nombreCategoria ?? '').toLowerCase().includes(q)
    ) : lista;
  });

  totalPaginas = computed(() => Math.max(1, Math.ceil(this.productosFiltrados().length / this.porPagina)));
  paginas      = computed(() => Array.from({ length: this.totalPaginas() }, (_, i) => i + 1));
  productosPag = computed(() => {
    const ini = (this.paginaActual() - 1) * this.porPagina;
    return this.productosFiltrados().slice(ini, ini + this.porPagina);
  });

  setBusqueda(v: string) { this.busqueda.set(v); this.paginaActual.set(1); }
  irAPagina(n: number)   { this.paginaActual.set(n); }

  private get usuarioActual() { return this.authSvc.id ?? 0; }
  esAdmin = computed(() => this.authSvc.esAdmin());

  ngOnInit() {
    this.cargar();
    this.http.get<Categoria[]>(`${environment.apiUrl}/categorias`).subscribe({
      next: data => this.categorias.set(data.filter(c => c.estado === 'ACTIVO')),
      error: () => this.error.set('No se pudieron cargar las categorías.'),
    });
  }

  cargar() {
    this.cargando.set(true);
    this.http.get<Producto[]>(this.api).subscribe({
      next: data => { this.productos.set(data); this.cargando.set(false); },
      error: ()   => { this.error.set('No se pudieron cargar los productos.'); this.cargando.set(false); },
    });
  }

  abrirNuevo() {
    this.modoEdicion.set(false);
    this.idEditando.set(null);
    this.formInicial.set(null);
    this.modalAbierto.set(true);
  }

  abrirEdicion(p: Producto) {
    this.modoEdicion.set(true);
    this.idEditando.set(p.id);
    this.formInicial.set({ nombre: p.nombre, descripcion: p.descripcion ?? '', precio: p.precio, cantidad: p.cantidad, idCategoria: p.idCategoria });
    this.modalAbierto.set(true);
  }

  onGuardado(data: ProductoFormData) {
    if (this.modoEdicion()) {
      this.http.put(`${this.api}/${this.idEditando()}`, { ...data, actualizadoPor: this.usuarioActual })
        .subscribe({ next: () => { this.modalAbierto.set(false); this.cargar(); this.toastSvc.mostrar('Producto actualizado correctamente'); } });
    } else {
      this.http.post(this.api, { ...data, creadoPor: this.usuarioActual })
        .subscribe({ next: () => { this.modalAbierto.set(false); this.cargar(); this.toastSvc.mostrar('Producto creado correctamente'); } });
    }
  }

  async cambiarEstado(id: number, estadoActual: string) {
    const nuevoEstado = estadoActual === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    const ok = await this.confirmSvc.mostrar({
      titulo:  nuevoEstado === 'INACTIVO' ? 'Desactivar producto' : 'Activar producto',
      mensaje: nuevoEstado === 'INACTIVO'
        ? '¿Deseas desactivar este producto? Dejará de estar disponible.'
        : '¿Deseas activar este producto?',
      tipo: nuevoEstado === 'INACTIVO' ? 'warning' : 'success',
      textoBtnAceptar: nuevoEstado === 'INACTIVO' ? 'Desactivar' : 'Activar',
    });
    if (!ok) return;
    this.http.patch(`${this.api}/${id}/estado`, { estado: nuevoEstado, actualizadoPor: this.usuarioActual })
      .subscribe({ next: () => { this.cargar(); this.toastSvc.mostrar(nuevoEstado === 'ACTIVO' ? 'Producto activado' : 'Producto desactivado'); } });
  }
}
