import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { VentaInterface } from '../../../interface/ventas-interface';

@Injectable({
  providedIn: 'root',
})
export class VentaServices {
  apiUrl = environment.apiUrl + '/ventas';

  constructor(private http: HttpClient) {}

  listarVentas(): Observable<VentaInterface[]> {
    return this.http.get<VentaInterface[]>(this.apiUrl);
  }

  obtenerVentaPorId(id: number): Observable<VentaInterface> {
    return this.http.get<VentaInterface>(`${this.apiUrl}/${id}`);
  }

  crearVenta(data: any): Observable<VentaInterface> {
    return this.http.post<VentaInterface>(this.apiUrl, data);
  }
}
