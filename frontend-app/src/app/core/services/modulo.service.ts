import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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

  listarCatalogoModulos(): Observable<Modulo[]> {
    return this.http.get<Modulo[]>(`${this.apiUrl}/catalogo`);
  }

  listarModulos(negocioId?: number | null): Observable<Modulo[]> {
    const params = typeof negocioId === 'number' ? new HttpParams().set('negocioId', String(negocioId)) : undefined;
    return this.http.get<Modulo[]>(this.apiUrl, params ? { params } : undefined);
  }

  toggleModulo(id: string, activo: boolean, negocioId?: number | null): Observable<Modulo> {
    const params = typeof negocioId === 'number' ? new HttpParams().set('negocioId', String(negocioId)) : undefined;
    return this.http.patch<Modulo>(`${this.apiUrl}/${id}/toggle`, { activo }, params ? { params } : undefined);
  }

  actualizarConfig(id: string, config: any): Observable<Modulo> {
    return this.http.put<Modulo>(`${this.apiUrl}/${id}/config`, { config });
  }
}
