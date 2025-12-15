import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { SistemaService, DatosConexion } from 'src/app/shared/services/sistema/sistema.service';
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

    constructor(
        private modalCtrl: ModalController,
        private sistemaService: SistemaService
    ) { }

    ngOnInit() {
        this.detectarEntorno();
        this.cargarDatos();
    }

    detectarEntorno() {
        const hostname = window.location.hostname;
        // Si es localhost, 127.0.0.1 o '0.0.0.0', pedimos IP manual porque esas no sirven para externos
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') {
            this.mostrarInputIp = true;
            this.ipManual = ''; // Se deja vacía para forzar al usuario a buscarla, o podríamos intentar adivinar
        } else {
            this.mostrarInputIp = false;
            this.ipManual = hostname;
        }
    }

    cargarDatos() {
        this.cargando = true;
        this.error = '';

        this.sistemaService.obtenerDatosConexion().subscribe({
            next: (resp: DatosConexion) => {
                this.token = resp.token;
                
                // Si el backend nos devuelve una IP válida (diferente a localhost), la usamos
                // y desactivamos la petición manual de IP
                if (resp.ip && resp.ip !== '127.0.0.1') {
                    this.ipManual = resp.ip;
                    this.mostrarInputIp = false; // Ya no necesitamos pedirla manualmente
                } else if (this.mostrarInputIp && resp.ip) {
                     // Si el backend devuelve algo pero seguimos en modo manual (ej. no pudo detectar bien)
                     this.ipManual = resp.ip;
                }

                this.cargando = false;
                setTimeout(() => this.generarQr(), 100);
            },
            error: (err) => {
                console.error(err);
                this.cargando = false;
                this.error = 'Error obteniendo token. Verifica que seas Admin.';
            }
        });
    }

    generarQr() {
        if (!this.token || !this.qrCanvas) return;

        // Si necesitamos IP manual y está vacía, no generamos QR válido aún
        if (this.mostrarInputIp && (!this.ipManual || this.ipManual.length < 7)) {
            this.urlQr = ''; // Limpiar
            // Limpiar canvas
            const context = this.qrCanvas.nativeElement.getContext('2d');
            if (context) context.clearRect(0, 0, 256, 256);
            return;
        }

        const ipUsar = this.ipManual || window.location.hostname;
        this.urlQr = `http://${ipUsar}:8100?token=${this.token}`;

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
}
