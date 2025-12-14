import { Component, OnInit } from '@angular/core';
import { VentaServices } from 'src/app/core/services/venta.service';
import { ProductosServices } from 'src/app/core/services/producto.service';
import { Venta } from '../../core/models/venta';
import { Producto } from '../../core/models/producto';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';

@Component({
  standalone: false,
  selector: 'app-ventas',
  templateUrl: './ventas.page.html',
  styleUrls: ['./ventas.page.scss'],
})
export class VentasPage implements OnInit {

  ventaForm: FormGroup;
  productos: Producto[] = [];
  filteredProductos: Producto[] = [];
  searchTerm: string = '';

  currentUserId: number = 1; // TODO: Get from AuthService

  constructor(
    private ventaService: VentaServices,
    private productoService: ProductosServices,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private fb: FormBuilder
  ) {
    this.ventaForm = this.fb.group({
      fecha: [new Date().toISOString(), Validators.required],
      usuarioId: [this.currentUserId, Validators.required],
      total: [0, [Validators.required, Validators.min(0)]],
      clienteId: [null],
      metodoPago: ['Efectivo', Validators.required],
      detalles: this.fb.array([], Validators.required)
    });
  }

  ngOnInit() {
    this.loadProducts();
  }

  get detalles(): FormArray {
    return this.ventaForm.get('detalles') as FormArray;
  }

  get totalControl(): AbstractControl {
    return this.ventaForm.get('total')!;
  }

  get paymentMethodControl(): AbstractControl {
    return this.ventaForm.get('metodoPago')!;
  }

  loadProducts() {
    this.productoService.listarProductos().subscribe({
      next: (data) => {
        this.productos = data;
        this.filteredProductos = data;
      },
      error: (err) => {
        console.error('Error cargando productos', err);
        this.mostrarToast('Error al cargar productos');
      }
    });
  }

  onSearch(event: any) {
    const term = event.target.value;
    this.searchTerm = term;
    if (!term) {
      this.filteredProductos = this.productos;
      return;
    }

    this.filteredProductos = this.productos.filter(p =>
      p.nombre.toLowerCase().includes(term.toLowerCase())
    );
  }

  addToCart(product: Producto) {
    const existingIndex = this.detalles.controls.findIndex(
      (ctrl) => ctrl.value.product.id === product.id
    );

    if (existingIndex > -1) {
      const control = this.detalles.at(existingIndex);
      const newQuantity = control.value.quantity + 1;
      control.patchValue({
        quantity: newQuantity,
        total: newQuantity * product.precio
      });
    } else {
      const detalleGroup = this.fb.group({
        product: [product],
        productoId: [product.id, Validators.required],
        quantity: [1, [Validators.required, Validators.min(1)]],
        precioUnitario: [product.precio, Validators.required],
        total: [product.precio, Validators.required]
      });
      this.detalles.push(detalleGroup);
    }
    this.calculateTotal();
  }

  removeFromCart(index: number) {
    this.detalles.removeAt(index);
    this.calculateTotal();
  }

  updateQuantity(event: { item: any, quantity: number }, index: number) {
    // Nota: 'item' aqui es el value del formGroup
    const control = this.detalles.at(index);
    if (control) {
      const product = control.value.product;
      control.patchValue({
        quantity: event.quantity,
        total: event.quantity * product.precio
      });
      this.calculateTotal();
    }
  }

  calculateTotal() {
    const total = this.detalles.controls.reduce((acc, ctrl) => acc + ctrl.value.total, 0);
    this.ventaForm.patchValue({ total: total });
  }

  setPaymentMethod(method: string) {
    this.ventaForm.patchValue({ metodoPago: method });
  }

  async pagar() {
    if (this.detalles.length === 0) return;

    if (this.ventaForm.invalid) {
      this.mostrarToast('Formulario inválido');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Procesando venta...'
    });
    await loading.present();

    // Preparar payload. Asegurar que 'fecha' se actualice al momento de pagar
    this.ventaForm.patchValue({ fecha: new Date().toISOString() });

    const ventaData = this.ventaForm.value;
    // Mapear detalles si es necesario para ajustar al DTO del backend, 
    // pero el formGroup ya tiene productoId, cantidad, subtotal (total aqui), precioUnitario

    // Ajuste final de estructura si el backend espera 'subtotal' en lugar de 'total' en detalles
    const payload = {
      ...ventaData,
      items: ventaData.detalles.map((d: any) => ({
        productoId: d.productoId,
        cantidad: d.quantity,
        precioUnitario: d.precioUnitario,
        subtotal: d.total
      }))
    };

    this.ventaService.crearVenta(payload).subscribe({
      next: async (res) => {
        await loading.dismiss();
        this.detalles.clear();
        this.calculateTotal();
        this.mostrarAlerta('Venta Exitosa', `La venta se registró correctamente. Método: ${this.paymentMethodControl.value}`);
      },
      error: async (err) => {
        await loading.dismiss();
        console.error('Error creating sale:', err); // Enhanced logging
        if (err.error && err.error.message) {
          this.mostrarAlerta('Error', `No se pudo procesar la venta: ${err.error.message}`);
        } else {
          this.mostrarAlerta('Error', 'No se pudo procesar la venta. Verifique conexión o stock.');
        }
      }
    });
  }

  async mostrarAlerta(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  async mostrarToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
      color: 'danger'
    });
    await toast.present();
  }
}
