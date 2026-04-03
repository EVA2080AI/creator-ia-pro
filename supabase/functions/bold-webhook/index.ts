import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-bold-signature",
};

/**
 * Bold.co Webhook Signature Verification
 * @param body Raw request body as text
 * @param signature Value of x-bold-signature header
 * @param secret Webhook secret from Bold dashboard
 */
async function verifySignature(body: string, signature: string | null, secret: string | undefined): Promise<boolean> {
  if (!signature || !secret) return false;
  
  // Bold-co payload for HMAC is the Base64 of the raw body
  const base64Body = btoa(body);
  
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(base64Body);

  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign("HMAC", key, messageData);
  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  const hexSignature = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

  return hexSignature === signature;
}

/**
 * Bold API Webhook (Event Receiver)
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  
  try {
    const signature = req.headers.get("x-bold-signature");
    const body = await req.text();
    const webhookSecret = Deno.env.get("BOLD_WEBHOOK_SECRET");

    // Verify security (skip if secret is missing to avoid blocking in dev, but log warning)
    if (webhookSecret) {
      const isValid = await verifySignature(body, signature, webhookSecret);
      if (!isValid) {
        console.error("[bold-webhook] Invalid signature attempt");
        return new Response("Invalid signature", { status: 401 });
      }
    } else {
      console.warn("[bold-webhook] BOLD_WEBHOOK_SECRET not set. Skipping verification.");
    }

    const payload = JSON.parse(body);
    console.log("Bold Webhook Received:", payload);

    // Reference ID to find the transaction
    const linkId = payload?.data?.reference || payload?.reference || payload?.payment_link_id;
    const status = payload?.data?.status || payload?.status;

    if (!linkId) {
      return new Response("Missing Link ID in payload", { status: 400 });
    }

    if (status === "APPROVED" || status === "PAID") {
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      // 1. Find the pending transaction
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
      const packId = tx.description.split("|")[0];

      // 2. Map packId to credit amount (including Plans and Packs)
      let creditsToAdd = 0;
      switch (packId) {
        // One-time Packs (from credit-packs.ts)
        case "pack_200":  creditsToAdd = 200;  break;
        case "pack_1000": creditsToAdd = 1000; break;
        case "pack_2000": creditsToAdd = 2000; break;
        // Subscription-style Plans (from pricing page)
        case "starter":   creditsToAdd = 500;  break;
        case "creator":   creditsToAdd = 1200; break;
        case "pymes":     creditsToAdd = 4000; break;
        // Legacy handles
        case "pack_100":  creditsToAdd = 100;  break;
        case "pack_500":  creditsToAdd = 500;  break;
        case "pack_2500": creditsToAdd = 2500; break;
        default: break;
      }

      if (creditsToAdd > 0) {
        // 3. Award credits via Atomic RPC
        const { error: rpcError } = await supabaseClient.rpc("admin_add_credits", {
          _target_user_id: tx.user_id,
          _amount: creditsToAdd,
          _reason: `Bold Payment: ${packId} (${linkId})`
        });

        if (rpcError) throw rpcError;

        // 3.5. If it is a subscription plan, update the profile's subscription_tier
        if (["starter", "creator", "pymes"].includes(packId)) {
          console.log(`Upgrading user ${tx.user_id} to plan: ${packId}`);
          await supabaseClient
            .from("profiles")
            .update({ subscription_tier: packId, updated_at: new Date().toISOString() })
            .eq("user_id", tx.user_id);
            
          // Add a trackable transaction for the tier upgrade itself
          await supabaseClient.from("transactions").insert({
            user_id: tx.user_id,
            type: "subscription_change",
            amount: 0,
            description: `Plan activado: ${packId} (Bold)`
          });
        }

        // 4. Confirm transaction
        await supabaseClient
          .from("transactions")
          .update({ type: "bold_approved", amount: creditsToAdd })
          .eq("id", tx.id);
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200, headers: corsHeaders });
  } catch (err: any) {
    console.error("Webhook Error:", err.message);
    return new Response(err.message, { status: 500, headers: corsHeaders });
  }
});
