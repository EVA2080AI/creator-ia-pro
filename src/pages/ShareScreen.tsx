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
      toast.error("No tienes créditos suficientes para ser Host. Recarga en tu perfil.");
      return false;
    }
    try {
      const { error } = await supabase.rpc("admin_update_credits", {
        _new_balance: profile.credits_balance - 1,
        _target_user_id: user!.id
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
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader userId={user?.id} onSignOut={signOut} />
      
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Share<span className="gradient-text">Screen</span> Pro</h1>
            <p className="text-sm text-muted-foreground">Extiende tu espacio de trabajo a cualquier dispositivo P2P</p>
          </div>
        </div>

        {/* MODO SELECTOR */}
        {!mode ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
            <button onClick={initHost} className="flex flex-col items-center gap-4 p-8 rounded-2xl border border-border bg-card node-shadow hover:border-primary/50 transition-all cursor-pointer group text-left">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Monitor className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold">Modo HOST <span className="text-xs bg-gold/20 text-gold px-2 py-1 rounded ml-2">1 Crédito</span></h3>
                <p className="text-sm text-muted-foreground mt-2">Compartir pantalla desde este dispositivo. Genera un código para el espectador.</p>
              </div>
            </button>
            <button onClick={initViewer} className="flex flex-col items-center gap-4 p-8 rounded-2xl border border-border bg-card node-shadow hover:border-accent/50 transition-all cursor-pointer group text-left">
               <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Smartphone className="h-8 w-8 text-accent" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold">Modo VIEWER <span className="text-xs bg-emerald-500/20 text-emerald-500 px-2 py-1 rounded ml-2">Gratis</span></h3>
                <p className="text-sm text-muted-foreground mt-2">Ver la pantalla de otro dispositivo. Requiere ingresar el código del Host.</p>
              </div>
            </button>
          </div>
        ) : mode === "host" ? (
          /* MODO HOST PANEL */
          <div className="max-w-md mx-auto p-6 rounded-3xl border border-border bg-card node-shadow mt-10 space-y-6">
            <div className="flex justify-between items-center border-b border-border pb-4">
              <h2 className="text-xl font-bold text-foreground">Panel de Emisión</h2>
              <span className="text-xs font-semibold px-3 py-1 bg-primary/10 text-primary rounded-full">{status}</span>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">1. Inicia la captura de pantalla de la ventana que deseas compartir.</p>
              <Button onClick={startSharing} disabled={!!streamRef.current} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2 h-12 rounded-xl">
                <Video className="h-5 w-5" /> {streamRef.current ? "Grabando pantalla" : "Iniciar Captura"}
              </Button>
            </div>

            {peerId && (
              <div className="p-6 rounded-2xl border border-primary/20 bg-primary/5 flex flex-col items-center gap-4 mt-8 animate-in fade-in zoom-in duration-300">
                <p className="text-sm font-medium text-center text-primary">2. Comparte este código o escanea el QR en el dispositivo Viewer:</p>
                <div className="p-3 bg-white rounded-xl shadow-sm">
                  <QRCodeSVG value={peerId} size={160} />
                </div>
                <div className="flex items-center gap-2 mt-2 w-full">
                  <code className="flex-1 text-center py-3 bg-background rounded-xl font-mono text-2xl font-bold text-foreground border border-border">{peerId}</code>
                  <Button variant="outline" size="icon" onClick={copyCode} className="h-14 w-14 rounded-xl shrink-0"><Copy className="h-5 w-5" /></Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* MODO VIEWER PANEL */
          <div className="max-w-md mx-auto p-6 rounded-3xl border border-border bg-card node-shadow mt-10 space-y-6">
            <div className="flex justify-between items-center border-b border-border pb-4">
              <h2 className="text-xl font-bold text-foreground">Receptor</h2>
              <span className="text-xs font-semibold px-3 py-1 bg-accent/10 text-accent rounded-full">{status}</span>
            </div>
            <div className="space-y-6 pt-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Código de Conexión del Host</label>
                <Input 
                  placeholder="Ej: A1B2C3" 
                  value={targetId}
                  onChange={e => setTargetId(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="font-mono uppercase text-center text-2xl h-16 rounded-xl border-border bg-background focus:ring-accent"
                />
              </div>
              <Button onClick={connectToHost} className="w-full h-12 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 text-md font-semibold">🔗 Conectar al Host</Button>
              <p className="text-xs text-center text-muted-foreground">Para un streaming fluido, asegúrate de estar en la misma red Wi-Fi o con buena señal 4G/5G.</p>
            </div>
          </div>
        )}

        {/* PANTALLA COMPLETA RECIBIENDO STREAM */}
        {mode === "viewer" && isReceiving && (
          <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center animate-in fade-in duration-500">
            <div className="absolute top-4 right-4 z-50 flex items-center gap-3 opacity-20 hover:opacity-100 transition-opacity p-2 bg-black/60 backdrop-blur-md rounded-2xl">
               <span className="text-xs font-mono text-white/50 px-2">{stats}</span>
               <Button variant="secondary" size="icon" onClick={() => videoRef.current?.requestFullscreen()} className="rounded-xl"><Maximize2 className="h-4 w-4" /></Button>
               <Button variant="destructive" size="icon" onClick={stopConnection} className="rounded-xl"><X className="h-4 w-4" /></Button>
            </div>
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-contain pointer-events-none" />
          </div>
        )}

      </main>
    </div>
  );
}
