import React, { useState } from 'react';
import { Task, TaskStatus } from '../types';
import { Clock, AlertTriangle, CheckCircle2, Circle, ArrowRight, ArrowLeft, User, Calendar, Plus, Edit3, Trash2, Sparkles, Layers, Video, Printer, FileText, Paperclip } from 'lucide-react';
import TaskFormModal from './TaskFormModal';

interface KanbanBoardProps {
  tasks: Task[];
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  onAddTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  // Confirmation Modal Props
  deleteConfirmId?: string | null;
  onConfirmDelete?: () => void;
  onCancelDelete?: () => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
  tasks, 
  onUpdateStatus, 
  onAddTask, 
  onEditTask, 
  onDeleteTask,
  deleteConfirmId,
  onConfirmDelete,
  onCancelDelete
}) => {
  const [filterOwner, setFilterOwner] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const columns = [
    { id: TaskStatus.TODO, label: 'A Fazer (To Do)', icon: <Circle size={18} className="text-gray-400" />, color: 'border-gray-600' },
    { id: TaskStatus.IN_PROGRESS, label: 'Em Produção', icon: <Clock size={18} className="text-yellow-400" />, color: 'border-yellow-500/50' },
    { id: TaskStatus.BLOCKED, label: 'Bloqueado / Review', icon: <AlertTriangle size={18} className="text-red-400" />, color: 'border-red-500/50' },
    { id: TaskStatus.DONE, label: 'Finalizado (Done)', icon: <CheckCircle2 size={18} className="text-green-400" />, color: 'border-green-500/50' },
  ];

  const activeTasks = tasks.filter(t => t.status !== TaskStatus.BACKLOG && t.status !== TaskStatus.ARCHIVED);
  const owners = ['All', ...Array.from(new Set(activeTasks.map(t => t.owner)))];

  const filteredTasks = filterOwner === 'All' 
    ? activeTasks 
    : activeTasks.filter(t => t.owner === filterOwner);

  const getNextStatus = (current: TaskStatus): TaskStatus | null => {
    if (current === TaskStatus.TODO) return TaskStatus.IN_PROGRESS;
    if (current === TaskStatus.IN_PROGRESS) return TaskStatus.DONE;
    return null;
  };

  const getPrevStatus = (current: TaskStatus): TaskStatus | null => {
    if (current === TaskStatus.DONE) return TaskStatus.IN_PROGRESS;
    if (current === TaskStatus.IN_PROGRESS) return TaskStatus.TODO;
    if (current === TaskStatus.BLOCKED) return TaskStatus.IN_PROGRESS;
    return null;
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

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'CREATIVE': return <Sparkles size={14} className="text-purple-400"/>;
      case 'CAROUSEL': return <Layers size={14} className="text-blue-400"/>;
      case 'REELS': return <Video size={14} className="text-pink-400"/>;
      case 'ANIMATION': return <Video size={14} className="text-orange-400"/>;
      case 'PRINT': return <Printer size={14} className="text-green-400"/>;
      default: return <FileText size={14} className="text-gray-400"/>;
    }
  };

  // Helper to safely format date
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return 'Sem data';
    try {
      return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    } catch (e) {
      return 'Data inválida';
    }
  };

  return (
    <div className="flex flex-col h-full p-8 overflow-hidden relative">
      <header className="flex justify-between items-end mb-6 flex-shrink-0">
        <div>
          <h2 className="text-3xl font-bold text-white">Active Production</h2>
          <p className="text-gray-400 mt-1">Fluxo de produção com Frameworks de Briefing</p>
        </div>
        
        <div className="flex items-center gap-3">
           <button 
            onClick={openNewTaskModal}
            className="bg-pool-500 hover:bg-pool-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold transition-all shadow-lg shadow-pool-500/20 text-sm"
          >
            <Plus size={16} />
            Nova Demanda
          </button>

          <div className="relative">
            <select 
              value={filterOwner}
              onChange={(e) => setFilterOwner(e.target.value)}
              className="bg-pool-800 border border-pool-700 text-white text-sm rounded-lg px-4 py-2 pr-8 appearance-none focus:outline-none focus:border-pool-500 min-w-[180px]"
            >
              {owners.map(o => <option key={o} value={o}>{o === 'All' ? 'Todos os Owners' : o}</option>)}
            </select>
            <User className="absolute right-3 top-2.5 text-gray-500 pointer-events-none" size={14} />
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <div className="flex gap-6 h-full min-w-[1024px]">
          {columns.map(col => {
            const colTasks = filteredTasks.filter(t => t.status === col.id);
            
            return (
              <div key={col.id} className="flex-1 flex flex-col bg-pool-950/30 rounded-xl border border-pool-800 min-w-[300px]">
                <div className={`p-4 border-b border-pool-800 flex justify-between items-center bg-pool-800/50 rounded-t-xl ${col.id === TaskStatus.BLOCKED ? 'bg-red-900/10' : ''}`}>
                  <div className="flex items-center gap-2 font-semibold text-slate-200">
                    {col.icon}
                    <span>{col.label}</span>
                  </div>
                  <span className="text-xs font-mono bg-pool-900 px-2 py-1 rounded text-gray-400">
                    {colTasks.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                  {colTasks.map(task => (
                    <div key={task.id} className={`bg-pool-800 p-4 rounded-lg border shadow-lg hover:border-pool-500 transition-all group relative ${col.color}`}>
                      
                      {/* ACTION BUTTONS - ALWAYS VISIBLE NOW */}
                      <div className="absolute top-2 right-2 flex gap-1 z-50 bg-pool-800/90 rounded backdrop-blur-sm p-1 shadow-sm border border-pool-700">
                        <button 
                          type="button"
                          onClick={(e) => { 
                            e.preventDefault();
                            e.stopPropagation(); 
                            openEditModal(task); 
                          }} 
                          className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-pool-700 transition-colors" 
                          title="Editar / Ver Briefing"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button 
                          type="button"
                          onClick={(e) => { 
                            e.preventDefault();
                            e.stopPropagation(); 
                            console.log('Kanban: Requesting delete for task:', task.id);
                            onDeleteTask(task.id); 
                          }} 
                          className="p-1.5 text-gray-400 hover:text-red-400 rounded hover:bg-pool-700 transition-colors" 
                          title="Excluir"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="flex justify-between items-start mb-2 pr-16">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-pool-300 bg-pool-900/80 px-1.5 py-0.5 rounded border border-pool-700 uppercase">
                           {getTypeIcon(task.demandType)}
                           {task.demandType}
                        </div>
                        {col.id === TaskStatus.BLOCKED && (
                           <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded font-bold">STOP</span>
                        )}
                      </div>

                      <h4 className="text-sm font-medium text-white mb-3 leading-snug pr-2">{task.title}</h4>

                      {/* Attachments Indicator */}
                      {task.attachments && task.attachments.length > 0 && (
                        <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
                            {task.attachments.map((att, i) => (
                                att.type.startsWith('image/') ? (
                                    <img key={i} src={att.content} alt="thumbnail" className="w-8 h-8 rounded object-cover border border-pool-600" />
                                ) : (
                                    <div key={i} className="w-8 h-8 rounded bg-pool-700 flex items-center justify-center border border-pool-600">
                                        <Paperclip size={12} className="text-gray-400"/>
                                    </div>
                                )
                            ))}
                        </div>
                      )}

                      {/* Briefing Hint */}
                      {task.briefing?.idea && (
                        <p className="text-xs text-gray-400 mb-2 line-clamp-2 italic bg-pool-900/50 p-2 rounded border border-pool-800/50">
                          "{task.briefing.idea}"
                        </p>
                      )}

                      <div className="flex justify-between items-center mt-auto pt-3 border-t border-pool-700/50">
                        <div className="flex items-center gap-2">
                           <div className="w-5 h-5 rounded-full bg-gradient-to-br from-pool-500 to-indigo-600 flex items-center justify-center text-[9px] font-bold text-white" title={task.owner}>
                             {task.owner.charAt(0)}
                           </div>
                           <div className="flex items-center gap-1 text-[10px] text-gray-400">
                             <Calendar size={10} />
                             {formatDate(task.deadline)}
                           </div>
                        </div>
                        
                        <div className="flex gap-1">
                           {getPrevStatus(task.status) && (
                             <button onClick={() => onUpdateStatus(task.id, getPrevStatus(task.status)!)} className="p-1 hover:bg-pool-700 rounded text-gray-400 hover:text-white"><ArrowLeft size={14} /></button>
                           )}
                           
                           {task.status !== TaskStatus.BLOCKED ? (
                             <button onClick={() => onUpdateStatus(task.id, TaskStatus.BLOCKED)} className="p-1 hover:bg-red-900/50 rounded text-gray-400 hover:text-red-400"><AlertTriangle size={14} /></button>
                           ) : (
                              <button onClick={() => onUpdateStatus(task.id, TaskStatus.IN_PROGRESS)} className="p-1 hover:bg-green-900/50 rounded text-gray-400 hover:text-green-400"><CheckCircle2 size={14} /></button>
                           )}

                           {getNextStatus(task.status) && (
                             <button onClick={() => onUpdateStatus(task.id, getNextStatus(task.status)!)} className="p-1 hover:bg-pool-700 rounded text-gray-400 hover:text-white"><ArrowRight size={14} /></button>
                           )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <TaskFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        taskToEdit={editingTask}
        onSave={handleSaveTask}
      />

      {/* CONFIRMATION DELETE MODAL */}
      {deleteConfirmId && onConfirmDelete && onCancelDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200">
          <div className="bg-pool-800 border border-pool-700 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl relative">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0 border border-red-500/20">
                <AlertTriangle size={24} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Excluir Demanda</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Esta ação não pode ser desfeita. A demanda será permanentemente removida do painel de produção e da memória da IA.
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={onCancelDelete}
                className="px-4 py-2 rounded-lg bg-pool-700 hover:bg-pool-600 text-white font-medium transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={onConfirmDelete}
                className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors flex items-center gap-2 text-sm"
              >
                <Trash2 size={16} />
                Excluir Permanentemente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KanbanBoard;