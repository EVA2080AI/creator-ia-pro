/**
 * MCP Service (Model Context Protocol)
 * Cliente base para descubrir y llamar herramientas en servidores MCP remotos.
 */

export interface MCPServer {
  id: string;
  name: string;
  url: string; // Base URL, ej: https://mcp-slack.miapp.com
  status: 'connected' | 'disconnected' | 'error';
  token?: string; 
  tools?: any[];
}

class MCPClient {
  private servers: Map<string, MCPServer> = new Map();

  constructor() {
    this.loadServers();
  }

  private loadServers() {
    try {
      const stored = localStorage.getItem('STUDIO_MCP_SERVERS');
      if (stored) {
        const parsed: MCPServer[] = JSON.parse(stored);
        parsed.forEach(s => this.servers.set(s.id, s));
      }
    } catch { /* ignore */ }
  }

  private saveServers() {
    localStorage.setItem('STUDIO_MCP_SERVERS', JSON.stringify(Array.from(this.servers.values())));
  }

  getServers(): MCPServer[] {
    return Array.from(this.servers.values());
  }

  addServer(server: Omit<MCPServer, 'id' | 'status' | 'tools'>): MCPServer {
    const newServer: MCPServer = {
      ...server,
      id: crypto.randomUUID(),
      status: 'disconnected',
      tools: []
    };
    this.servers.set(newServer.id, newServer);
    this.saveServers();
    return newServer;
  }

  removeServer(id: string) {
    this.servers.delete(id);
    this.saveServers();
  }

  /**
   * Intenta conectar con el servidor MCP y descubrir sus Tools.
   * Esto usa un endpoint genérico /v1/tools para simplificación del proxy web.
   */
  async listTools(serverId: string) {
    const server = this.servers.get(serverId);
    if (!server) throw new Error("Servidor no encontrado");

    try {
      // Request a un proxy o router HTTP básico del servidor MCP
      const res = await fetch(`${server.url}/tools`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(server.token ? {'Authorization': `Bearer ${server.token}`} : {})
        }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const data = await res.json();
      server.status = 'connected';
      server.tools = data?.tools || data?.result?.tools || [];
      this.saveServers();
      return server.tools;
    } catch (e: any) {
      server.status = 'error';
      this.saveServers();
      throw new Error(`MCP Connection Failed: ${e.message}`);
    }
  }

  /**
   * Ejecuta la herramienta de forma remota enviando el JSON-RPC call.
   */
  async callTool(serverId: string, toolName: string, args: Record<string, any>) {
     const server = this.servers.get(serverId);
     if (!server) throw new Error("Servidor no encontrado");

     const res = await fetch(`${server.url}/call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(server.token ? {'Authorization': `Bearer ${server.token}`} : {})
        },
        body: JSON.stringify({
           jsonrpc: "2.0",
           method: "callTool",
           params: {
              name: toolName,
              arguments: args
           },
           id: Date.now()
        })
     });

     if (!res.ok) throw new Error(`Fallo ejecucion MCP HTTP: ${res.status}`);
     return res.json();
  }
}

export const mcpService = new MCPClient();
