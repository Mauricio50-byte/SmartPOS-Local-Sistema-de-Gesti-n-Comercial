const hostname = window.location.hostname;
const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
const apiUrl = isLocalhost ? 'http://127.0.0.1:3000' : `http://${hostname}:3000`;

export const environment = {
  production: true,
  apiUrl: apiUrl,
  VAPID_PUBLIC_KEY: ''
};
