import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Producto } from 'src/app/core/models/producto';

import { FormularioRopaComponent } from '../formulario-ropa/formulario-ropa.component';
import { FormularioAlimentosComponent } from '../formulario-alimentos/formulario-alimentos.component';
import { FormularioServiciosComponent } from '../formulario-servicios/formulario-servicios.component';
import { FormularioFarmaciaComponent } from '../formulario-farmacia/formulario-farmacia.component';
import { FormularioPapeleriaComponent } from '../formulario-papeleria/formulario-papeleria.component';
import { FormularioRestauranteComponent } from '../formulario-restaurante/formulario-restaurante.component';

@Component({
  standalone: true,
  selector: 'app-productos-form',
  templateUrl: './productos-form.component.html',
  styleUrls: ['./productos-form.component.scss'],
  imports: [
    CommonModule, 
    IonicModule, 
    ReactiveFormsModule,
    FormularioRopaComponent,
    FormularioAlimentosComponent,
    FormularioServiciosComponent,
    FormularioFarmaciaComponent,
    FormularioPapeleriaComponent,
    FormularioRestauranteComponent
  ]
})
export class ProductosFormComponent implements OnInit, OnChanges {
  @Input() product: Producto | null = null;
  @Input() modulosActivos: Set<string> = new Set();
  @Output() save = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  productForm: FormGroup;
  isEditing: boolean = false;

  constructor(private fb: FormBuilder) {
    this.productForm = this.initForm();
  }

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['product'] && this.product) {
      this.isEditing = true;
      this.patchForm(this.product);
    } else if (changes['product'] && !this.product) {
        this.isEditing = false;
        this.resetForm();
    }
  }

  initForm(): FormGroup {
    return this.fb.group({
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
      registroInvima: [''],

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

  patchForm(product: Producto) {
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

    if (product.detalleRopa) Object.assign(formValue, product.detalleRopa);
    if (product.detalleAlimento) Object.assign(formValue, product.detalleAlimento);
    if (product.detalleServicio) Object.assign(formValue, product.detalleServicio);
    if (product.detalleFarmacia) Object.assign(formValue, product.detalleFarmacia);
    if (product.detallePapeleria) Object.assign(formValue, product.detallePapeleria);
    if (product.detalleRestaurante) Object.assign(formValue, product.detalleRestaurante);

    this.productForm.patchValue(formValue);
  }

  resetForm() {
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

  onSubmit() {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }
    this.save.emit(this.productForm.value);
  }

  onCancel() {
    this.cancel.emit();
  }

  isModuleActive(moduleId: string): boolean {
    return this.modulosActivos.has(moduleId);
  }
}
