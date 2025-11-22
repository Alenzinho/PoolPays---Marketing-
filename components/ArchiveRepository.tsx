
import React, { useState } from 'react';
import { Task, TaskStatus } from '../types';
import { Archive, Search, Trash2, RefreshCcw } from 'lucide-react';

interface ArchiveRepositoryProps {
  tasks: Task[];
  onDeleteTask: (id: string) => void;
  onRestoreTask?: (id: string) => void;
}

const ArchiveRepository: React.FC<ArchiveRepositoryProps> = ({ tasks, onDeleteTask, onRestoreTask }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter for archived tasks
  const archivedTasks = tasks.filter(t => t.status === TaskStatus.ARCHIVED);
  
  const filteredTasks = archivedTasks.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.owner.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 h-full flex flex-col animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <Archive className="text-pool-gold" />
            Repository
          </h2>
          <p className="text-gray-400 mt-1">Arquivo morto e histórico de demandas finalizadas.</p>
        </div>
        
        <div className="relative">
          <input 
            type="text" 
            placeholder="Buscar no arquivo..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-pool-800 border border-pool-700 text-white rounded-lg pl-10 pr-4 py-2 focus:border-pool-500 outline-none w-64"
          />
          <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
        </div>
      </div>

      <div className="bg-pool-800/50 border border-pool-700 rounded-xl overflow-hidden flex-1 flex flex-col">
        <div className="grid grid-cols-12 gap-4 p-4 bg-pool-800 border-b border-pool-700 font-bold text-gray-400 text-xs uppercase tracking-wider">
          <div className="col-span-1">ID</div>
          <div className="col-span-1">Type</div>
          <div className="col-span-5">Title</div>
          <div className="col-span-2">Owner</div>
          <div className="col-span-2">Date</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        <div className="overflow-y-auto custom-scrollbar flex-1">
          {filteredTasks.length > 0 ? (
            filteredTasks.map(task => (
              <div key={task.id} className="grid grid-cols-12 gap-4 p-4 border-b border-pool-700/50 items-center hover:bg-pool-700/30 transition-colors text-sm">
                <div className="col-span-1 font-mono text-pool-400 text-xs">{task.code}</div>
                <div className="col-span-1">
                    <span className="bg-pool-900 text-xs px-2 py-1 rounded border border-pool-700 text-gray-300">
                        {task.demandType === 'GENERIC' ? 'TASK' : task.demandType.substring(0, 4)}
                    </span>
                </div>
                <div className="col-span-5 font-medium text-white flex flex-col">
                    {task.title}
                    {task.briefing?.idea && <span className="text-xs text-gray-500 truncate">{task.briefing.idea}</span>}
                </div>
                <div className="col-span-2 text-gray-400">{task.owner}</div>
                <div className="col-span-2 text-gray-400 text-xs">
                    {task.deadline ? new Date(task.deadline).toLocaleDateString() : '-'}
                </div>
                <div className="col-span-1 flex justify-end gap-2">
                  {onRestoreTask && (
                    <button onClick={() => onRestoreTask(task.id)} className="p-1.5 text-gray-400 hover:text-green-400 bg-pool-900 rounded transition-colors" title="Restaurar para Produção">
                        <RefreshCcw size={14} />
                    </button>
                  )}
                  <button onClick={() => onDeleteTask(task.id)} className="p-1.5 text-gray-400 hover:text-red-400 bg-pool-900 rounded transition-colors" title="Excluir Permanentemente">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center h-full">
                <Archive size={48} className="mb-4 opacity-20" />
                <p>Nenhum item arquivado encontrado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArchiveRepository;
