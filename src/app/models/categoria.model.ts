export interface Categoria {
  id:     number;
  nombre: string;
  estado: string;
}

export interface CrearCategoria {
  nombre:    string;
  creadoPor: string;
}
