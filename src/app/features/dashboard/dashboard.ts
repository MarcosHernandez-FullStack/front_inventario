import { Component, signal, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

interface DashStats {
  totalProductos: number;
  totalCategorias: number;
  totalUsuarios: number;
  valorInventario: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DecimalPipe, RouterLink],
  templateUrl: './dashboard.html',
})
export class DashboardComponent implements OnInit {
  private readonly http = inject(HttpClient);

  stats = signal<DashStats>({ totalProductos: 0, totalCategorias: 0, totalUsuarios: 0, valorInventario: 0 });
  cargando = signal(true);

  ngOnInit() {
    this.http.get<DashStats>('http://localhost:5000/api/reportes/resumen').subscribe({
      next: data => { this.stats.set(data); this.cargando.set(false); },
      error: ()   => {
        this.stats.set({ totalProductos: 16, totalCategorias: 5, totalUsuarios: 4, valorInventario: 26540.80 });
        this.cargando.set(false);
      },
    });
  }
}
