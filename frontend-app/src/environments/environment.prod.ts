const protocol = window.location.protocol;
const hostname = window.location.hostname;
const port = window.location.port;

let apiUrl = '';

if (port === '8100' || port === '4200') {
  apiUrl = `${protocol}//${hostname}:3000`;
} else {
  apiUrl = ''; 
}

export const environment = {
  production: true,
  apiUrl: apiUrl,
};
