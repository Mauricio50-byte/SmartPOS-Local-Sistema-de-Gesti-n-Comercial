import { Component, inject, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { VentaServices } from '../../../../core/services/venta.service';
import { ProductosServices } from '../../../../core/services/producto.service';
import { ClientesServices } from '../../../../core/services/cliente.service';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: false
})
export class DashboardComponent implements OnInit {
  private ventaServices = inject(VentaServices);
  private productosServices = inject(ProductosServices);
  private clientesServices = inject(ClientesServices);

  // KPIs
  totalIngresos = 0;
  totalVentas = 0;
  nuevosClientes = 0;
  
  // Charts Data
  public ventasChartData: ChartData<'bar'> | undefined;
  public productosChartData: ChartData<'bar'> | undefined;
  public categoriasChartData: ChartData<'doughnut'> | undefined;

  public barChartType: ChartType = 'bar';
  public doughnutChartType: ChartType = 'doughnut';

  dataLoaded = false;
  timeFilter: 'week' | 'month' | 'year' = 'month';

  // Configuración de Gráficos
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#1f2937',
        bodyColor: '#4b5563',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        displayColors: false
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#6b7280', font: { size: 12 } }
      },
      y: {
        grid: { color: '#f3f4f6' },
        ticks: { color: '#6b7280', font: { size: 12 } },
        beginAtZero: true
      }
    }
  };

  public doughnutChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } }
    }
  };

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.dataLoaded = false;
    forkJoin({
      ventas: this.ventaServices.listarVentas(),
      productos: this.productosServices.listarProductos(),
      clientes: this.clientesServices.listarClientes()
    }).subscribe({
      next: ({ ventas, productos, clientes }) => {
        this.processMetrics(ventas, clientes);
        this.processSalesChart(ventas);
        this.processTopProductsChart(ventas, productos);
        this.processCategoriesChart(ventas, productos);
        this.dataLoaded = true;
      },
      error: (err) => {
        console.error('Error loading dashboard data', err);
        this.dataLoaded = true;
      }
    });
  }

  private processMetrics(ventas: any[], clientes: any[]) {
    // Total Ingresos (Sum of total paid)
    this.totalIngresos = ventas.reduce((acc, v) => acc + (Number(v.total) || 0), 0);
    
    // Total Ventas
    this.totalVentas = ventas.length;

    // Nuevos Clientes (Last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    this.nuevosClientes = clientes.filter(c => {
      const createdAt = c.createdAt ? new Date(c.createdAt) : new Date(); // Fallback if no date
      return createdAt >= thirtyDaysAgo;
    }).length;
  }

  private processSalesChart(ventas: any[]) {
    // Group by month (last 12 months) or day depending on filter
    // For simplicity, let's do monthly sales for the current year
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const salesByMonth = new Array(12).fill(0);

    ventas.forEach(v => {
      const date = new Date(v.fecha);
      const month = date.getMonth();
      const year = date.getFullYear();
      if (year === new Date().getFullYear()) {
        salesByMonth[month] += Number(v.total) || 0;
      }
    });

    this.ventasChartData = {
      labels: months,
      datasets: [
        {
          data: salesByMonth,
          label: 'Ventas',
          backgroundColor: '#3880ff',
          borderRadius: 4,
          hoverBackgroundColor: '#3dc2ff'
        }
      ]
    };
  }

  private processTopProductsChart(ventas: any[], productos: any[]) {
    const productSales: Record<number, number> = {};

    ventas.forEach(v => {
      if (v.items && Array.isArray(v.items)) {
        v.items.forEach((item: any) => {
          // Assuming item has productoId and cantidad (or derived from structure)
          // Adjust based on actual data structure from VentaService
          const pId = item.producto?.id || item.productoId; 
          const qty = item.cantidad || 1;
          if (pId) {
            productSales[pId] = (productSales[pId] || 0) + qty;
          }
        });
      } else if (v.detalles && Array.isArray(v.detalles)) {
         // Fallback for different structure
         v.detalles.forEach((d: any) => {
            const pId = d.producto?.id || d.productoId;
            const qty = d.cantidad || 1;
            if (pId) productSales[pId] = (productSales[pId] || 0) + qty;
         });
      }
    });

    // Sort and take top 5
    const sortedProducts = Object.entries(productSales)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    const labels = sortedProducts.map(([id]) => {
      const p = productos.find(prod => prod.id === Number(id));
      return p ? p.nombre : `Producto #${id}`;
    });

    const data = sortedProducts.map(([, qty]) => qty);

    this.productosChartData = {
      labels,
      datasets: [
        {
          data,
          label: 'Unidades Vendidas',
          backgroundColor: '#2dd36f',
          borderRadius: 4,
          indexAxis: 'y'
        }
      ]
    };
  }

  private processCategoriesChart(ventas: any[], productos: any[]) {
    const categorySales: Record<string, number> = {};
    const productMap = new Map(productos.map(p => [p.id, p]));

    ventas.forEach(v => {
      const items = v.items || v.detalles || [];
      items.forEach((item: any) => {
        const pId = item.producto?.id || item.productoId;
        const product = productMap.get(pId);
        if (product) {
          const cat = product.categoria || product.tipo || 'General';
          categorySales[cat] = (categorySales[cat] || 0) + (Number(item.total) || 0);
        }
      });
    });

    const labels = Object.keys(categorySales);
    const data = Object.values(categorySales);

    this.categoriasChartData = {
      labels,
      datasets: [
        {
          data,
          backgroundColor: ['#3880ff', '#3dc2ff', '#5260ff', '#2dd36f', '#ffc409', '#eb445a'],
          hoverOffset: 4
        }
      ]
    };
  }

  onFilterChange(event: any) {
    this.timeFilter = event.detail.value;
    // Implement filter logic here (reload data with params)
    this.loadDashboardData();
  }
}
