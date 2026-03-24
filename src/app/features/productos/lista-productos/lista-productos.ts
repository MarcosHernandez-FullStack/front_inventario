import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { Producto, CrearProducto, ActualizarProducto } from '../../../models/producto.model';
import { Categoria } from '../../../models/categoria.model';
import { AuthService } from '../../../core/services/auth.service';

const MOCK_PRODUCTOS: Producto[] = [
  { id: 1, nombre: 'Laptop HP 15"',       descripcion: 'Intel Core i5, 8GB RAM, 512GB SSD', precio: 2899.90, cantidad: 12, idCategoria: 1, nombreCategoria: 'Computadoras', estado: 'ACTIVO' },
  { id: 2, nombre: 'Monitor LG 27"',      descripcion: 'Full HD IPS, 75Hz',                 precio: 749.00,  cantidad: 8,  idCategoria: 2, nombreCategoria: 'Monitores',    estado: 'ACTIVO' },
  { id: 3, nombre: 'Teclado Mecánico',    descripcion: 'Switch Blue, retroiluminado',        precio: 189.90,  cantidad: 3,  idCategoria: 3, nombreCategoria: 'Periféricos',  estado: 'ACTIVO' },
  { id: 4, nombre: 'Mouse Logitech MX',   descripcion: 'Inalámbrico, ergonómico',            precio: 229.00,  cantidad: 20, idCategoria: 3, nombreCategoria: 'Periféricos',  estado: 'ACTIVO' },
  { id: 5, nombre: 'Disco SSD 1TB',       descripcion: 'Samsung 870 EVO SATA',               precio: 399.00,  cantidad: 5,  idCategoria: 4, nombreCategoria: 'Almacenamiento', estado: 'ACTIVO' },
  { id: 6, nombre: 'Auriculares Sony',    descripcion: 'Noise Cancelling WH-1000XM5',        precio: 899.00,  cantidad: 2,  idCategoria: 5, nombreCategoria: 'Audio',         estado: 'INACTIVO' },
];

@Component({
  selector: 'app-lista-productos',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  templateUrl: './lista-productos.html',
})
export class ListaProductosComponent implements OnInit {
  private readonly http    = inject(HttpClient);
  private readonly authSvc = inject(AuthService);
  private readonly api     = 'http://localhost:5000/api/productos';

  productos     = signal<Producto[]>([]);
  categorias    = signal<Categoria[]>([]);
  busqueda      = signal('');
  paginaActual  = signal(1);
  readonly porPagina = 5;
  cargando     = signal(false);
  error        = signal('');
  modalAbierto = signal(false);
  modoEdicion  = signal(false);
  idEditando   = signal<number | null>(null);
  tocado       = signal<Set<string>>(new Set());

  productosFiltrados = computed(() => {
    const q = this.busqueda().toLowerCase();
    const lista = [...this.productos()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    return q ? lista.filter(p =>
      p.nombre.toLowerCase().includes(q) ||
      (p.nombreCategoria ?? '').toLowerCase().includes(q)
    ) : lista;
  });

  totalPaginas  = computed(() => Math.max(1, Math.ceil(this.productosFiltrados().length / this.porPagina)));
  paginas       = computed(() => Array.from({ length: this.totalPaginas() }, (_, i) => i + 1));
  productosPag  = computed(() => {
    const ini = (this.paginaActual() - 1) * this.porPagina;
    return this.productosFiltrados().slice(ini, ini + this.porPagina);
  });

  setBusqueda(v: string) { this.busqueda.set(v); this.paginaActual.set(1); }
  irAPagina(n: number)   { this.paginaActual.set(n); }

  formNuevo = signal<CrearProducto>({ nombre: '', descripcion: '', precio: 0, cantidad: 0, idCategoria: 0, creadoPor: '' });
  formEdit  = signal<ActualizarProducto>({ nombre: '', descripcion: '', precio: 0, cantidad: 0, idCategoria: 0, actualizadoPor: '' });

  private get usuarioActual() { return this.authSvc.session()?.correo ?? ''; }
  esAdmin = computed(() => this.authSvc.esAdmin());

  // ── Validación ──────────────────────────────────────────────
  private get formActual() {
    return this.modoEdicion() ? this.formEdit() : this.formNuevo();
  }

  errores = computed(() => {
    const f = this.modoEdicion() ? this.formEdit() : this.formNuevo();
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

  tocar(campo: string) {
    this.tocado.update(s => new Set(s).add(campo));
  }

  err(campo: string) {
    return this.tocado().has(campo) ? this.errores()[campo] : '';
  }
  // ────────────────────────────────────────────────────────────

  ngOnInit() {
    this.cargar();
    this.http.get<Categoria[]>('http://localhost:5000/api/categorias').subscribe({
      next: data => this.categorias.set(data.filter(c => c.estado === 'ACTIVO')),
      error: ()  => this.categorias.set([
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
    this.formNuevo.set({ nombre: '', descripcion: '', precio: 0, cantidad: 0, idCategoria: 0, creadoPor: this.usuarioActual });
    this.tocado.set(new Set());
    this.modalAbierto.set(true);
  }

  abrirEdicion(p: Producto) {
    this.modoEdicion.set(true);
    this.idEditando.set(p.id);
    this.formEdit.set({ nombre: p.nombre, descripcion: p.descripcion ?? '', precio: p.precio, cantidad: p.cantidad, idCategoria: p.idCategoria, actualizadoPor: this.usuarioActual });
    this.tocado.set(new Set());
    this.modalAbierto.set(true);
  }

  guardar() {
    this.tocado.set(new Set(['nombre', 'precio', 'cantidad', 'idCategoria']));
    if (!this.formValido()) return;

    if (this.modoEdicion()) {
      this.http.put(`${this.api}/${this.idEditando()}`, this.formEdit())
        .subscribe({ next: () => { this.modalAbierto.set(false); this.cargar(); } });
    } else {
      this.http.post(this.api, this.formNuevo())
        .subscribe({ next: () => { this.modalAbierto.set(false); this.cargar(); } });
    }
  }

  cambiarEstado(id: number, estadoActual: string) {
    const nuevoEstado = estadoActual === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    const msg = nuevoEstado === 'INACTIVO' ? '¿Desactivar este producto?' : '¿Activar este producto?';
    if (!confirm(msg)) return;
    this.http.patch(`${this.api}/${id}/estado`, { estado: nuevoEstado, actualizadoPor: this.usuarioActual })
      .subscribe({ next: () => this.cargar() });
  }

  patchNuevo(field: keyof CrearProducto, value: unknown) {
    this.formNuevo.update(f => ({ ...f, [field]: value }));
    this.tocar(field);
  }

  patchEdit(field: keyof ActualizarProducto, value: unknown) {
    this.formEdit.update(f => ({ ...f, [field]: value }));
    this.tocar(field);
  }
}
