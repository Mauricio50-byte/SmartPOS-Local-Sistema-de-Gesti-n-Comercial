import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { CuentasPorCobrarComponent } from './components/cuentas-por-cobrar/cuentas-por-cobrar.component';
import { CuentasPorPagarComponent } from './components/cuentas-por-pagar/cuentas-por-pagar.component';
import { addIcons } from 'ionicons';
import { walletOutline, cashOutline, cardOutline } from 'ionicons/icons';

@Component({
  selector: 'app-finanzas',
  templateUrl: './finanzas.component.html',
  styleUrls: ['./finanzas.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, CuentasPorCobrarComponent, CuentasPorPagarComponent]
})
export class FinanzasComponent {
  segment: 'por-cobrar' | 'por-pagar' = 'por-cobrar';

  constructor() {
    addIcons({ walletOutline, cashOutline, cardOutline });
  }

  segmentChanged(event: any) {
    this.segment = event.detail.value;
  }
}
