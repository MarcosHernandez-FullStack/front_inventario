export interface Usuario {
  id:        number;
  nombres:   string;
  apellidos: string;
  celular?:  string;
  correo:    string;
  rol:       string;
  estado:    string;
}

export interface CrearUsuario {
  nombres:    string;
  apellidos:  string;
  celular?:   string;
  correo:     string;
  contrasena: string;
  rol:        string;
  creadoPor:  string;
}
