import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Producto } from 'src/app/core/models/producto';

@Component({
  standalone: true,
  selector: 'app-productos-lista',
  templateUrl: './productos-lista.component.html',
  styleUrls: ['./productos-lista.component.scss'],
  imports: [CommonModule, IonicModule, FormsModule]
})
export class ProductosListaComponent implements OnChanges {
  @Input() products: Producto[] = [];
  @Output() edit = new EventEmitter<Producto>();
  @Output() delete = new EventEmitter<Producto>();

  filteredProducts: Producto[] = [];
  searchTerm: string = '';

  constructor() {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['products']) {
      this.filterProducts();
    }
  }

  onSearch(event: any) {
    this.searchTerm = event.target.value;
    this.filterProducts();
  }

  filterProducts() {
    if (!this.searchTerm) {
      this.filteredProducts = this.products;
      return;
    }
    const term = this.searchTerm.toLowerCase();
    this.filteredProducts = this.products.filter(p =>
      p.nombre.toLowerCase().includes(term)
    );
  }

  onEdit(product: Producto) {
    this.edit.emit(product);
  }

  onDelete(product: Producto) {
    this.delete.emit(product);
  }
}
