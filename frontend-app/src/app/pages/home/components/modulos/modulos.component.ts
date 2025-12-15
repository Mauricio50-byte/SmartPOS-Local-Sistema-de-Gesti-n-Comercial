import { Component, OnInit } from '@angular/core';
import { Modulo, ModuloService } from 'src/app/core/services/modulo.service';
import { AlertController, ToastController } from '@ionic/angular';

@Component({
  standalone: false,
  selector: 'app-modulos',
  templateUrl: './modulos.component.html',
  styleUrls: ['./modulos.component.scss']
})
export class ModulosComponent implements OnInit {
  modulos: Modulo[] = [];
  loading = false;

  constructor(
    private moduloService: ModuloService,
    private toastController: ToastController,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.cargarModulos();
  }

  cargarModulos() {
    this.loading = true;
    this.moduloService.listarModulos().subscribe({
      next: (data) => {
        this.modulos = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando módulos', error);
        this.loading = false;
        this.mostrarToast('Error al cargar módulos', 'danger');
      }
    });
  }

  async toggleModulo(modulo: Modulo) {
    // Optimistic update
    const estadoAnterior = modulo.activo;
    modulo.activo = !modulo.activo;

    this.moduloService.toggleModulo(modulo.id, modulo.activo).subscribe({
      next: () => {
        this.mostrarToast(`Módulo ${modulo.nombre} ${modulo.activo ? 'activado' : 'desactivado'}`, 'success');
      },
      error: () => {
        modulo.activo = estadoAnterior; // Revert
        this.mostrarToast('Error al cambiar estado del módulo', 'danger');
      }
    });
  }

  async mostrarToast(mensaje: string, color: string) {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 2000,
      color: color,
      position: 'bottom'
    });
    toast.present();
  }
}
