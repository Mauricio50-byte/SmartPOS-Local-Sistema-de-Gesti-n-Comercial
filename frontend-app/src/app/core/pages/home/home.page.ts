import { Component, inject, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { Venta, Producto } from '../../models';
import { VentaServices } from '../../services/venta.service';
import { ProductosServices } from '../../services/producto.service';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  private ventaServices = inject(VentaServices);
  private productosServices = inject(ProductosServices);

  // Variables para Chart.js
  public ventasMensualesChart: any;
  public productosMasVendidosChart: any;
  dataLoaded = false;

  // Configuración común para gráficos
  chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#0d9488',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#666',
          font: {
            size: 11
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          color: '#666',
          font: {
            size: 11
          }
        },
        beginAtZero: true
      }
    }
  };

  ngOnInit() {
    this.loadChartData();
  }

  loadChartData() {
    forkJoin({
      ventas: this.ventaServices.listarVentas(),
      productos: this.productosServices.listarProductos()
    }).subscribe(({ ventas, productos }) => {
      this.prepareEmptyVentasMensualesChart();
      this.prepareEmptyProductosMasVendidosChart();
      this.dataLoaded = true;
    }, error => {
      this.prepareEmptyVentasMensualesChart();
      this.prepareEmptyProductosMasVendidosChart();
      this.dataLoaded = true;
    });
  }

  prepareEmptyVentasMensualesChart() {
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    
    this.ventasMensualesChart = {
      type: 'bar',
      data: {
        labels: monthNames,
        datasets: [{
          label: 'Ventas',
          data: Array(12).fill(0),
          backgroundColor: '#e0e0e0',
          borderColor: '#e0e0e0',
          borderWidth: 1,
          borderRadius: 6,
          borderSkipped: false,
        }]
      },
      options: {
        ...this.chartOptions,
        plugins: {
          ...this.chartOptions.plugins,
          title: {
            display: false
          }
        }
      }
    };
  }

  prepareEmptyProductosMasVendidosChart() {
    this.productosMasVendidosChart = {
      type: 'bar',
      data: {
        labels: ['Producto 1', 'Producto 2', 'Producto 3', 'Producto 4', 'Producto 5'],
        datasets: [{
          label: 'Unidades',
          data: Array(5).fill(0),
          backgroundColor: '#e0e0e0',
          borderColor: '#e0e0e0',
          borderWidth: 1,
          borderRadius: 6,
          borderSkipped: false,
        }]
      },
      options: {
        ...this.chartOptions,
        indexAxis: 'y',
        plugins: {
          ...this.chartOptions.plugins,
          title: {
            display: false
          }
        }
      }
    };
  }

  enablePush() {
    console.log('Habilitando notificaciones push...');
  }
}
