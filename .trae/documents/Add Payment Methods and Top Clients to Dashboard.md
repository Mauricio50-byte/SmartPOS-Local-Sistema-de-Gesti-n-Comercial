I will add two new sections to the dashboard to fill the empty space: **"Métodos de Pago"** (Payment Methods Chart) and **"Mejores Clientes"** (Top Customers Table). I will also fix a bug where the Category Distribution chart was receiving empty data.

### 1. Update Dashboard Logic (`dashboard.component.ts`)
*   Store raw `ventas` and `productos` data to pass to child components.
*   Add `topClients` and `paymentChartData` properties.
*   Implement `processTopClients(ventas)`:
    *   Group sales by customer.
    *   Calculate total spent and number of purchases.
    *   Sort by total spent and select top 5.
*   Implement `processPaymentMethods(ventas)`:
    *   Group sales by `metodoPago`.
    *   Generate Doughnut Chart data showing revenue share per payment method.

### 2. Update Dashboard Template (`dashboard.component.html`)
*   **Fix Category Component**: Update `<app-category-distribution>` to pass the actual `ventas` and `productos` arrays.
*   **Add Payment Methods Panel**:
    *   Title: "Métodos de Pago".
    *   Content: Doughnut chart showing distribution (Cash, Card, Transfer, etc.).
*   **Add Top Clients Panel**:
    *   Title: "Mejores Clientes".
    *   Content: Table listing Client Name, Total Purchases, and Total Amount.

### 3. Update Dashboard Styles (`dashboard.component.scss`)
*   Define grid positions for the new panels in the desktop layout (min-width: 1024px and 1280px).
*   **Layout Strategy**:
    *   Row 3 (Bottom):
        *   `category-panel`: 1 column.
        *   `payment-panel`: 1 column.
        *   `top-clients-panel`: 2 columns.
    *   This will fill the 4-column grid completely.
