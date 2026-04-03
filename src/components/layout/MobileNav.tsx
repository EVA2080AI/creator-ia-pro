import { Menu, Zap } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { SidebarGlobal } from './SidebarGlobal';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { Coins } from 'lucide-react';

export function MobileNav() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile(user?.id);

  return (
    <header className="md:hidden sticky top-0 left-0 right-0 z-[40] h-14 border-b border-zinc-200/60 bg-white/95 backdrop-blur-xl px-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Sheet>
          <SheetTrigger asChild>
            <button className="p-2 -ml-2 rounded-xl text-zinc-500 hover:text-zinc-900 transition-all">
              <Menu className="w-5 h-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[240px] border-r-0 shadow-2xl">
            <SidebarGlobal isMobile />
          </SheetContent>
        </Sheet>
        <Logo size="sm" showText onClick={() => navigate('/dashboard')} />
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={() => navigate('/pricing')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-primary/5 border border-primary/15 text-[11px] font-bold text-primary"
        >
          <Coins className="w-3.5 h-3.5" />
          {profile?.credits_balance?.toLocaleString() ?? '—'}
        </button>
      </div>
    </header>
  );
}
