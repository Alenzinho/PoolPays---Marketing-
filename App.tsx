import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import StrategicBlueprint from './components/StrategicBlueprint';
import KanbanBoard from './components/KanbanBoard';
import ArchiveRepository from './components/ArchiveRepository';
import IntelligenceHub from './components/IntelligenceHub';
import { INITIAL_TASKS } from './data';
import { Task, TaskStatus } from './types';
import { vectorStore } from './services/vectorStore';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('production');
  
  // Hydrate tasks from local storage
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('poolpays-tasks');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            // Fix Date objects recreation from strings
            return parsed.map((t: any) => ({
                ...t,
                deadline: t.deadline ? new Date(t.deadline) : null
            }));
        } catch (e) {
            console.error("Failed to parse tasks", e);
            return INITIAL_TASKS;
        }
    }
    return INITIAL_TASKS;
  });

  // State for custom delete confirmation modal
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('poolpays-tasks', JSON.stringify(tasks));
  }, [tasks]);

  // --- VECTOR STORE INDEXING ---
  // Helper to feed the AI Brain automatically when tasks are updated
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
        category: 'MARKETING_OPS', // Tasks generally fall under Ops
        status: task.status
      }
    });

    // Index Attachments if any (Simulated text extraction)
    if (task.attachments) {
        task.attachments.forEach(att => {
            if (att.type.includes('text') || att.type.includes('markdown') || att.content.length < 5000) {
                vectorStore.upsertDocument({
                    id: att.id,
                    type: 'FILE',
                    content: att.content, // In a real app, this would be OCR or Text Extraction result
                    metadata: {
                        title: att.name,
                        originalId: task.id,
                        category: 'GENERAL'
                    }
                });
            }
        });
    }
  };

  const handleAddTask = (newTask: Task) => {
    setTasks(prev => [...prev, newTask]);
    indexTask(newTask); // Feed the brain
  };

  const handleEditTask = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    indexTask(updatedTask); // Feed the brain
  };

  // Step 1: User clicks delete -> Opens Modal (Sets ID)
  const handleDeleteTask = (id: string) => {
    console.log("App.tsx: Requesting delete confirmation for task", id);
    setDeleteConfirmId(id);
  };

  // Step 2: User confirms in Modal -> Actually deletes
  const confirmDelete = () => {
    if (deleteConfirmId) {
      console.log("App.tsx: Confirmed delete for task", deleteConfirmId);
      setTasks(prev => prev.filter(t => t.id !== deleteConfirmId));
      vectorStore.removeDocument(deleteConfirmId); // Remove from brain
      setDeleteConfirmId(null); // Close modal
    }
  };

  // Step 2: User cancels -> Close Modal
  const cancelDelete = () => {
    console.log("App.tsx: Cancelled delete");
    setDeleteConfirmId(null);
  };

  const handleUpdateStatus = (id: string, newStatus: TaskStatus) => {
    setTasks(prev => prev.map(task => {
      if (task.id === id) {
        const updated = { ...task, status: newStatus };
        // If archived, we might want to keep it in brain or move it to a different index
        // For now, we update it so the AI knows it's done.
        indexTask(updated); 
        return updated;
      }
      return task;
    }));
  };

  const handleRestoreTask = (id: string) => {
    handleUpdateStatus(id, TaskStatus.TODO);
  };

  const renderContent = () => {
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
            // Pass Confirmation Props
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