import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-configuracion',
  templateUrl: './configuracion.component.html',
  styleUrls: ['./configuracion.component.scss'],
  standalone: false
})
export class ConfiguracionComponent implements OnInit {
  activeTab: 'usuario' | 'tecnico' = 'usuario';

  constructor() { }

  ngOnInit() {}

  segmentChanged(ev: any) {
    this.activeTab = ev.detail.value;
  }
}
