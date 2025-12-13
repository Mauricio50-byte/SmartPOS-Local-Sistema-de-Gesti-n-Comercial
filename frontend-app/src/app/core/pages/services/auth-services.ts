import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthInterface } from '../../../interface/auth-interface';
@Injectable({
  providedIn: 'root'
})
export class AuthServices {
  apiUrl = environment.apiUrl + '/auth';

  constructor(private http: HttpClient) {}

  ingresar(data: AuthInterface): Observable<AuthInterface> {
    return this.http.post<AuthInterface>(`${this.apiUrl}/ingresar`, data);
  }

  registrarAdmin(data: AuthInterface): Observable<AuthInterface> {
    return this.http.post<AuthInterface>(`${this.apiUrl}/registrar-admin`, data);
  }

  registrarTrabajador(data: AuthInterface): Observable<AuthInterface> {
    return this.http.post<AuthInterface>(`${this.apiUrl}/registrar-trabajador`, data);
  }

  perfilUsuario(): Observable<AuthInterface> {
    return this.http.get<AuthInterface>(`${this.apiUrl}/perfil`);
  }
}

