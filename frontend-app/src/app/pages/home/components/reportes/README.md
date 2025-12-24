# Módulo de Reportes

Este directorio contiene la implementación centralizada del sistema de reportes para SmartPOS.

## Estructura

- **reportes.module.ts**: Módulo principal que declara los componentes y gestiona las importaciones.
- **reportes.component.ts**: Componente principal (Dashboard) que visualiza los KPIs, gráficos y tablas.
- **services/reportes.service.ts**: Servicio encargado de la obtención, agregación y cálculo de métricas, así como de la exportación de datos.

## Flujo de Datos

1. **Carga de Datos**: `ReportesService` obtiene datos crudos de `VentaServices` y `ProductosServices` utilizando `forkJoin`.
2. **Procesamiento**: Los datos se procesan en `calculateMetrics` para generar estadísticas por categoría (volumen, ingresos, costos, margen, crecimiento).
3. **Visualización**: `ReportesComponent` consume estos datos y los presenta en:
   - Tarjetas de KPIs (Totales).
   - Gráficos de barras (Ingresos vs Costos).
   - Gráficos circulares (Distribución de ventas).
   - Tabla interactiva con búsqueda y ordenamiento.

## Dependencias

- **chart.js** & **ng2-charts**: Para la visualización de gráficos.
- **jspdf** & **jspdf-autotable**: Para la generación de reportes en PDF.
- **xlsx** & **file-saver**: Para la exportación de datos a Excel.

## Guía de Uso

### Agregar un nuevo reporte

1. Modificar `ReportMetric` en `reportes.service.ts` si se requieren nuevos campos.
2. Implementar la lógica de cálculo en `calculateMetrics` o crear un nuevo método en el servicio.
3. Actualizar `ReportesComponent` para mostrar la nueva información (ej. agregar un nuevo gráfico).

### Exportación

La exportación se maneja en `ReportesService`.
- `exportToPDF(data)`: Genera un PDF con una tabla formateada.
- `exportToExcel(data)`: Genera un archivo Excel (.xlsx) con los datos crudos.

## Ejemplos de Implementación

### Consumir el servicio

```typescript
this.reportesService.getGeneralReport().subscribe(data => {
  console.log(data.metrics); // Array de métricas por categoría
  console.log(data.totalRevenue); // Ingresos totales
});
```
