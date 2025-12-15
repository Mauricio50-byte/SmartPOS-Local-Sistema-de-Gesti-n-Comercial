import { Component, OnInit } from '@angular/core';
import { ProductosServices } from 'src/app/core/services/producto.service';
import { Producto } from 'src/app/core/models/producto';
import { AlertController, ToastController, LoadingController } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModuloService, Modulo } from 'src/app/core/services/modulo.service';

@Component({
  standalone: false,
  selector: 'app-productos',
  templateUrl: './productos.component.html',
  styleUrls: ['./productos.component.scss'],
})
export class ProductosComponent implements OnInit {
  segment: 'info' | 'gestion' = 'info';
  products: Producto[] = [];
  filteredProducts: Producto[] = [];
  searchTerm: string = '';

  productForm: FormGroup;
  isEditing: boolean = false;
  selectedProduct: Producto | null = null;
  
  modulosActivos: Set<string> = new Set();

  constructor(
    private productoService: ProductosServices,
    private moduloService: ModuloService,
    private alertController: AlertController,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private fb: FormBuilder
  ) {
    this.productForm = this.fb.group({
      // Tipo de Item
      tipo: ['GENERAL', Validators.required],

      // Identificación
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      sku: [''],

      // Descripción
      descripcion: [''],
      imagen: [''],

      // Categorización
      categoria: [''],
      subcategoria: [''],
      marca: [''],

      // Precios y Costos
      precioCosto: [0, [Validators.min(0)]],
      precioVenta: [0, [Validators.required, Validators.min(0)]],
      descuento: [0, [Validators.min(0), Validators.max(100)]],

      // Inventario
      stock: [0, [Validators.required, Validators.min(0)]],
      stockMinimo: [0, [Validators.min(0)]],
      unidadMedida: [''],

      // Campos específicos para alimentos
      fechaVencimiento: [''],
      lote: [''],
      registroSanitario: [''],
      ingredientes: [''],
      esPerecedero: [true],
      temperaturaConservacion: [''],

      // Campos para ropa
      talla: [''],
      color: [''],
      material: [''],
      genero: [''],
      temporada: [''],

      // Campos específicos para servicios
      duracion: [null, [Validators.min(1)]],
      responsable: [''],
      requiereCita: [false],
      garantiaDias: [0],
      disponible: [true],

      // Campos específicos para farmacia
      componenteActivo: [''],
      presentacion: [''],
      dosis: [''],
      laboratorio: [''],
      requiereReceta: [false],
      registroInvima: [''], // Reutilizado o nuevo campo

      // Campos específicos para papelería
      tipoPapel: [''],
      gramaje: [''],
      dimensiones: [''],
      esKit: [false],

      // Campos específicos para restaurante
      tiempoPreparacion: [null],
      esVegano: [false],
      esVegetariano: [false],
      tieneAlcohol: [false],
      calorias: [null],

      // Impuestos
      iva: [0, [Validators.min(0), Validators.max(100)]],

      // Proveedor
      proveedor: [''],

      // Notas adicionales
      notas: [''],

      // Estado
      activo: [true]
    });
  }

  ngOnInit() {
    this.loadProducts();
    this.loadModulos();
  }

  loadModulos() {
    this.moduloService.listarModulos().subscribe(modulos => {
      modulos.forEach(m => {
        if (m.activo) this.modulosActivos.add(m.id);
      });
    });
  }

  segmentChanged(event: any) {
    this.segment = event.detail.value;
    if (this.segment === 'info') {
      this.loadProducts();
      this.resetForm();
    }
  }

  loadProducts() {
    this.productoService.listarProductos().subscribe({
      next: (data) => {
        this.products = data;
        this.filteredProducts = data;
      },
      error: (err) => {
        console.error('Error loading products', err);
        this.mostrarToast('Error al cargar productos');
      }
    });
  }

  onSearch(event: any) {
    const term = event.target.value;
    this.searchTerm = term;
    if (!term) {
      this.filteredProducts = this.products;
      return;
    }

    this.filteredProducts = this.products.filter(p =>
      p.nombre.toLowerCase().includes(term.toLowerCase())
    );
  }

