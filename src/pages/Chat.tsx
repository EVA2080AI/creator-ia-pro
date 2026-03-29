import { useAuth } from "@/hooks/useAuth";
import { AppHeader } from "@/components/AppHeader";
import { GeniusAssistant } from "@/components/formarketing/GeniusAssistant";
import { useNavigate } from "react-router-dom";
import { Code2, Sparkles } from "lucide-react";

const Chat = () => {
  const { user, signOut } = useAuth("/auth");
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#050506]">
      <AppHeader userId={user?.id} onSignOut={signOut} />
      {/* Studio entry banner */}
      <div className="mx-auto max-w-3xl px-4 pt-4">
        <button
          onClick={() => navigate('/studio')}
          className="w-full flex items-center justify-between gap-4 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-aether-purple/10 to-aether-blue/10 border border-aether-purple/20 hover:border-aether-purple/40 hover:from-aether-purple/15 hover:to-aether-blue/15 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-aether-purple/20 border border-aether-purple/30 group-hover:bg-aether-purple/30 transition-colors">
              <Code2 className="h-4 w-4 text-aether-purple" />
            </div>
            <div className="text-left">
              <p className="text-[13px] font-bold text-white font-display">BuilderAI Studio</p>
              <p className="text-[11px] text-white/40">Genera apps completas con IA — código, preview y GitHub</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-aether-purple/20 border border-aether-purple/30 group-hover:bg-aether-purple/30 transition-colors shrink-0">
            <Sparkles className="h-3.5 w-3.5 text-aether-purple" />
            <span className="text-[10px] font-bold text-aether-purple uppercase tracking-widest font-display">Abrir</span>
          </div>
        </button>
      </div>
      <GeniusAssistant />
    </div>
  );
};

export default Chat;
