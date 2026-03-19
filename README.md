# COTI CAP

Sistema web interno para la gestion de ordenes de compra y ordenes de servicio.

## Ejecucion local

```bash
npm install
npm run dev
```

Abrir en:

```text
http://localhost:3000
```

## Login

Ruta:

```text
http://localhost:3000/login
```

## Credenciales iniciales

Todos usan la misma contraseña temporal:

```text
Pacifico2026*
```

Usuarios disponibles:

- `admin@pacifico.local`
- `logistica@pacifico.local`
- `contabilidad@pacifico.local`
- `equipos@pacifico.local`
- `finanzas@pacifico.local`

## Modulos actuales

- Login y sesion
- Dashboard
- Proveedores
- Ordenes
- Usuarios
- Aprobaciones
- Configuracion

## Calculo tributario actual

- IGV configurable en `Configuracion`
- Retencion configurable en `Configuracion`
- Umbral automatico de retencion configurable
- El total de la orden se calcula desde los items
- El sistema calcula `Subtotal`, `IGV`, `Retencion`, `Total` y `Total a pagar`

## Base de datos

El sistema ahora esta preparado para trabajar con `MySQL + Prisma`.

Variables necesarias:

```text
DATABASE_URL="mysql://root:@localhost:3306/coti_cap"
AUTH_SECRET="cambia-esto-en-produccion"
```

Pasos recomendados en local:

```bash
copy .env.example .env
npm run prisma:generate
npm run prisma:push
npm run db:seed
```

`db:seed` importa a MySQL los datos actuales que tengas en `data/`.

## Despliegue

Secuencia recomendada para Railway:

1. Subir el proyecto a GitHub
2. Crear el proyecto en Railway desde ese repositorio
3. Agregar MySQL en Railway
4. Configurar `DATABASE_URL` y `AUTH_SECRET`
5. Ejecutar:

```bash
npm run prisma:generate
npm run prisma:push
npm run db:seed
```
