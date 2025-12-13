import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  currentView: 'dashboard' | 'users' = 'dashboard';
  pageTitle: string = 'Dashboard';

  constructor() {}

  ngOnInit() {}

  setView(view: 'dashboard' | 'users') {
    this.currentView = view;
    if (view === 'dashboard') {
      this.pageTitle = 'Dashboard';
    } else if (view === 'users') {
      this.pageTitle = 'Gestión de Usuarios';
    }
  }

  enablePush() {
    console.log('Habilitando notificaciones push...');
  }
}
