import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Usuario, CrearUsuario } from '../../../models/usuario.model';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

const MOCK_USUARIOS: Usuario[] = [
  { id: 1, nombres: 'Carlos',   apellidos: 'Mendoza',  celular: '987654321', correo: 'carlos@empresa.com',   rol: 'ADMINISTRADOR', estado: 'ACTIVO'   },
  { id: 2, nombres: 'Ana',      apellidos: 'Torres',   celular: '912345678', correo: 'ana@empresa.com',      rol: 'EMPLEADO',      estado: 'ACTIVO'   },
  { id: 3, nombres: 'Luis',     apellidos: 'Quispe',   celular: '',          correo: 'luis@empresa.com',     rol: 'EMPLEADO',      estado: 'ACTIVO'   },
  { id: 4, nombres: 'Sofía',    apellidos: 'Ramírez',  celular: '945123456', correo: 'sofia@empresa.com',    rol: 'EMPLEADO',      estado: 'INACTIVO' },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Component({
  selector: 'app-lista-usuarios',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './lista-usuarios.html',
})
export class ListaUsuariosComponent implements OnInit {
  private readonly http    = inject(HttpClient);
  private readonly authSvc = inject(AuthService);
  private readonly api     = `${environment.apiUrl}/usuarios`;

  usuarios      = signal<Usuario[]>([]);
  busqueda      = signal('');
  paginaActual  = signal(1);
  readonly porPagina = 5;
  cargando     = signal(false);
  error        = signal('');
  modalAbierto = signal(false);
  tocado       = signal<Set<string>>(new Set());

  usuariosFiltrados = computed(() => {
    const q = this.busqueda().toLowerCase();
    const lista = [...this.usuarios()].sort((a, b) =>
      (a.nombres + ' ' + a.apellidos).localeCompare(b.nombres + ' ' + b.apellidos, 'es'));
    return q ? lista.filter(u =>
      (u.nombres + ' ' + u.apellidos).toLowerCase().includes(q) ||
      u.correo.toLowerCase().includes(q)
    ) : lista;
  });

  totalPaginas  = computed(() => Math.max(1, Math.ceil(this.usuariosFiltrados().length / this.porPagina)));
  paginas       = computed(() => Array.from({ length: this.totalPaginas() }, (_, i) => i + 1));
  usuariosPag   = computed(() => {
    const ini = (this.paginaActual() - 1) * this.porPagina;
    return this.usuariosFiltrados().slice(ini, ini + this.porPagina);
  });

  setBusqueda(v: string) { this.busqueda.set(v); this.paginaActual.set(1); }
  irAPagina(n: number)   { this.paginaActual.set(n); }

  form = signal<CrearUsuario>({ nombres: '', apellidos: '', correo: '', contrasena: '', rol: 'EMPLEADO', creadoPor: '' });

  private get usuarioActual() { return this.authSvc.session()?.correo ?? ''; }

  // ── Validación ──────────────────────────────────────────────
  errores = computed(() => {
    const f = this.form();
    const e: Record<string, string> = {};
    if (!f.nombres.trim())                e['nombres']    = 'Los nombres son requeridos.';
    else if (f.nombres.length > 100)      e['nombres']    = 'Máximo 100 caracteres.';
    if (!f.apellidos.trim())              e['apellidos']  = 'Los apellidos son requeridos.';
    else if (f.apellidos.length > 100)    e['apellidos']  = 'Máximo 100 caracteres.';
    if (!f.correo.trim())                 e['correo']     = 'El correo es requerido.';
    else if (!EMAIL_REGEX.test(f.correo)) e['correo']     = 'Ingresa un correo válido.';
    else if (f.correo.length > 150)       e['correo']     = 'Máximo 150 caracteres.';
    if (!f.contrasena)                    e['contrasena'] = 'La contraseña es requerida.';
    else if (f.contrasena.length < 8)     e['contrasena'] = 'Mínimo 8 caracteres.';
    else if (f.contrasena.length > 50)    e['contrasena'] = 'Máximo 50 caracteres.';
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

  ngOnInit() { this.cargar(); }

  cargar() {
    this.cargando.set(true);
    this.http.get<Usuario[]>(this.api).subscribe({
      next: data => { this.usuarios.set(data); this.cargando.set(false); },
      error: ()   => { this.usuarios.set(MOCK_USUARIOS); this.cargando.set(false); },
    });
  }

  abrirNuevo() {
    this.form.set({ nombres: '', apellidos: '', correo: '', contrasena: '', rol: 'EMPLEADO', creadoPor: this.usuarioActual });
    this.tocado.set(new Set());
    this.modalAbierto.set(true);
  }

  guardar() {
    this.tocado.set(new Set(['nombres', 'apellidos', 'correo', 'contrasena']));
    if (!this.formValido()) return;
    this.http.post(this.api, this.form())
      .subscribe({ next: () => { this.modalAbierto.set(false); this.cargar(); } });
  }

  cambiarEstado(id: number, estadoActual: string) {
    const nuevoEstado = estadoActual === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    this.http.patch(`${this.api}/${id}/estado`, { estado: nuevoEstado, actualizadoPor: this.usuarioActual })
      .subscribe({ next: () => this.cargar() });
  }

  patchForm(field: keyof CrearUsuario, value: string) {
    this.form.update(f => ({ ...f, [field]: value }));
    this.tocar(field);
  }
}
