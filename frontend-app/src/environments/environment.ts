// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

const protocol = window.location.protocol;
const hostname = window.location.hostname;
const port = window.location.port;

let apiUrl = '';

// Si estamos en desarrollo (Ionic/Angular sirven en 8100 o 4200),
// forzamos la conexión al backend en puerto 3000.
if (port === '8100' || port === '4200') {
  apiUrl = `${protocol}//${hostname}:3000`;
} else {
  // Si estamos en producción o via túnel (Serveo/Localtunnel),
  // el backend sirve el frontend, así que la API está en el mismo origen.
  // Usamos ruta relativa o URL base sin puerto explícito.
  apiUrl = ''; 
}

export const environment = {
  production: false,
  apiUrl: apiUrl,
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
