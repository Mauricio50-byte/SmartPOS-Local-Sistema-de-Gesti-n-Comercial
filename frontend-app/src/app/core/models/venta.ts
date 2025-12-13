import { DetalleVenta } from './detalle-venta';
import { Cliente } from './cliente';
import { Usuario } from './usuario';

export interface Venta {
  id: number;
  fecha: string;
  total: number;
  clienteId?: number | null;
  usuarioId: number;
  detalles: DetalleVenta[];
  cliente?: Cliente | null;
  usuario?: Usuario;
}

