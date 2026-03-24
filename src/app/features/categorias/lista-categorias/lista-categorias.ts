import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Categoria, CrearCategoria } from '../../../models/categoria.model';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

const MOCK_CATEGORIAS: Categoria[] = [
  { id: 1, nombre: 'Computadoras',    estado: 'ACTIVO' },
  { id: 2, nombre: 'Monitores',       estado: 'ACTIVO' },
  { id: 3, nombre: 'Periféricos',     estado: 'ACTIVO' },
  { id: 4, nombre: 'Almacenamiento',  estado: 'ACTIVO' },
  { id: 5, nombre: 'Audio',           estado: 'INACTIVO' },
];

@Component({
  selector: 'app-lista-categorias',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './lista-categorias.html',
})
export class ListaCategoriasComponent implements OnInit {
  private readonly http    = inject(HttpClient);
  private readonly authSvc = inject(AuthService);
  private readonly api     = `${environment.apiUrl}/categorias`;

  categorias    = signal<Categoria[]>([]);
  busqueda      = signal('');
  paginaActual  = signal(1);
  readonly porPagina = 5;
  cargando     = signal(false);
  error        = signal('');
  modalAbierto = signal(false);
  modoEdicion  = signal(false);
  idEditando   = signal<number | null>(null);
  nombreEdit   = signal('');
  tocado       = signal<Set<string>>(new Set());

  categoriasFiltradas = computed(() => {
    const q = this.busqueda().toLowerCase();
    const lista = [...this.categorias()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    return q ? lista.filter(c => c.nombre.toLowerCase().includes(q)) : lista;
  });

  totalPaginas   = computed(() => Math.max(1, Math.ceil(this.categoriasFiltradas().length / this.porPagina)));
  paginas        = computed(() => Array.from({ length: this.totalPaginas() }, (_, i) => i + 1));
  categoriasPag  = computed(() => {
    const ini = (this.paginaActual() - 1) * this.porPagina;
    return this.categoriasFiltradas().slice(ini, ini + this.porPagina);
  });

  setBusqueda(v: string) { this.busqueda.set(v); this.paginaActual.set(1); }
  irAPagina(n: number)   { this.paginaActual.set(n); }

  form = signal<CrearCategoria>({ nombre: '', creadoPor: '' });

  private get usuarioActual() { return this.authSvc.session()?.correo ?? ''; }

  // ── Validación ──────────────────────────────────────────────
  errNombre = computed(() => {
    const v = this.modoEdicion() ? this.nombreEdit() : this.form().nombre;
    if (!v.trim())            return 'El nombre es requerido.';
    if (v.trim().length < 2)  return 'Mínimo 2 caracteres.';
    if (v.length > 100)       return 'Máximo 100 caracteres.';
    return '';
  });

  formValido = computed(() => !this.errNombre());

  tocar(campo: string) {
    this.tocado.update(s => new Set(s).add(campo));
  }

  mostrarError(campo: string) {
    return this.tocado().has(campo);
  }
  // ────────────────────────────────────────────────────────────

  ngOnInit() { this.cargar(); }

  cargar() {
    this.cargando.set(true);
    this.http.get<Categoria[]>(this.api).subscribe({
      next: data => { this.categorias.set(data); this.cargando.set(false); },
      error: ()   => { this.categorias.set(MOCK_CATEGORIAS); this.cargando.set(false); },
    });
  }

  abrirNuevo() {
    this.modoEdicion.set(false);
    this.idEditando.set(null);
    this.form.set({ nombre: '', creadoPor: this.usuarioActual });
    this.tocado.set(new Set());
    this.modalAbierto.set(true);
  }

  abrirEdicion(c: Categoria) {
    this.modoEdicion.set(true);
    this.idEditando.set(c.id);
    this.nombreEdit.set(c.nombre);
    this.tocado.set(new Set());
    this.modalAbierto.set(true);
  }

  guardar() {
    this.tocado.set(new Set(['nombre']));
    if (!this.formValido()) return;

    if (this.modoEdicion()) {
      this.http.put(`${this.api}/${this.idEditando()}`, { nombre: this.nombreEdit(), actualizadoPor: this.usuarioActual })
        .subscribe({ next: () => { this.modalAbierto.set(false); this.cargar(); } });
    } else {
      this.http.post(this.api, this.form())
        .subscribe({ next: () => { this.modalAbierto.set(false); this.cargar(); } });
    }
  }

  eliminar(id: number) {
    if (!confirm('¿Eliminar esta categoría?')) return;
    this.http.delete(`${this.api}/${id}`).subscribe({ next: () => this.cargar() });
  }
}
