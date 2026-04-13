import { useState, useEffect } from 'react';
import { mcpService, MCPServer } from '@/services/mcp-service';
import { Server, Plug, Trash2, RefreshCw, Key, Globe, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export function MCPServerManager() {
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setServers(mcpService.getServers());
  }, []);

  const handleAdd = async () => {
    if (!name || !url) return;
    setIsLoading(true);
    
    try {
      const srv = mcpService.addServer({ name, url: url.replace(/\/$/, ''), token });
      setServers(mcpService.getServers());
      
      // Intentar descubrir tools
      await mcpService.listTools(srv.id);
      toast.success(`Servidor ${name} conectado correctamente.`);
    } catch (e: any) {
      toast.error(`Error al conectar con ${name}: ${e.message}`);
    } finally {
      setServers(mcpService.getServers());
      setIsLoading(false);
      setName(''); setUrl(''); setToken('');
    }
  };

  const handleRemove = (id: string) => {
    mcpService.removeServer(id);
    setServers(mcpService.getServers());
  };

  const syncServer = async (id: string) => {
    try {
      await mcpService.listTools(id);
      toast.success("Reglas y Tools sincronizadas");
    } catch (e: any) {
      const msg = e.message;
      if (msg.includes('npx') || msg.includes('PATH')) {
        toast.error("Error de PATH: El servidor remoto no encuentra 'npx'. Asegúrate de que Node.js esté en el PATH del servidor.");
      } else {
        toast.error(msg);
      }
    }
    setServers(mcpService.getServers());
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-[13px] font-bold text-white/80 mb-0.5">Model Context Protocol (MCP)</h3>
        <p className="text-[11px] text-white/40 leading-relaxed max-w-sm">
          Conecta Génesis con tus servidores privados. Permite a la IA interactuar con bases de datos internas, Slack, Notion o APIs corporativas.
        </p>
      </div>

      <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3 space-y-3">
        <h4 className="text-[10px] font-black text-white/30 uppercase tracking-widest">Añadir Servidor</h4>
        
        <div className="space-y-2">
          <input
            value={name} onChange={e => setName(e.target.value)}
            placeholder="Nombre (ej: Servidor Slack Empresa)"
            className="w-full text-[12px] bg-white/[0.02] border border-white/[0.05] rounded-lg px-3 py-2 outline-none focus:border-white/20 text-white"
          />
          <input
            value={url} onChange={e => setUrl(e.target.value)}
            placeholder="URL del Servidor (https://...)"
            className="w-full text-[12px] bg-white/[0.02] border border-white/[0.05] rounded-lg px-3 py-2 outline-none focus:border-white/20 text-white"
          />
          <input
            value={token} onChange={e => setToken(e.target.value)}
            placeholder="Token de Autenticación (Opcional)"
            type="password"
            className="w-full text-[12px] bg-white/[0.02] border border-white/[0.05] rounded-lg px-3 py-2 outline-none focus:border-white/20 text-white"
          />
        </div>

        <button
          onClick={handleAdd}
          disabled={!name || !url || isLoading}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-bold text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 disabled:opacity-50 transition-colors"
        >
          {isLoading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Plug className="h-3 w-3" />}
          Conectar Nodo MCP
        </button>
      </div>

      <div className="space-y-2">
        {servers.map(s => (
          <div key={s.id} className="p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <Server className="h-4 w-4 text-indigo-400" />
            </div>
            
            <div className="flex-1 overflow-hidden">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-bold text-white/80">{s.name}</span>
                {s.status === 'connected' ? (
                  <CheckCircle className="h-3 w-3 text-emerald-500" />
                ) : (
                  <AlertCircle className="h-3 w-3 text-red-400" />
                )}
              </div>
              <div className="text-[10px] text-white/30 truncate flex items-center gap-1 mt-0.5">
                <Globe className="h-2.5 w-2.5" /> {s.url}
              </div>
              <div className="text-[9px] text-white/20 mt-1 uppercase tracking-widest font-mono">
                {s.tools?.length || 0} Tools Disponibles
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button 
                onClick={() => syncServer(s.id)}
                className="p-1.5 rounded-md hover:bg-white/5 text-white/30 hover:text-white transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
              <button 
                onClick={() => handleRemove(s.id)}
                className="p-1.5 rounded-md hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
