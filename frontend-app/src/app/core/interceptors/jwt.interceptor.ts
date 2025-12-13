import { Injectable, inject, Injector } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  private injector = inject(Injector);
  private router = inject(Router);

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const auth = this.injector.get(AuthService);
    const token = auth.getToken();
    const isApi = req.url.startsWith('http://') || req.url.startsWith('https://');
    const isLogin = req.url.includes('/auth/ingresar');
    const shouldAttach = token && isApi && !isLogin;
    const authReq = shouldAttach ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
    return next.handle(authReq).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401) {
          const onLoginPage = this.router.url.startsWith('/login');
          if (!isLogin) {
            auth.logout();
            if (!onLoginPage) this.router.navigate(['/login']);
          }
        }
        return throwError(() => err);
      })
    );
  }
}
