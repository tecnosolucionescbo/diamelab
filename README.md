# Diamelad Web - Sistema de Gestion de Ventas

Sistema web interactivo para la gestion de ventas, pagos y retenciones fiscales de la empresa Diamelad.

## Caracteristicas Principales

- **Control de Acceso por Roles**: Admin/CEO con acceso total, 3 vendedores por sede (Ciudad Bolivar, Ciudad Guayana, Maturin)
- **Modulo de Ventas**: Registro de ordenes de entrega con correlacion fiscal al sistema A2
- **Modulo de Pagos**: Registro de pagos con capturas de pantalla como comprobantes
- **Tasa BCV**: Actualizacion automatica diaria + ajuste manual para pagos retroactivos
- **Retenciones**: Gestion de retenciones IVA e ISLR con comprobantes adjuntos
- **Notificaciones**: Notificaciones automaticas al CEO por nuevas ventas y pagos
- **Supabase**: Base de datos PostgreSQL con RLS + Storage para documentos

## Estructura del Proyecto

```
diamelad-web/
├── src/
│   ├── app/              # Paginas de Next.js (App Router)
│   ├── components/       # Componentes React reutilizables
│   ├── hooks/            # Custom hooks (useAuth, useVentas)
│   ├── lib/              # Cliente Supabase y utilidades
│   └── types/            # Tipos TypeScript
├── supabase/
│   ├── migrations/       # Scripts SQL de la base de datos
│   └── functions/        # Edge Functions (tasa BCV)
└── package.json
```

## Instalacion

1. Clonar el repositorio
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Configurar variables de entorno en `.env.local` (ver `.env.local.example`)
4. Ejecutar migraciones SQL en Supabase Dashboard
5. Crear buckets de Storage en Supabase:
   - `comprobantes-pago`
   - `comprobantes-retencion`
6. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```

## Configuracion de Supabase

### 1. Crear proyecto en Supabase
### 2. Ejecutar migracion SQL
Copiar el contenido de `supabase/migrations/001_schema_completo.sql` en el SQL Editor de Supabase.

### 3. Configurar Storage Buckets
En el Dashboard de Supabase > Storage, crear:
- `comprobantes-pago` (privado)
- `comprobantes-retencion` (privado)

### 4. Configurar Edge Function (Tasa BCV)
```bash
supabase functions deploy actualizar-tasa-bcv
```

### 5. Configurar Cron Job
En Supabase Dashboard > Cron Jobs, crear un job que ejecute la Edge Function diariamente a las 9:00 AM.

### 6. Generar tipos de TypeScript
```bash
npm run types
```

## Roles de Usuario

| Rol | Sede | Permisos |
|-----|------|----------|
| admin | Todas | Acceso total, gestion de usuarios, reportes, configuracion de tasas |
| vendedor_bolivar | Ciudad Bolivar | Crear ventas, ver sus ventas, registrar pagos |
| vendedor_guayana | Ciudad Guayana | Crear ventas, ver sus ventas, registrar pagos |
| vendedor_maturin | Maturin | Crear ventas, ver sus ventas, registrar pagos |

## Integracion con Sistema A2

Cada orden de entrega generada en Diamelad Web incluye obligatoriamente el campo `correlacion_a2`, que vincula la numeracion fiscal con el sistema A2 existente.

## Tecnologias

- Next.js 15 + React 19
- TypeScript
- Tailwind CSS
- Supabase (PostgreSQL + Auth + Storage + Realtime)
- Deno (Edge Functions)

## Licencia

Proyecto privado - Diamelad C.A.
