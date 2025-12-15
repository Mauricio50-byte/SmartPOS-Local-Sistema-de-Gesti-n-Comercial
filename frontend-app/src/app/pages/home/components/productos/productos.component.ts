import { Component, OnInit } from '@angular/core';
import { ProductosServices } from 'src/app/core/services/producto.service';
import { Producto } from 'src/app/core/models/producto';
import { AlertController, ToastController, LoadingController } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

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

  constructor(
    private productoService: ProductosServices,
    private alertController: AlertController,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private fb: FormBuilder
  ) {
    this.productForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      precio: [0, [Validators.required, Validators.min(0)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      activo: [true]
    });
  }

  ngOnInit() {
    this.loadProducts();
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
    this.productForm.patchValue({
      nombre: product.nombre,
      precio: product.precio,
      stock: product.stock,
      activo: product.activo
    });
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
      nombre: '',
      precio: 0,
      stock: 0,
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
}

