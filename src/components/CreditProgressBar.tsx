import { useNavigate, useLocation } from 'react-router-dom';
import { Zap, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';

// Credit caps per plan tier (for progress bar %)
const TIER_CAPS: Record<string, number> = {
  free:       5,
  creador:    1000,
  pro:        3000,
  agencia:    8000,
  pyme:       20000,
};

const HIDDEN_PATHS = ['/', '/auth', '/descargar', '/product-backlog', '/reset-password', '/chat', '/formarketing', '/code', '/studio', '/admin'];

export function CreditProgressBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile(user?.id);

  const isHidden = HIDDEN_PATHS.some(p => location.pathname === p || location.pathname.startsWith(p));
  if (isHidden || !user || !profile) return null;

  const tier = (profile.subscription_tier || 'free').toLowerCase();
  const cap = TIER_CAPS[tier] ?? 10;
  const balance = profile.credits_balance ?? 0;
  const pct = Math.min(100, Math.max(0, (balance / cap) * 100));
  const isLow = pct < 15;
  const isCritical = pct < 5;

  const barColor = isCritical ? '#EF4444' : isLow ? '#F59E0B' : '#10B981';

  return (
    <div
      className={cn(
        "fixed top-[56px] left-0 right-0 z-[99] transition-all duration-500",
        isCritical && "animate-pulse"
      )}
    >
      {/* Ultra-thin progress line - Only show when low */}
      {isLow && (
        <div className="h-[2px] w-full bg-zinc-50 relative overflow-hidden">
          <div
            className="h-full transition-all duration-700 ease-out"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${barColor}80, ${barColor})`,
              boxShadow: `0 0 8px ${barColor}60`,
            }}
          />
        </div>
      )}

      {/* Low credits warning pill */}
      {isLow && (
        <div className="flex justify-center mt-1.5 px-4">
          <button
            onClick={() => navigate('/pricing')}
            className={cn(
              "flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95",
              isCritical
                ? "bg-rose-500/15 border border-rose-500/30 text-rose-400"
                : "bg-amber-500/10 border border-amber-500/20 text-amber-400"
            )}
          >
            <Zap className="h-2.5 w-2.5" />
            {isCritical
              ? `¡Solo ${balance.toLocaleString()} créditos! Recarga ya →`
              : `${balance.toLocaleString()} créditos · Recargar →`}
            <TrendingUp className="h-2.5 w-2.5" />
          </button>
        </div>
      )}
    </div>
  );
}
