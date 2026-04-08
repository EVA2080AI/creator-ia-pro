import React from "react";
import { Zap } from "lucide-react";

interface BannerProps {
  checkoutSuccess: boolean;
  creditsSuccess: boolean;
  balance: number;
  onAction: () => void;
}

export function CheckoutBanner({ checkoutSuccess, balance, onAction }: BannerProps) {
  return (
    <div className="p-5 rounded-2xl border border-primary/30 bg-primary/10 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
        <Zap className="w-5 h-5 text-primary" />
      </div>
      <div>
        <p className="text-[13px] font-black">{checkoutSuccess ? '¡Suscripción activada!' : '¡Créditos añadidos!'}</p>
        <p className="text-[11px] text-zinc-500">{balance.toLocaleString()} créditos disponibles</p>
      </div>
      <button onClick={onAction} className="ml-auto px-4 py-2 rounded-xl bg-primary text-white text-[11px] font-black uppercase tracking-widest">
        Ir a Genesis
      </button>
    </div>
  );
}
