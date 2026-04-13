import React from 'react';
import { motion } from 'framer-motion';
import { NebulaButton, NebulaCard, NebulaStat } from '@/components/nebula/NebulaUI';
import { 
  Zap, 
  TrendingUp, 
  Wallet, 
  Activity, 
  ArrowUpRight, 
  LayoutDashboard,
  Bell,
  Search,
  PieChart
} from 'lucide-react';

const NebulaDashboard = () => {
  return (
    <div className="min-h-screen bg-nebula-obsidian text-white font-sans selection:bg-nebula-indigo/30 selection:text-white">
      {/* Sidebar Placeholder (Desktop) */}
      <div className="fixed left-0 top-0 bottom-0 w-20 bg-nebula-surface border-r border-nebula-border hidden md:flex flex-col items-center py-10 gap-8">
        <div className="w-12 h-12 bg-nebula-indigo rounded-2xl flex items-center justify-center shadow-lg shadow-nebula-indigo/20">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <div className="flex flex-col gap-6 mt-10">
          <div className="p-3 bg-white/5 rounded-xl text-nebula-indigo">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div className="p-3 text-nebula-muted hover:text-white transition-colors">
            <PieChart className="w-5 h-5" />
          </div>
          <div className="p-3 text-nebula-muted hover:text-white transition-colors">
            <Wallet className="w-5 h-5" />
          </div>
        </div>
      </div>

      <main className="md:ml-20 p-6 md:p-12 max-w-7xl mx-auto space-y-12">
        {/* Top Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-black tracking-tighter">Overview</h1>
            <p className="text-nebula-muted text-sm font-medium">Welcome back, Captain. Assets are stable.</p>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="flex-1 md:w-64 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-nebula-muted" />
              <input 
                type="text" 
                placeholder="Search assets..." 
                className="w-full bg-nebula-surface border border-nebula-border rounded-xl py-3 pl-12 pr-4 text-xs focus:outline-none focus:border-nebula-indigo/50 transition-colors"
              />
            </div>
            <button className="p-3 bg-nebula-surface border border-nebula-border rounded-xl">
              <Bell className="w-4 h-4 text-nebula-muted" />
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <NebulaStat label="Total Balance" value="$124,502.00" trend={12} />
          <NebulaStat label="Monthly Income" value="$18,200.45" trend={8.4} />
          <NebulaStat label="Total Expenses" value="$4,302.10" trend={-2.1} />
          <NebulaStat label="Safe to Spend" value="$7,405.00" />
        </section>

        {/* Chart Area Mock */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <NebulaCard className="lg:col-span-2 min-h-[400px] flex flex-col justify-between">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="font-bold text-lg">Growth Analysis</h3>
                <p className="text-xs text-nebula-muted">Stripe vs Patreon Revenue</p>
              </div>
              <div className="flex gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg text-[10px] font-bold">
                  <div className="w-2 h-2 rounded-full bg-nebula-indigo" /> Stripe
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg text-[10px] font-bold">
                  <div className="w-2 h-2 rounded-full bg-nebula-emerald" /> Patreon
                </div>
              </div>
            </div>
            
            <div className="flex-1 flex items-end gap-1 md:gap-2 px-2">
              {[45, 60, 45, 90, 100, 80, 50, 70, 85, 95, 110, 120].map((h, i) => (
                <motion.div 
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ delay: i * 0.05, duration: 1 }}
                  className="flex-1 bg-gradient-to-t from-nebula-indigo/10 to-nebula-indigo rounded-t-lg relative group"
                >
                   <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-black px-2 py-1 rounded text-[9px] font-black opacity-0 group-hover:opacity-100 transition-opacity">
                      ${(h * 100).toLocaleString()}
                   </div>
                </motion.div>
              ))}
            </div>

            <div className="flex justify-between items-center mt-6 text-[10px] font-bold text-nebula-muted uppercase tracking-widest px-1">
              <span>Jan</span>
              <span>Mar</span>
              <span>Jun</span>
              <span>Sep</span>
              <span>Dec</span>
            </div>
          </NebulaCard>

          <div className="space-y-6">
            <NebulaCard className="bg-gradient-to-br from-nebula-indigo to-[#4F46E5] border-none text-white p-8">
              <div className="space-y-6">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <ArrowUpRight className="w-6 h-6 text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black leading-tight">Nebula Pro is Active</h3>
                  <p className="text-sm text-white/70 leading-relaxed font-medium">Enjoy unlimited API connections and advanced neural prediction.</p>
                </div>
                <button className="w-full py-4 bg-white text-nebula-indigo rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl">
                  Manage Plan
                </button>
              </div>
            </NebulaCard>

            <NebulaCard className="space-y-6">
              <h4 className="text-xs font-black uppercase tracking-widest text-nebula-muted">Recent Streams</h4>
              <div className="space-y-4">
                {[
                  { name: 'Stripe Payout', date: '2h ago', amount: '+$4,200', color: 'nebula-emerald' },
                  { name: 'Server Billing', date: '5h ago', amount: '-$120', color: 'rose-500' },
                  { name: 'Patreon Sync', date: '1d ago', amount: '+$505', color: 'nebula-emerald' }
                ].map((t, i) => (
                  <div key={i} className="flex justify-between items-center group cursor-pointer hover:bg-white/5 p-2 -mx-2 rounded-xl transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                        <Activity className="w-4 h-4 text-nebula-muted group-hover:text-white transition-colors" />
                      </div>
                      <div>
                        <p className="text-sm font-bold tracking-tight">{t.name}</p>
                        <p className="text-[10px] text-nebula-muted font-medium">{t.date}</p>
                      </div>
                    </div>
                    <span className={cn('font-bold text-sm', `text-${t.color}`)}>{t.amount}</span>
                  </div>
                ))}
              </div>
            </NebulaCard>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NebulaDashboard;
