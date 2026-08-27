'use client';

import { useCallback, useEffect, useState } from 'react';
import { Sparkles, Activity, ShieldCheck, FileCode2, Layers3, Terminal, Radio, ArrowLeftRight, Trophy } from 'lucide-react';
import { MagicOrbView } from './components/magic/MagicOrbView';
import { MagicHallView } from './components/magic/MagicHallView';
import { StatsMonitorView } from './components/stats/StatsMonitorView';
import { VerificationSuiteView } from './components/verification/VerificationSuiteView';
import { ProductionCodeHub } from './components/production/ProductionCodeHub';
import { JsonRpcTerminal } from './components/rpc/JsonRpcTerminal';
import { LiveQueryPanel } from './components/live/LiveQueryPanel';
import { TransactionFeed } from './components/transactions/TransactionFeed';
import { QuestLeaderboard } from './components/leaderboard/QuestLeaderboard';
import { AggregatedStats } from './components/types';

type TabId = 'orb' | 'hall' | 'stats' | 'rpc' | 'live' | 'tx' | 'leaderboard' | 'verification' | 'production';

const TABS: Array<{ id: TabId; label: string; icon: typeof Sparkles }> = [
  { id: 'orb', label: 'Magic Orb', icon: Sparkles },
  { id: 'hall', label: 'Magic Hall', icon: Layers3 },
  { id: 'stats', label: 'Telemetry', icon: Activity },
  { id: 'rpc', label: 'RPC Terminal', icon: Terminal },
  { id: 'live', label: 'Live Query', icon: Radio },
  { id: 'tx', label: 'Transactions', icon: ArrowLeftRight },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { id: 'verification', label: 'Verification', icon: ShieldCheck },
  { id: 'production', label: 'Production Files', icon: FileCode2 },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>('orb');
  const [stats, setStats] = useState<AggregatedStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const res = await fetch('/api/stats', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as AggregatedStats;
      setStats(data);
    } catch (err: any) {
      setStatsError(err.message || 'Failed to fetch stats');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStats();
    const interval = window.setInterval(() => void fetchStats(), 30000);
    return () => window.clearInterval(interval);
  }, [fetchStats]);

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <header className="mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Layers3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">
                  MeeChain <span className="text-indigo-400 font-normal">Dashboard</span>
                </h1>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-mono">
                  Network Operations & Infrastructure Control
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-mono font-semibold text-emerald-400">LIVE</span>
              </div>
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <nav className="mb-6 flex flex-wrap gap-1.5 border-b border-slate-800 pb-px">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-xs font-mono font-semibold transition border-b-2 -mb-px ${
                  isActive
                    ? 'text-white border-indigo-500 bg-[#0a0a0a]'
                    : 'text-slate-500 border-transparent hover:text-slate-300 hover:bg-[#0a0a0a]/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Tab Content */}
        <div className="pb-12">
          {activeTab === 'orb' && <MagicOrbView chaosMode={false} />}
          {activeTab === 'hall' && <MagicHallView />}
          {activeTab === 'stats' && (
            <StatsMonitorView stats={stats} loading={statsLoading} error={statsError} onRefresh={fetchStats} />
          )}
          {activeTab === 'rpc' && <JsonRpcTerminal />}
          {activeTab === 'live' && <LiveQueryPanel />}
          {activeTab === 'tx' && <TransactionFeed />}
          {activeTab === 'leaderboard' && <QuestLeaderboard />}
          {activeTab === 'verification' && <VerificationSuiteView />}
          {activeTab === 'production' && <ProductionCodeHub />}
        </div>

        {/* Footer */}
        <footer className="border-t border-slate-800 pt-4 pb-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-[10px] font-mono text-slate-600">
          <span>MeeChain Network Operations Center</span>
          <span className="flex items-center gap-1.5">
            <Activity className="w-3 h-3 text-emerald-500" /> Monitoring Active
          </span>
        </footer>
      </div>
    </main>
  );
}
