export interface Rol {
  id: number;
  nombre: string;
  descripcion?: string | null;
  permisos?: any[]; // Podríamos definir una interfaz para Permiso si fuera necesario
}

