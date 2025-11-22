
import React, { useState, useEffect, useRef } from 'react';
import { Task, TaskStatus, FileAttachment } from '../types';
import { X, Save, FileText, Image, Video, Layers, Printer, Sparkles, Upload, Trash2, Eye } from 'lucide-react';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit: Task | null;
  onSave: (task: Task) => void;
}

const TaskFormModal: React.FC<TaskFormModalProps> = ({ isOpen, onClose, taskToEdit, onSave }) => {
  const [formData, setFormData] = useState<Partial<Task>>({
    title: '',
    code: '',
    owner: '',
    deadline: null,
    week: 'Semana 1',
    category: 'Conteúdo',
    subtasks: [],
    status: TaskStatus.TODO,
    demandType: 'GENERIC',
    briefing: {},
    attachments: []
  });
  const [subtasksInput, setSubtasksInput] = useState('');
  const [dateInput, setDateInput] = useState(''); // String for input[type=date]
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (taskToEdit) {
        setFormData(taskToEdit);
        setSubtasksInput(taskToEdit.subtasks.join('\n'));
        // Format Date for input
        if (taskToEdit.deadline) {
            try {
                setDateInput(new Date(taskToEdit.deadline).toISOString().split('T')[0]);
            } catch(e) { setDateInput(''); }
        } else {
            setDateInput('');
        }
      } else {
        setFormData({
          title: '',
          code: '',
          owner: '',
          deadline: null,
          week: 'Semana 1',
          category: 'Conteúdo',
          subtasks: [],
          status: TaskStatus.TODO,
          demandType: 'GENERIC',
          briefing: {},
          attachments: []
        });
        setSubtasksInput('');
        setDateInput('');
      }
    }
  }, [isOpen, taskToEdit]);

  const handleDateChange = (val: string) => {
      setDateInput(val);
      setFormData(prev => ({ ...prev, deadline: val ? new Date(val) : null }));
  };

  const handleSave = () => {
    if (!formData.title || !formData.owner) return alert('Preencha Título e Responsável');

    const subtasksArray = subtasksInput.split('\n').filter(line => line.trim() !== '');
    
    const taskToSave: Task = {
      id: taskToEdit ? taskToEdit.id : Date.now().toString(),
      code: formData.code || 'N/A',
      title: formData.title || '',
      owner: formData.owner || '',
      deadline: formData.deadline || null,
      week: formData.week || 'Semana 1',
      category: formData.category || 'Geral',
      status: formData.status || TaskStatus.TODO,
      subtasks: subtasksArray,
      demandType: formData.demandType || 'GENERIC',
      briefing: formData.briefing || {},
      attachments: formData.attachments || []
    };

    onSave(taskToSave);
    onClose();
  };

  const updateBriefing = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      briefing: {
        ...prev.briefing,
        [field]: value
      }
    }));
  };

  // --- FILE UPLOAD LOGIC ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          processFiles(Array.from(e.target.files));
      }
  };

  const processFiles = (files: File[]) => {
      files.forEach(file => {
          const reader = new FileReader();
          reader.onload = (event) => {
              if (event.target?.result) {
                  const newAttachment: FileAttachment = {
                      id: Date.now().toString() + Math.random().toString(),
                      name: file.name,
                      type: file.type,
                      size: file.size,
                      content: event.target.result as string
                  };
                  setFormData(prev => ({
                      ...prev,
                      attachments: [...(prev.attachments || []), newAttachment]
                  }));
              }
          };
          reader.readAsDataURL(file);
      });
  };

  const removeAttachment = (id: string) => {
      setFormData(prev => ({
          ...prev,
          attachments: prev.attachments?.filter(a => a.id !== id)
      }));
  };

  const downloadAttachment = (att: FileAttachment) => {
      const link = document.createElement('a');
      link.href = att.content;
      link.download = att.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  if (!isOpen) return null;

  // Render specific briefing fields based on type
  const renderBriefingFields = () => {
    switch (formData.demandType) {
      case 'CREATIVE':
        return (
          <div className="space-y-4 bg-pool-800/50 p-4 rounded-xl border border-pool-700">
            <h4 className="text-pool-gold font-bold flex items-center gap-2"><Sparkles size={16}/> Briefing Criativo</h4>
            <Input label="Ideia / Conceito" value={formData.briefing?.idea} onChange={v => updateBriefing('idea', v)} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Formato" value={formData.briefing?.format} onChange={v => updateBriefing('format', v)} placeholder="Ex: 1080x1080" />
              <Input label="Referência (Link)" value={formData.briefing?.reference} onChange={v => updateBriefing('reference', v)} />
            </div>
            <TextArea label="Texto / Copy" value={formData.briefing?.copy} onChange={v => updateBriefing('copy', v)} rows={4} />
          </div>
        );
      case 'CAROUSEL':
        return (
          <div className="space-y-4 bg-pool-800/50 p-4 rounded-xl border border-pool-700">
            <h4 className="text-pool-gold font-bold flex items-center gap-2"><Layers size={16}/> Briefing Carrossel</h4>
            <Input label="Ideia Central" value={formData.briefing?.idea} onChange={v => updateBriefing('idea', v)} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Formato" value={formData.briefing?.format} onChange={v => updateBriefing('format', v)} placeholder="Ex: 4:5 (1080x1350)" />
              <Input label="Referência" value={formData.briefing?.reference} onChange={v => updateBriefing('reference', v)} />
            </div>
            <TextArea label="Texto (Lâmina 1, 2, 3...)" value={formData.briefing?.copy} onChange={v => updateBriefing('copy', v)} rows={6} placeholder="[Lâmina 1] ... [Lâmina 2] ..." />
          </div>
        );
      case 'REELS':
        return (
          <div className="space-y-4 bg-pool-800/50 p-4 rounded-xl border border-pool-700">
            <h4 className="text-pool-gold font-bold flex items-center gap-2"><Video size={16}/> Briefing Reels / TikTok</h4>
            <Input label="Ideia / Roteiro Macro" value={formData.briefing?.idea} onChange={v => updateBriefing('idea', v)} />
            <div className="grid grid-cols-3 gap-4">
              <Input label="Formato" value={formData.briefing?.format} onChange={v => updateBriefing('format', v)} placeholder="9:16" />
              <Input label="Duração Estimada" value={formData.briefing?.duration} onChange={v => updateBriefing('duration', v)} placeholder="15s, 30s..." />
              <Input label="Trilha Sonora" value={formData.briefing?.soundtrack} onChange={v => updateBriefing('soundtrack', v)} />
            </div>
            <Input label="Referência" value={formData.briefing?.reference} onChange={v => updateBriefing('reference', v)} />
            <TextArea label="Texto / Legenda / Locução" value={formData.briefing?.copy} onChange={v => updateBriefing('copy', v)} rows={4} />
          </div>
        );
      case 'ANIMATION':
        return (
          <div className="space-y-4 bg-pool-800/50 p-4 rounded-xl border border-pool-700">
            <h4 className="text-pool-gold font-bold flex items-center gap-2"><Video size={16}/> Briefing Animação / Motion</h4>
            <Input label="Link do PSD (Obrigatório)" value={formData.briefing?.psdLink} onChange={v => updateBriefing('psdLink', v)} placeholder="Link do arquivo aberto" />
            <Input label="Ideia de Movimento" value={formData.briefing?.idea} onChange={v => updateBriefing('idea', v)} />
            <div className="grid grid-cols-3 gap-4">
              <Input label="Formato" value={formData.briefing?.format} onChange={v => updateBriefing('format', v)} />
              <Input label="Duração" value={formData.briefing?.duration} onChange={v => updateBriefing('duration', v)} />
              <Input label="Trilha Sonora" value={formData.briefing?.soundtrack} onChange={v => updateBriefing('soundtrack', v)} />
            </div>
            <Input label="Referência" value={formData.briefing?.reference} onChange={v => updateBriefing('reference', v)} />
            <TextArea label="Texto de Apoio" value={formData.briefing?.copy} onChange={v => updateBriefing('copy', v)} rows={3} />
          </div>
        );
      case 'PRINT':
        return (
          <div className="space-y-4 bg-pool-800/50 p-4 rounded-xl border border-pool-700">
            <h4 className="text-pool-gold font-bold flex items-center gap-2"><Printer size={16}/> Briefing Impresso / Offline</h4>
            <Input label="Ideia / Objetivo" value={formData.briefing?.idea} onChange={v => updateBriefing('idea', v)} />
            <div className="grid grid-cols-2 gap-4">
               <Input label="Tamanho / Dimensões" value={formData.briefing?.size} onChange={v => updateBriefing('size', v)} placeholder="A4, Outdoor, Banner..." />
               <Input label="Referência" value={formData.briefing?.reference} onChange={v => updateBriefing('reference', v)} />
            </div>
            <Input label="Link Arquivo Base (Logo, etc)" value={formData.briefing?.fileLink} onChange={v => updateBriefing('fileLink', v)} />
            <TextArea label="Texto Obrigatório na Peça" value={formData.briefing?.copy} onChange={v => updateBriefing('copy', v)} rows={4} />
          </div>
        );
      default: // GENERIC
        return (
          <div className="space-y-4">
             <TextArea label="Descrição da Demanda" value={formData.briefing?.idea} onChange={v => updateBriefing('idea', v)} rows={4} placeholder="Descreva o que precisa ser feito..." />
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-pool-900 border border-pool-700 rounded-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto shadow-2xl flex flex-col">
        <div className="p-6 border-b border-pool-700 flex justify-between items-center sticky top-0 bg-pool-900 z-10">
          <div>
            <h3 className="text-xl font-bold text-white">
              {taskToEdit ? 'Editar Demanda' : 'Nova Demanda de Produção'}
            </h3>
            <p className="text-xs text-gray-400">Preencha o framework para iniciar a produção</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X /></button>
        </div>
        
        <div className="p-8 space-y-6 flex-1 overflow-y-auto">
          
          {/* Type Selector */}
          <div className="bg-pool-800 p-4 rounded-lg border border-pool-600">
            <label className="block text-sm font-bold text-white mb-3 uppercase tracking-wider">Qual a característica da demanda?</label>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
               <TypeButton type="GENERIC" current={formData.demandType} icon={<FileText size={18}/>} label="Tarefa" onClick={(t) => setFormData({...formData, demandType: t})} />
               <TypeButton type="CREATIVE" current={formData.demandType} icon={<Sparkles size={18}/>} label="Design" onClick={(t) => setFormData({...formData, demandType: t})} />
               <TypeButton type="CAROUSEL" current={formData.demandType} icon={<Layers size={18}/>} label="Carrossel" onClick={(t) => setFormData({...formData, demandType: t})} />
               <TypeButton type="REELS" current={formData.demandType} icon={<Video size={18}/>} label="Reels" onClick={(t) => setFormData({...formData, demandType: t})} />
               <TypeButton type="ANIMATION" current={formData.demandType} icon={<Video size={18}/>} label="Motion" onClick={(t) => setFormData({...formData, demandType: t})} />
               <TypeButton type="PRINT" current={formData.demandType} icon={<Printer size={18}/>} label="Print" onClick={(t) => setFormData({...formData, demandType: t})} />
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Código (ID)</label>
              <input 
                type="text" 
                value={formData.code} 
                onChange={e => setFormData({...formData, code: e.target.value})}
                className="w-full bg-pool-800 border border-pool-700 rounded p-2 text-white focus:border-pool-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Categoria Macro</label>
              <select 
                value={formData.category} 
                onChange={e => setFormData({...formData, category: e.target.value})}
                className="w-full bg-pool-800 border border-pool-700 rounded p-2 text-white focus:border-pool-500 outline-none"
              >
                <option value="Conteúdo">Conteúdo</option>
                <option value="Marketing">Marketing</option>
                <option value="Design">Design</option>
                <option value="Tech">Tech</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Título da Demanda</label>
            <input 
              type="text" 
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})}
              className="w-full bg-pool-800 border border-pool-700 rounded p-2 text-white text-lg font-semibold focus:border-pool-500 outline-none"
              placeholder="Ex: Post Carrossel sobre Yield"
            />
          </div>

          {/* Dynamic Framework Fields */}
          {renderBriefingFields()}
          
          {/* ATTACHMENTS ZONE */}
          <div className="border-t border-pool-700 pt-4">
             <label className="block text-xs text-gray-400 mb-2 font-bold uppercase tracking-wider">Arquivos / Referências</label>
             
             <div 
               className="border-2 border-dashed border-pool-600 bg-pool-800/30 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-pool-800 hover:border-pool-400 transition-all mb-4"
               onClick={() => fileInputRef.current?.click()}
             >
                 <Upload size={24} className="text-gray-400 mb-2" />
                 <p className="text-sm text-gray-300 font-medium">Clique para fazer upload</p>
                 <p className="text-xs text-gray-500">Suporta Imagens, PDF, Docs (Armazenamento Local)</p>
                 <input 
                    type="file" 
                    multiple 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleFileSelect} 
                 />
             </div>

             {formData.attachments && formData.attachments.length > 0 && (
                 <div className="space-y-2">
                     {formData.attachments.map(att => (
                         <div key={att.id} className="flex items-center justify-between bg-pool-800 p-3 rounded border border-pool-700">
                             <div className="flex items-center gap-3">
                                 {att.type.startsWith('image/') ? (
                                     <img src={att.content} alt={att.name} className="w-10 h-10 object-cover rounded" />
                                 ) : (
                                     <div className="w-10 h-10 bg-pool-700 rounded flex items-center justify-center"><FileText size={20}/></div>
                                 )}
                                 <div>
                                     <p className="text-sm font-bold text-gray-200 truncate max-w-[200px]">{att.name}</p>
                                     <p className="text-xs text-gray-500">{(att.size / 1024).toFixed(1)} KB</p>
                                 </div>
                             </div>
                             <div className="flex gap-2">
                                 <button onClick={() => downloadAttachment(att)} className="p-2 bg-pool-900 hover:bg-pool-600 rounded text-gray-400 hover:text-white transition-colors"><Eye size={16}/></button>
                                 <button onClick={() => removeAttachment(att.id)} className="p-2 bg-pool-900 hover:bg-red-900/50 rounded text-gray-400 hover:text-red-400 transition-colors"><Trash2 size={16}/></button>
                             </div>
                         </div>
                     ))}
                 </div>
             )}
          </div>

          {/* Logistics */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-pool-800">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Responsável</label>
              <input 
                type="text" 
                value={formData.owner} 
                onChange={e => setFormData({...formData, owner: e.target.value})}
                className="w-full bg-pool-800 border border-pool-700 rounded p-2 text-white focus:border-pool-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Data de Entrega</label>
              <input 
                type="date" 
                value={dateInput} 
                onChange={e => handleDateChange(e.target.value)}
                className="w-full bg-pool-800 border border-pool-700 rounded p-2 text-white focus:border-pool-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Semana</label>
              <select 
                value={formData.week} 
                onChange={e => setFormData({...formData, week: e.target.value})}
                className="w-full bg-pool-800 border border-pool-700 rounded p-2 text-white focus:border-pool-500 outline-none"
              >
                <option>Semana 1</option>
                <option>Semana 2</option>
                <option>Semana 3</option>
                <option>Semana 4</option>
                <option>Semana 5+</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Checklist de Produção (Subtarefas)</label>
            <textarea 
              value={subtasksInput} 
              onChange={e => setSubtasksInput(e.target.value)}
              className="w-full bg-pool-800 border border-pool-700 rounded p-2 text-white h-24 focus:border-pool-500 outline-none font-mono text-sm"
              placeholder="- Validar copy&#10;- Exportar assets"
            />
          </div>
        </div>

        <div className="p-6 border-t border-pool-700 flex justify-end gap-3 bg-pool-900 rounded-b-2xl sticky bottom-0 z-10">
          <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancelar</button>
          <button onClick={handleSave} className="px-6 py-2 bg-pool-500 hover:bg-pool-600 text-white rounded-lg font-bold flex items-center gap-2 transition-colors">
            <Save size={18} />
            Salvar Demanda
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const TypeButton = ({ type, current, icon, label, onClick }: any) => (
  <button 
    onClick={() => onClick(type)}
    className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
      current === type 
        ? 'bg-pool-500 border-pool-400 text-white shadow-lg' 
        : 'bg-pool-900 border-pool-700 text-gray-400 hover:bg-pool-800 hover:text-white'
    }`}
  >
    {icon}
    <span className="text-xs font-bold mt-2">{label}</span>
  </button>
);

const Input = ({ label, value, onChange, placeholder }: any) => (
  <div>
    <label className="block text-xs text-gray-300 mb-1 font-bold">{label}</label>
    <input 
      type="text" 
      value={value || ''} 
      onChange={e => onChange(e.target.value)}
      className="w-full bg-pool-900 border border-pool-600 rounded p-2 text-white focus:border-pool-400 outline-none text-sm"
      placeholder={placeholder}
    />
  </div>
);

const TextArea = ({ label, value, onChange, rows, placeholder }: any) => (
  <div>
    <label className="block text-xs text-gray-300 mb-1 font-bold">{label}</label>
    <textarea 
      value={value || ''} 
      onChange={e => onChange(e.target.value)}
      rows={rows}
      className="w-full bg-pool-900 border border-pool-600 rounded p-2 text-white focus:border-pool-400 outline-none text-sm font-mono"
      placeholder={placeholder}
    />
  </div>
);

export default TaskFormModal;