  async saveProduct() {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    const loading = await this.loadingController.create({ message: 'Guardando...' });
    await loading.present();

    const productData = this.productForm.value;

    if (this.isEditing && this.selectedProduct) {
      this.productoService.actualizarProductos(productData, this.selectedProduct.id).subscribe({
        next: async () => {
          await loading.dismiss();
          this.mostrarToast('Producto actualizado correctamente');
          this.resetForm();
          this.segment = 'info';
          this.loadProducts();
        },
        error: async (err) => {
          await loading.dismiss();
          console.error(err);
          this.mostrarToast('Error al actualizar producto');
        }
      });
    } else {
      this.productoService.crearProductos(productData).subscribe({
        next: async () => {
          await loading.dismiss();
          this.mostrarToast('Producto creado correctamente');
          this.resetForm();
          this.segment = 'info';
          this.loadProducts();
        },
        error: async (err) => {
          await loading.dismiss();
          console.error(err);
          this.mostrarToast('Error al crear producto');
        }
      });
    }
  }

  editProduct(product: Producto) {
    this.isEditing = true;
    this.selectedProduct = product;
    
    // Flatten nested objects for form
    const formValue: any = {
      tipo: product.tipo || 'GENERAL',
      nombre: product.nombre,
      sku: product.sku || '',
      descripcion: product.descripcion || '',
      imagen: product.imagen || '',
      categoria: product.categoria || '',
      subcategoria: product.subcategoria || '',
      marca: product.marca || '',
      precioCosto: product.precioCosto || 0,
      precioVenta: product.precioVenta,
      descuento: product.descuento || 0,
      stock: product.stock,
      stockMinimo: product.stockMinimo || 0,
      unidadMedida: product.unidadMedida || '',
      iva: product.iva || 0,
      proveedor: product.proveedor || '',
      activo: product.activo
    };

    // Merge extension fields
    if (product.detalleRopa) Object.assign(formValue, product.detalleRopa);
    if (product.detalleAlimento) Object.assign(formValue, product.detalleAlimento);
    if (product.detalleServicio) Object.assign(formValue, product.detalleServicio);
    if (product.detalleFarmacia) Object.assign(formValue, product.detalleFarmacia);
    if (product.detallePapeleria) Object.assign(formValue, product.detallePapeleria);
    if (product.detalleRestaurante) Object.assign(formValue, product.detalleRestaurante);

    this.productForm.patchValue(formValue);
    this.segment = 'gestion';
  }

  async deleteConfirm(product: Producto) {
    const alert = await this.alertController.create({
      header: 'Confirmar Eliminación',
      message: `¿Estás seguro de eliminar el producto <strong>${product.nombre}</strong>?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.deleteProduct(product.id);
          }
        }
      ]
    });
    await alert.present();
  }

  deleteProduct(id: number) {
    this.productoService.eliminarProductos(id).subscribe({
      next: () => {
        this.mostrarToast('Producto eliminado');
        this.loadProducts();
      },
      error: (err) => {
        console.error(err);
        this.mostrarToast('Error al eliminar producto');
      }
    });
  }

  resetForm() {
    this.isEditing = false;
    this.selectedProduct = null;
    this.productForm.reset({
      tipo: 'GENERAL',
      nombre: '',
      sku: '',
      descripcion: '',
      imagen: '',
      categoria: '',
      subcategoria: '',
      marca: '',
      precioCosto: 0,
      precioVenta: 0,
      descuento: 0,
      stock: 0,
      stockMinimo: 0,
      unidadMedida: '',
      fechaVencimiento: '',
      lote: '',
      registroSanitario: '',
      ingredientes: '',
      esPerecedero: true,
      temperaturaConservacion: '',
      talla: '',
      color: '',
      material: '',
      genero: '',
      temporada: '',
      duracion: null,
      responsable: '',
      requiereCita: false,
      garantiaDias: 0,
      disponible: true,
      componenteActivo: '',
      presentacion: '',
      dosis: '',
      laboratorio: '',
      requiereReceta: false,
      registroInvima: '',
      tipoPapel: '',
      gramaje: '',
      dimensiones: '',
      esKit: false,
      tiempoPreparacion: null,
      esVegano: false,
      esVegetariano: false,
      tieneAlcohol: false,
      calorias: null,
      iva: 0,
      proveedor: '',
      notas: '',
      activo: true
    });
  }

  async mostrarToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom'
    });
    toast.present();
  }
  
  isModuleActive(moduleId: string): boolean {
    return this.modulosActivos.has(moduleId);
  }
}
