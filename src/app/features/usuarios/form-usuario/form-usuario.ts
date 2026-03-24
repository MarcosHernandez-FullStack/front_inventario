import { Component, Output, EventEmitter, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CrearUsuario } from '../../../models/usuario.model';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Component({
  selector: 'app-form-usuario',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './form-usuario.html',
})
export class FormUsuarioComponent {
  @Output() guardado  = new EventEmitter<Omit<CrearUsuario, 'creadoPor'>>();
  @Output() cancelado = new EventEmitter<void>();

  form   = signal<Omit<CrearUsuario, 'creadoPor'>>({ nombres: '', apellidos: '', correo: '', contrasena: '', rol: 'EMPLEADO' });
  tocado = signal<Set<string>>(new Set());

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

  tocar(campo: string) { this.tocado.update(s => new Set(s).add(campo)); }
  err(campo: string)   { return this.tocado().has(campo) ? this.errores()[campo] : ''; }

  patch(field: keyof Omit<CrearUsuario, 'creadoPor'>, value: string) {
    this.form.update(f => ({ ...f, [field]: value }));
    this.tocar(field);
  }

  guardar() {
    this.tocado.set(new Set(['nombres', 'apellidos', 'correo', 'contrasena']));
    if (!this.formValido()) return;
    this.guardado.emit(this.form());
  }
}
