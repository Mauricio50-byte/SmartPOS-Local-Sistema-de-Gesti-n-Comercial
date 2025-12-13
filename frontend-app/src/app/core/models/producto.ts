export interface Producto {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
  activo: boolean;
  creadoEn?: string;
  actualizadoEn?: string;
}

