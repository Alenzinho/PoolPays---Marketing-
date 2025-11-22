
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Task, TaskStatus } from '../types';
import { AlertTriangle, CheckCircle2, Clock, Lock, Map } from 'lucide-react';

interface DashboardProps {
  tasks: Task[];
}

const Dashboard: React.FC<DashboardProps> = ({ tasks }) => {
  // Calculate stats
  const backlog = tasks.filter(t => t.status === TaskStatus.BACKLOG).length;
  const done = tasks.filter(t => t.status === TaskStatus.DONE).length;
  const inProgress = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
  const blocked = tasks.filter(t => t.status === TaskStatus.BLOCKED).length;
  const todo = tasks.filter(t => t.status === TaskStatus.TODO).length;

  const totalActive = done + inProgress + blocked + todo;
  const totalAll = totalActive + backlog;

  const dataPie = [
    { name: 'Feito', value: done, color: '#22c55e' },
    { name: 'Em Progresso', value: inProgress, color: '#fbbf24' }, // Gold
    { name: 'Bloqueado', value: blocked, color: '#ef4444' },
    { name: 'A Fazer', value: todo, color: '#4b5563' },
  ];

  // Active Tasks by owner (excluding backlog)
  const ownerData = Object.entries(tasks
    .filter(t => t.status !== TaskStatus.BACKLOG)
    .reduce((acc, task) => {
      acc[task.owner] = (acc[task.owner] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)).map(([name, count]) => ({ name, count }));

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 overflow-y-auto h-full">
      <header>
        <h2 className="text-3xl font-bold text-white">Command Center</h2>
        <p className="text-gray-400 mt-1">Visão geral da operação: Blueprint vs Produção</p>
      </header>

      {/* Pipeline Flow Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        
        {/* Strategy Phase */}
        <div className="bg-pool-800/50 p-6 rounded-xl border border-pool-600/50 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-10 bg-pool-600/10 rounded-full blur-xl group-hover:bg-pool-600/20 transition-all"></div>
          <div className="flex items-center gap-3 text-pool-400 mb-2">
             <Map size={20} />
             <span className="text-sm font-bold uppercase tracking-wider">Blueprint</span>
          </div>
          <div>
            <p className="text-3xl font-bold text-white">{backlog}</p>
            <p className="text-xs text-gray-500">Fatores em Planejamento</p>
          </div>
        </div>

        {/* Arrow Connector */}
        <div className="hidden md:flex items-center justify-center text-pool-600">
           <div className="h-1 flex-1 bg-pool-800"></div>
           {'>'}
        </div>

        {/* Production Phase */}
        <div className="col-span-3 grid grid-cols-3 gap-4 bg-pool-800 p-1 rounded-xl border border-pool-700">
            <div className="p-5 rounded-lg bg-pool-900/50 flex flex-col justify-between">
               <div className="flex items-center gap-2 text-yellow-400 mb-2">
                  <Clock size={18} />
                  <span className="text-xs font-bold uppercase">WIP (Active)</span>
               </div>
               <p className="text-2xl font-bold text-white">{inProgress + todo}</p>
            </div>
            
            <div className="p-5 rounded-lg bg-pool-900/50 flex flex-col justify-between">
               <div className="flex items-center gap-2 text-red-400 mb-2">
                  <AlertTriangle size={18} />
                  <span className="text-xs font-bold uppercase">Blocked</span>
               </div>
               <p className="text-2xl font-bold text-white">{blocked}</p>
            </div>

            <div className="p-5 rounded-lg bg-pool-900/50 flex flex-col justify-between">
               <div className="flex items-center gap-2 text-green-400 mb-2">
                  <CheckCircle2 size={18} />
                  <span className="text-xs font-bold uppercase">Shipped</span>
               </div>
               <p className="text-2xl font-bold text-white">{done}</p>
            </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart 1 - Active Production Health */}
        <div className="bg-pool-800 p-6 rounded-xl border border-pool-700">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-lg font-bold text-white">Active Production Breakdown</h3>
             <span className="text-xs bg-pool-900 px-2 py-1 rounded text-gray-400">Kanban Only</span>
          </div>
          <div className="h-64 flex items-center justify-center">
            {totalActive > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataPie}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {dataPie.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a0b2e', borderColor: '#4c1d95', color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-gray-500 text-sm">Nenhuma tarefa em produção. Ative itens do Blueprint.</div>
            )}
          </div>
          {totalActive > 0 && (
            <div className="flex justify-center gap-4 mt-4 flex-wrap">
              {dataPie.map(item => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm text-gray-400">{item.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chart 2 - Load by Owner */}
        <div className="bg-pool-800 p-6 rounded-xl border border-pool-700">
          <h3 className="text-lg font-bold text-white mb-6">Active Load by Specialist</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ownerData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#2d1b4e" horizontal={false} />
                <XAxis type="number" stroke="#64748b" />
                <YAxis dataKey="name" type="category" width={100} stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <Tooltip cursor={{fill: '#2d1b4e'}} contentStyle={{ backgroundColor: '#1a0b2e', borderColor: '#4c1d95', color: '#fff' }} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Critical Alerts */}
      {(tasks.filter(t => t.status === TaskStatus.BLOCKED).length > 0) && (
        <div className="bg-red-900/10 border border-red-900/50 p-6 rounded-xl">
          <h3 className="text-red-400 font-bold flex items-center gap-2 mb-4">
            <AlertTriangle size={20} />
            Bloqueios em Produção
          </h3>
          <ul className="space-y-3">
            {tasks.filter(t => t.status === TaskStatus.BLOCKED).map(task => (
               <li key={task.id} className="flex justify-between items-center border-b border-red-900/30 pb-2 last:border-0">
                 <span className="text-gray-300">{task.code} - {task.title}</span>
                 <span className="text-xs bg-red-900/50 text-red-300 px-2 py-1 rounded">{task.owner}</span>
               </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
