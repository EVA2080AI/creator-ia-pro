import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sparkles, ArrowRight } from "lucide-react";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setReady(true);
    } else {
      // Try to get session — if user arrived via recovery link, session exists
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) setReady(true);
        else navigate("/auth");
      });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("¡Contraseña actualizada!");
      navigate("/dashboard");
    }
    setLoading(false);
  };

  if (!ready) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050506] font-sans selection:bg-[#EC4699]/30 selection:text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-[#EC4699]/5 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md px-6 animate-fade-in">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/5 bg-[#121215] shadow-[0_0_25px_rgba(236,70,153,0.2)]">
            <Sparkles className="h-8 w-8 text-[#EC4699]" />
          </div>
          <h1 className="text-4xl md:text-5xl font-display text-white uppercase tracking-tight">Reiniciar <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#EC4699] to-[#FA8214]">Acceso</span></h1>
          <p className="mt-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Ingresa tu nueva clave de ingeniería creativa</p>
        </div>

        <div className="rounded-[2.5rem] border border-white/5 bg-[#121215]/80 backdrop-blur-3xl p-10 shadow-2xl shadow-black/40">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="password" className="text-slate-500 text-[9px] font-bold uppercase tracking-[0.2em] ml-2">nueva_clave</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="bg-white/5 border-white/5 focus:bg-white/[0.08] focus:border-[#EC4699]/30 rounded-2xl h-13 text-xs font-bold text-white transition-all ring-0"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-14 bg-gradient-to-r from-[#EC4699] to-[#FA8214] text-white hover:opacity-90 rounded-2xl gap-3 font-bold uppercase text-[10px] tracking-[0.2em] shadow-xl transition-all active:scale-95 disabled:opacity-50 mt-4">
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  Actualizar Clave
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
