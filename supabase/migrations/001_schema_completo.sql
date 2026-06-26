-- ============================================================
-- SISTEMA DIAMELAD WEB - ESQUEMA DE BASE DE DATOS
-- Supabase PostgreSQL con Row Level Security (RLS)
-- ============================================================

-- ============================================================
-- EXTENSIONES
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS / TIPOS PERSONALIZADOS
-- ============================================================
CREATE TYPE rol_usuario AS ENUM (
    'admin',
    'vendedor_bolivar',
    'vendedor_guayana',
    'vendedor_maturin'
);

CREATE TYPE sede_empresa AS ENUM (
    'Ciudad Bolivar',
    'Ciudad Guayana',
    'Maturin'
);

CREATE TYPE estado_venta AS ENUM (
    'pendiente',
    'parcial',
    'pagada',
    'vencida',
    'anulada'
);

CREATE TYPE metodo_pago AS ENUM (
    'transferencia',
    'efectivo',
    'divisa',
    'zelle',
    'otro'
);

CREATE TYPE tipo_retencion AS ENUM (
    'IVA',
    'ISLR'
);

CREATE TYPE tipo_notificacion AS ENUM (
    'nueva_venta',
    'pago_registrado',
    'vencimiento_proximo',
    'venta_vencida',
    'sistema'
);

-- ============================================================
-- TABLA: PERFILES DE USUARIO (Extension de auth.users)
-- ============================================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    role rol_usuario NOT NULL DEFAULT 'vendedor_bolivar',
    sede sede_empresa,
    phone TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'Perfiles de usuarios del sistema Diamelad';

