import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import StrategicBlueprint from './components/StrategicBlueprint';
import KanbanBoard from './components/KanbanBoard';
import ArchiveRepository from './components/ArchiveRepository';
import IntelligenceHub from './components/IntelligenceHub';
import { Task, TaskStatus } from './types';
import { vectorStore } from './services/vectorStore';
import { TaskService } from './services/taskService';
import { Loader2, AlertCircle, RefreshCcw } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('production');
  
  // State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for custom delete confirmation modal
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // --- INITIALIZATION & REALTIME ---
  useEffect(() => {
    let subscription: any;

    const initSystem = async () => {
      try {
        setIsLoading(true);
        // 1. Initial Fetch
        const data = await TaskService.getAllTasks();
        setTasks(data);
        
        // 2. Setup Realtime Listener
        subscription = TaskService.subscribeToTasks((updatedTasks) => {
          setTasks(updatedTasks);
        });

      } catch (err: any) {
        console.error("Initialization Error:", err);
        // If env vars are missing, show helpful error
        if (err.message?.includes('supabaseUrl')) {
            setError("Supabase configuration missing. Check .env.local file.");
        } else {
            setError("Falha ao conectar com o servidor. Verifique sua conexão.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    initSystem();

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  // --- VECTOR STORE INDEXING HELPER ---
  const indexTask = (task: Task) => {
    const content = `
      Title: ${task.title}
      Code: ${task.code}
      Status: ${task.status}
      Owner: ${task.owner}
      Category: ${task.category}
      Demand Type: ${task.demandType}
      Briefing Idea: ${task.briefing.idea || ''}
      Briefing Copy: ${task.briefing.copy || ''}
      Subtasks: ${task.subtasks.join(', ')}
    `;

    vectorStore.upsertDocument({
      id: task.id,
      type: 'TASK',
      content: content.trim(),
      metadata: {
        title: task.title,
        originalId: task.id,
        category: 'MARKETING_OPS',
        status: task.status
      }
    });
  };

  // --- HANDLERS ---

  const handleAddTask = async (newTask: Task) => {
    try {
      // Optimistic update not strictly necessary with Realtime, but feels faster
      // setTasks(prev => [...prev, newTask]); 
      
      await TaskService.createTask(newTask);
      indexTask(newTask);
    } catch (e) {
      console.error("Create Error", e);
      alert("Erro ao salvar tarefa.");
    }
  };

  const handleEditTask = async (updatedTask: Task) => {
    try {
      await TaskService.updateTask(updatedTask);
      indexTask(updatedTask);
    } catch (e) {
       console.error("Update Error", e);
    }
  };

  const handleDeleteTask = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (deleteConfirmId) {
      try {
        await TaskService.deleteTask(deleteConfirmId);
        vectorStore.removeDocument(deleteConfirmId);
        setDeleteConfirmId(null);
      } catch (e) {
        console.error("Delete Error", e);
        alert("Erro ao excluir tarefa.");
      }
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmId(null);
  };

  const handleUpdateStatus = async (id: string, newStatus: TaskStatus) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      const updated = { ...task, status: newStatus };
      try {
         await TaskService.updateTask(updated);
         indexTask(updated);
      } catch (e) {
         console.error("Status Update Error", e);
      }
    }
  };

  const handleRestoreTask = (id: string) => {
    handleUpdateStatus(id, TaskStatus.TODO);
  };

  // --- RENDER ---

  const renderContent = () => {
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-pool-500">
                <Loader2 size={48} className="animate-spin mb-4" />
                <p className="font-mono text-sm">Synchronizing with Supabase...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-red-400">
                <AlertCircle size={48} className="mb-4" />
                <h3 className="text-xl font-bold">Connection Error</h3>
                <p className="mb-4">{error}</p>
                <button onClick={() => window.location.reload()} className="bg-pool-700 hover:bg-pool-600 px-4 py-2 rounded flex items-center gap-2 text-white">
                    <RefreshCcw size={16}/> Retry
                </button>
            </div>
        );
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard tasks={tasks} />;
      case 'blueprint':
        return (
          <StrategicBlueprint 
            tasks={tasks} 
            onAddTask={handleAddTask}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            onUpdateStatus={handleUpdateStatus} 
          />
        );
      case 'production':
        return (
          <KanbanBoard 
            tasks={tasks} 
            onUpdateStatus={handleUpdateStatus}
            onAddTask={handleAddTask}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            deleteConfirmId={deleteConfirmId}
            onConfirmDelete={confirmDelete}
            onCancelDelete={cancelDelete}
          />
        );
      case 'archive':
        return <ArchiveRepository tasks={tasks} onDeleteTask={handleDeleteTask} onRestoreTask={handleRestoreTask} />;
      case 'intelligence':
        return <IntelligenceHub />;
      default:
        return <KanbanBoard 
            tasks={tasks} 
            onUpdateStatus={handleUpdateStatus}
            onAddTask={handleAddTask}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            deleteConfirmId={deleteConfirmId}
            onConfirmDelete={confirmDelete}
            onCancelDelete={cancelDelete}
          />;
    }
  };

  return (
    <div className="flex h-screen bg-pool-900 text-slate-200 overflow-hidden font-sans selection:bg-pool-500 selection:text-white">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 ml-64 h-full relative">
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-pool-800/20 to-transparent pointer-events-none z-0"></div>
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-pool-500/10 rounded-full blur-3xl pointer-events-none z-0"></div>

        <div className="relative z-1 h-full">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;