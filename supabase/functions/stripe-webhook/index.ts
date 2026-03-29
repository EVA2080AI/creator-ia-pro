import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const TIERS: Record<string, { name: string; credits: number }> = {
  // Legacy tiers
  "prod_U6xj2kgXVmXSBX": { name: "educacion", credits: 500 },
  "prod_U6xjReaTzoFveY": { name: "pro",        credits: 1_000 },
  "prod_U6xkDNO9PA3C9C": { name: "business",   credits: 5_000 },
  // v2 tiers
  "prod_UE2MjSRJAsKDnj": { name: "starter",    credits: 100_000 },
  "prod_UE2NGBRjcHbZPk": { name: "creator",    credits: 500_000 },
  "prod_UE2NDJ9HS6wxBF": { name: "agency",     credits: 2_000_000 },
};

const CREDIT_PACKS: Record<string, number> = {
  "prod_U6y485FCart4fA": 100,
  "prod_U6y5xIdgIEdJ3Q": 500,
  "prod_U6yAWcXSzZjc8g": 2500,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  
  if (!stripeKey) {
    return new Response("STRIPE_SECRET_KEY not set", { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  const body = await req.text();
  let event: Stripe.Event;

  try {
    if (webhookSecret) {
      const sig = req.headers.get("stripe-signature")!;
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      // Without webhook secret, parse directly (less secure but works for testing)
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response("Webhook Error", { status: 400 });
  }

  console.log(`[WEBHOOK] Event: ${event.type} id: ${event.id}`);

  try {
    // ── Idempotency check: skip if this event was already processed ────────────
    const { data: existing } = await supabaseAdmin
      .from("transactions")
      .select("id")
      .eq("stripe_event_id", event.id)
      .maybeSingle();

    if (existing) {
      console.log(`[WEBHOOK] Event ${event.id} already processed — skipping.`);
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Handle subscription renewal / payment success
    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;
      const customerEmail = invoice.customer_email;
      
      if (!customerEmail) {
        console.log("[WEBHOOK] No customer email on invoice");
        return new Response("OK", { status: 200 });
      }

      // Find user by email
      const { data: users } = await supabaseAdmin.auth.admin.listUsers();
      const user = users?.users?.find((u) => u.email === customerEmail);
      
      if (!user) {
        console.log(`[WEBHOOK] No user found for ${customerEmail}`);
        return new Response("OK", { status: 200 });
      }

      // Check if this is a subscription renewal
      if (invoice.subscription) {
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
        const productId = subscription.items.data[0]?.price?.product as string;
        const tierInfo = TIERS[productId];

        if (tierInfo) {
          // Reload credits for subscription tier
          await supabaseAdmin
            .from("profiles")
            .update({
              credits_balance: tierInfo.credits,
              subscription_tier: tierInfo.name,
            })
            .eq("user_id", user.id);

          await supabaseAdmin.from("transactions").insert({
            user_id: user.id,
            amount: tierInfo.credits,
            type: "subscription_reload",
            description: `Recarga mensual: plan ${tierInfo.name} (${tierInfo.credits} créditos)`,
            stripe_event_id: event.id,
          });

          console.log(`[WEBHOOK] Reloaded ${tierInfo.credits} credits for ${customerEmail} (${tierInfo.name})`);
        }
      }
    }

    // Handle one-time payment (credit packs)
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      if (session.mode === "payment" && session.payment_status === "paid") {
        const customerEmail = session.customer_email || session.customer_details?.email;
        
        if (!customerEmail) {
          console.log("[WEBHOOK] No customer email on session");
          return new Response("OK", { status: 200 });
        }

        // Use the exact user.id provided during checkout via client_reference_id
        const supabaseUserId = session.client_reference_id;
        
        let user: any = null;
        if (supabaseUserId) {
          // Verify user exists using admin api
          const { data: { user: exactUser } } = await supabaseAdmin.auth.admin.getUserById(supabaseUserId);
          user = exactUser;
        }

        if (!user) {
          console.log(`[WEBHOOK] No exact user found for client_reference_id: ${supabaseUserId}. Attempting email fallback...`);
          // Fallback just in case (e.g. legacy checkout links)
          const { data: users } = await supabaseAdmin.auth.admin.listUsers();
          user = users?.users?.find((u) => u.email === customerEmail);
        }

        if (!user) {
          console.log(`[WEBHOOK] User completely not found for ${customerEmail} / ${supabaseUserId}`);
          return new Response("OK", { status: 200 });
        }

        // Get line items to determine which credit pack
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
        for (const item of lineItems.data) {
          const productId = item.price?.product as string;
          const creditAmount = CREDIT_PACKS[productId];
          
          if (creditAmount) {
            // Add credits
            const { data: profile } = await supabaseAdmin
              .from("profiles")
              .select("credits_balance")
              .eq("user_id", user.id)
              .single();

            const currentBalance = profile?.credits_balance ?? 0;

            await supabaseAdmin
              .from("profiles")
              .update({ credits_balance: currentBalance + creditAmount })
              .eq("user_id", user.id);

            await supabaseAdmin.from("transactions").insert({
              user_id: user.id,
              amount: creditAmount,
              type: "credit_purchase",
              description: `Compra de ${creditAmount} créditos extra`,
              stripe_event_id: event.id,
            });

            console.log(`[WEBHOOK] Added ${creditAmount} credits for ${customerEmail}`);
          }
        }
      }
    }

    // Handle subscription cancelled
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
      const customerEmail = customer.email;

      if (customerEmail) {
        const { data: users } = await supabaseAdmin.auth.admin.listUsers();
        const user = users?.users?.find((u) => u.email === customerEmail);

        if (user) {
          await supabaseAdmin
            .from("profiles")
            .update({ subscription_tier: "free" })
            .eq("user_id", user.id);

          console.log(`[WEBHOOK] Subscription cancelled for ${customerEmail}, set to free`);
        }
      }
    }
  } catch (err) {
    console.error("[WEBHOOK] Error processing event:", err);
    return new Response("Error", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});
