import { Injectable, OnDestroy, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, Subscription, of } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { UsuarioPerfil, AuthResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenKey = 'auth_token';
  private rememberKey = 'remember_email';
  private perfil$ = new BehaviorSubject<UsuarioPerfil | null>(null);
  private http = inject(HttpClient);
  private perfilSubscription: Subscription | undefined;

  constructor() {
    // Si hay token guardado, intentamos cargar el perfil
    // NOTA: Si acabamos de guardar el token en AppComponent, esto se ejecutará después o concurrentemente.
    const token = this.getToken();
    if (token) {
      this.validarYRefrescarPerfil();
    }
  }

  validarYRefrescarPerfil() {
    if (this.perfilSubscription) this.perfilSubscription.unsubscribe();
    this.perfilSubscription = this.fetchPerfil().subscribe({
      next: (p) => this.perfil$.next(p),
      error: (err) => { if (err?.status === 401) this.logout(); }
    });
  }

  ngOnDestroy(): void {
    if (this.perfilSubscription) {
      this.perfilSubscription.unsubscribe();
    }
  }

  login(correo: string, password: string, remember: boolean): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/ingresar`, { correo, password }).pipe(
      tap((resp) => {
        this.setToken(resp.token);
        this.perfil$.next(resp.usuario);
        if (remember) localStorage.setItem(this.rememberKey, correo);
        else localStorage.removeItem(this.rememberKey);
      })
    );
  }

  // Nuevo método para login con token directo (QR)
  loginWithToken(token: string): Observable<UsuarioPerfil> {
    this.setToken(token);
    // Verificar que el token sea válido y obtener datos del usuario
    return this.fetchPerfil().pipe(
      tap((usuario) => {
        this.perfil$.next(usuario);
      })
    );
  }

  fetchPerfil(): Observable<UsuarioPerfil> {
    return this.http.get<{ usuario: UsuarioPerfil }>(`${environment.apiUrl}/auth/perfil`).pipe(
      tap(({ usuario }) => this.perfil$.next(usuario)),
      map(({ usuario }) => usuario)
    );
  }

  getPerfil$(): Observable<UsuarioPerfil | null> { return this.perfil$.asObservable(); }

  getRememberedEmail(): string { return localStorage.getItem(this.rememberKey) || ''; }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }
  getToken(): string | null { return localStorage.getItem(this.tokenKey); }
  logout(): void {
    localStorage.removeItem(this.tokenKey); this.perfil$.next(null);
  }
}
