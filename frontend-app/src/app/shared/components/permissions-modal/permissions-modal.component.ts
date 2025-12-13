import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { RolService } from '../../../core/services/rol.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { Rol, Usuario } from '../../../core/models';

@Component({
  selector: 'app-permissions-modal',
  templateUrl: './permissions-modal.component.html',
  styleUrls: ['./permissions-modal.component.scss'],
  standalone: false
})
export class PermissionsModalComponent implements OnInit {
  @Input() usuario!: Usuario;

  roles: Rol[] = [];
  selectedRoles: string[] = [];
  loading = false;

  constructor(
    private modalController: ModalController,
    private rolService: RolService,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit() {
    this.loadRoles();
    if (this.usuario && this.usuario.roles) {
      this.selectedRoles = [...this.usuario.roles];
    }
  }

  loadRoles() {
    this.loading = true;
    this.rolService.listarRoles().subscribe({
      next: (roles) => {
        this.roles = roles;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading roles', error);
        this.loading = false;
      }
    });
  }

  toggleRole(roleName: string) {
    const index = this.selectedRoles.indexOf(roleName);
    if (index > -1) {
      this.selectedRoles.splice(index, 1);
    } else {
      this.selectedRoles.push(roleName);
    }
  }

  isRoleSelected(roleName: string): boolean {
    return this.selectedRoles.includes(roleName);
  }

  dismiss() {
    this.modalController.dismiss();
  }

  save() {
    if (!this.usuario) return;

    this.loading = true;
    this.usuarioService.asignarRoles(this.usuario.id, this.selectedRoles).subscribe({
      next: () => {
        this.loading = false;
        this.modalController.dismiss({
          updated: true,
          roles: this.selectedRoles
        });
      },
      error: (error) => {
        console.error('Error assigning roles', error);
        this.loading = false;
        // Handle error (show toast/alert)
      }
    });
  }
}
