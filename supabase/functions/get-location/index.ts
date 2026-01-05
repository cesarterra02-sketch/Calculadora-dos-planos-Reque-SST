
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Detecta o IP do cliente (gateway da Supabase)
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0] || "";
    
    // 2. Consulta a API de geolocalização de forma segura (Server-Side)
    // Se não houver IP detectado, a API usará o IP do servidor da Function como fallback
    const geoUrl = clientIP ? `https://ipapi.co/${clientIP}/json/` : 'https://ipapi.co/json/';
    
    const response = await fetch(geoUrl, {
      headers: { 'User-Agent': 'Supabase-Edge-Function' }
    });
    
    const data = await response.json();

    // 3. Verifica se a API retornou erro (ex: limite de requisições)
    if (data.error) throw new Error(data.reason || "Erro na API Geográfica");

    // 4. Mapeia o payload de resposta
    const payload = {
      city: (data.city || 'ACESSO VIA WEB - LOCALIZAÇÃO PROTEGIDA').toUpperCase(),
      region: (data.region_code || data.region || '').toUpperCase(),
      latitude: data.latitude,
      longitude: data.longitude
    };

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    // Fallback de segurança em caso de qualquer falha técnica
    return new Response(JSON.stringify({ 
      error: error.message,
      city: 'ACESSO VIA WEB - LOCALIZAÇÃO PROTEGIDA',
      region: '',
      latitude: null,
      longitude: null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, // Retornamos 200 para que o frontend processe o fallback suavemente
    })
  }
})
