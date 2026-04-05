import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  X, Plus, Minus, RotateCcw, History, Loader2, Coins
} from "lucide-react";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  created_at: string;
}

interface AdminUser {
  user_id: string;
  email: string;
  display_name: string | null;
  credits_balance: number;
  created_at: string;
  last_sign_in: string | null;
  subscription_tier: string;
  is_active: boolean;
}

const TX_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  admin_grant:  { label: "Carga Admin",   color: "#A855F7" },
  admin_deduct: { label: "Deducción",     color: "#EF4444" },
  refund:       { label: "Reembolso",     color: "#60A5FA" },
  spend:        { label: "Uso",           color: "#F59E0B" },
  purchase:     { label: "Compra",        color: "#A855F7" },
};

export function CreditModal({
  user,
  onClose,
  onDone,
}: {
  user: AdminUser;
  onClose: () => void;
  onDone: () => void;
}) {
  const [tab, setTab] = useState<"add" | "deduct" | "refund" | "history">("add");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    setTxLoading(true);
    const { data, error } = await (supabase.rpc as any)("admin_get_transactions", {
      _target_user_id: user.user_id,
      _limit: 30,
    });
    if (!error) setTxs((data as Transaction[]) || []);
    setTxLoading(false);
  }, [user.user_id]);

  useEffect(() => {
    if (tab === "history") loadHistory();
  }, [tab, loadHistory]);

  const runOp = async () => {
    const n = parseInt(amount);
    if (!n || n <= 0) { toast.error("Monto inválido"); return; }

    const fnMap = {
      add:    "admin_add_credits",
      deduct: "admin_deduct_credits",
      refund: "admin_refund_credits",
    } as const;

    const fn = fnMap[tab as keyof typeof fnMap];
    if (!fn) return;

    setLoading(true);
    const { data, error } = await (supabase.rpc as any)(fn, {
      _target_user_id: user.user_id,
      _amount: n,
      _reason: reason || undefined,
    });

    if (error) {
      toast.error(error.message);
    } else {
      const opLabels = { add: "Créditos agregados", deduct: "Créditos deducidos", refund: "Reembolso aplicado" };
      toast.success(`${opLabels[tab as keyof typeof opLabels]} · Nuevo balance: ${(data as number).toLocaleString()}`);
      setAmount("");
      setReason("");
      onDone();
    }
    setLoading(false);
  };

  const TABS = [
    { key: "add",     label: "Agregar",   icon: Plus,      color: "#A855F7" },
    { key: "deduct",  label: "Deducir",   icon: Minus,     color: "#EF4444" },
    { key: "refund",  label: "Reembolso", icon: RotateCcw, color: "#60A5FA" },
    { key: "history", label: "Historial", icon: History,   color: "#A855F7" },
  ] as const;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-md p-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-background/50 backdrop-blur-2xl shadow-2xl shadow-black/50">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 p-5">
          <div>
            <p className="font-semibold text-zinc-900">{user.display_name || user.email}</p>
            <p className="text-xs text-zinc-400 font-mono">{user.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-lg bg-zinc-50 px-3 py-1.5">
              <Coins className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-sm font-bold text-zinc-900 font-mono">{user.credits_balance.toLocaleString()}</span>
            </div>
            <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-200">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors"
                style={{ color: isActive ? t.color : "rgba(113,113,122,1)", borderBottom: isActive ? `2px solid ${t.color}` : "2px solid transparent" }}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="p-5">
          {tab !== "history" ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="admin-credits" className="mb-1.5 block text-xs text-zinc-500">Créditos</label>
                <input
                  id="admin-credits"
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={tab === "add" ? "Ej: 50000" : "Ej: 1000"}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-300 transition-colors"
                />
              </div>
              <div>
                <label htmlFor="admin-reason" className="mb-1.5 block text-xs text-zinc-500">
                  Razón {tab !== "refund" && <span className="text-zinc-500">(opcional)</span>}
                </label>
                <input
                  id="admin-reason"
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={tab === "refund" ? "Motivo del reembolso" : "Descripción (opcional)"}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-300 transition-colors"
                />
              </div>
              <button
                onClick={runOp}
                disabled={loading || !amount}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all disabled:opacity-40"
                style={{
                  background: tab === "add" ? "#A855F715" : tab === "deduct" ? "#EF444415" : "#60A5FA15",
                  border: `1px solid ${tab === "add" ? "#A855F730" : tab === "deduct" ? "#EF444430" : "#60A5FA30"}`,
                  color: tab === "add" ? "#A855F7" : tab === "deduct" ? "#EF4444" : "#60A5FA",
                }}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {tab === "add" ? "Agregar créditos" : tab === "deduct" ? "Deducir créditos" : "Aplicar reembolso"}
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
              {txLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                </div>
              ) : txs.length === 0 ? (
                <p className="py-8 text-center text-sm text-zinc-400">Sin transacciones</p>
              ) : (
                txs.map((tx) => {
                  const meta = TX_TYPE_LABELS[tx.type] || { label: tx.type, color: "#6B7280" };
                  return (
                    <div key={tx.id} className="flex items-center justify-between rounded-xl bg-zinc-50 p-3">
                      <div className="min-w-0">
                        <span className="inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide" style={{ background: meta.color + "15", color: meta.color }}>
                          {meta.label}
                        </span>
                        {tx.description && (
                          <p className="mt-0.5 truncate text-xs text-zinc-400">{tx.description}</p>
                        )}
                        <p className="text-[10px] text-zinc-500">{new Date(tx.created_at).toLocaleString()}</p>
                      </div>
                      <span className="ml-3 font-mono text-sm font-bold" style={{ color: tx.amount >= 0 ? "#A855F7" : "#EF4444" }}>
                        {tx.amount >= 0 ? "+" : ""}{tx.amount.toLocaleString()}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
