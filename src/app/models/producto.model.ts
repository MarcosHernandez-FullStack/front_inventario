export interface Producto {
  id:              number;
  nombre:          string;
  descripcion?:    string;
  precio:          number;
  cantidad:        number;
  idCategoria:     number;
  nombreCategoria: string;
  estado:          string;
}

export interface CrearProducto {
  nombre:      string;
  descripcion?: string;
  precio:      number;
  cantidad:    number;
  idCategoria: number;
  creadoPor:   number;
}

export interface ActualizarProducto {
  nombre:        string;
  descripcion?:  string;
  precio:        number;
  cantidad:      number;
  idCategoria:   number;
  actualizadoPor: number;
}
