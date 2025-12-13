import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ClienteInterface } from '../../../interface/cliente-interface';

@Injectable({
  providedIn: 'root',
})
export class ClientesServices {
  apiUrl = environment.apiUrl + '/clientes'
  
  constructor(private http:HttpClient ){}

   listarClientes(): Observable<ClienteInterface[]>{
    return this.http.get<ClienteInterface[]>(`${this.apiUrl}`)
   }


   buscarClienteById(id:number): Observable<ClienteInterface>{
    return this.http.get<ClienteInterface>(`${this.apiUrl}/${id}`)
   }
  
   
  
   crearCliente(data: ClienteInterface): Observable<ClienteInterface>{
    return this.http.post<ClienteInterface>(`${this.apiUrl}`, data)
   }
   
  
   actualizarCliente(data:ClienteInterface, id:number): Observable<ClienteInterface>{
     return this.http.put<ClienteInterface>(`${this.apiUrl}/${id}`, data)
   }
 
   
 
   eliminarCliente(id: number): Observable<ClienteInterface> {
  return this.http.delete<ClienteInterface>(`${this.apiUrl}/${id}`);
}

}
