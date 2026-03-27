import { useAuth } from "@/hooks/useAuth";
import { AppHeader } from "@/components/AppHeader";
import { GeniusAssistant } from "@/components/formarketing/GeniusAssistant";

const Chat = () => {
  const { user, signOut } = useAuth("/auth");
  return (
    <div className="min-h-screen bg-[#050506]">
      <AppHeader userId={user?.id} onSignOut={signOut} />
      <GeniusAssistant />
    </div>
  );
};

export default Chat;
