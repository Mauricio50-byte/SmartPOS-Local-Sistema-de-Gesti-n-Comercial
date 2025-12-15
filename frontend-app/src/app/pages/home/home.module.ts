import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HomePage } from './home.page';
import { SharedModule } from '../../shared/shared.module';
import { VentasComponent } from './components/ventas/ventas.component';
import { ProductosComponent } from './components/productos/productos.component';

import { HomePageRoutingModule } from './home-routing.module';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { UsersComponent } from './components/users/users.component';
import { PermissionsModalComponent } from '../../shared/components/permissions-modal/permissions-modal.component';
import { ClientSelectorComponent } from './components/ventas/components/client-selector/client-selector.component';
import { ClientRegistrationFormComponent } from './components/ventas/components/client-registration-form/client-registration-form.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HomePageRoutingModule,
    SharedModule,
    ReactiveFormsModule
  ],
  declarations: [
    HomePage,
    DashboardComponent,
    UsersComponent,
    VentasComponent,
    ProductosComponent,
    PermissionsModalComponent,
    ClientSelectorComponent,
    ClientSelectorComponent,
    ClientRegistrationFormComponent
  ]
})
export class HomePageModule { }
