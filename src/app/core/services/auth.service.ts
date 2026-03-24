import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { LoginRequest, LoginResponse } from '../../models/auth.model';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';

const SESSION_KEY = 'inv_session';
const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  readonly session = signal<LoginResponse | null>(
    JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null')
  );

  login(dto: LoginRequest) {
    return this.http.post<LoginResponse>(`${API}/auth/login`, dto).pipe(
      tap(resp => {
        localStorage.setItem(SESSION_KEY, JSON.stringify(resp));
        this.session.set(resp);
      })
    );
  }

  logout() {
    localStorage.removeItem(SESSION_KEY);
    this.session.set(null);
  }

  get token(): string | null {
    return this.session()?.token ?? null;
  }

  get rol(): string | null {
    return this.session()?.rol ?? null;
  }

  esAdmin(): boolean {
    return this.rol === 'ADMINISTRADOR';
  }
}
