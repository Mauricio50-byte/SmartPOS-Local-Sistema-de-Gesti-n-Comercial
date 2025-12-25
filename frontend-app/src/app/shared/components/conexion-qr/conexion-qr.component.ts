import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { SistemaService, DatosConexion } from 'src/app/shared/services/sistema/sistema.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { UsuarioService } from 'src/app/core/services/usuario.service';
import { Usuario } from 'src/app/core/models/usuario';
import * as QRCode from 'qrcode';

@Component({
    selector: 'app-conexion-qr',
    templateUrl: './conexion-qr.component.html',
    styleUrls: ['./conexion-qr.component.scss'],
    standalone: false
})
export class ConexionQrComponent implements OnInit {
    @ViewChild('qrCanvas') qrCanvas!: ElementRef<HTMLCanvasElement>;

    token = '';
    ipManual = '';
    urlQr = '';
    cargando = true;
    error = '';
    mostrarInputIp = false;
    
    usuarios: Usuario[] = [];
    usuarioSeleccionadoId: number | null = null;
    esAdmin = false;

    constructor(
        private modalCtrl: ModalController,
        private sistemaService: SistemaService,
        private authService: AuthService,
        private usuarioService: UsuarioService
    ) { }

    ngOnInit() {
        this.detectarEntorno();
        this.verificarPermisos();
        this.cargarDatos();
    }

    verificarPermisos() {
        const user = this.authService.getUser();
        if (user && (user.roles?.includes('ADMIN') || user.adminPorDefecto)) {
            this.esAdmin = true;
            this.cargarUsuarios();
        }
    }

    cargarUsuarios() {
        this.usuarioService.getUsuarios({ activo: true }).subscribe({
            next: (users) => {
                this.usuarios = users;
            },
            error: (err) => console.error('Error cargando usuarios', err)
        });
    }

    detectarEntorno() {
        const hostname = window.location.hostname;
        const storedIp = localStorage.getItem('pos_server_ip');
        
        // Si es localhost, 127.0.0.1 o '0.0.0.0', pedimos IP manual porque esas no sirven para externos
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') {
            this.mostrarInputIp = true;
            this.ipManual = storedIp || ''; 
        } else {
            this.mostrarInputIp = false;
            this.ipManual = hostname;
        }
    }

    cargarDatos() {
        this.cargando = true;
        this.error = '';

        // Si hay un usuario seleccionado, usamos su ID, si no, undefined (genera para el usuario actual)
        const userId = this.usuarioSeleccionadoId || undefined;

        this.sistemaService.obtenerDatosConexion(userId).subscribe({
            next: (resp: DatosConexion) => {
                this.token = resp.token;
                
                if (resp.ip && resp.ip !== '127.0.0.1') {
                    this.ipManual = resp.ip;
                    this.mostrarInputIp = true; 
                }
                
                this.cargando = false;
                setTimeout(() => this.generarQr(), 100);
            },
            error: (err) => {
                console.warn('Backend QR endpoint failed, falling back to local session', err);
                
                // Fallback: Usar token de sesión actual (solo si no estamos tratando de suplantar a otro)
                if (!userId) {
                    const currentToken = this.authService.getToken();
                    if (currentToken) {
                        this.token = currentToken;
                        this.cargando = false;
                        setTimeout(() => this.generarQr(), 100);
                    } else {
                        this.error = 'No se pudo generar el código. Inicia sesión nuevamente.';
                        this.cargando = false;
                    }
                } else {
                    this.error = 'No se pudo generar el código para el usuario seleccionado.';
                    this.cargando = false;
                }
            }
        });
    }

    generarQr() {
        if (!this.token || !this.qrCanvas) return;

        // Guardar IP si se ingresó manualmente
        if (this.mostrarInputIp && this.ipManual) {
            localStorage.setItem('pos_server_ip', this.ipManual);
        }

        // Si necesitamos IP manual y está vacía, no generamos QR válido aún
        if (this.mostrarInputIp && (!this.ipManual || this.ipManual.length < 7)) {
            this.urlQr = ''; 
            const context = this.qrCanvas.nativeElement.getContext('2d');
            if (context) context.clearRect(0, 0, 256, 256);
            return;
        }

        const ipUsar = this.ipManual || window.location.hostname;
        const port = window.location.port || '80';
        const protocol = window.location.protocol;
        
        // Construir URL completa basada en el entorno actual
        this.urlQr = `${protocol}//${ipUsar}:${port}?token=${this.token}`;

        QRCode.toCanvas(this.qrCanvas.nativeElement, this.urlQr, {
            width: 256,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        }, (error) => {
            if (error) console.error(error);
        });
    }

    cerrar() {
        this.modalCtrl.dismiss();
    }
    
    onUsuarioChange() {
        this.cargarDatos();
    }

    async copiarUrl() {
        try {
            await navigator.clipboard.writeText(this.urlQr);
            // Podrías mostrar un toast aquí si lo deseas
            const btn = document.querySelector('.url-box ion-button');
            if(btn) {
                const originalColor = btn.getAttribute('color');
                btn.setAttribute('color', 'success');
                setTimeout(() => btn.setAttribute('color', originalColor || 'primary'), 1000);
            }
        } catch (err) {
            console.error('Error al copiar: ', err);
        }
    }
}
