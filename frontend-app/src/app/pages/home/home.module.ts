import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HomePage } from './home.page';
import { VentasPageModule } from '../ventas/ventas.module';
import { ProductosPageModule } from '../productos/productos.module';

import { HomePageRoutingModule } from './home-routing.module';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { UsersComponent } from './components/users/users.component';
import { PermissionsModalComponent } from '../../shared/components/permissions-modal/permissions-modal.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HomePageRoutingModule,
    VentasPageModule, // Added as per instruction
    ProductosPageModule,
    ReactiveFormsModule
  ],
  declarations: [
    HomePage,
    DashboardComponent,
    UsersComponent,
    PermissionsModalComponent
  ]
})
export class HomePageModule { }
