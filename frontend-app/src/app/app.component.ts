import { Component, OnInit } from '@angular/core';
import { AuthService } from './core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    this.checkTokenInUrl();
  }

  checkTokenInUrl() {
    // Verificar si hay token en la URL (Login Mágico vía QR)
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
      console.log('Token detectado en URL, iniciando sesión automática...');
      this.authService.loginWithToken(token).subscribe({
        next: () => {
          console.log('Login vía QR exitoso');
          // Limpiar la URL param para que no se vea feo
          window.history.replaceState({}, document.title, window.location.pathname);
          this.router.navigate(['/home']);
        },
        error: (err) => {
          console.error('Error en login QR:', err);
          this.router.navigate(['/login']);
        }
      });
    }
  }
}
