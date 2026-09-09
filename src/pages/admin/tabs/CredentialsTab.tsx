import {
  Shield, Database, Github, Cloud, Zap, Lock, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CredentialRef {
  envKey: string;
  service: string;
  name: string;
  icon: any;
  color: string;
}

// Solo referencia — este panel llegó a "editar" claves guardándolas en una función
// de Supabase (`admin-save-settings`) que nada en producción lee: el checkout, el
// chat de IA y el resto de /api/* leen process.env.* directo en Vercel. Guardar acá
// no tenía ningún efecto real, así que se dejó de mostrar como editable.
const CREDENTIAL_REFS: CredentialRef[] = [
  { envKey: "OPENROUTER_API_KEY", service: "OpenRouter", name: "Motor de chat / Genesis", icon: Zap, color: "text-amber-500" },
  { envKey: "REPLICATE_API_TOKEN", service: "Replicate", name: "Generación de imágenes", icon: Zap, color: "text-amber-500" },
  { envKey: "DATABASE_URL", service: "Neon", name: "Base de datos (Postgres)", icon: Database, color: "text-emerald-500" },
  { envKey: "BOLD_API_KEY / BOLD_WEBHOOK_SECRET", service: "Bold.co", name: "Cobro de créditos y planes", icon: Shield, color: "text-indigo-500" },
  { envKey: "RESEND_API_KEY", service: "Resend", name: "Correo transaccional", icon: Cloud, color: "text-zinc-600" },
  { envKey: "GOOGLE_CLIENT_ID / SECRET, GITHUB_CLIENT_ID / SECRET", service: "OAuth social", name: "Login con Google / GitHub", icon: Github, color: "text-zinc-600" },
];

export function CredentialsTab() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 mb-2">
        <h2 className="text-xl font-black text-zinc-900 tracking-tight uppercase">Credenciales</h2>
        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Referencia — se editan en Vercel, no aquí</p>
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-100">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Servicio</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Variable de entorno</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Para qué sirve</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {CREDENTIAL_REFS.map((cred) => {
                const Icon = cred.icon;
                return (
                  <tr key={cred.envKey} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className={cn("h-9 w-9 rounded-xl bg-zinc-50 flex items-center justify-center border border-zinc-100", cred.color)}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <p className="text-xs font-black text-zinc-900 uppercase tracking-tight">{cred.service}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <code className="font-mono text-[10px] text-zinc-500 bg-zinc-100 border border-zinc-200 rounded-lg px-2.5 py-1.5">{cred.envKey}</code>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-xs text-zinc-500">{cred.name}</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-3xl bg-zinc-900 p-8 text-white relative overflow-hidden flex flex-col md:flex-row items-center gap-6">
        <Lock className="absolute -right-8 -bottom-8 h-48 w-48 text-white/5 rotate-12" />
        <div className="h-16 w-16 rounded-[2rem] bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 relative z-10">
          <ExternalLink className="h-8 w-8 text-white" />
        </div>
        <div className="relative z-10">
          <h3 className="text-lg font-black tracking-tight mb-2 uppercase italic leading-none">Se configuran en Vercel</h3>
          <p className="text-xs text-zinc-400 leading-relaxed font-medium opacity-80">
            Vercel → proyecto <span className="text-white font-bold">creator-ia-pro</span> → Settings → Environment Variables.
            Cada cambio requiere un nuevo deploy (o redeploy) para tomar efecto en producción.
          </p>
        </div>
      </div>
    </div>
  );
}
