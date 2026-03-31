import { useState } from "react";
import { Globe, UploadCloud, CheckCircle, Loader2, ArrowRight, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { vercelService } from "@/services/vercel-service";
import { creditService } from "@/services/billing-service";
import type { StudioFile } from "@/hooks/useStudioProjects";

interface StudioDeployProps {
  onClose: () => void;
  files: Record<string, StudioFile>;
  projectName: string;
}

export function StudioDeploy({ onClose, files, projectName }: StudioDeployProps) {
  const [deploying, setDeploying] = useState(false);
  const [liveUrl, setLiveUrl] = useState<string | null>(null);
  const [domainStatus, setDomainStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable' | 'buying'>('idle');
  const [domainName, setDomainName] = useState("");
  const [domainPrice, setDomainPrice] = useState<number | null>(null);

  const handleDeploy = async () => {
    setDeploying(true);
    try {
      const data = await vercelService.deployProject(projectName, files, "vite");
      setLiveUrl(data.url);
      toast.success("¡Desplegado con éxito en Vercel!");
    } catch (err: any) {
      toast.error(err.message || "Error al desplegar");
    } finally {
      setDeploying(false);
    }
  };

  const checkDomain = async () => {
    if (!domainName) return;
    setDomainStatus('checking');
    try {
      const result = await vercelService.checkDomainPrice(domainName);
      if (result.price) {
        setDomainPrice(result.price);
        setDomainStatus('available');
      } else {
        setDomainStatus('unavailable');
      }
    } catch (err) {
      setDomainStatus('unavailable');
      toast.error("El dominio no está disponible o no tiene soporte.");
    }
  };

  const buyDomain = async () => {
    if (!domainName || !domainPrice) return;
    setDomainStatus('buying');
    try {
      // Lovable credit model: 1 USD domain = ~1000 credits? Or a fixed amount.
      // Let's say we deduct 5000 credits for a generic domain.
      const creditsCost = Math.ceil(domainPrice * 100); 
      
      // Attempt to deduct credits first
      await creditService.spend(creditsCost, "buy_domain", "vercel", null);

      // Procedamos a comprar el dominio
      await vercelService.buyDomain(domainName, domainPrice);
      toast.success(`Dominio ${domainName} adquirido. Se ha añadido a tu Vercel.`);
      setDomainStatus('idle');
    } catch (err: any) {
      toast.error(err.message || "No se pudo comprar el dominio.");
      setDomainStatus('available');
    }
  };

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-xl max-h-[85vh] overflow-hidden rounded-[24px] shadow-2xl flex flex-col"
      style={{ background: '#0a0a0c', border: '1px solid rgba(255,255,255,0.08)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <Globe className="h-5 w-5 text-white/70" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Publicar Proyecto</h2>
            <p className="text-[11px] text-white/40">Despliegue automático vía Vercel Edge</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-white/40 transition-colors">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M13 1L1 13M1 1L13 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>

      <div className="p-6 overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-8">
        
        {/* Step 1: Deploy */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold">1</span>
            <h3 className="text-sm font-medium text-white/90">Despliegue Cloud</h3>
          </div>
          {!liveUrl ? (
            <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02] flex flex-col items-center justify-center gap-3">
              <UploadCloud className="h-10 w-10 text-white/20 mb-1" />
              <p className="text-[12px] text-white/60 text-center">
                Genesis empaquetará tu proyecto y lo desplegará en los servidores globales de Vercel.
              </p>
              <button 
                onClick={handleDeploy}
                disabled={deploying}
                className="mt-2 px-6 py-2.5 rounded-lg bg-white text-black text-[12px] font-bold flex items-center gap-2 hover:bg-white/90 transition-all disabled:opacity-50"
              >
                {deploying && <Loader2 className="h-4 w-4 animate-spin" />}
                {deploying ? "Desplegando..." : "Desplegar ahora"}
              </button>
            </div>
          ) : (
            <div className="p-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle className="h-5 w-5" />
                <span className="text-[13px] font-bold font-display">¡Sitio activo!</span>
              </div>
              <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="text-[13px] text-white hover:underline flex items-center gap-1.5">
                {liveUrl} <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </section>

        {/* Step 2: Custom Domain */}
        {liveUrl && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold">2</span>
              <h3 className="text-sm font-medium text-white/90">Dominio Personalizado</h3>
            </div>
            
            <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02]">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  autoCorrect="off" spellCheck="false"
                  placeholder="ej. mi-super-app.com"
                  value={domainName}
                  onChange={(e) => {
                    setDomainName(e.target.value);
                    setDomainStatus('idle');
                  }}
                  className="w-full bg-transparent border border-white/10 rounded-lg px-4 py-2.5 text-[13px] text-white outline-none focus:border-white/30"
                />
                <button 
                  onClick={checkDomain}
                  disabled={domainStatus === 'checking' || !domainName}
                  className="px-4 rounded-lg bg-white/10 text-white hover:bg-white/20 text-[12px] font-medium whitespace-nowrap disabled:opacity-50"
                >
                  {domainStatus === 'checking' ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verificar"}
                </button>
              </div>

              {domainStatus === 'unavailable' && (
                <p className="text-red-400 text-[11px] mt-3">Dominio no disponible o extensión no válida.</p>
              )}

              {domainStatus === 'available' && domainPrice && (
                <div className="mt-4 p-4 rounded-lg border border-primary/30 bg-primary/10 flex items-center justify-between">
                  <div>
                    <p className="text-[12px] text-white font-medium">{domainName}</p>
                    <p className="text-[11px] text-white/50">Costo aproximado: {Math.ceil(domainPrice * 100)} créditos</p>
                  </div>
                  <button 
                    onClick={buyDomain}
                    className="px-4 py-2 rounded-lg bg-primary text-black text-[12px] font-bold hover:bg-primary/90 transition-all flex items-center gap-2"
                  >
                    Adquirir
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
