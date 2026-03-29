import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Peer, { MediaConnection, DataConnection } from "peerjs";
import { QRCodeSVG } from "qrcode.react";
import { Monitor, Smartphone, Video, Copy, Maximize2, X, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

export default function ShareScreen() {
  const { user, signOut } = useAuth("/auth");
  const { profile, refreshProfile } = useProfile(user?.id);
  const navigate = useNavigate();
  
  const [mode, setMode] = useState<"host" | "viewer" | null>(null);
  const [peerId, setPeerId] = useState<string>("");
  const [targetId, setTargetId] = useState<string>("");
  const [status, setStatus] = useState("Desconectado");
  const [isReceiving, setIsReceiving] = useState(false);
  const [peer, setPeer] = useState<Peer | null>(null);
  const [stats, setStats] = useState("");
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const connRef = useRef<MediaConnection | DataConnection | null>(null);

  // Limpieza de conexiones
  useEffect(() => {
    return () => {
      if (peer) peer.destroy();
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, [peer]);

  // Consumir 1 crédito por conexión Host
  const consumeCredit = async () => {
    if (!profile || profile.credits_balance < 1) {
      toast.error("No tienes créditos suficientes para ser Host. Recarga en Planes.");
      return false;
    }
    try {
      const { error } = await (supabase.rpc as any)("spend_credits", {
        _amount: 1,
        _action: "sharescreen",
        _model: "p2p",
        _node_id: null,
      });
      if (error) throw error;
      await refreshProfile();
      toast.success("1 Crédito consumido por la sesión P2P");
      return true;
    } catch (err) {
      console.error(err);
      toast.error("Error al descontar el crédito.");
      return false;
    }
  };

  const initHost = async () => {
    const hasCredits = await consumeCredit();
    if (!hasCredits) return;

    setMode("host");
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newPeer = new Peer(id, {
      config: { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] }
    });

    newPeer.on("open", (id) => {
      setPeerId(id);
      setStatus("En Línea - Esperando conexión 👀");
    });

    newPeer.on("connection", (conn) => {
      setStatus("Viewer Conectado 📱");
      conn.on("open", () => {
        if (streamRef.current) {
          newPeer.call(conn.peer, streamRef.current);
          setStatus("Transmitiendo a Viewer 🚀");
        }
      });
    });

    newPeer.on("call", (call) => {
      if (streamRef.current) {
        call.answer(streamRef.current);
        setStatus("Transmitiendo 🚀");
      } else {
        call.answer();
      }
    });

    setPeer(newPeer);
  };

  const initViewer = () => {
    setMode("viewer");
    const newPeer = new Peer({
      config: { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] }
    });

    newPeer.on("open", () => {
      setStatus("Listo");
    });

    newPeer.on("call", (call) => {
      call.answer();
      call.on("stream", (remoteStream) => {
        if (videoRef.current) videoRef.current.srcObject = remoteStream;
        setIsReceiving(true);
        setStatus("Recibiendo");
        
        // Monitor stats
        setInterval(() => {
          const track = remoteStream.getVideoTracks()[0];
          if (track) {
            const settings = track.getSettings();
            setStats(`Calidad: ${settings.width}x${settings.height} @ ${Math.round(settings.frameRate || 30)}fps`);
          }
        }, 2000);
      });
    });

    setPeer(newPeer);
  };

  const startSharing = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" } as any,
        audio: false
      });
      streamRef.current = stream;
      setStatus("Capturando pantalla... Dile al Viewer que se conecte.");
      toast.success("Captura iniciada. Comparte tu código.");

      stream.getVideoTracks()[0].onended = () => {
        setStatus("Conexión Terminada");
        streamRef.current = null;
      };
    } catch (err) {
      toast.error("Permiso denegado para capturar pantalla");
    }
  };

  const connectToHost = () => {
    if (!targetId || !peer) return toast.error("Ingresa un código válido");
    setStatus("Conectando...");
    
    const conn = peer.connect(targetId);
    conn.on("open", () => {
      setStatus("Conectado. Esperando imagen...");
    });
    connRef.current = conn;
  };

  const copyCode = () => {
    navigator.clipboard.writeText(peerId);
    toast.success("Código copiado: " + peerId);
  };

  const stopConnection = () => {
    if (peer) peer.destroy();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#020203] text-white selection:bg-[var(--brand)]/30 selection:text-[#020203] lowercase font-sans">
      <AppHeader userId={user?.id} onSignOut={signOut} />
      
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} aria-label="volver al dashboard" className="hover:bg-white/5 rounded-xl text-slate-400 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="space-y-1">
             <Badge className="bg-[var(--brand)]/10 text-[var(--brand)] border-transparent font-black px-3 py-0.5 rounded-full text-[9px] tracking-widest uppercase mb-1">p2p_nexus_v8.0</Badge>
             <h1 className="text-4xl font-black tracking-tighter text-white">sharescreen_<span className="text-[var(--brand)]">pro</span></h1>
             <p className="text-sm font-bold text-slate-500 lowercase">extiende tu espacio de trabajo a cualquier dispositivo p2p</p>
          </div>
        </div>

        {/* MODO SELECTOR */}
        {!mode ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
            <button onClick={initHost} className="flex flex-col items-center gap-6 p-10 rounded-[2.5rem] border border-white/5 bg-[#080809]/60 shadow-[0_10px_40px_rgba(0,0,0,0.1)] hover:border-[var(--brand)]/20 hover:shadow-2xl hover:shadow-[var(--brand)]/5 transition-all cursor-pointer group">
              <div className="w-16 h-16 rounded-2xl bg-[var(--brand)]/10 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl shadow-[var(--brand)]/10">
                <Monitor className="h-8 w-8 text-[var(--brand)]" />
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-black text-white">modo host <span className="text-[10px] bg-[var(--brand)]/10 text-[var(--brand)] px-3 py-1 rounded-full ml-2 lowercase font-black tracking-tight">1 crédito</span></h3>
                <p className="text-sm text-slate-500 font-bold mt-3 leading-relaxed">compartir pantalla desde este dispositivo. genera un código para el espectador.</p>
              </div>
            </button>
            <button onClick={initViewer} className="flex flex-col items-center gap-6 p-10 rounded-[2.5rem] border border-white/5 bg-[#080809]/60 shadow-[0_10px_40px_rgba(0,0,0,0.1)] hover:border-[var(--brand)]/20 hover:shadow-2xl hover:shadow-[var(--brand)]/5 transition-all cursor-pointer group">
               <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl">
                <Smartphone className="h-8 w-8 text-white" />
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-black text-white">modo viewer <span className="text-[10px] bg-white/10 text-slate-500 px-3 py-1 rounded-full ml-2 lowercase font-black tracking-tight">gratis</span></h3>
                <p className="text-sm text-slate-500 font-bold mt-3 leading-relaxed">ver la pantalla de otro dispositivo. requiere ingresar el código del host.</p>
              </div>
            </button>
          </div>
        ) : mode === "host" ? (
          /* MODO HOST PANEL */
          <div className="max-w-md mx-auto p-8 rounded-[2.5rem] border border-white/10 bg-[#080809]/80 backdrop-blur-3xl shadow-2xl mt-10 space-y-6">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <h2 className="text-xl font-black text-white lowercase">panel_emisión</h2>
              <span className="text-[10px] font-black px-3 py-1 bg-[var(--brand)]/10 text-[var(--brand)] rounded-full uppercase tracking-widest">{status}</span>
            </div>
            
            <div className="space-y-4">
              <p className="text-xs text-slate-500 font-bold">1. inicia la captura de pantalla de la ventana que deseas compartir.</p>
              <Button onClick={startSharing} disabled={!!streamRef.current} className="w-full bg-[var(--brand)] text-[#020203] hover:bg-[#c4eb00] gap-2 h-14 rounded-2xl font-black lowercase shadow-2xl shadow-[var(--brand)]/10">
                <Video className="h-5 w-5" /> {streamRef.current ? "grabando_pantalla" : "iniciar_captura"}
              </Button>
            </div>

            {peerId && (
              <div className="p-6 rounded-2xl border border-[var(--brand)]/20 bg-[var(--brand)]/5 flex flex-col items-center gap-4 mt-8 animate-in fade-in zoom-in duration-300">
                <p className="text-[10px] font-black text-center text-[var(--brand)] uppercase tracking-widest">2. comparte este código o escanea el qr:</p>
                <div className="p-3 bg-white rounded-2xl shadow-sm">
                  <QRCodeSVG value={peerId} size={160} />
                </div>
                <div className="flex items-center gap-2 mt-2 w-full">
                  <code className="flex-1 text-center py-3 bg-[#020203] rounded-2xl font-mono text-2xl font-black text-white border border-white/10">{peerId}</code>
                  <Button variant="outline" size="icon" onClick={copyCode} className="h-14 w-14 rounded-2xl shrink-0 border-white/10 hover:bg-white/5 active:scale-95 transition-all"><Copy className="h-5 w-5" /></Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* MODO VIEWER PANEL */
          <div className="max-w-md mx-auto p-8 rounded-[2.5rem] border border-white/10 bg-[#080809]/80 backdrop-blur-3xl shadow-2xl mt-10 space-y-6">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <h2 className="text-xl font-black text-white lowercase">receptor</h2>
              <span className="text-[10px] font-black px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full uppercase tracking-widest">{status}</span>
            </div>
            <div className="space-y-6 pt-2">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest pl-1">código_del_host</label>
                <Input 
                  placeholder="A1B2C3" 
                  value={targetId}
                  onChange={e => setTargetId(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="font-mono uppercase text-center text-2xl h-16 rounded-2xl border-white/5 bg-white/5 focus:ring-[var(--brand)]/20 text-white"
                />
              </div>
              <Button onClick={connectToHost} className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-[var(--brand)] hover:text-[#020203] hover:border-[var(--brand)] text-sm font-black lowercase transition-all active:scale-95 shadow-2xl shadow-[var(--brand)]/5">🔗 conectar_al_host</Button>
              <p className="text-[10px] text-center text-slate-500 font-bold leading-relaxed">transmisión fluida garantizada en redes de alta velocidad.</p>
            </div>
          </div>
        )}

        {/* PANTALLA COMPLETA RECIBIENDO STREAM */}
        {mode === "viewer" && isReceiving && (
          <div className="fixed inset-0 z-[110] bg-black flex flex-col items-center justify-center animate-in fade-in duration-500">
             <div className="absolute top-4 right-4 z-50 flex items-center gap-3 opacity-20 hover:opacity-100 transition-opacity p-2 bg-[#020203]/60 backdrop-blur-md rounded-2xl border border-white/10">
                <span className="text-[10px] font-black font-mono text-[var(--brand)] px-2">{stats}</span>
                <Button variant="ghost" size="icon" onClick={() => videoRef.current?.requestFullscreen()} className="rounded-xl hover:bg-white/5"><Maximize2 className="h-4 w-4" /></Button>
                <Button variant="destructive" size="icon" onClick={stopConnection} className="rounded-xl"><X className="h-4 w-4" /></Button>
             </div>
             <video ref={videoRef} autoPlay playsInline className="w-full h-full object-contain pointer-events-none" />
          </div>
        )}

      </main>
    </div>
  );
}
