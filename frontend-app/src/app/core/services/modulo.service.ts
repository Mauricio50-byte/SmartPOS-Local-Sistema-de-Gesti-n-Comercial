import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface Modulo {
  id: string;
  nombre: string;
  descripcion: string;
  activo: boolean;
  config?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ModuloService {
  private apiUrl = `${environment.apiUrl}/modulos`;

  constructor(private http: HttpClient) {}

  listarModulos(): Observable<Modulo[]> {
    return this.http.get<Modulo[]>(this.apiUrl);
  }

  toggleModulo(id: string, activo: boolean): Observable<Modulo> {
    return this.http.patch<Modulo>(`${this.apiUrl}/${id}/toggle`, { activo });
  }

  actualizarConfig(id: string, config: any): Observable<Modulo> {
    return this.http.put<Modulo>(`${this.apiUrl}/${id}/config`, { config });
  }
}
