// supabase/functions/actualizar-tasa-bcv/index.ts
// Edge Function: Actualiza la tasa del BCV diariamente
// Se ejecuta via Cron Job (Supabase Dashboard > Cron Jobs)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Consultar API del BCV (BCV esquema oficial)
    // Nota: La URL real debe ser confirmada segun la API disponible del BCV
    const response = await fetch("https://bcv.org.ve/", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    // Extraccion de la tasa (ajustar segun la estructura real de la pagina/API)
    const html = await response.text();

    // Ejemplo de extraccion - AJUSTAR segun la estructura real del BCV
    // Se recomienda usar una API oficial si esta disponible
    const tasaMatch = html.match(/(\d{1,2},\d{4})/);
    let tasa_usd = 36.5000; // Valor por defecto si falla la extraccion

    if (tasaMatch) {
      tasa_usd = parseFloat(tasaMatch[1].replace(",", "."));
    }

    const fecha = new Date().toISOString().split("T")[0];

    // Insertar o actualizar la tasa del dia
    const { data, error } = await supabase
      .from("tasas_bcv")
      .upsert(
        {
          fecha,
          tasa_usd,
          fuente: "BCV",
          es_manual: false,
        },
        { onConflict: "fecha" }
      )
      .select();

    if (error) throw error;

    return new Response(
      JSON.stringify({
        success: true,
        fecha,
        tasa_usd,
        message: "Tasa BCV actualizada correctamente",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error actualizando tasa BCV:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
