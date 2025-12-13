import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Rol } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RolService {
  private apiUrl = `${environment.apiUrl}/roles`;

  constructor(private http: HttpClient) { }

  /**
   * Obtener todos los roles.
   * @returns Un Observable con un arreglo de roles.
   */
  listarRoles(): Observable<Rol[]> {
    return this.http.get<Rol[]>(this.apiUrl);
  }

  /**
   * Crear un nuevo rol.
   * @param rol El objeto de rol a crear.
   * @returns Un Observable con el rol creado.
   */
  crearRol(rol: Partial<Rol>): Observable<Rol> {
    return this.http.post<Rol>(this.apiUrl, rol);
  }

  /**
   * Actualizar un rol existente.
   * @param id El ID del rol a actualizar.
   * @param rol El objeto de rol con los datos actualizados.
   * @returns Un Observable con el rol actualizado.
   */
  actualizarRol(id: number, rol: Partial<Rol>): Observable<Rol> {
    return this.http.put<Rol>(`${this.apiUrl}/${id}`, rol);
  }
}
