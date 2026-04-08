import { serve } from "std/http/server";
import { createClient } from "supabase";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BoldCheckoutRequest {
  packId: string;
  userId: string;
  buyerEmail: string;
  description?: string;
}

interface BoldApiResponse {
  payload?: {
    payment_link?: string;
    url?: string;
  };
  message?: string;
}

/**
 * Bold API Checkout Link Generator
 */
serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { packId, userId, buyerEmail, description }: BoldCheckoutRequest = await req.json();

    // ─── Server-Side Price Verification (Expert-Level Security) ───
    const PRICE_MAP: Record<string, number> = {
      // Planes mensuales
      'creador':     149900,
      'pro':         349900,
      'agencia':     699900,
      'pyme':       1499900,
      // Recargas puntuales
      'pack_200':    25000,
      'pack_1000':   90000,
      'pack_2000':  150000,
    };

    const validatedAmount = PRICE_MAP[packId];
    if (!validatedAmount) {
      throw new Error(`Identificador de pack inválido: ${packId}`);
    }

    const BOLD_API_KEY = Deno.env.get("BOLD_API_KEY");

    if (!BOLD_API_KEY) {
      console.error("[bold-checkout] BOLD_API_KEY not set in Supabase secrets");
      return new Response(JSON.stringify({ error: "Pasarela de pagos no configurada. Configura BOLD_API_KEY en Supabase > Edge Functions > Secrets." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200, // Return 200 with error in body so frontend can read it
      });
    }

    const payload = {
      amount_type: "CLOSE",
      total_amount: validatedAmount, // Use validated amount
      currency: "COP",
      description: description || `Carga de Inteligencia Genesis: ${packId}`,
      payer_email: buyerEmail, 
      callback_url: `${Deno.env.get("SUPABASE_URL") || "https://creator-ia.com"}/pricing?status=payment_returned&pack=${packId}`
    };

    const boldApiUrl = "https://integrations.api.bold.co/online/link/v1";
    const response = await fetch(boldApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": BOLD_API_KEY
      },
      body: JSON.stringify(payload)
    });

    const data: BoldApiResponse = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Error al en Bold");
    }

    const linkId = data.payload?.payment_link;
    const url = data.payload?.url;

    // Track pending transaction in Database
    // This allows the Webhook to know who gets the credits when this link is approved.
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { error: insertError } = await supabaseClient
      .from("transactions")
      .insert({
        user_id: userId,
        amount: 0, // 0 until confirmed
        type: "bold_pending",
        description: `${packId}|${linkId}`
      });

    if (insertError) {
      console.error("Failed to insert pending tx:", insertError);
    }

    return new Response(JSON.stringify({ url, linkId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const err = error as Error;
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
