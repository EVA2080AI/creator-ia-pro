import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, bold-signature",
};

/**
 * Bold API Webhook (Event Receiver)
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  
  try {
    // Note: In production you MUST validate the `Bold-Signature` header here 
    // using HMAC-SHA256 with your webhook secret.
    const body = await req.text();
    const payload = JSON.parse(body);

    console.log("Bold Webhook Received:", payload);

    // Assuming Bold returns the payment_link_id inside `reference` or `payment_link_id` depending on event config
    const linkId = payload?.data?.reference || payload?.reference || payload?.payment_link_id;
    const status = payload?.data?.status || payload?.status;

    if (!linkId) {
      return new Response("Missing Link ID in payload", { status: 400 });
    }

    if (status === "APPROVED" || status === "PAID") {
      const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
      const supabaseClient = createClient(supabaseUrl, supabaseKey);

      // 1. Find the pending transaction wrapper we created inside bold-checkout
      const { data: txList, error: txError } = await supabaseClient
        .from("transactions")
        .select("*")
        .eq("type", "bold_pending")
        .like("description", `%${linkId}%`);
        
      if (txError || !txList || txList.length === 0) {
        console.error("Link no encontrado en base de datos:", linkId);
        return new Response("No pending tx matching link", { status: 404 });
      }

      const tx = txList[0];
      const descParts = tx.description.split("|"); // e.g., ["pack_500", "LNK_H7S4..."]
      const packId = descParts[0];

      let creditsToAdd = 0;
      switch (packId) {
        case "pack_100":  creditsToAdd = 100;  break;
        case "pack_500":  creditsToAdd = 500;  break;
        case "pack_1000": creditsToAdd = 1000; break;
        case "pack_2500": creditsToAdd = 2500; break;
        default: break;
      }

      if (creditsToAdd > 0) {
        // 2. Add Credits to the User Profile (Admin RPC)
        const { error: rpcError } = await supabaseClient.rpc("admin_add_credits", {
          _target_user_id: tx.user_id,
          _amount: creditsToAdd,
          _reason: `Bold Payment: ${packId} (${linkId})`
        });

        if (rpcError) {
          console.error("Failed to assign credits:", rpcError.message);
          throw rpcError;
        }

        // 3. Mark the transaction as confirmed
        await supabaseClient
          .from("transactions")
          .update({ type: "bold_approved" })
          .eq("id", tx.id);
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200, headers: corsHeaders });
  } catch (err: any) {
    console.error("Webhook Error:", err.message);
    return new Response(err.message, { status: 500, headers: corsHeaders });
  }
});
