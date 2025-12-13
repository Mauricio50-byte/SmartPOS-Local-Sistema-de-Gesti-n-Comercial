export interface UsuarioPerfil {
  id: number;
  nombre: string;
  correo: string;
  roles: string[];
  permisos: string[];
}

export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  activo: boolean;
  creadoEn?: string;
  roles?: string[];
}

