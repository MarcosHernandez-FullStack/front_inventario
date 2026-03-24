import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then(m => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layouts/admin-layout/admin-layout').then(m => m.AdminLayoutComponent),
    children: [
      { path: 'dashboard',  loadComponent: () => import('./features/dashboard/dashboard').then(m => m.DashboardComponent) },
      { path: 'productos',  loadComponent: () => import('./features/productos/lista-productos/lista-productos').then(m => m.ListaProductosComponent) },
      { path: 'reportes',   loadComponent: () => import('./features/reportes/reportes').then(m => m.ReportesComponent) },
      {
        path: 'categorias',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/categorias/lista-categorias/lista-categorias').then(m => m.ListaCategoriasComponent),
      },
      {
        path: 'usuarios',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/usuarios/lista-usuarios/lista-usuarios').then(m => m.ListaUsuariosComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
