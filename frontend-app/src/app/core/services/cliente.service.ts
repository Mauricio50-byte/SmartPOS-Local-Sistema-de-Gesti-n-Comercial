import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Cliente } from '../models';

@Injectable({
  providedIn: 'root',
})
export class ClientesServices {
  apiUrl = environment.apiUrl + '/clientes'
  
  constructor(private http:HttpClient ){}

   listarClientes(): Observable<Cliente[]>{
    return this.http.get<Cliente[]>(`${this.apiUrl}`)
   }


   buscarClienteById(id:number): Observable<Cliente>{
    return this.http.get<Cliente>(`${this.apiUrl}/${id}`)
   }
  
   
  
   crearCliente(data: Cliente): Observable<Cliente>{
    return this.http.post<Cliente>(`${this.apiUrl}`, data)
   }
   
  
   actualizarCliente(data:Cliente, id:number): Observable<Cliente>{
     return this.http.put<Cliente>(`${this.apiUrl}/${id}`, data)
   }
 
   
 
   eliminarCliente(id: number): Observable<Cliente> {
  return this.http.delete<Cliente>(`${this.apiUrl}/${id}`);
}

}