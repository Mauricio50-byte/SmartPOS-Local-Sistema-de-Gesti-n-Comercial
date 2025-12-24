import { Component, OnInit, inject } from '@angular/core';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { forkJoin } from 'rxjs';
import { VentaServices } from '../../../../core/services/venta.service';
import { ProductosServices } from '../../../../core/services/producto.service';

interface CategoryMetric {
  name: string;
  salesVolume: number; // Units
  revenue: number; // Money
  cost: number; // Money
  margin: number; // %
  growth: number; // % vs previous period
  share: number; // % of total revenue
}

@Component({
  selector: 'app-reporte-categorias',
  templateUrl: './reporte-categorias.component.html',
  styleUrls: ['./reporte-categorias.component.scss'],
  standalone: false
})
export class ReporteCategoriasComponent implements OnInit {
  private ventaService = inject(VentaServices);
  private productoService = inject(ProductosServices);

  metrics: CategoryMetric[] = [];
  dataLoaded = false;
  
  // Charts
  public barChartData: ChartData<'bar'> | undefined;
  public pieChartData: ChartData<'pie'> | undefined;
  
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    }
  };

  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' }
    }
  };

  public sortColumn: keyof CategoryMetric = 'revenue';
  public sortDirection: 'asc' | 'desc' = 'desc';

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.dataLoaded = false;
    forkJoin({
      ventas: this.ventaService.listarVentas(),
      productos: this.productoService.listarProductos()
    }).subscribe({
      next: ({ ventas, productos }) => {
        this.calculateMetrics(ventas, productos);
        this.prepareCharts();
        this.dataLoaded = true;
      },
      error: (err) => console.error('Error loading report data', err)
    });
  }

  calculateMetrics(ventas: any[], productos: any[]) {
    const productMap = new Map(productos.map(p => [p.id, p]));
    const categoryStats: Record<string, { 
      volume: number, 
      revenue: number, 
      cost: number, 
      prevRevenue: number 
    }> = {};

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonth = prevMonthDate.getMonth();
    const prevYear = prevMonthDate.getFullYear();

    let totalRevenue = 0;

    ventas.forEach(v => {
      const vDate = new Date(v.fecha);
      const isCurrentPeriod = vDate.getMonth() === currentMonth && vDate.getFullYear() === currentYear;
      const isPrevPeriod = vDate.getMonth() === prevMonth && vDate.getFullYear() === prevYear;

      // Skip if not in analysis window (e.g., last 2 months for growth calc)
      if (!isCurrentPeriod && !isPrevPeriod) return;

      const items = v.items || v.detalles || [];
      items.forEach((item: any) => {
        const pId = item.producto?.id || item.productoId;
        const product = productMap.get(pId);
        if (!product) return;

        const cat = product.categoria || product.tipo || 'General';
        const qty = item.cantidad || 1;
        const itemRevenue = Number(item.total) || 0;
        // Cost estimation: if priceCosto exists, use it, else 0 (margin = 100% or exclude?)
        // Let's assume cost is priceCosto * qty
        const unitCost = product.precioCosto || 0;
        const itemCost = unitCost * qty;

        if (!categoryStats[cat]) {
          categoryStats[cat] = { volume: 0, revenue: 0, cost: 0, prevRevenue: 0 };
        }

        if (isCurrentPeriod) {
          categoryStats[cat].volume += qty;
          categoryStats[cat].revenue += itemRevenue;
          categoryStats[cat].cost += itemCost;
          totalRevenue += itemRevenue;
        } else if (isPrevPeriod) {
          categoryStats[cat].prevRevenue += itemRevenue;
        }
      });
    });

    this.metrics = Object.entries(categoryStats).map(([name, stats]) => {
      const margin = stats.revenue > 0 ? ((stats.revenue - stats.cost) / stats.revenue) * 100 : 0;
      const growth = stats.prevRevenue > 0 ? ((stats.revenue - stats.prevRevenue) / stats.prevRevenue) * 100 : 0; // Or 100% if prev was 0
      const share = totalRevenue > 0 ? (stats.revenue / totalRevenue) * 100 : 0;

      return {
        name,
        salesVolume: stats.volume,
        revenue: stats.revenue,
        cost: stats.cost,
        margin,
        growth,
        share
      };
    });

    this.sortMetrics();
  }

  prepareCharts() {
    const labels = this.metrics.map(m => m.name);
    
    // Bar Chart: Revenue vs Cost (or just Revenue)
    this.barChartData = {
      labels,
      datasets: [
        {
          data: this.metrics.map(m => m.revenue),
          label: 'Ventas ($)',
          backgroundColor: '#3880ff',
          borderRadius: 4
        },
        {
          data: this.metrics.map(m => m.cost),
          label: 'Costo ($)',
          backgroundColor: '#eb445a',
          borderRadius: 4,
          hidden: true // Hide by default to keep it clean
        }
      ]
    };

    // Pie Chart: Share
    this.pieChartData = {
      labels,
      datasets: [{
        data: this.metrics.map(m => m.share),
        backgroundColor: [
          '#3880ff', '#3dc2ff', '#5260ff', '#2dd36f', '#ffc409', '#eb445a', '#92949c'
        ]
      }]
    };
  }

  sortMetrics() {
    this.metrics.sort((a, b) => {
      const valA = a[this.sortColumn];
      const valB = b[this.sortColumn];
      
      if (typeof valA === 'number' && typeof valB === 'number') {
        return this.sortDirection === 'asc' ? valA - valB : valB - valA;
      }
      return 0; // String sort not implemented for simplicity
    });
  }

  toggleSort(column: keyof CategoryMetric) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'desc';
    }
    this.sortMetrics();
  }

  getBestCategory(): CategoryMetric | null {
    if (!this.metrics.length) return null;
    return [...this.metrics].sort((a, b) => b.revenue - a.revenue)[0];
  }

  getWorstCategory(): CategoryMetric | null {
    if (!this.metrics.length) return null;
    return [...this.metrics].sort((a, b) => a.revenue - b.revenue)[0];
  }
}
