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
    <div className="min-h-screen bg-white text-slate-900">
      <AppHeader userId={user?.id} onSignOut={signOut} />
      
      <main className="container mx-auto px-6 py-12 max-w-5xl animate-fade-in lowercase">
        <div className="mb-12 space-y-3">
          <Badge className="bg-[#ff0071]/10 text-[#ff0071] border-transparent font-bold px-3 py-1 rounded-full text-[10px]">interoperability_hub_v1</Badge>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">hub_desarrollador</h1>
          <p className="text-slate-400 font-medium max-w-xl">conecta tus espacios industriales con lovabe y figma mediante el puente de interoperabilidad json.</p>
        </div>

        <div className="grid gap-8">
          {/* API Credentials */}
          <Card className="rounded-[2.5rem] border-slate-50 bg-white shadow-xl shadow-slate-900/5 p-4 overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 text-[#ff0071] mb-2 font-bold text-xs tracking-widest uppercase opacity-60">
                <ShieldCheck className="h-4 w-4" />
                credenciales_de_acceso
              </div>
              <CardTitle className="text-xl font-bold tracking-tight lowercase">tus credenciales de puente</CardTitle>
              <CardDescription className="lowercase font-medium">usa estas claves para configurar plugins externos (figma/lovable).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">instancia_supabase</p>
                <div className="flex items-center gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-50">
                  <Database className="h-4 w-4 text-slate-400" />
                  <code className="text-xs font-mono flex-1 text-slate-600 truncate">https://zfzkohjdwggctogehlkw.supabase.co</code>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard("https://zfzkohjdwggctogehlkw.supabase.co", "URL")}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">anon_public_key</p>
                <div className="flex items-center gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-50">
                  <Terminal className="h-4 w-4 text-slate-400" />
                  <code className="text-xs font-mono flex-1 text-slate-600 truncate">eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</code>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmernvaGpkd2dnY3RvZ2VobGt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI5NzE1NzgsImV4cCI6MjA1ODU0NzU3OH0.S0s4fV9fX19fX19fX19fX19fX19fX19fX19fX19fX19f", "Anon Key")}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Spaces JSON Bridge */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 lowercase flex items-center gap-3">
                puente_de_espacios
                <Badge variant="outline" className="rounded-full text-[10px] lowercase">{spaces.length} activos</Badge>
              </h2>
            </div>
            
            {loading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-slate-200" />
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {spaces.map(space => (
                  <div key={space.id} className="group p-6 rounded-[2rem] border border-slate-50 bg-white shadow-sm hover:shadow-xl hover:shadow-[#ff0071]/5 transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#ff0071]/10 group-hover:text-[#ff0071] transition-colors">
                        <Layers className="h-5 w-5" />
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="rounded-full font-bold lowercase text-[10px] text-slate-400 hover:text-[#ff0071]"
                        onClick={() => generateInteroperabilityJSON(space.id)}
                      >
                        <FileJson className="mr-1.5 h-3 w-3" />
                        copiar_json
                      </Button>
                    </div>
                    <h3 className="font-bold text-slate-800 lowercase">{space.name}</h3>
                    <p className="text-[10px] font-mono text-slate-300 mt-1 uppercase tracking-tighter">{space.id}</p>
                    
                    <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                       <div className="flex items-center gap-1.5 opacity-40">
                          <Sparkles className="h-3 w-3 text-[#ff0071]" />
                          <span className="text-[9px] font-bold lowercase">industrial_ready</span>
                       </div>
                       <Button variant="ghost" size="sm" className="h-8 rounded-xl lowercase text-[10px] font-bold gap-1.5 text-slate-400">
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
          <Card className="rounded-[2.5rem] border-slate-900 bg-slate-900 text-white p-10 overflow-hidden relative group">
             <div className="absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-white/5 blur-[80px] group-hover:bg-white/10 transition-all duration-1000" />
             <div className="relative z-10">
                <h3 className="text-3xl font-bold tracking-tight mb-4">conectando con lovable</h3>
                <p className="text-slate-400 font-medium max-w-lg mb-8 lowercase leading-relaxed">
                  el puente de interoperabilidad permite que lovable lea tus activos generativos y contexto de marca directamente desde creator ia pro. simplemente pega el json exportado en el prompt de sistema o usa el plugin de sincronización.
                </p>
                <div className="flex gap-4">
                   <Button className="bg-white text-slate-900 hover:bg-slate-100 rounded-2xl h-12 px-8 font-bold lowercase shadow-xl shadow-white/10 active:scale-95 transition-all">
                      ver_guia_de_lovable
                   </Button>
                   <Button variant="ghost" className="text-white hover:bg-white/5 rounded-2xl h-12 px-8 font-bold lowercase active:scale-95 transition-all">
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
