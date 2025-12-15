import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface DatosConexion {
    ip: string;
    puerto: number;
    url: string;
    token: string;
}

@Injectable({
    providedIn: 'root'
})
export class SistemaService {
    private apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) { }

    obtenerDatosConexion(): Observable<DatosConexion> {
        return this.http.get<DatosConexion>(`${this.apiUrl}/sistema/conexion-qr`);
    }
}
