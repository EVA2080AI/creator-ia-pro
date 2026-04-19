import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SEO } from "@/components/SEO";
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
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setReady(true);
    } else {
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
    <div className="flex min-h-screen items-center justify-center bg-background font-sans selection:bg-primary/15">
      <SEO
        title="Restablecer Contraseña"
        description="Restablece tu contraseña de Creator IA Pro."
        noindex={true}
      />
      {/* Subtle glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/6 blur-[130px]" />
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-zinc-900 tracking-tight">
            Nueva <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">contraseña</span>
          </h1>
          <p className="mt-3 text-[13px] text-zinc-400 font-medium">Ingresa tu nueva contraseña para acceder a tu cuenta</p>
        </div>

        <div className="rounded-[2rem] border border-zinc-200 bg-white p-10 shadow-xl shadow-zinc-100">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-500 text-[11px] font-bold uppercase tracking-[0.2em]">Nueva contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                className="bg-zinc-50 border-zinc-200 focus:border-primary/40 rounded-2xl h-12 text-sm text-zinc-900 placeholder:text-zinc-300 transition-all"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-primary text-white hover:bg-primary/90 rounded-2xl gap-2 font-bold text-[13px] transition-all active:scale-95 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  Actualizar contraseña
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
