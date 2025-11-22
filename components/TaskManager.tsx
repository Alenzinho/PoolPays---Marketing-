
import React, { useState } from 'react';
import { Task, TaskStatus } from '../types';
import { Filter, ChevronDown, Calendar, User, Plus, Trash2, Edit3 } from 'lucide-react';
import TaskFormModal from './TaskFormModal';

interface TaskManagerProps {
  tasks: Task[];
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  onAddTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
}

const TaskManager: React.FC<TaskManagerProps> = ({ tasks, onUpdateStatus, onAddTask, onEditTask, onDeleteTask }) => {
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterWeek, setFilterWeek] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const categories = ['All', ...Array.from(new Set(tasks.map(t => t.category)))];
  const weeks = ['All', ...Array.from(new Set(tasks.map(t => t.week)))];

  const filteredTasks = tasks.filter(task => {
    const catMatch = filterCategory === 'All' || task.category === filterCategory;
    const weekMatch = filterWeek === 'All' || task.week === filterWeek;
    return catMatch && weekMatch;
  });

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.DONE: return 'bg-green-500/20 text-green-400 border-green-500/50';
      case TaskStatus.IN_PROGRESS: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case TaskStatus.BLOCKED: return 'bg-red-500/20 text-red-400 border-red-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const openNewTaskModal = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleSaveTask = (task: Task) => {
    if (editingTask) {
      onEditTask(task);
    } else {
      onAddTask(task);
    }
  };

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return 'Sem data';
    try {
      return new Date(date).toLocaleDateString();
    } catch { return 'Inválido'; }
  };

  return (
    <div className="p-8 h-full flex flex-col relative">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white">Mission Log</h2>
          <p className="text-gray-400 mt-1">Gerenciamento tático de demandas</p>
        </div>
        
        <div className="flex gap-4 items-center">
           <button 
            onClick={openNewTaskModal}
            className="bg-pool-500 hover:bg-pool-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold transition-all shadow-lg shadow-pool-500/20"
          >
            <Plus size={18} />
            Nova Missão
          </button>

          <div className="relative">
            <div className="relative">
              <select 
                value={filterWeek}
                onChange={(e) => setFilterWeek(e.target.value)}
                className="bg-pool-800 border border-pool-700 text-white text-sm rounded-lg px-4 py-2 pr-8 appearance-none focus:outline-none focus:border-pool-500 min-w-[140px]"
              >
                {weeks.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-2.5 text-gray-500 pointer-events-none" size={14} />
            </div>
          </div>

          <div className="relative">
            <div className="relative">
              <select 
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-pool-800 border border-pool-700 text-white text-sm rounded-lg px-4 py-2 pr-8 appearance-none focus:outline-none focus:border-pool-500 min-w-[180px]"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <Filter className="absolute right-3 top-2.5 text-gray-500 pointer-events-none" size={14} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 overflow-y-auto pb-20 pr-2">
        {filteredTasks.map(task => (
          <div key={task.id} className="bg-pool-800 border border-pool-700 rounded-xl p-5 hover:border-pool-500 transition-all group shadow-lg shadow-black/40 relative">
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => openEditModal(task)} className="text-gray-400 hover:text-pool-400"><Edit3 size={16} /></button>
              <button onClick={() => onDeleteTask(task.id)} className="text-gray-400 hover:text-red-400"><Trash2 size={16} /></button>
            </div>

            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-mono text-pool-500 bg-pool-900 px-2 py-1 rounded">{task.code}</span>
              <div className="relative group/menu">
                <select
                  value={task.status}
                  onChange={(e) => onUpdateStatus(task.id, e.target.value as TaskStatus)}
                  className={`text-xs font-bold px-2 py-1 rounded border appearance-none cursor-pointer outline-none ${getStatusColor(task.status)}`}
                >
                  {Object.values(TaskStatus).map(s => (
                    <option key={s} value={s} className="bg-pool-900 text-white">{s}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <h3 className="text-lg font-semibold text-white mb-1 pr-8">{task.title}</h3>
            <p className="text-xs text-pool-400 mb-4 uppercase tracking-wider">{task.category}</p>

            <div className="space-y-2 mb-6">
              {task.subtasks.map((sub, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-gray-400">
                  <div className={`w-1.5 h-1.5 rounded-full ${task.status === TaskStatus.DONE ? 'bg-green-500' : 'bg-pool-600'}`}></div>
                  {sub}
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-pool-700 mt-auto">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <User size={14} />
                <span>{task.owner}</span>
              </div>
              <div className={`flex items-center gap-2 text-xs font-mono ${task.deadline && new Date() > new Date(2024, 10, 20) ? 'text-red-400' : 'text-gray-400'}`}>
                <Calendar size={14} />
                <span>{formatDate(task.deadline)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <TaskFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        taskToEdit={editingTask}
        onSave={handleSaveTask}
      />
    </div>
  );
};

export default TaskManager;
