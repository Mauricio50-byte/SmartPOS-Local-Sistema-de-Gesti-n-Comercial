import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductosListaComponent } from './productos-lista.component';
import { IonicModule } from '@ionic/angular';
import { Producto } from 'src/app/core/models/producto';

describe('ProductosListaComponent', () => {
  let component: ProductosListaComponent;
  let fixture: ComponentFixture<ProductosListaComponent>;

  const mockProducts: Producto[] = [
    {
      id: 1,
      nombre: 'Camisa',
      tipo: 'ROPA',
      precioVenta: 20,
      stock: 10,
      activo: true,
      detalleRopa: { talla: 'M', color: 'Azul' }
    },
    {
      id: 2,
      nombre: 'Manzana',
      tipo: 'ALIMENTO',
      precioVenta: 1,
      stock: 100,
      activo: true,
      detalleAlimento: { lote: 'L001' }
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductosListaComponent, IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductosListaComponent);
    component = fixture.componentInstance;
    component.products = mockProducts;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should filter by search term', () => {
    component.searchTerm = 'Camisa';
    component.filterProducts();
    expect(component.filteredProducts.length).toBe(1);
    expect(component.filteredProducts[0].nombre).toBe('Camisa');
  });

  it('should filter by module', () => {
    component.selectedModule = 'ROPA';
    component.filterProducts();
    expect(component.filteredProducts.length).toBe(1);
    expect(component.filteredProducts[0].tipo).toBe('ROPA');
  });

  it('should update columns when module changes', () => {
    // Initial state (TODOS) -> Base columns
    expect(component.displayedColumns.length).toBe(6); // 6 base columns

    // Change to ROPA
    component.selectedModule = 'ROPA';
    component.updateColumns();
    
    // Base (6) + Ropa specific (3) = 9
    expect(component.displayedColumns.length).toBe(9);
    expect(component.displayedColumns.find(c => c.key === 'talla')).toBeTruthy();
  });

  it('should extract nested values correctly', () => {
    const product = mockProducts[0];
    const col = { key: 'talla', label: 'Talla', path: 'detalleRopa.talla' };
    
    const value = component.getValue(product, col);
    expect(value).toBe('M');
  });

  it('should handle missing nested values gracefully', () => {
    const product = mockProducts[1]; // Alimento (no tiene detalleRopa)
    const col = { key: 'talla', label: 'Talla', path: 'detalleRopa.talla' };
    
    const value = component.getValue(product, col);
    expect(value).toBeNull();
  });
});
