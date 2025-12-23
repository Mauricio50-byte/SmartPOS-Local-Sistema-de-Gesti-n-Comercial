import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertController, ModalController } from '@ionic/angular';
import { Rol, Usuario } from '../../../../core/models';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { Modulo, ModuloService } from '../../../../core/services/modulo.service';
import { AuthService } from '../../../../core/services/auth.service';
import { RolService } from '../../../../core/services/rol.service';
import { PermissionsModalComponent } from '../../../../shared/components/permissions-modal/permissions-modal.component';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  standalone: false
})
export class UsersComponent implements OnInit {
  formgroup: FormGroup;
  usuarios: Usuario[] = [];
  usuarioSeleccionado: Usuario | null = null;
  mostrarFormulario = false;
  isEditMode = false;
  actorNegocioId: number | null = null;
  actorRoles: string[] = [];
  actorPermisos: string[] = [];
  actorAdminPorDefecto = false;
  rolesCatalog: Rol[] = [];
  catalogModulos: Modulo[] = [];
  modulosActivosNegocio: Modulo[] = [];

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private moduloService: ModuloService,
    private authService: AuthService,
    private rolService: RolService,
    private alertController: AlertController,
    private modalController: ModalController
  ) {
    this.formgroup = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      correo: ['', [Validators.required, Validators.email]],
      rol: ['TRABAJADOR', Validators.required],
      passwordHash: ['', [Validators.required, Validators.minLength(6)]],
      activo: [true, Validators.required]
      ,
      crearNuevoNegocio: [false],
      negocioNombre: [''],
      modulos: [[]]
    });
  }

  ngOnInit() {
    this.getUsuarios();
    this.authService.getPerfil$().subscribe(p => {
      this.actorNegocioId = (p?.negocioId ?? null) as any;
      this.actorRoles = Array.isArray(p?.roles) ? p!.roles : [];
      this.actorPermisos = Array.isArray(p?.permisos) ? p!.permisos : [];
      this.actorAdminPorDefecto = p?.adminPorDefecto === true;
      if (this.actorNegocioId) {
        this.moduloService.listarModulos().subscribe({
          next: (mods) => {
            this.modulosActivosNegocio = (mods || []).filter(m => m.activo);
            if (!this.isEditMode) {
              const current = this.getSelectedModulos();
              if (!current.length) {
                const porDefecto = this.actorAdminPorDefecto
                  ? this.modulosActivosNegocio.map(m => m.id)
                  : (Array.isArray(p?.modulos) && p!.modulos!.length ? p!.modulos : this.modulosActivosNegocio.map(m => m.id));
                this.formgroup.patchValue({ modulos: porDefecto });
              }
            }
          },
          error: () => this.modulosActivosNegocio = []
        });
      } else {
        this.modulosActivosNegocio = [];
      }
    });
    this.moduloService.listarCatalogoModulos().subscribe({
      next: (mods) => this.catalogModulos = mods || [],
      error: () => this.catalogModulos = []
    });

    this.rolService.listarRoles().subscribe({
      next: (roles) => {
        this.rolesCatalog = roles || [];
        const actual = this.formgroup.get('rol')?.value;
        if (actual && !this.rolesCatalog.some(r => r.nombre === actual) && this.rolesCatalog.length) {
          this.formgroup.patchValue({ rol: this.rolesCatalog[0].nombre });
        }
      },
      error: () => this.rolesCatalog = []
    });

    this.formgroup.get('rol')?.valueChanges.subscribe((rol) => {
      if (rol !== 'ADMIN') {
        this.formgroup.patchValue({ crearNuevoNegocio: false, negocioNombre: '' });
      }
    });

    this.formgroup.get('crearNuevoNegocio')?.valueChanges.subscribe((crearNuevo) => {
      if (crearNuevo) {
        this.formgroup.patchValue({ modulos: [] });
      } else if (this.actorNegocioId && !this.isEditMode) {
        const current = this.getSelectedModulos();
        if (!current.length) {
          this.formgroup.patchValue({ modulos: this.modulosActivosNegocio.map(m => m.id) });
        }
      }
    });
  }

  // Control del modal
  mostrarFormularioCrear() {
    this.mostrarFormulario = true;
    this.isEditMode = false;
  }

  cerrarFormulario() {
    this.mostrarFormulario = false;
    this.formgroup.reset({
      rol: 'TRABAJADOR',
      activo: true,
      crearNuevoNegocio: false,
      negocioNombre: '',
      modulos: []
    });
    // Restore password validation for create mode
    this.formgroup.get('passwordHash')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.formgroup.get('passwordHash')?.updateValueAndValidity();
  }

  getUsuarios() {
    this.usuarioService.getUsuarios().subscribe({
      next: (usuarios: Usuario[]) => {
        this.usuarios = usuarios;
        console.log('Usuarios cargados:', this.usuarios);
      },
      error: (error: any) => {
        console.warn('No se pudieron cargar usuarios desde el backend:', error);
        this.mostrarAlerta('Error de Carga', 'No se pudieron cargar los usuarios. Verifique que el servidor esté activo y usted tenga permisos.' + (error.message || ''));
        this.usuarios = [];
      }
    });
  }

  guardarUsuario() {
    if (this.formgroup.valid) {
      if (this.isEditMode && this.usuarioSeleccionado) {
        // We are editing
        this.updateUsuario(this.usuarioSeleccionado.id, this.formgroup.value);
      } else {
        // We are creating
        const formData = this.formgroup.value;
        const creandoAdmin = formData.rol === 'ADMIN';

        if (creandoAdmin && !this.actorAdminPorDefecto) {
          this.mostrarAlerta('No autorizado', 'Solo el Administrador por defecto puede crear administradores.');
          return;
        }

        if (creandoAdmin && !this.actorAdminPorDefecto) {
          this.mostrarAlerta('No autorizado', 'Solo el Administrador por defecto puede crear administradores.');
          return;
        }

        const nuevoUsuario = {
          ...formData,
          password: formData.passwordHash // Send raw password as 'password'
        };
        delete nuevoUsuario.passwordHash; // Remove the field name used in form

        this.usuarioService.createUsuario(nuevoUsuario).subscribe({
          next: (usuario: Usuario) => {
            console.log('Usuario creado', usuario);
            this.getUsuarios();
            this.cerrarFormulario();
            this.mostrarAlerta('Éxito', 'Usuario creado correctamente');
          },
          error: (error: any) => {
            console.error('Error creando usuario', error);
            this.mostrarAlerta('Error', 'No se pudo crear el usuario. ' + (error.error?.message || error.message || ''));
          }
        });
      }
    }
  }

  getSelectedModulos(): string[] {
    const v = this.formgroup.get('modulos')?.value;
    return Array.isArray(v) ? v : [];
  }

  isModuloSeleccionado(id: string): boolean {
    return this.getSelectedModulos().includes(id);
  }

  async toggleModuloSeleccion(id: string, max: number | null = null) {
    const actuales = this.getSelectedModulos();
    const existe = actuales.includes(id);
    if (!existe && typeof max === 'number' && actuales.length >= max) {
      await this.mostrarAlerta('Límite de módulos', `Solo puedes seleccionar hasta ${max} módulos.`);
      return;
    }
    const nuevos = existe ? actuales.filter(m => m !== id) : [...actuales, id];
    this.formgroup.patchValue({ modulos: nuevos });
  }

  puedeGestionarPermisos(usuario: Usuario): boolean {
    const rolesObjetivo = Array.isArray(usuario?.roles) ? usuario.roles : [];
    if (this.actorAdminPorDefecto) return true;
    if (this.actorRoles.includes('ADMIN')) return rolesObjetivo.includes('TRABAJADOR');
    return false;
  }

  toggleMenu(usuario: Usuario) {
    this.usuarioSeleccionado = this.usuarioSeleccionado?.id === usuario.id ? null : usuario;
  }

  verDetalles(usuario: Usuario) {
    console.log('Ver detalles:', usuario);
    // Aquí podrías navegar a una página de detalles o mostrar un modal
  }

  editarUsuario(usuario: Usuario) {
    console.log('Editar usuario:', usuario);
    this.mostrarFormulario = true;
    this.isEditMode = true;
    this.usuarioSeleccionado = usuario;

    this.formgroup.patchValue({
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.roles && usuario.roles.length > 0 ? usuario.roles[0] : 'TRABAJADOR',
      activo: usuario.activo
    });
    // Password is not updated here, so validation is not required for edit mode.
    this.formgroup.get('passwordHash')?.clearValidators();
    this.formgroup.get('passwordHash')?.updateValueAndValidity();
  }

  async cambiarContrasena(id: number, nueva: string) {
    const alert = await this.alertController.create({
      header: 'Cambiar Contraseña',
      inputs: [
        {
          name: 'nuevaPassword',
          type: 'password',
          placeholder: 'Nueva contraseña',
          attributes: {
            minlength: 6
          }
        },
        {
          name: 'confirmarPassword',
          type: 'password',
          placeholder: 'Confirmar contraseña',
          attributes: {
            minlength: 6
          }
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Cambiar',
          handler: (data: any) => {
            if (data.nuevaPassword && data.nuevaPassword === data.confirmarPassword) {
              this.usuarioService.cambiarPassword(id, data.nuevaPassword).subscribe(() => {
                console.log('Contraseña cambiada exitosamente');
                this.mostrarAlerta('Éxito', 'Contraseña cambiada correctamente');
              });
            } else {
              this.mostrarAlerta('Error', 'Las contraseñas no coinciden');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async gestionarPermisos(usuario: Usuario) {
    const modal = await this.modalController.create({
      component: PermissionsModalComponent,
      componentProps: {
        usuario: usuario
      }
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data && data.updated) {
      this.mostrarAlerta('Éxito', 'Permisos actualizados correctamente');
      this.getUsuarios(); // Reload users to show updated roles
    }
  }

  toggleEstadoUsuario(usuario: Usuario) {
    if (usuario.activo) {
      this.desactivarUsuario(usuario.id);
    } else {
      this.activarUsuario(usuario.id);
    }
  }

  activarUsuario(id: number) {
    this.usuarioService.activarUsuario(id).subscribe(() => {
      console.log('Usuario activado exitosamente');
      this.getUsuarios();
      this.usuarioSeleccionado = null;
    });
  }

  desactivarUsuario(id: number) {
    this.usuarioService.desactivarUsuario(id).subscribe(() => {
      console.log('Usuario desactivado exitosamente');
      this.getUsuarios();
      this.usuarioSeleccionado = null;
    });
  }

  getUsuario(id: number) {
    this.usuarioService.getUsuario(id).subscribe((usuario: Usuario) => {
      this.usuarios = [usuario];
      console.log('Usuario cargado:', this.usuarios);
    });
  }

  updateUsuario(id: number, usuarioData: any) {
    // 1. Update basic info
    this.usuarioService.updateUsuario(id, usuarioData).pipe(
      // 2. If role is present in form, update roles separately
      switchMap((usuarioActualizado) => {
        if (usuarioData.rol) {
          // Backend expects an array of roles
          return this.usuarioService.asignarRoles(id, [usuarioData.rol]);
        }
        return of(usuarioActualizado);
      })
    ).subscribe({
      next: () => {
        console.log('Usuario actualizado correctamente (info y rol)');
        this.getUsuarios();
        this.cerrarFormulario();
        this.mostrarAlerta('Éxito', 'Usuario actualizado correctamente');
      },
      error: (err) => {
        console.error('Error actualizando usuario', err);
        this.mostrarAlerta('Error', 'No se pudo actualizar el usuario completamente.');
      }
    });
  }

  async mostrarAlerta(titulo: string, mensaje: string) {
    const alert = await this.alertController.create({
      header: titulo,
      message: mensaje,
      buttons: ['OK']
    });

    await alert.present();
  }
}
