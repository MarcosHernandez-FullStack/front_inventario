import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Categoria } from '../../../models/categoria.model';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { ToastService } from '../../../core/services/toast.service';
import { FormCategoriaComponent } from '../form-categoria/form-categoria';
import { environment } from '../../../../environments/environment';

const MOCK_CATEGORIAS: Categoria[] = [
  { id: 1, nombre: 'Computadoras',   estado: 'ACTIVO'   },
  { id: 2, nombre: 'Monitores',      estado: 'ACTIVO'   },
  { id: 3, nombre: 'Periféricos',    estado: 'ACTIVO'   },
  { id: 4, nombre: 'Almacenamiento', estado: 'ACTIVO'   },
  { id: 5, nombre: 'Audio',          estado: 'INACTIVO' },
];

@Component({
  selector: 'app-lista-categorias',
  standalone: true,
  imports: [FormsModule, FormCategoriaComponent],
  templateUrl: './lista-categorias.html',
})
export class ListaCategoriasComponent implements OnInit {
  private readonly http       = inject(HttpClient);
  private readonly authSvc    = inject(AuthService);
  private readonly confirmSvc = inject(ConfirmService);
  private readonly toastSvc   = inject(ToastService);
  private readonly api        = `${environment.apiUrl}/categorias`;

  categorias   = signal<Categoria[]>([]);
  busqueda     = signal('');
  paginaActual = signal(1);
  readonly porPagina = 5;
  cargando     = signal(false);
  error        = signal('');
  modalAbierto = signal(false);
  modoEdicion  = signal(false);
  idEditando   = signal<number | null>(null);
  nombreEdit   = signal('');

  categoriasFiltradas = computed(() => {
    const q = this.busqueda().toLowerCase();
    const lista = [...this.categorias()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    return q ? lista.filter(c => c.nombre.toLowerCase().includes(q)) : lista;
  });

  totalPaginas  = computed(() => Math.max(1, Math.ceil(this.categoriasFiltradas().length / this.porPagina)));
  paginas       = computed(() => Array.from({ length: this.totalPaginas() }, (_, i) => i + 1));
  categoriasPag = computed(() => {
    const ini = (this.paginaActual() - 1) * this.porPagina;
    return this.categoriasFiltradas().slice(ini, ini + this.porPagina);
  });

  setBusqueda(v: string) { this.busqueda.set(v); this.paginaActual.set(1); }
  irAPagina(n: number)   { this.paginaActual.set(n); }

  private get usuarioActual() { return this.authSvc.id ?? 0; }

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
    this.nombreEdit.set('');
    this.modalAbierto.set(true);
  }

  abrirEdicion(c: Categoria) {
    this.modoEdicion.set(true);
    this.idEditando.set(c.id);
    this.nombreEdit.set(c.nombre);
    this.modalAbierto.set(true);
  }

  onGuardado(data: { nombre: string }) {
    if (this.modoEdicion()) {
      this.http.put(`${this.api}/${this.idEditando()}`, { nombre: data.nombre, actualizadoPor: this.usuarioActual })
        .subscribe({ next: () => { this.modalAbierto.set(false); this.cargar(); this.toastSvc.mostrar('Categoría actualizada correctamente'); } });
    } else {
      this.http.post(this.api, { nombre: data.nombre, creadoPor: this.usuarioActual })
        .subscribe({ next: () => { this.modalAbierto.set(false); this.cargar(); this.toastSvc.mostrar('Categoría creada correctamente'); } });
    }
  }

  async cambiarEstado(id: number, estadoActual: string) {
    const nuevoEstado = estadoActual === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    const ok = await this.confirmSvc.mostrar({
      titulo:  nuevoEstado === 'INACTIVO' ? 'Desactivar categoría' : 'Activar categoría',
      mensaje: nuevoEstado === 'INACTIVO'
        ? '¿Deseas desactivar esta categoría?'
        : '¿Deseas activar esta categoría?',
      tipo: nuevoEstado === 'INACTIVO' ? 'warning' : 'success',
      textoBtnAceptar: nuevoEstado === 'INACTIVO' ? 'Desactivar' : 'Activar',
    });
    if (!ok) return;
    this.http.patch(`${this.api}/${id}/estado`, { estado: nuevoEstado, actualizadoPor: this.usuarioActual })
      .subscribe({ next: () => { this.cargar(); this.toastSvc.mostrar(nuevoEstado === 'ACTIVO' ? 'Categoría activada' : 'Categoría desactivada'); } });
  }
}
