import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { GeniusAssistant } from "@/components/formarketing/GeniusAssistant";
import { useEffect } from "react";

/**
 * /chat — Standalone page that opens the Aether Chat in fullscreen mode.
 * The GeniusAssistant component handles all chat logic, models, and streaming.
 */
const Chat = () => {
  const { user } = useAuth("/auth");

  // Force fullscreen mode by default on this page
  useEffect(() => {
    // Signal to GeniusAssistant to open in fullscreen
    const event = new CustomEvent("aether-chat-open-fullscreen");
    window.dispatchEvent(event);
  }, []);

  // Render GeniusAssistant — it will receive the event and auto-open fullscreen
  // The component is self-contained, so we just need it mounted
  return (
    <div className="min-h-screen bg-[#050506]">
      <GeniusAssistant />
    </div>
  );
};

export default Chat;
