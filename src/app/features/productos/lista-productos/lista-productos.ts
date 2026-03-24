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

const MOCK_PRODUCTOS: Producto[] = [
  { id: 1, nombre: 'Laptop HP 15"',    descripcion: 'Intel Core i5, 8GB RAM, 512GB SSD', precio: 2899.90, cantidad: 12, idCategoria: 1, nombreCategoria: 'Computadoras',    estado: 'ACTIVO'   },
  { id: 2, nombre: 'Monitor LG 27"',   descripcion: 'Full HD IPS, 75Hz',                 precio: 749.00,  cantidad: 8,  idCategoria: 2, nombreCategoria: 'Monitores',       estado: 'ACTIVO'   },
  { id: 3, nombre: 'Teclado Mecánico', descripcion: 'Switch Blue, retroiluminado',        precio: 189.90,  cantidad: 3,  idCategoria: 3, nombreCategoria: 'Periféricos',     estado: 'ACTIVO'   },
  { id: 4, nombre: 'Mouse Logitech MX',descripcion: 'Inalámbrico, ergonómico',            precio: 229.00,  cantidad: 20, idCategoria: 3, nombreCategoria: 'Periféricos',     estado: 'ACTIVO'   },
  { id: 5, nombre: 'Disco SSD 1TB',    descripcion: 'Samsung 870 EVO SATA',               precio: 399.00,  cantidad: 5,  idCategoria: 4, nombreCategoria: 'Almacenamiento',  estado: 'ACTIVO'   },
  { id: 6, nombre: 'Auriculares Sony', descripcion: 'Noise Cancelling WH-1000XM5',        precio: 899.00,  cantidad: 2,  idCategoria: 5, nombreCategoria: 'Audio',           estado: 'INACTIVO' },
];

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

  private get usuarioActual() { return this.authSvc.session()?.correo ?? ''; }
  esAdmin = computed(() => this.authSvc.esAdmin());

  ngOnInit() {
    this.cargar();
    this.http.get<Categoria[]>(`${environment.apiUrl}/categorias`).subscribe({
      next: data => this.categorias.set(data.filter(c => c.estado === 'ACTIVO')),
      error: () => this.categorias.set([
        { id: 1, nombre: 'Computadoras',   estado: 'ACTIVO' },
        { id: 2, nombre: 'Monitores',      estado: 'ACTIVO' },
        { id: 3, nombre: 'Periféricos',    estado: 'ACTIVO' },
        { id: 4, nombre: 'Almacenamiento', estado: 'ACTIVO' },
        { id: 5, nombre: 'Audio',          estado: 'ACTIVO' },
      ]),
    });
  }

  cargar() {
    this.cargando.set(true);
    this.http.get<Producto[]>(this.api).subscribe({
      next: data => { this.productos.set(data); this.cargando.set(false); },
      error: ()   => { this.productos.set(MOCK_PRODUCTOS); this.cargando.set(false); },
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
