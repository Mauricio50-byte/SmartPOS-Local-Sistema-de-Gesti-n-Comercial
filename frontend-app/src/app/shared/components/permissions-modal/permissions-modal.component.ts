import { Component, Input, OnInit } from '@angular/core';
import { ModalController, AlertController } from '@ionic/angular';
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
  
  // Lista maestra de permisos disponibles en el sistema (idealmente vendría de un servicio)
  // Por simplicidad, los extraemos de los roles cargados o los hardcodeamos
  availablePermissions: string[] = [
    'GESTION_USUARIOS', 'CREAR_ROL', 'EDITAR_ROL', 'ASIGNAR_PERMISOS', 
    'VENDER', 'GESTION_INVENTARIO', 'GESTION_CLIENTES', 'VER_REPORTES'
  ];
  
  // Permisos asignados directamente (no por rol)
  directPermissions: string[] = [];
  
  loading = false;
  activeTab: 'roles' | 'permisos' = 'roles';

  constructor(
    private modalController: ModalController,
    private alertController: AlertController,
    private rolService: RolService,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit() {
    this.loadRoles();
    if (this.usuario) {
      this.loadUserPermissions();
    }
  }

  loadUserPermissions() {
    this.loading = true;
    this.usuarioService.getUsuario(this.usuario.id).subscribe({
      next: (fullUsuario) => {
        this.selectedRoles = fullUsuario.roles ? [...fullUsuario.roles] : [];
        this.directPermissions = fullUsuario.permisosDirectos ? [...fullUsuario.permisosDirectos] : [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading user details', error);
        // Fallback to input data if fetch fails, though likely incomplete
        this.selectedRoles = this.usuario.roles ? [...this.usuario.roles] : [];
        this.directPermissions = this.usuario.permisosDirectos ? [...this.usuario.permisosDirectos] : [];
        this.loading = false;
      }
    });
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

  toggleDirectPermission(permiso: string) {
    const index = this.directPermissions.indexOf(permiso);
    if (index > -1) {
      this.directPermissions.splice(index, 1);
    } else {
      this.directPermissions.push(permiso);
    }
  }

  isPermissionDirect(permiso: string): boolean {
    return this.directPermissions.includes(permiso);
  }

  isPermissionInherited(permiso: string): boolean {
    // Check if permission is granted by any selected role
    for (const roleName of this.selectedRoles) {
      const role = this.roles.find(r => r.nombre === roleName);
      if (role && role.permisos) {
        if (role.permisos.some((p: any) => p.permiso.clave === permiso)) {
          return true;
        }
      }
    }
    return false;
  }

  dismiss() {
    this.modalController.dismiss();
  }

  async save() {
    if (!this.usuario) return;

    // Confirm critical changes if permissions are being removed or admin role removed
    const isRemovingAdmin = this.usuario.roles?.includes('ADMIN') && !this.selectedRoles.includes('ADMIN');
    
    if (isRemovingAdmin) {
      const alert = await this.alertController.create({
        header: 'Confirmación Crítica',
        message: 'Estás a punto de quitar el rol de ADMINISTRADOR a este usuario. ¿Estás seguro? Esta acción restringirá severamente su acceso.',
        buttons: [
          { text: 'Cancelar', role: 'cancel' },
          { 
            text: 'Sí, quitar rol', 
            handler: () => this.executeSave() 
          }
        ]
      });
      await alert.present();
    } else {
      this.executeSave();
    }
  }

  executeSave() {
    this.loading = true;
    
    // Save roles
    this.usuarioService.asignarRoles(this.usuario.id, this.selectedRoles).subscribe({
      next: () => {
        // Save direct permissions
        this.usuarioService.asignarPermisosDirectos(this.usuario.id, this.directPermissions).subscribe({
          next: () => {
            this.loading = false;
            this.modalController.dismiss({
              updated: true,
              roles: this.selectedRoles,
              permisos: this.directPermissions
            });
          },
          error: (err) => {
             console.error('Error saving permissions', err);
             this.loading = false;
          }
        });
      },
      error: (error) => {
        console.error('Error assigning roles', error);
        this.loading = false;
      }
    });
  }
}
