import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import {Producto} from '../models'
@Injectable({
  providedIn: 'root',
})
export class ProductosServices {
  apiUrl = environment.apiUrl + '/productos'  
  
  constructor(private http:HttpClient ){}
  
     listarProductos(): Observable<Producto[]>{
      return this.http.get<Producto[]>(`${this.apiUrl}`)
     }
  
  
     buscarProductosById(id:number): Observable<Producto>{
      return this.http.get<Producto>(`${this.apiUrl}/${id}`)
     }
    
     
    
     crearProductos(data: Producto): Observable<Producto>{
      return this.http.post<Producto>(`${this.apiUrl}`, data)
     }
     
    
     actualizarProductos(data:Producto, id:number): Observable<Producto>{
       return this.http.put<Producto>(`${this.apiUrl}/${id}`, data)
     }
   
     
   
     eliminarProductos(id: number): Observable<Producto> {
    return this.http.delete<Producto>(`${this.apiUrl}/${id}`);
  }
  
}