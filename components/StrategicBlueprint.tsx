
import React, { useState } from 'react';
import { Task, TaskStatus } from '../types';
import { Map, Plus, ArrowRightCircle, Edit3, Trash2, Layers, Crosshair, Database, Megaphone, FileText } from 'lucide-react';
import TaskFormModal from './TaskFormModal';

interface StrategicBlueprintProps {
  tasks: Task[];
  onAddTask: (task: Task) => void;
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
}

const StrategicBlueprint: React.FC<StrategicBlueprintProps> = ({ tasks, onAddTask, onUpdateStatus, onEditTask, onDeleteTask }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Filter only backlog items
  const backlogItems = tasks.filter(t => t.status === TaskStatus.BACKLOG);

  // Group by Category
  const groupedItems = backlogItems.reduce((acc, item) => {
    const cat = item.category || 'Geral';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, Task[]>);

  const openNewFactorModal = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleSave = (task: Task) => {
    // Force status to BACKLOG if creating new in this view
    if (!editingTask) {
      task.status = TaskStatus.BACKLOG;
    }
    if (editingTask) {
      onEditTask(task);
    } else {
      onAddTask(task);
    }
  };

  const activateTask = (id: string) => {
    onUpdateStatus(id, TaskStatus.TODO);
  };

  const getCategoryIcon = (cat: string) => {
    const lower = cat.toLowerCase();
    if (lower.includes('tech') || lower.includes('infra')) return <Database size={18} className="text-blue-400" />;
    if (lower.includes('market') || lower.includes('brand') || lower.includes('conteúdo')) return <Megaphone size={18} className="text-pink-400" />;
    if (lower.includes('strat')) return <Crosshair size={18} className="text-green-400" />;
    return <Layers size={18} className="text-pool-400" />;
  };

  return (
    <div className="p-8 h-full overflow-y-auto relative">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <Map className="text-pool-gold" />
            Strategic Blueprint
          </h2>
          <p className="text-gray-400 mt-1 max-w-2xl">
            Registro de Ideias, Fatores e Planejamento. Use este espaço para definir a estratégia antes de produzir.
          </p>
        </div>
        <button 
          onClick={openNewFactorModal}
          className="bg-pool-500 hover:bg-pool-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold transition-all shadow-lg shadow-pool-500/20"
        >
          <Plus size={18} />
          Adicionar ao Backlog
        </button>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {Object.entries(groupedItems).map(([category, items]: [string, Task[]]) => (
          <div key={category} className="bg-pool-800/50 border border-pool-700 rounded-xl overflow-hidden">
            <div className="p-4 bg-pool-800 border-b border-pool-700 flex items-center gap-3">
              {getCategoryIcon(category)}
              <h3 className="font-bold text-white uppercase tracking-wider text-sm">{category}</h3>
              <span className="ml-auto text-xs bg-pool-900 text-gray-400 px-2 py-1 rounded-full">{items.length} itens</span>
            </div>
            
            <div className="divide-y divide-pool-700/50">
              {items.map(item => (
                <div key={item.id} className="p-4 hover:bg-pool-700/30 transition-colors group">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                         <h4 className="text-white font-medium">{item.title}</h4>
                         {item.demandType !== 'GENERIC' && (
                           <span className="text-[10px] bg-pool-900 border border-pool-600 px-1.5 rounded text-gray-400">{item.demandType}</span>
                         )}
                      </div>
                      <p className="text-xs text-pool-400 font-mono mt-0.5">{item.code}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={() => openEditModal(item)} className="p-1.5 text-gray-400 hover:text-white bg-pool-900 hover:bg-pool-700 rounded"><Edit3 size={14} /></button>
                       <button onClick={() => onDeleteTask(item.id)} className="p-1.5 text-gray-400 hover:text-red-400 bg-pool-900 hover:bg-red-900/30 rounded"><Trash2 size={14} /></button>
                    </div>
                  </div>

                  {item.briefing?.idea && (
                    <p className="text-xs text-gray-400 mb-2 line-clamp-2 bg-pool-900/30 p-1.5 rounded">
                       "{item.briefing.idea}"
                    </p>
                  )}

                  <div className="flex justify-between items-center mt-3">
                    <div className="text-xs text-gray-500">Owner: <span className="text-gray-300">{item.owner}</span></div>
                    <button 
                      onClick={() => activateTask(item.id)}
                      className="text-xs bg-pool-900 hover:bg-green-900/30 text-pool-gold hover:text-green-400 border border-pool-700 hover:border-green-500/50 px-3 py-1.5 rounded flex items-center gap-2 transition-all"
                    >
                      Ativar Produção <ArrowRightCircle size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {backlogItems.length === 0 && (
          <div className="col-span-full p-12 border-2 border-dashed border-pool-700 rounded-xl flex flex-col items-center justify-center text-gray-500">
            <Map size={48} className="mb-4 opacity-50" />
            <p className="text-lg">Blueprint Vazio</p>
            <p className="text-sm">Adicione fatores, cenários ou dependências para começar a planejar.</p>
            <button onClick={openNewFactorModal} className="mt-4 text-pool-500 hover:text-pool-400 underline">Adicionar primeiro item</button>
          </div>
        )}
      </div>

      <TaskFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        taskToEdit={editingTask}
        onSave={handleSave}
      />
    </div>
  );
};

export default StrategicBlueprint;