-- ============================================================
-- TABLA: TASAS BCV
-- ============================================================
CREATE TABLE public.tasas_bcv (
    id SERIAL PRIMARY KEY,
    fecha DATE NOT NULL UNIQUE,
    tasa_usd DECIMAL(12,4) NOT NULL,
    fuente TEXT DEFAULT 'BCV',
    es_manual BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.tasas_bcv IS 'Historial de tasas del BCV, actualizacion automatica y manual';

-- ============================================================
-- TABLA: CLIENTES
-- ============================================================
CREATE TABLE public.clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    razon_social TEXT NOT NULL,
    rif TEXT UNIQUE NOT NULL,
    direccion TEXT,
    telefono TEXT,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.clientes IS 'Catalogo de clientes de Diamelad';

-- ============================================================
-- TABLA: VENTAS (Ordenes de Entrega)
-- ============================================================
CREATE TABLE public.ventas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_oe TEXT NOT NULL,
    correlacion_a2 TEXT UNIQUE NOT NULL,

    cliente_id UUID NOT NULL REFERENCES public.clientes(id),
    vendedor_id UUID NOT NULL REFERENCES public.profiles(id),
    sede sede_empresa NOT NULL,

    fecha_emision DATE NOT NULL,
    fecha_vencimiento DATE NOT NULL,

    monto_total_usd DECIMAL(12,2) NOT NULL,
    monto_total_bsd DECIMAL(12,2),

    tasa_aplicada DECIMAL(12,4) NOT NULL,

    saldo_pendiente_usd DECIMAL(12,2) DEFAULT 0,

    estado estado_venta DEFAULT 'pendiente',

    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.ventas IS 'Ordenes de entrega con correlacion fiscal al sistema A2';

-- ============================================================
-- TABLA: ITEMS DE VENTA
-- ============================================================
CREATE TABLE public.venta_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venta_id UUID NOT NULL REFERENCES public.ventas(id) ON DELETE CASCADE,
    codigo_producto TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    cantidad DECIMAL(10,2) NOT NULL CHECK (cantidad > 0),
    precio_unitario_usd DECIMAL(12,2) NOT NULL CHECK (precio_unitario_usd >= 0),
    total_item_usd DECIMAL(12,2) GENERATED ALWAYS AS (cantidad * precio_unitario_usd) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.venta_items IS 'Lineas de producto por orden de entrega';

-- ============================================================
-- TABLA: PAGOS
-- ============================================================
CREATE TABLE public.pagos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venta_id UUID NOT NULL REFERENCES public.ventas(id),
    vendedor_id UUID NOT NULL REFERENCES public.profiles(id),

    fecha_pago DATE NOT NULL,
    monto_pagado_usd DECIMAL(12,2) NOT NULL CHECK (monto_pagado_usd > 0),
    monto_pagado_bsd DECIMAL(12,2),

    tasa_usada DECIMAL(12,4) NOT NULL,
    es_tasa_manual BOOLEAN DEFAULT FALSE,

    metodo_pago metodo_pago NOT NULL DEFAULT 'transferencia',
    referencia_pago TEXT,
    banco TEXT,

    comprobante_url TEXT,
    notas TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.pagos IS 'Registro de pagos con comprobantes adjuntos';

-- ============================================================
-- TABLA: RETENCIONES (IVA e ISLR)
-- ============================================================
CREATE TABLE public.retenciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venta_id UUID NOT NULL REFERENCES public.ventas(id),
    tipo tipo_retencion NOT NULL,
    porcentaje DECIMAL(5,2) NOT NULL CHECK (porcentaje >= 0 AND porcentaje <= 100),
    monto_retenido_usd DECIMAL(12,2) NOT NULL,
    fecha_retencion DATE NOT NULL,
    numero_comprobante TEXT,
    comprobante_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.retenciones IS 'Retenciones fiscales IVA e ISLR por venta';

-- ============================================================
-- TABLA: NOTIFICACIONES
-- ============================================================
CREATE TABLE public.notificaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    tipo tipo_notificacion NOT NULL,
    titulo TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    data JSONB,
    leida BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.notificaciones IS 'Notificaciones para el CEO/Admin';

-- ============================================================
-- INDICES
-- ============================================================
CREATE INDEX idx_ventas_vendedor ON public.ventas(vendedor_id);
CREATE INDEX idx_ventas_estado ON public.ventas(estado);
CREATE INDEX idx_ventas_fecha_emision ON public.ventas(fecha_emision);
CREATE INDEX idx_ventas_sede ON public.ventas(sede);
CREATE INDEX idx_pagos_venta ON public.pagos(venta_id);
CREATE INDEX idx_pagos_vendedor ON public.pagos(vendedor_id);
CREATE INDEX idx_retenciones_venta ON public.retenciones(venta_id);
CREATE INDEX idx_notificaciones_user ON public.notificaciones(user_id);
CREATE INDEX idx_notificaciones_leida ON public.notificaciones(leida);
CREATE INDEX idx_clientes_rif ON public.clientes(rif);

-- ============================================================
-- TRIGGER: Actualizar saldo y estado de venta al registrar pago
-- ============================================================
CREATE OR REPLACE FUNCTION public.actualizar_saldo_venta()
RETURNS TRIGGER AS $$
DECLARE
    total_pagado DECIMAL(12,2);
    monto_total DECIMAL(12,2);
    nuevo_estado estado_venta;
BEGIN
    SELECT COALESCE(SUM(monto_pagado_usd), 0) INTO total_pagado
    FROM public.pagos WHERE venta_id = NEW.venta_id;

    SELECT monto_total_usd INTO monto_total
    FROM public.ventas WHERE id = NEW.venta_id;

    IF total_pagado >= monto_total THEN
        nuevo_estado := 'pagada';
    ELSIF total_pagado > 0 THEN
        nuevo_estado := 'parcial';
    ELSE
        nuevo_estado := 'pendiente';
    END IF;

    UPDATE public.ventas
    SET saldo_pendiente_usd = monto_total - total_pagado,
        estado = nuevo_estado,
        updated_at = NOW()
    WHERE id = NEW.venta_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_actualizar_saldo_venta
AFTER INSERT OR UPDATE ON public.pagos
FOR EACH ROW
EXECUTE FUNCTION public.actualizar_saldo_venta();

-- ============================================================
-- TRIGGER: Notificar al CEO cuando se registra una nueva venta
-- ============================================================
CREATE OR REPLACE FUNCTION public.notificar_nueva_venta()
RETURNS TRIGGER AS $$
DECLARE
    admin_id UUID;
    vendedor_nombre TEXT;
    cliente_nombre TEXT;
BEGIN
    SELECT full_name INTO vendedor_nombre FROM public.profiles WHERE id = NEW.vendedor_id;
    SELECT razon_social INTO cliente_nombre FROM public.clientes WHERE id = NEW.cliente_id;

    FOR admin_id IN
        SELECT id FROM public.profiles WHERE role = 'admin'
    LOOP
        INSERT INTO public.notificaciones (user_id, tipo, titulo, mensaje, data)
        VALUES (
            admin_id,
            'nueva_venta',
            'Nueva Venta Registrada',
            vendedor_nombre || ' registro una venta de $' || NEW.monto_total_usd || ' para ' || cliente_nombre,
            jsonb_build_object(
                'venta_id', NEW.id,
                'numero_oe', NEW.numero_oe,
                'vendedor', vendedor_nombre,
                'monto', NEW.monto_total_usd
            )
        );
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notificar_nueva_venta
AFTER INSERT ON public.ventas
FOR EACH ROW
EXECUTE FUNCTION public.notificar_nueva_venta();

-- ============================================================
-- TRIGGER: Notificar al CEO cuando se registra un pago
-- ============================================================
CREATE OR REPLACE FUNCTION public.notificar_pago_registrado()
RETURNS TRIGGER AS $$
DECLARE
    admin_id UUID;
    vendedor_nombre TEXT;
    venta_info RECORD;
BEGIN
    SELECT full_name INTO vendedor_nombre FROM public.profiles WHERE id = NEW.vendedor_id;
    SELECT numero_oe, correlacion_a2, monto_total_usd INTO venta_info
    FROM public.ventas WHERE id = NEW.venta_id;

    FOR admin_id IN
        SELECT id FROM public.profiles WHERE role = 'admin'
    LOOP
        INSERT INTO public.notificaciones (user_id, tipo, titulo, mensaje, data)
        VALUES (
            admin_id,
            'pago_registrado',
            'Pago Registrado',
            vendedor_nombre || ' registro un pago de $' || NEW.monto_pagado_usd || ' para OE ' || venta_info.numero_oe,
            jsonb_build_object(
                'pago_id', NEW.id,
                'venta_id', NEW.venta_id,
                'numero_oe', venta_info.numero_oe,
                'monto_pagado', NEW.monto_pagado_usd
            )
        );
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notificar_pago_registrado
AFTER INSERT ON public.pagos
FOR EACH ROW
EXECUTE FUNCTION public.notificar_pago_registrado();

-- ============================================================
-- TRIGGER: Actualizar updated_at automaticamente
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON public.clientes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ventas_updated_at BEFORE UPDATE ON public.ventas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY (RLS) - POLITICAS
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasas_bcv ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venta_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retenciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;

-- Funcion auxiliar para verificar si es admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PROFILES: Admin ve todo, usuario ve solo su perfil
CREATE POLICY "profiles_admin_all" ON public.profiles
    FOR ALL TO authenticated USING (public.is_admin());

CREATE POLICY "profiles_self_read" ON public.profiles
    FOR SELECT TO authenticated USING (id = auth.uid());

CREATE POLICY "profiles_self_update" ON public.profiles
    FOR UPDATE TO authenticated USING (id = auth.uid());

-- TASAS BCV: Todos pueden leer, solo admin puede crear/modificar
CREATE POLICY "tasas_bcv_read_all" ON public.tasas_bcv
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "tasas_bcv_admin_write" ON public.tasas_bcv
    FOR ALL TO authenticated USING (public.is_admin());

-- CLIENTES: Todos pueden leer, admin puede todo
CREATE POLICY "clientes_read_all" ON public.clientes
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "clientes_admin_write" ON public.clientes
    FOR ALL TO authenticated USING (public.is_admin());

-- VENTAS: Admin ve todo, vendedor solo sus ventas de su sede
CREATE POLICY "ventas_admin_all" ON public.ventas
    FOR ALL TO authenticated USING (public.is_admin());

CREATE POLICY "ventas_vendedor_own" ON public.ventas
    FOR ALL TO authenticated USING (vendedor_id = auth.uid());

-- VENTA_ITEMS: Admin ve todo, vendedor ve items de sus ventas
CREATE POLICY "venta_items_admin_all" ON public.venta_items
    FOR ALL TO authenticated USING (public.is_admin());

CREATE POLICY "venta_items_vendedor_own" ON public.venta_items
    FOR ALL TO authenticated USING (
        venta_id IN (SELECT id FROM public.ventas WHERE vendedor_id = auth.uid())
    );

-- PAGOS: Admin ve todo, vendedor solo sus pagos
CREATE POLICY "pagos_admin_all" ON public.pagos
    FOR ALL TO authenticated USING (public.is_admin());

CREATE POLICY "pagos_vendedor_own" ON public.pagos
    FOR ALL TO authenticated USING (vendedor_id = auth.uid());

-- RETENCIONES: Admin ve todo, vendedor ve retenciones de sus ventas
CREATE POLICY "retenciones_admin_all" ON public.retenciones
    FOR ALL TO authenticated USING (public.is_admin());

CREATE POLICY "retenciones_vendedor_own" ON public.retenciones
    FOR ALL TO authenticated USING (
        venta_id IN (SELECT id FROM public.ventas WHERE vendedor_id = auth.uid())
    );

-- NOTIFICACIONES: Solo el usuario destinatario puede ver sus notificaciones
CREATE POLICY "notificaciones_own" ON public.notificaciones
    FOR ALL TO authenticated USING (user_id = auth.uid());

-- ============================================================
-- DATOS INICIALES
-- ============================================================
INSERT INTO public.tasas_bcv (fecha, tasa_usd, fuente, es_manual)
VALUES (CURRENT_DATE, 36.5000, 'BCV', FALSE)
ON CONFLICT (fecha) DO NOTHING;

-- ============================================================
-- BUCKETS DE STORAGE (ejecutar en Supabase Dashboard > Storage)
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES
-- ('comprobantes-pago', 'comprobantes-pago', false),
-- ('comprobantes-retencion', 'comprobantes-retencion', false);

-- Politicas de Storage (ejecutar en SQL Editor de Supabase):
-- CREATE POLICY "Comprobantes de pago - propietario y admin" ON storage.objects
--   FOR ALL USING (
--     bucket_id = 'comprobantes-pago' AND
--     (auth.uid() = (storage.foldername(name))[1]::uuid OR public.is_admin())
--   );
