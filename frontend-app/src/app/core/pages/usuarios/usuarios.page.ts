import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Usuario } from '../../models';
import { UsuarioService } from '../../services/usuario.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertController } from '@ionic/angular';

@Component({
  standalone: false,
  selector: 'app-usuarios',
  templateUrl: './usuarios.page.html',
  styleUrls: ['./usuarios.page.scss'],

})


export class UsuariosPage implements OnInit {
  formgroup: FormGroup;
  usuarios: Usuario[] = [];
  usuarioSeleccionado: Usuario | null = null;
  mostrarFormulario = false;
  isEditMode = false;

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private alertController: AlertController,
    private router: Router
  ) {
    this.formgroup = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      correo: ['', [Validators.required, Validators.email]],
      rol: ['trabajador', Validators.required],
      passwordHash: ['', [Validators.required, Validators.minLength(6)]],
      activo: [true, Validators.required]
    });
  }

  ngOnInit() {
    this.getUsuarios();
  }

  // Navegación
  goTo(url: string) {
    this.router.navigateByUrl(url);
  }

  // Control del modal
  mostrarFormularioCrear() {
    this.mostrarFormulario = true;
    this.isEditMode = false;
  }

  cerrarFormulario() {
    this.mostrarFormulario = false;
    this.formgroup.reset({
      rol: 'trabajador',
      activo: true
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
        this.mostrarAlerta('Aviso', 'La creación de usuarios no está implementada en este entorno.');
      }
    }
  }

  // private crearUsuario() { ... } // Removed as per instructions

  // ... (keep toggleMenu, verDetalles)


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
      rol: usuario.roles && usuario.roles.length > 0 ? usuario.roles[0] : 'trabajador',
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

  updateUsuario(id: number, usuarioData: Partial<Usuario>) {
    this.usuarioService.updateUsuario(id, usuarioData).subscribe((usuario: Usuario) => {
      console.log('Usuario actualizado', usuario);
      this.getUsuarios();
      this.cerrarFormulario();
      this.mostrarAlerta('Éxito', 'Usuario actualizado correctamente');
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