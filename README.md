# FrontInventario — Aplicación Web

Frontend del sistema de gestión de inventario. Desarrollado con **Angular 21**, consume la API REST del backend y se comunica en tiempo real mediante SignalR.

> **Repositorio backend:** [back_inventario](https://github.com/MarcosHernandez-FullStack/back_inventario)

---

## Tecnologías

- Angular 21 (Standalone Components + Signals)
- Bootstrap 5 + Bootstrap Icons
- SignalR client (notificaciones en tiempo real)
- jsPDF (exportación de reportes a PDF)

---

## Requisitos previos

| Herramienta | Versión mínima |
|---|---|
| Node.js | 20 o superior |
| npm | 10 o superior |
| Angular CLI | 21 |

Instalar Angular CLI globalmente (si no lo tienes):

```bash
npm install -g @angular/cli
```

---

## Dependencia con el backend

Esta aplicación **requiere que el backend esté corriendo** antes de iniciarla.

Sigue las instrucciones de [back_inventario](https://github.com/MarcosHernandez-FullStack/back_inventario) para levantar la API en `http://localhost:5000`.

---

## Ejecutar

```bash
npm install
npm start
```

La aplicación estará disponible en `http://localhost:4200`.

---

## Estructura del proyecto

```
src/app/
├── core/
│   ├── guards/          # Protección de rutas por rol (adminGuard)
│   └── services/        # AuthService, NotificacionService (SignalR)
├── features/
│   ├── login/           # Pantalla de inicio de sesión
│   ├── productos/       # Listado, creación y edición de productos
│   ├── categorias/      # Gestión de categorías
│   ├── usuarios/        # Gestión de usuarios
│   └── reportes/        # Reportes, stock bajo, exportar PDF
└── layouts/
    └── admin-layout/    # Sidebar, topbar, notificaciones toast
```

---

## Funcionalidades por rol

### Administrador
- Gestión completa de productos, categorías y usuarios
- Activar / desactivar registros desde la columna de estado
- Reportes: resumen general y stock por categoría
- Exportar reporte de inventario bajo a **PDF**
- Recibir **notificaciones en tiempo real** cuando un empleado reporta stock bajo

### Empleado
- Ver listado de productos (solo lectura)
- Consultar productos con stock bajo en reportes
- **Notificar al administrador** con un clic cuando el inventario está bajo

---

## Comunicación con el backend

| Función | Mecanismo | URL |
|---|---|---|
| Login y datos | HTTP REST | `http://localhost:5000/api/...` |
| Notificaciones en tiempo real | SignalR WebSocket | `http://localhost:5000/hubs/notificaciones` |

El token JWT obtenido al iniciar sesión se envía en el header `Authorization: Bearer <token>` en cada petición.

---

## Credenciales de prueba

> Las credenciales se crean al ejecutar el script `db_setup.sql` del backend.

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | admin@inventario.com | Admin123 |
| Empleado | empleado@inventario.com | Empleado123 |

---

## Build para producción

```bash
npm run build
```

Los archivos compilados se generan en la carpeta `dist/`.
