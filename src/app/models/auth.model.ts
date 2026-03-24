export interface LoginRequest {
  correo:     string;
  contrasena: string;
}

export interface LoginResponse {
  token:     string;
  id:        number;
  nombres:   string;
  apellidos: string;
  correo:    string;
  rol:       string;
}
