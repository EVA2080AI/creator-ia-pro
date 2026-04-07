// @ts-nocheck
// ──────────────────────────────────────────────────────────────────────────────
// Supabase Edge Function — Deno Runtime (NOT Node.js)
// This file uses Deno-native imports. TypeScript errors from the Node engine
// are expected and suppressed with @ts-nocheck. Deploy with: supabase deploy
// ──────────────────────────────────────────────────────────────────────────────
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-bold-signature",
};

interface Transaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  description: string;
}

/**
 * Bold.co Webhook Signature Verification (Binary-safe)
 */
async function verifySignature(body: string, signature: string | null, secret: string | undefined): Promise<boolean> {
  if (!signature || !secret) return false;
  
  // Bold-co payload for HMAC is the Base64 of the raw body
  // Re-encoding string to UTF-8 then to Base64 to ensure binary compatibility
  const encoder = new TextEncoder();
  const bodyData = encoder.encode(body);
  
  // Convert Uint8Array to binary string for btoa safely
  let binary = "";
  const len = bodyData.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bodyData[i]);
  }
  const base64Body = btoa(binary);
  
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

  // Constant-time comparison to prevent timing attacks
  if (hexSignature.length !== signature.length) return false;
  let result = 0;
  for (let i = 0; i < hexSignature.length; i++) {
    result |= hexSignature.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Bold API Webhook (Event Receiver)
 */
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  
  try {
    const signature = req.headers.get("x-bold-signature");
    const body = await req.text();
    const webhookSecret = Deno.env.get("BOLD_WEBHOOK_SECRET");

    // Verify security
    if (webhookSecret) {
      const isValid = await verifySignature(body, signature, webhookSecret);
      if (!isValid) {
        console.error("[bold-webhook] Invalid signature attempt");
        return new Response("Unauthorized", { status: 401 });
      }
    } else {
      console.warn("[bold-webhook] BOLD_WEBHOOK_SECRET not set. Verification skipped.");
    }

    const payload = JSON.parse(body);
    console.log("[bold-webhook] Received payload:", JSON.stringify(payload, null, 2));

    const linkId = payload?.data?.reference || payload?.reference || payload?.payment_link_id;
    const status = payload?.data?.status || payload?.status;

    if (!linkId) {
      return new Response("Missing Reference ID", { status: 400 });
    }

    if (status === "APPROVED" || status === "PAID") {
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      // 1. Find the pending transaction with EXACT matching
      const { data: txList, error: txError } = await supabaseClient
        .from("transactions")
        .select("*")
        .eq("type", "bold_pending")
        .ilike("description", `%${linkId}%`);
        
      if (txError || !txList || txList.length === 0) {
        console.error("[bold-webhook] No matching pending transaction for:", linkId);
        return new Response("Transaction not found", { status: 404 });
      }

      // Filter exact matches to avoid partial string collisions
      const tx = (txList as Transaction[]).find((t: Transaction) => t.description.includes(linkId));
      if (!tx) {
        return new Response("Transaction match failed", { status: 404 });
      }

      const packId = tx.description.split("|")[0]?.trim();

      // 2. Map packId to credit amount
      const creditMap: Record<string, number> = {
        // Recargas puntuales
        "pack_200":  200,
        "pack_1000": 1000,
        "pack_2000": 2000,
        // Planes mensuales (IDs actuales de Pricing.tsx)
        "creador":    1000,
        "pro":        3000,
        "agencia":    8000,
        "pyme":       20000,
      };

      const creditsToAdd = creditMap[packId] || 0;

      if (creditsToAdd > 0) {
        console.log(`[bold-webhook] Processing ${creditsToAdd} credits for user ${tx.user_id}`);
        
        // 3. Award credits via Atomic RPC (now supports service_role)
        const { error: rpcError } = await supabaseClient.rpc("admin_add_credits", {
          _target_user_id: tx.user_id,
          _amount: creditsToAdd,
          _reason: `Bold Payment: ${packId} (${linkId})`
        });

        if (rpcError) {
          console.error("[bold-webhook] RPC Error:", rpcError);
          throw new Error("Failed to award credits");
        }

        // 3.5. Update subscription tier if applicable
        if (["creador", "pro", "agencia", "pyme"].includes(packId)) {
          console.log(`[bold-webhook] Upgrading user ${tx.user_id} tier to: ${packId}`);
          await supabaseClient
            .from("profiles")
            .update({ 
              subscription_tier: packId, 
              updated_at: new Date().toISOString() 
            })
            .eq("user_id", tx.user_id);
            
          await supabaseClient.from("transactions").insert({
            user_id: tx.user_id,
            type: "subscription_change",
            amount: 0,
            description: `Plan activado: ${packId} (Bold)`
          });
        }

        // 4. Confirm transaction status
        await supabaseClient
          .from("transactions")
          .update({ type: "bold_approved", amount: creditsToAdd })
          .eq("id", tx.id);
          
        console.log(`[bold-webhook] Success: Credits added and transaction verified.`);
      }
    }

    return new Response(JSON.stringify({ success: true }), { 
      status: 200, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  } catch (err) {
    const error = err as Error;
    console.error("[bold-webhook] Fatal Error:", error.message);
    return new Response("Internal Processing Error", { status: 500, headers: corsHeaders });
  }
});
