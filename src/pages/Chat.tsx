import { useAuth } from "@/hooks/useAuth";
import { GeniusAssistant } from "@/components/formarketing/GeniusAssistant";

/**
 * /chat — Dedicated standalone chat page.
 * GeniusAssistant always renders in fullscreen mode.
 */
const Chat = () => {
  useAuth("/auth");
  return (
    <div className="min-h-screen bg-[#050506]">
      <GeniusAssistant />
    </div>
  );
};

export default Chat;
