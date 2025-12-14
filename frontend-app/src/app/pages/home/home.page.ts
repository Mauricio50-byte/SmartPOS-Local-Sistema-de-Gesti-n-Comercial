import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  currentView: 'dashboard' | 'users' | 'ventas' | 'productos' = 'dashboard';
  pageTitle: string = 'Dashboard';

  constructor() { }

  ngOnInit() { }

  setView(view: 'dashboard' | 'users' | 'ventas' | 'productos') {
    this.currentView = view;
    if (view === 'dashboard') {
      this.pageTitle = 'Dashboard';
    } else if (view === 'users') {
      this.pageTitle = 'Gestión de Usuarios';
    } else if (view === 'ventas') {
      this.pageTitle = 'Ventas';
    } else if (view === 'productos') {
      this.pageTitle = 'Productos';
    }
  }

  enablePush() {
    console.log('Habilitando notificaciones push...');
  }
}
