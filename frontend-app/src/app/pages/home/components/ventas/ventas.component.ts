import { Component, OnInit } from '@angular/core';
import { VentaServices } from 'src/app/core/services/venta.service';
import { ProductosServices } from 'src/app/core/services/producto.service';
import { ClientesServices } from 'src/app/core/services/cliente.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { Venta } from 'src/app/core/models/venta';
import { Producto } from 'src/app/core/models/producto';
import { Cliente } from 'src/app/core/models/cliente';
import { AlertController, LoadingController, ToastController, ModalController } from '@ionic/angular';
import { FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';

@Component({
  standalone: false,
  selector: 'app-ventas',
  templateUrl: './ventas.component.html',
  styleUrls: ['./ventas.component.scss'],
})
export class VentasComponent implements OnInit {
  ventaForm: FormGroup;
  productos: Producto[] = [];
  filteredProductos: Producto[] = [];
  clientes: Cliente[] = [];
  searchTerm: string = '';

  // Configuración de venta
  tipoVenta: 'CONTADO' | 'FIADO' = 'CONTADO';
  clienteSeleccionado: Cliente | null = null;
  mostrarRegistroCliente: boolean = false;

  // Usuario actual
  currentUserId: number = 1;

  constructor(
    private ventaService: VentaServices,
    private productoService: ProductosServices,
    private clienteService: ClientesServices,
    private authService: AuthService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private modalController: ModalController,
    private fb: FormBuilder
  ) {
    this.ventaForm = this.fb.group({
      fecha: [new Date().toISOString(), Validators.required],
      usuarioId: [this.currentUserId, Validators.required],
      total: [0, [Validators.required, Validators.min(0)]],
      clienteId: [null],
      metodoPago: ['EFECTIVO', Validators.required],
      estadoPago: ['PAGADO', Validators.required],
      montoPagado: [0],
      registrarCliente: [false],
      datosCliente: this.fb.group({
        nombre: [''],
        telefono: [''],
        cedula: [''],
        correo: [''],
        creditoMaximo: [0]
      }),
      detalles: this.fb.array([], Validators.required)
    });
  }

  ngOnInit() {
    this.loadProducts();
    this.loadClientes();
    this.loadCurrentUser();
  }

  loadCurrentUser() {
    this.authService.getPerfil$().subscribe(user => {
      if (user) {
        this.currentUserId = user.id;
        this.ventaForm.patchValue({ usuarioId: user.id });
      }
    });
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

  get datosClienteGroup(): FormGroup {
    return this.ventaForm.get('datosCliente') as FormGroup;
  }

  loadProducts() {
    this.productoService.listarProductos().subscribe({
      next: (data) => {
        this.productos = data;
        this.filteredProductos = data;
      },
      error: (err) => {
        console.error('Error cargando productos', err);
        this.mostrarToast('Error al cargar productos', 'danger');
      }
    });
  }

  loadClientes() {
    this.clienteService.listarClientes().subscribe({
      next: (data) => {
        this.clientes = data.filter(c => c.activo !== false);
      },
      error: (err) => {
        console.error('Error cargando clientes', err);
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

  setTipoVenta(value: any) {
    const tipo = value as 'CONTADO' | 'FIADO';
    this.tipoVenta = tipo;

    if (tipo === 'CONTADO') {
      this.ventaForm.patchValue({
        estadoPago: 'PAGADO'
      });
      // No limpiamos el cliente aquí para permitir que sea opcional en contado
      this.mostrarRegistroCliente = false;
    } else {
      this.ventaForm.patchValue({
        estadoPago: 'FIADO'
      });
    }
  }

  onClienteSeleccionado(cliente: Cliente | null) {
    this.clienteSeleccionado = cliente;
    if (cliente) {
      this.ventaForm.patchValue({
        clienteId: cliente.id,
        registrarCliente: false
      });
    } else {
      this.ventaForm.patchValue({
        clienteId: null
      });
    }
    this.mostrarRegistroCliente = false;
  }

  cancelarRegistroCliente() {
    this.mostrarRegistroCliente = false;
    this.ventaForm.patchValue({ registrarCliente: false });
  }

  async mostrarModalRegistroCliente() {
    const alert = await this.alertController.create({
      header: '¿Registrar Cliente?',
      message: '¿El cliente desea registrarse para acumular puntos y tener acceso a crédito?',
      buttons: [
        {
          text: 'No',
          role: 'cancel',
          handler: () => {
            this.mostrarRegistroCliente = false;
            this.ventaForm.patchValue({ registrarCliente: false });
          }
        },
        {
          text: 'Sí, registrar',
          handler: () => {
            this.mostrarRegistroCliente = true;
            this.ventaForm.patchValue({ registrarCliente: true });
          }
        }
      ]
    });

    await alert.present();
  }

  async validarCreditoDisponible(): Promise<boolean> {
    if (!this.clienteSeleccionado) return false;

    const loading = await this.loadingController.create({
      message: 'Validando crédito...'
    });
    await loading.present();

    return new Promise((resolve) => {
      this.clienteService.validarCredito(
        this.clienteSeleccionado!.id,
        this.totalControl.value
      ).subscribe({
        next: async (validacion) => {
          await loading.dismiss();

          if (!validacion.disponible) {
            await this.mostrarAlerta(
              'Crédito Insuficiente',
              `El cliente no tiene crédito suficiente.\n\n` +
              `Crédito máximo: $${validacion.creditoMaximo.toLocaleString()}\n` +
              `Deuda actual: $${validacion.saldoDeuda.toLocaleString()}\n` +
              `Crédito disponible: $${validacion.creditoDisponible.toLocaleString()}\n` +
              `Monto solicitado: $${validacion.montoSolicitado.toLocaleString()}`
            );
            resolve(false);
          } else {
            resolve(true);
          }
        },
        error: async (err) => {
          await loading.dismiss();
          console.error('Error validando crédito', err);
          await this.mostrarAlerta('Error', 'No se pudo validar el crédito del cliente');
          resolve(false);
        }
      });
    });
  }

  async pagar() {
    if (this.detalles.length === 0) {
      await this.mostrarToast('Agregue productos al carrito', 'warning');
      return;
    }

    // Validar que si es venta fiada, haya cliente
    if (this.tipoVenta === 'FIADO') {
      if (!this.clienteSeleccionado && !this.ventaForm.value.registrarCliente) {
        await this.mostrarAlerta(
          'Cliente Requerido',
          'Para ventas fiadas debe seleccionar un cliente o registrar uno nuevo'
        );
        return;
      }

      // Validar datos del cliente si se va a registrar
      if (this.ventaForm.value.registrarCliente) {
        const datos = this.datosClienteGroup.value;
        if (!datos.nombre || !datos.telefono) {
          await this.mostrarAlerta(
            'Datos Incompletos',
            'Debe ingresar al menos el nombre y teléfono del cliente'
          );
          return;
        }
      }

      // Validar crédito disponible si hay cliente seleccionado
      if (this.clienteSeleccionado) {
        const creditoValido = await this.validarCreditoDisponible();
        if (!creditoValido) return;
      }
    }

    if (this.ventaForm.invalid) {
      await this.mostrarToast('Formulario inválido', 'danger');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Procesando venta...'
    });
    await loading.present();

    this.ventaForm.patchValue({ fecha: new Date().toISOString() });

    const ventaData = this.ventaForm.value;
    const payload: any = {
      usuarioId: ventaData.usuarioId,
      metodoPago: ventaData.metodoPago,
      estadoPago: ventaData.estadoPago,
      items: ventaData.detalles.map((d: any) => ({
        productoId: d.productoId,
        cantidad: d.quantity
      }))
    };

    // Agregar cliente si existe
    if (this.clienteSeleccionado) {
      payload.clienteId = this.clienteSeleccionado.id;
    }

    // Agregar datos de nuevo cliente si se va a registrar
    if (ventaData.registrarCliente) {
      payload.registrarCliente = true;
      payload.datosCliente = ventaData.datosCliente;
    }

    // Si es venta al contado, el monto pagado es el total
    if (ventaData.estadoPago === 'PAGADO') {
      payload.montoPagado = ventaData.total;
    }

    this.ventaService.crearVenta(payload).subscribe({
      next: async (venta) => {
        await loading.dismiss();
        this.detalles.clear();
        this.calculateTotal();
        this.clienteSeleccionado = null;
        this.mostrarRegistroCliente = false;
        this.tipoVenta = 'CONTADO';
        this.ventaForm.patchValue({
          estadoPago: 'PAGADO',
          clienteId: null,
          registrarCliente: false
        });
        this.datosClienteGroup.reset();

        let mensaje = `Venta registrada correctamente.\n`;
        mensaje += `Total: $${venta.total.toLocaleString()}\n`;
        mensaje += `Método: ${venta.metodoPago}`;

        if (venta.estadoPago === 'FIADO') {
          mensaje += `\n\n⚠️ Venta FIADA registrada`;
        }

        await this.mostrarAlerta('Venta Exitosa', mensaje);

        // Recargar clientes si se registró uno nuevo
        if (payload.registrarCliente) {
          this.loadClientes();
        }
      },
      error: async (err) => {
        await loading.dismiss();
        console.error('Error creating sale:', err);
        if (err.error && err.error.message) {
          await this.mostrarAlerta('Error', `No se pudo procesar la venta: ${err.error.message}`);
        } else {
          await this.mostrarAlerta('Error', 'No se pudo procesar la venta. Verifique conexión o stock.');
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

  async mostrarToast(message: string, color: 'success' | 'danger' | 'warning' = 'danger') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
      color
    });
    await toast.present();
  }
}

