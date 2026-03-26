import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Code, Copy, Terminal, ExternalLink, ShieldCheck, 
  Layers, Database, FileJson, Sparkles, Loader2 
} from "lucide-react";

interface Space {
  id: string;
  name: string;
}

const Developer = () => {
  const { user, signOut } = useAuth("/auth");
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSpaces = async () => {
      if (!user) return;
      const { data } = await supabase.from("spaces").select("id, name").eq("user_id", user.id);
      if (data) setSpaces(data);
      setLoading(false);
    };
    fetchSpaces();
  }, [user]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado al portapapeles`);
  };

  const generateInteroperabilityJSON = async (spaceId: string) => {
    toast.loading("generando json de interoperabilidad...");
    try {
      const { data: space } = await (supabase.from("spaces") as any).select("*").eq("id", spaceId).single();
      const { data: assets } = await (supabase.from("saved_assets") as any).select("*").eq("space_id", spaceId);
      const { data: nodes } = await (supabase.from("canvas_nodes") as any).select("*").eq("space_id", spaceId);

      const spaceTyped = space as any;
      const assetsTyped = assets as any[];
      const nodesTyped = nodes as any[];

      const payload = {
        version: "v6.4",
        project: "creator_ia_pro",
        timestamp: new Date().toISOString(),
        space_id: spaceId,
        metadata: {
          name: spaceTyped?.name,
          description: spaceTyped?.description,
          brand_context: spaceTyped?.settings?.brand_context
        },
        ecosystem_bridge: {
          assets: assetsTyped?.map(a => ({ id: a.id, url: a.asset_url, tags: a.tags, type: a.type })),
          canvas: nodesTyped?.map(n => ({ id: n.id, type: n.type, data: n.data_payload }))
        }
      };

      copyToClipboard(JSON.stringify(payload, null, 2), "JSON de Interoperabilidad");
    } catch (err) {
      toast.error("error al generar el puente de datos.");
    } finally {
      toast.dismiss();
    }
  };

  return (
    <div className="min-h-screen bg-[#020203] text-white selection:bg-[#d4ff00]/30 selection:text-[#020203]">
      <AppHeader userId={user?.id} onSignOut={signOut} />
      
      <main className="container mx-auto px-6 py-12 max-w-5xl animate-fade-in lowercase">
        <div className="mb-12 space-y-3">
          <Badge className="bg-[#d4ff00]/10 text-[#d4ff00] border-transparent font-black px-3 py-1 rounded-full text-[10px] tracking-widest uppercase">interoperability_nexus_v8.0</Badge>
          <h1 className="text-4xl font-black tracking-tighter text-white">hub_<span className="text-[#d4ff00]">desarrollador</span></h1>
          <p className="text-slate-400 font-bold max-w-xl leading-relaxed">conecta tus espacios industriales con lovabe y figma mediante el puente de interoperabilidad json.</p>
        </div>

        <div className="grid gap-8">
          {/* API Credentials */}
          <Card className="rounded-[2.5rem] border-white/5 bg-[#080809]/60 backdrop-blur-2xl shadow-2xl p-4 overflow-hidden group">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 text-[#d4ff00] mb-2 font-black text-xs tracking-widest uppercase opacity-60">
                <ShieldCheck className="h-4 w-4" />
                credenciales_de_acceso
              </div>
              <CardTitle className="text-xl font-black tracking-tight lowercase text-white">tus credenciales de puente</CardTitle>
              <CardDescription className="lowercase font-bold text-slate-500">usa estas claves para configurar plugins externos (figma/lovable).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest pl-1">instancia_supabase</p>
                <div className="flex items-center gap-2 p-4 bg-white/5 rounded-2xl border border-white/5 transition-all hover:bg-white/[0.08]">
                  <Database className="h-4 w-4 text-slate-500" />
                  <code className="text-xs font-mono flex-1 text-slate-400 truncate">https://zfzkohjdwggctogehlkw.supabase.co</code>
                  <Button variant="ghost" size="icon" className="hover:bg-white/5 text-slate-500 hover:text-[#d4ff00]" onClick={() => copyToClipboard("https://zfzkohjdwggctogehlkw.supabase.co", "URL")}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest pl-1">anon_public_key</p>
                <div className="flex items-center gap-2 p-4 bg-white/5 rounded-2xl border border-white/5 transition-all hover:bg-white/[0.08]">
                  <Terminal className="h-4 w-4 text-slate-500" />
                  <code className="text-xs font-mono flex-1 text-slate-400 truncate">eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</code>
                  <Button variant="ghost" size="icon" className="hover:bg-white/5 text-slate-500 hover:text-[#d4ff00]" onClick={() => copyToClipboard("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmernvaGpkd2dnY3RvZ2VobGt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI5NzE1NzgsImV4cCI6MjA1ODU0NzU3OH0.S0s4fV9fX19fX19fX19fX19fX19fX19fX19fX19fX19f", "Anon Key")}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Spaces JSON Bridge */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black tracking-tighter text-white lowercase flex items-center gap-3">
                puente_de_espacios
                <Badge variant="outline" className="rounded-full text-[10px] font-black lowercase border-white/10 text-[#d4ff00] bg-[#d4ff00]/5">{spaces.length} activos</Badge>
              </h2>
            </div>
            
            {loading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-[#d4ff00]" />
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {spaces.map(space => (
                  <div key={space.id} className="group p-8 rounded-[2.5rem] border border-white/5 bg-[#080809]/60 backdrop-blur-2xl shadow-xl hover:shadow-[#d4ff00]/5 hover:border-[#d4ff00]/20 transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:bg-[#d4ff00] group-hover:text-[#020203] transition-all duration-500">
                        <Layers className="h-5 w-5" />
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="rounded-full font-black lowercase text-[10px] text-slate-500 hover:text-[#d4ff00] hover:bg-white/5"
                        onClick={() => generateInteroperabilityJSON(space.id)}
                      >
                        <FileJson className="mr-1.5 h-3 w-3" />
                        copiar_json
                      </Button>
                    </div>
                    <h3 className="font-black text-white lowercase tracking-tight">{space.name}</h3>
                    <p className="text-[10px] font-mono text-slate-600 mt-1 uppercase tracking-tighter">{space.id}</p>
                    
                    <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                       <div className="flex items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                          <Sparkles className="h-3 w-3 text-[#d4ff00]" />
                          <span className="text-[9px] font-black lowercase text-slate-400">industrial_ready</span>
                       </div>
                       <Button variant="ghost" size="sm" className="h-8 rounded-xl lowercase text-[10px] font-black gap-1.5 text-slate-500 hover:text-white hover:bg-white/5">
                          <ExternalLink className="h-3 w-3" />
                          doc
                       </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lovable/Figma Documentation Hint */}
          <Card className="rounded-[3rem] border-white/5 bg-[#d4ff00] text-[#020203] p-10 overflow-hidden relative group shadow-2xl shadow-[#d4ff00]/10">
             <div className="absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-white/20 blur-[80px] group-hover:bg-white/30 transition-all duration-1000" />
             <div className="relative z-10">
                <h3 className="text-3xl font-black tracking-tighter mb-4 lowercase">conectando_con_lovable</h3>
                <p className="text-[#020203]/70 font-bold max-w-lg mb-8 lowercase leading-relaxed text-sm">
                  el puente de interoperabilidad permite que lovable lea tus activos generativos y contexto de marca directamente desde creator ia pro. simplemente pega el json exportado en el prompt de sistema o usa el plugin de sincronización.
                </p>
                <div className="flex gap-4">
                   <Button className="bg-[#020203] text-white hover:bg-slate-900 rounded-2xl h-14 px-8 font-black lowercase shadow-2xl active:scale-95 transition-all">
                      ver_guia_de_lovable
                   </Button>
                   <Button variant="ghost" className="text-[#020203] hover:bg-[#020203]/5 rounded-2xl h-14 px-8 font-black lowercase active:scale-95 transition-all border border-[#020203]/10">
                      plugin_figma
                   </Button>
                </div>
             </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Developer;
