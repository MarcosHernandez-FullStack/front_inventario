import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DecimalPipe, DatePipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { NotificacionService } from '../../core/services/notificacion.service';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { environment } from '../../../environments/environment';

const MOCK_REPORTE = [
  { categoria: 'Computadoras',   totalProductos: 3, stockTotal: 25, valorTotal: 12450.50 },
  { categoria: 'Monitores',      totalProductos: 2, stockTotal: 18, valorTotal: 4320.00  },
  { categoria: 'Periféricos',    totalProductos: 5, stockTotal: 64, valorTotal: 2890.30  },
  { categoria: 'Almacenamiento', totalProductos: 4, stockTotal: 30, valorTotal: 5100.00  },
  { categoria: 'Audio',          totalProductos: 2, stockTotal: 9,  valorTotal: 1780.00  },
];

const MOCK_BAJO_STOCK = [
  { id: 3, nombre: 'Teclado Mecánico',  descripcion: 'Switch Blue', precio: 189.90, cantidad: 3, idCategoria: 3, nombreCategoria: 'Periféricos',  estado: 'ACTIVO' },
  { id: 6, nombre: 'Auriculares Sony',  descripcion: 'Noise Cancelling', precio: 899.00, cantidad: 4, idCategoria: 5, nombreCategoria: 'Audio', estado: 'ACTIVO' },
  { id: 5, nombre: 'Disco SSD 1TB',     descripcion: 'Samsung 870 EVO',  precio: 399.00, cantidad: 5, idCategoria: 4, nombreCategoria: 'Almacenamiento', estado: 'ACTIVO' },
];

interface ReporteItem {
  categoria:      string;
  totalProductos: number;
  stockTotal:     number;
  valorTotal:     number;
}

interface ProductoBajoStock {
  id:              number;
  nombre:          string;
  descripcion:     string;
  precio:          number;
  cantidad:        number;
  nombreCategoria: string;
}

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './reportes.html',
})
export class ReportesComponent implements OnInit {
  private readonly http    = inject(HttpClient);
  private readonly authSvc = inject(AuthService);
  private readonly api     = `${environment.apiUrl}/reportes`;

  esAdmin    = computed(() => this.authSvc.esAdmin());
  notifSvc   = inject(NotificacionService);
  notificando = signal(false);
  notificado  = signal(false);

  datos      = signal<ReporteItem[]>([]);
  bajoStock  = signal<ProductoBajoStock[]>([]);
  cargando   = signal(false);
  generando  = signal(false);
  error      = signal('');

  ngOnInit() { this.cargar(); }

  cargar() {
    this.cargando.set(true);
    this.http.get<ReporteItem[]>(`${this.api}/stock-por-categoria`).subscribe({
      next: data => { this.datos.set(data); this.cargando.set(false); },
      error: ()   => { this.datos.set(MOCK_REPORTE); this.cargando.set(false); },
    });
    this.http.get<ProductoBajoStock[]>(`${this.api}/bajo-stock`).subscribe({
      next: data => this.bajoStock.set(data),
      error: ()  => this.bajoStock.set(MOCK_BAJO_STOCK),
    });
  }

  notificarAdmin() {
    if (this.bajoStock().length === 0) return;
    this.notificando.set(true);
    const productos = this.bajoStock().map(p => ({ nombre: p.nombre, cantidad: p.cantidad }));
    const reportadoPor = this.authSvc.session()?.correo ?? 'Empleado';
    this.http.post(`${this.api.replace('/reportes', '')}/notificaciones/reportar`, { reportadoPor, productos })
      .subscribe({
        next: () => {
          this.notificando.set(false);
          this.notificado.set(true);
          setTimeout(() => this.notificado.set(false), 4000);
        },
        error: () => this.notificando.set(false),
      });
  }

  get totalProductos() { return this.datos().reduce((s, r) => s + r.totalProductos, 0); }
  get stockTotal()     { return this.datos().reduce((s, r) => s + r.stockTotal, 0); }
  get valorTotal()     { return this.datos().reduce((s, r) => s + r.valorTotal, 0); }

  generarPDF() {
    this.generando.set(true);
    const doc  = new jsPDF();
    const hoy  = new Date();
    const fecha = hoy.toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' });
    const hora  = hoy.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

    // Encabezado
    doc.setFillColor(27, 42, 78);
    doc.rect(0, 0, 210, 32, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Reporte de Inventario Bajo', 14, 14);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generado el ${fecha} a las ${hora}`, 14, 23);

    // Badge de alerta
    doc.setFillColor(220, 53, 69);
    doc.roundedRect(140, 8, 56, 14, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`${this.bajoStock().length} productos en alerta`, 168, 17, { align: 'center' });

    // Tabla de productos con bajo stock
    doc.setTextColor(27, 42, 78);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Productos con Stock Bajo (<= 5 unidades)', 14, 44);

    const filas = this.bajoStock().map(p => [
      p.nombre,
      p.nombreCategoria,
      `S/ ${p.precio.toFixed(2)}`,
      { content: String(p.cantidad), styles: { textColor: [220, 53, 69] as [number,number,number], fontStyle: 'bold' as const } },
    ]);

    autoTable(doc, {
      startY: 48,
      head: [['Producto', 'Categoría', 'Precio', 'Stock']],
      body: filas,
      headStyles: {
        fillColor: [59, 108, 248],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: { fontSize: 9, textColor: [30, 42, 59] },
      alternateRowStyles: { fillColor: [245, 247, 255] },
      columnStyles: {
        0: { cellWidth: 75 },
        1: { cellWidth: 45 },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 20, halign: 'center' },
      },
      margin: { left: 14, right: 14 },
    });

    // Resumen por categoría
    const finalY = (doc as any).lastAutoTable.finalY + 12;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(27, 42, 78);
    doc.text('Resumen por Categoría', 14, finalY);

    autoTable(doc, {
      startY: finalY + 4,
      head: [['Categoría', 'Productos', 'Stock Total', 'Valor (S/)']],
      body: this.datos().map(r => [
        r.categoria,
        r.totalProductos,
        r.stockTotal,
        `S/ ${r.valorTotal.toFixed(2)}`,
      ]),
      foot: [['Total', this.totalProductos, this.stockTotal, `S/ ${this.valorTotal.toFixed(2)}`]],
      headStyles: { fillColor: [59, 108, 248], textColor: 255, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: [30, 42, 59] },
      footStyles: { fillColor: [232, 236, 244], textColor: [27, 42, 78], fontStyle: 'bold', fontSize: 9 },
      alternateRowStyles: { fillColor: [245, 247, 255] },
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'right' },
      },
      margin: { left: 14, right: 14 },
    });

    // Pie de página
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.setFont('helvetica', 'normal');
      doc.text('Sistema de Inventario — Documento generado automáticamente', 14, 290);
      doc.text(`Página ${i} de ${pageCount}`, 196, 290, { align: 'right' });
    }

    doc.save(`reporte-inventario-bajo-${hoy.toISOString().slice(0,10)}.pdf`);
    this.generando.set(false);
  }
}
