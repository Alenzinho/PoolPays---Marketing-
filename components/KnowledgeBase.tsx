
import React, { useState, useRef } from 'react';
import { Database, Plus, FileText, Trash2, Upload, Shield, TrendingUp, Cpu, Layers, CheckCircle2, AlertCircle, FileCode, X } from 'lucide-react';
import { VectorDocument, KnowledgeCategory } from '../types';
import { vectorStore } from '../services/vectorStore';

export default function KnowledgeBase() {
  const [activeCategory, setActiveCategory] = useState<KnowledgeCategory | 'ALL'>('ALL');
  const [documents, setDocuments] = useState<VectorDocument[]>(() => vectorStore.getDocumentsByType('ALL'));
  const [isAdding, setIsAdding] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<KnowledgeCategory>('GENERAL');
  const [ingestStatus, setIngestStatus] = useState<'IDLE' | 'READING' | 'VECTORIZING' | 'DONE'>('IDLE');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories: { id: KnowledgeCategory | 'ALL', label: string, icon: any, color: string }[] = [
    { id: 'ALL', label: 'All Neural Memory', icon: <Database size={16}/>, color: 'text-gray-400' },
    { id: 'CORE_IDENTITY', label: 'Core Identity', icon: <Shield size={16}/>, color: 'text-yellow-400' },
    { id: 'TECH_DOCS', label: 'Tech Docs', icon: <Cpu size={16}/>, color: 'text-purple-400' },
    { id: 'MARKETING_OPS', label: 'Marketing Ops', icon: <TrendingUp size={16}/>, color: 'text-green-400' },
  ];

  const refreshDocs = () => {
    setDocuments(vectorStore.getDocumentsByType('ALL'));
  };

  const handleAdd = async () => {
    if (!title || !content) return;
    setIngestStatus('VECTORIZING');
    
    // Simulate network delay for "Thinking" feel
    await new Promise(r => setTimeout(r, 800));

    await vectorStore.upsertDocument({
      id: Date.now().toString(),
      type: 'KNOWLEDGE',
      content,
      metadata: {
        title,
        originalId: 'manual',
        category: category
      }
    });
    
    setIngestStatus('DONE');
    setTimeout(() => {
        setTitle('');
        setContent('');
        setIsAdding(false);
        setIngestStatus('IDLE');
        refreshDocs();
    }, 500);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this memory node? The AI will forget this information.')) {
      vectorStore.removeDocument(id);
      refreshDocs();
    }
  };

  // File Ingestion Logic
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIngestStatus('READING');
    
    // Auto-fill title
    setTitle(file.name);

    try {
        const text = await file.text();
        setContent(text);
        
        // Auto-detect category based on extension/name (heuristic)
        if (file.name.toLowerCase().includes('brand') || file.name.toLowerCase().includes('manifesto')) {
            setCategory('CORE_IDENTITY');
        } else if (file.name.endsWith('.md') || file.name.endsWith('.json') || file.name.toLowerCase().includes('tech')) {
            setCategory('TECH_DOCS');
        } else if (file.name.toLowerCase().includes('post') || file.name.toLowerCase().includes('brief')) {
            setCategory('MARKETING_OPS');
        }

        setIngestStatus('IDLE');
    } catch (error) {
        console.error("Error reading file", error);
        setIngestStatus('IDLE');
        alert("Could not read text from file. Ensure it is a text-based format (TXT, MD, CSV, JSON).");
    }
  };

  const filteredDocs = activeCategory === 'ALL' 
    ? documents 
    : documents.filter(d => d.metadata.category === activeCategory);

  return (
    <div className="p-8 h-full flex flex-col animate-in fade-in">
      <header className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <Database className="text-pool-gold" />
            Knowledge Base
          </h2>
          <p className="text-gray-400 mt-1">Gestão de Memória Vetorial (Input Module)</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-pool-500 hover:bg-pool-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold transition-all shadow-lg shadow-pool-500/20"
        >
          <Plus size={18} />
          Ingest Data
        </button>
      </header>

      <div className="flex gap-6 h-full overflow-hidden">
        {/* Neural Folders Sidebar */}
        <div className="w-64 space-y-2 flex-shrink-0">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-2">Neural Folders</div>
            {categories.map(cat => (
                <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-all ${
                        activeCategory === cat.id 
                        ? 'bg-pool-800 border-pool-500 text-white shadow-lg' 
                        : 'bg-pool-900/50 border-pool-800 text-gray-400 hover:bg-pool-800'
                    }`}
                >
                    <span className={cat.color}>{cat.icon}</span>
                    <span className="font-medium text-sm">{cat.label}</span>
                </button>
            ))}

            <div className="mt-8 p-4 bg-pool-900 rounded-xl border border-pool-800">
                <div className="flex items-center gap-2 mb-2 text-gray-400 text-xs font-bold uppercase">
                    <ActivityIndicator />
                    Vector Engine
                </div>
                <div className="text-2xl font-bold text-white">{documents.length}</div>
                <div className="text-xs text-gray-500">Chunks Indexados</div>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-pool-800/30 border border-pool-700 rounded-xl overflow-hidden flex flex-col relative">
            
            {isAdding && (
                <div className="absolute inset-0 bg-pool-950/90 backdrop-blur-sm z-20 p-8 flex items-center justify-center animate-in fade-in">
                    <div className="bg-pool-900 border border-pool-600 rounded-xl p-6 w-full max-w-2xl shadow-2xl relative max-h-full overflow-y-auto">
                         <button onClick={() => setIsAdding(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>

                        <h3 className="text-white font-bold mb-6 flex items-center gap-2 text-lg border-b border-pool-800 pb-4">
                            <Upload size={20} className="text-pool-gold"/> 
                            Ingest New Knowledge
                        </h3>
                        
                        <div className="space-y-5">
                            {/* Drag & Drop Zone */}
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-pool-600 bg-pool-800/50 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-pool-800 hover:border-pool-400 transition-all group"
                            >
                                <FileCode size={32} className="text-gray-500 group-hover:text-pool-400 mb-2 transition-colors"/>
                                <p className="text-sm text-white font-bold">Clique para Upload de Arquivo</p>
                                <p className="text-xs text-gray-500 mb-2">Suporta .txt, .md, .json, .csv (Extração automática de texto)</p>
                                <input 
                                    type="file" 
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept=".txt,.md,.json,.csv,.log"
                                    onChange={handleFileSelect}
                                />
                                {ingestStatus === 'READING' && <span className="text-xs text-yellow-400 animate-pulse">Lendo arquivo...</span>}
                            </div>

                            {/* Category Selector */}
                            <div>
                                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-2">Target Neural Folder</label>
                                <div className="flex gap-2 flex-wrap">
                                    {categories.filter(c => c.id !== 'ALL').map(c => (
                                        <button 
                                            key={c.id}
                                            onClick={() => setCategory(c.id as KnowledgeCategory)}
                                            className={`px-4 py-2 rounded-lg border text-xs font-bold flex items-center gap-2 transition-all ${
                                                category === c.id 
                                                ? 'bg-pool-600 border-pool-400 text-white' 
                                                : 'bg-pool-950 border-pool-800 text-gray-500 hover:border-pool-600'
                                            }`}
                                        >
                                            <span className={c.color}>{c.icon}</span>
                                            {c.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="text-xs text-gray-400 block mb-1">Document Title</label>
                                    <input 
                                        className="w-full bg-pool-950 border border-pool-700 rounded-lg p-3 text-white focus:border-pool-500 outline-none" 
                                        placeholder="Ex: Brandbook v2.0"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 block mb-1">Raw Content (Markdown/Text)</label>
                                    <textarea 
                                        className="w-full h-48 bg-pool-950 border border-pool-700 rounded-lg p-3 text-white font-mono text-sm focus:border-pool-500 outline-none" 
                                        placeholder="Cole o conteúdo aqui ou use o upload acima..."
                                        value={content}
                                        onChange={e => setContent(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-2">
                                <span className="text-xs text-pool-400 flex items-center gap-2">
                                    {ingestStatus === 'VECTORIZING' && <><ActivityIndicator /> Generating Embeddings...</>}
                                    {ingestStatus === 'DONE' && <><CheckCircle2 size={14}/> Indexing Complete</>}
                                </span>
                                <div className="flex gap-3">
                                    <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-gray-400 hover:text-white text-sm">Cancelar</button>
                                    <button 
                                        onClick={handleAdd} 
                                        disabled={ingestStatus !== 'IDLE' && ingestStatus !== 'READING'}
                                        className="bg-pool-500 hover:bg-pool-400 text-white px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 disabled:opacity-50"
                                    >
                                        <Cpu size={16}/>
                                        Process & Save
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header Stats */}
            <div className="p-4 bg-pool-800 border-b border-pool-700 flex justify-between items-center">
                <span className="font-bold text-gray-400 text-xs uppercase tracking-wider flex items-center gap-2">
                    {categories.find(c => c.id === activeCategory)?.icon}
                    Viewing: <span className="text-white">{activeCategory}</span>
                </span>
                <span className="text-xs bg-pool-900 text-pool-400 px-2 py-1 rounded border border-pool-800">
                    {filteredDocs.length} Documents Found
                </span>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                {filteredDocs.length > 0 ? (
                    filteredDocs.map(doc => (
                        <div key={doc.id} className="bg-pool-900 border border-pool-800 rounded-lg p-5 hover:border-pool-600 transition-colors group relative">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded bg-pool-800 ${
                                        doc.metadata.category === 'CORE_IDENTITY' ? 'text-yellow-400' :
                                        doc.metadata.category === 'TECH_DOCS' ? 'text-purple-400' :
                                        doc.metadata.category === 'MARKETING_OPS' ? 'text-green-400' : 'text-gray-400'
                                    }`}>
                                        <FileText size={18} />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold text-sm">{doc.metadata.title}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] bg-pool-800 px-1.5 py-0.5 rounded text-gray-500 uppercase font-bold">{doc.metadata.category || 'GENERAL'}</span>
                                            <span className="text-[10px] text-green-500 flex items-center gap-1"><CheckCircle2 size={10}/> Indexed</span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => handleDelete(doc.id)} className="p-2 text-gray-600 hover:text-red-400 hover:bg-pool-800 rounded transition-all opacity-0 group-hover:opacity-100">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 font-mono line-clamp-2 pl-12 border-l-2 border-pool-800 ml-3">
                                {doc.content.substring(0, 150)}...
                            </p>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-600">
                        <Layers size={48} className="mb-4 opacity-20" />
                        <p className="text-sm">Nenhum documento encontrado nesta categoria.</p>
                        <p className="text-xs mt-1">Adicione dados para alimentar os agentes.</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}

const ActivityIndicator = () => (
  <span className="relative flex h-2 w-2 mr-2">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
  </span>
);
