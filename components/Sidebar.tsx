
import React from 'react';
import { LayoutDashboard, Map, Wallet, Kanban, Archive, BrainCircuit } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'blueprint', label: 'Briefing / Backlog', icon: <Map size={20} /> },
    { id: 'production', label: 'Active Production', icon: <Kanban size={20} /> },
    { id: 'archive', label: 'Repository', icon: <Archive size={20} /> },
    { id: 'intelligence', label: 'Intelligence Hub', icon: <BrainCircuit size={20} className="text-pool-gold" /> },
  ];

  return (
    <aside className="w-64 bg-pool-900 border-r border-pool-700 flex flex-col h-screen fixed left-0 top-0 z-10">
      <div className="p-6 border-b border-pool-700">
        <div className="flex items-center gap-2 text-pool-gold mb-1">
          <Wallet className="h-6 w-6" />
          <h1 className="text-xl font-bold tracking-wider">POOLPAYS</h1>
        </div>
        <p className="text-xs text-pool-400 uppercase tracking-widest ml-8">Architect OS</p>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
              activeTab === item.id
                ? 'bg-pool-700 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)] border-l-4 border-pool-500'
                : 'text-gray-400 hover:bg-pool-800 hover:text-white'
            }`}
          >
            <span className={activeTab === item.id ? 'text-pool-gold' : 'group-hover:text-pool-400'}>
              {item.icon}
            </span>
            <span className="font-medium text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-pool-700 bg-pool-950">
        <div className="text-xs text-gray-500">System Status</div>
        <div className="flex items-center gap-2 mt-1">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-xs font-mono text-green-400">ONLINE - GEMINI 3</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
