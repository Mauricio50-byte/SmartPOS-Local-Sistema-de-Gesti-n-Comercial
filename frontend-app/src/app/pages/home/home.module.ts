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
import { ModulosComponent } from './components/modulos/modulos.component';
import { ProductosListaComponent } from './components/productos/modulos/productos-lista/productos-lista.component';
import { ProductosFormComponent } from './components/productos/modulos/productos-form/productos-form.component';
import { FinanzasComponent } from './components/finanzas/finanzas.component';
import { ClientesComponent } from './components/clientes/clientes.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HomePageRoutingModule,
    SharedModule,
    ReactiveFormsModule,
    ProductosListaComponent,
    ProductosFormComponent,
    FinanzasComponent,
    ClientesComponent
  ],
  declarations: [
    HomePage,
    DashboardComponent,
    UsersComponent,
    VentasComponent,
    ProductosComponent,
    PermissionsModalComponent,
    ClientSelectorComponent,
    ClientRegistrationFormComponent,
    ModulosComponent
  ]
})
export class HomePageModule { }
