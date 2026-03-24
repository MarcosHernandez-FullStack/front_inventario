import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Usuario, CrearUsuario } from '../../../models/usuario.model';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { ToastService } from '../../../core/services/toast.service';
import { FormUsuarioComponent } from '../form-usuario/form-usuario';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-lista-usuarios',
  standalone: true,
  imports: [FormsModule, FormUsuarioComponent],
  templateUrl: './lista-usuarios.html',
})
export class ListaUsuariosComponent implements OnInit {
  private readonly http       = inject(HttpClient);
  private readonly authSvc    = inject(AuthService);
  private readonly confirmSvc = inject(ConfirmService);
  private readonly toastSvc   = inject(ToastService);
  private readonly api        = `${environment.apiUrl}/usuarios`;

  usuarios     = signal<Usuario[]>([]);
  busqueda     = signal('');
  paginaActual = signal(1);
  readonly porPagina = 5;
  cargando     = signal(false);
  error        = signal('');
  modalAbierto = signal(false);

  usuariosFiltrados = computed(() => {
    const q = this.busqueda().toLowerCase();
    const lista = [...this.usuarios()].sort((a, b) =>
      (a.nombres + ' ' + a.apellidos).localeCompare(b.nombres + ' ' + b.apellidos, 'es'));
    return q ? lista.filter(u =>
      (u.nombres + ' ' + u.apellidos).toLowerCase().includes(q) ||
      u.correo.toLowerCase().includes(q)
    ) : lista;
  });

  totalPaginas = computed(() => Math.max(1, Math.ceil(this.usuariosFiltrados().length / this.porPagina)));
  paginas      = computed(() => Array.from({ length: this.totalPaginas() }, (_, i) => i + 1));
  usuariosPag  = computed(() => {
    const ini = (this.paginaActual() - 1) * this.porPagina;
    return this.usuariosFiltrados().slice(ini, ini + this.porPagina);
  });

  setBusqueda(v: string) { this.busqueda.set(v); this.paginaActual.set(1); }
  irAPagina(n: number)   { this.paginaActual.set(n); }

  private get usuarioActual() { return this.authSvc.id ?? 0; }

  ngOnInit() { this.cargar(); }

  cargar() {
    this.cargando.set(true);
    this.http.get<Usuario[]>(this.api).subscribe({
      next: data => { this.usuarios.set(data); this.cargando.set(false); },
      error: ()   => { this.error.set('No se pudieron cargar los usuarios.'); this.cargando.set(false); },
    });
  }

  abrirNuevo() { this.modalAbierto.set(true); }

  onGuardado(data: Omit<CrearUsuario, 'creadoPor'>) {
    const payload: CrearUsuario = { ...data, creadoPor: this.usuarioActual };
    this.http.post(this.api, payload)
      .subscribe({ next: () => { this.modalAbierto.set(false); this.cargar(); this.toastSvc.mostrar('Usuario creado correctamente'); } });
  }

  async cambiarEstado(id: number, estadoActual: string) {
    const nuevoEstado = estadoActual === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    const ok = await this.confirmSvc.mostrar({
      titulo:  nuevoEstado === 'INACTIVO' ? 'Desactivar usuario' : 'Activar usuario',
      mensaje: nuevoEstado === 'INACTIVO'
        ? '¿Deseas desactivar este usuario? No podrá iniciar sesión.'
        : '¿Deseas activar este usuario?',
      tipo: nuevoEstado === 'INACTIVO' ? 'warning' : 'success',
      textoBtnAceptar: nuevoEstado === 'INACTIVO' ? 'Desactivar' : 'Activar',
    });
    if (!ok) return;
    this.http.patch(`${this.api}/${id}/estado`, { estado: nuevoEstado, actualizadoPor: this.usuarioActual })
      .subscribe({ next: () => { this.cargar(); this.toastSvc.mostrar(nuevoEstado === 'ACTIVO' ? 'Usuario activado' : 'Usuario desactivado'); } });
  }
}
