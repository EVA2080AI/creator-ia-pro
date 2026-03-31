import { supabase } from "@/integrations/supabase/client";
import { CREDIT_PACKS } from "@/lib/credit-packs";

/**
 * Bold Latam Checkout Service
 *
 * This frontend service communicates with the secure `bold-checkout` edge function
 * to obtain a dynamically generated Checkout URL (a `LNK_H7S4...` URL).
 */

export const boldService = {
  /**
   * Initiate a Checkout flow to buy credits with Bold Latam.
   */
  async purchaseCredits(packId: string) {
    const pack = CREDIT_PACKS.find((p) => p.id === packId);
    if (!pack) throw new Error("Pack no encontrado");

    // Remove text, commas and periods to extract numerical COP integer.
    // Ej: "$ 30.000 COP" -> 30000
    const amountStr = pack.price.replace(/[^0-9]/g, "");
    const amount = parseInt(amountStr, 10);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuario no autenticado");

    // We pass userId and packId so the backend tracks pending tx
    const { data, error } = await supabase.functions.invoke("bold-checkout", {
      body: { 
        amount, 
        packId: pack.id,
        userId: user.id,
        buyerEmail: user.email,
        description: `Creator IA Pro: ${pack.name}`
      },
    });

    if (error || !data) {
      console.error("[Bold Checkout Error]", error);
      throw new Error(error?.message || "Error al conectar con Bold API");
    }

    if (data.error) {
      throw new Error(data.error);
    }

    if (data.url) {
      // Bold responds with a hosted URL (e.g. "https://checkout.bold.co/LNK_...")
      window.location.href = data.url;
    } else {
      throw new Error("Respuesta inválida de Bold API");
    }
  },
};
