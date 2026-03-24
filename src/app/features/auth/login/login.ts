import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LoginRequest } from '../../../models/auth.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
})
export class LoginComponent {
  private readonly authSvc = inject(AuthService);
  private readonly router  = inject(Router);

  correo     = signal('');
  contrasena = signal('');
  error      = signal('');
  cargando   = signal(false);
  year = new Date().getFullYear();

  login() {
    this.error.set('');
    this.cargando.set(true);
    const dto: LoginRequest = { correo: this.correo(), contrasena: this.contrasena() };
    this.authSvc.login(dto).subscribe({
      next: () => this.router.navigate([this.authSvc.esAdmin() ? '/dashboard' : '/productos']),
      error: err => {
        this.error.set(err.error?.mensaje ?? 'Credenciales inválidas.');
        this.cargando.set(false);
      },
    });
  }
}
