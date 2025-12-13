import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ProductosInterface } from '../../../interface/productos-interface';
@Injectable({
  providedIn: 'root',
})
export class ProductosServices {
  apiUrl = environment.apiUrl + '/productos'  
  
  constructor(private http:HttpClient ){}
  
     listarProductos(): Observable<ProductosInterface[]>{
      return this.http.get<ProductosInterface[]>(`${this.apiUrl}`)
     }
  
  
     buscarProductosById(id:number): Observable<ProductosInterface>{
      return this.http.get<ProductosInterface>(`${this.apiUrl}/${id}`)
     }
    
     
    
     crearProductos(data: ProductosInterface): Observable<ProductosInterface>{
      return this.http.post<ProductosInterface>(`${this.apiUrl}`, data)
     }
     
    
     actualizarProductos(data:ProductosInterface, id:number): Observable<ProductosInterface>{
       return this.http.put<ProductosInterface>(`${this.apiUrl}/${id}`, data)
     }
   
     
   
     eliminarProductos(id: number): Observable<ProductosInterface> {
    return this.http.delete<ProductosInterface>(`${this.apiUrl}/${id}`);
  }
  
}
