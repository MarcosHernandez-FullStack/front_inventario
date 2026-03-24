import { Component, inject, signal, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { NotificacionService, AlertaStock } from '../../core/services/notificacion.service';

const TITLES: Record<string, string> = {
  '/dashboard':  'Dashboard',
  '/productos':  'Productos',
  '/categorias': 'Categorías',
  '/usuarios':   'Usuarios',
  '/reportes':   'Reportes',
};

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.html',
})
export class AdminLayoutComponent implements OnDestroy {
  private readonly authSvc  = inject(AuthService);
  private readonly router   = inject(Router);
  readonly notifSvc         = inject(NotificacionService);

  pageTitle       = signal('Dashboard');
  toastActivo     = signal<AlertaStock | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: NavigationEnd) => {
      const path = '/' + e.urlAfterRedirects.split('/')[1];
      this.pageTitle.set(TITLES[path] ?? 'Inventario');
    });

    // Conectar SignalR y escuchar notificaciones (solo admin las recibe del hub)
    this.notifSvc.conectar();

    // Mostrar toast cuando llegue nueva alerta
    let prevCount = 0;
    setInterval(() => {
      const count = this.notifSvc.alertas().length;
      if (count > prevCount) {
        const ultima = this.notifSvc.alertas()[0];
        this.mostrarToast(ultima);
        prevCount = count;
      }
    }, 500);
  }

  private mostrarToast(alerta: AlertaStock) {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastActivo.set(alerta);
    this.toastTimer = setTimeout(() => this.toastActivo.set(null), 6000);
  }

  cerrarToast() {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastActivo.set(null);
  }

  get session()        { return this.authSvc.session(); }
  get esAdmin()        { return this.authSvc.esAdmin(); }
  get totalNoLeidas()  { return this.notifSvc.totalNoLeidas(); }
  get alertas()        { return this.notifSvc.alertas(); }

  ngOnDestroy() {
    this.notifSvc.desconectar();
  }

  logout() {
    this.notifSvc.desconectar();
    this.authSvc.logout();
    this.router.navigate(['/login']);
  }
}
