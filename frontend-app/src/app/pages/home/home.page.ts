import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { UsuarioPerfil } from '../../core/models';

import { ModalController } from '@ionic/angular';
import { ConexionQrComponent } from '../../shared/components/conexion-qr/conexion-qr.component';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  currentView: 'dashboard' | 'users' | 'ventas' | 'productos' | 'modulos' | 'finanzas' = 'dashboard';
  pageTitle: string = 'Dashboard';
  currentUser: UsuarioPerfil | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private modalCtrl: ModalController
  ) { }

  async conectarDispositivo() {
    const modal = await this.modalCtrl.create({
      component: ConexionQrComponent,
      cssClass: 'qr-modal' // You might want to define this class in global CSS or component styles
    });
    return await modal.present();
  }

  ngOnInit() {
    this.authService.getPerfil$().subscribe(user => {
      this.currentUser = user;
      this.checkCurrentViewAccess();
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  hasPermission(permiso: string): boolean {
    if (!this.currentUser) return false;
    // Admin has access to everything by default (optional, but good practice)
    if (this.currentUser.roles && this.currentUser.roles.includes('ADMIN')) return true;
    return this.currentUser.permisos ? this.currentUser.permisos.includes(permiso) : false;
  }

  checkCurrentViewAccess() {
    // If user loses access to current view, switch to a safe one or dashboard
    if (this.currentView === 'users' && !this.hasPermission('GESTION_USUARIOS')) {
      this.currentView = 'dashboard'; // Fallback
    }
    if (this.currentView === 'ventas' && !this.hasPermission('VENDER')) {
      this.currentView = 'dashboard';
    }
    if (this.currentView === 'productos' && !this.hasPermission('GESTION_INVENTARIO')) {
      this.currentView = 'dashboard';
    }
    if (this.currentView === 'modulos' && !this.hasPermission('ADMIN')) {
      this.currentView = 'dashboard';
    }
    // Update title
    this.setView(this.currentView);
  }

  setView(view: 'dashboard' | 'users' | 'ventas' | 'productos' | 'modulos' | 'finanzas') {
    this.currentView = view;
    if (view === 'dashboard') {
      this.pageTitle = 'Dashboard';
    } else if (view === 'users') {
      this.pageTitle = 'Gestión de Usuarios';
    } else if (view === 'ventas') {
      this.pageTitle = 'Ventas';
    } else if (view === 'productos') {
      this.pageTitle = 'Productos';
    } else if (view === 'modulos') {
      this.pageTitle = 'Gestión de Módulos';
    } else if (view === 'finanzas') {
      this.pageTitle = 'Gestión Financiera';
    }
  }

  enablePush() {
    console.log('Habilitando notificaciones push...');
  }
}
