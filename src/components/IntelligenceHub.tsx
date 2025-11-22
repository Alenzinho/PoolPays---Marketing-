import React, { useState, useRef, useEffect } from 'react';
import { Send, BrainCircuit, Activity, Shield, TrendingUp, Cpu, ToggleLeft, ToggleRight, FileText, AlertTriangle, Search, HelpCircle, X, Terminal, Plus, Trash2, MessageSquare } from 'lucide-react';
import { ChatMessage, ChatThread, AgentRole, AgentLog } from '../types';
import { runMultiAgentSystem } from '../services/ai';
import { ChatStorageService } from '../services/chatStorage';
import { vectorStore } from '../services/vectorStore';

export default function IntelligenceHub() {
  // 🆕 NOVOS ESTADOS
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<AgentRole>('SUPERVISOR');
  const [processingStage, setProcessingStage] = useState('');
  const [forcedAgent, setForcedAgent] = useState<AgentRole | null>(null);
  const [currentLogs, setCurrentLogs] = useState<AgentLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState(vectorStore.getStats());

  // Carregar threads do localStorage ao montar
  useEffect(() => {
    const loadedThreads = ChatStorageService.getAllThreads();
    setThreads(loadedThreads);
    
    // Se não tem thread, criar uma
    if (loadedThreads.length === 0) {
      const newThread = ChatStorageService.createThread();
      setThreads([newThread]);
      setActiveThreadId(newThread.id);
    } else {
      setActiveThreadId(loadedThreads[0].id);
    }
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThreadId]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentLogs]);

  // Pegar thread ativa
  const activeThread = activeThreadId ? ChatStorageService.getThread(activeThreadId) : null;

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    setIsProcessing(true);
    setProcessingStage('Analyzing intent...');
    setCurrentLogs([]);

    try {
      // 1. Criar thread se não existir
      let thread = activeThreadId ? ChatStorageService.getThread(activeThreadId) : null;
      if (!thread) {
        thread = ChatStorageService.createThread(forcedAgent || 'SUPERVISOR');
        setActiveThreadId(thread.id);
        setThreads([thread, ...threads]);
      }

      // 2. Adicionar mensagem do usuário
      const userMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: input.trim(),
        timestamp: Date.now()
      };
      ChatStorageService.addMessage(thread.id, userMessage);

      // 3. Executar sistema de agentes COM HISTÓRICO
      const result = await runMultiAgentSystem(
        input.trim(),
        forcedAgent,
        thread.messages, // 🆕 PASSAR HISTÓRICO
        (stage, agent) => {
          setProcessingStage(stage);
          setCurrentAgent(agent);
        }
      );

      // 4. Atualizar agente ativo na UI
      setCurrentAgent(result.agent);
      ChatStorageService.updateThreadAgent(thread.id, result.agent);

      // 5. Adicionar resposta do assistente
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        content: result.text,
        agent: result.agent,
        timestamp: Date.now(),
        context: result.context
      };
      ChatStorageService.addMessage(thread.id, assistantMessage);

      // 6. Atualizar logs
      setCurrentLogs(result.logs);

      // 7. Recarregar thread atualizada
      const updatedThread = ChatStorageService.getThread(thread.id);
      if (updatedThread) {
        setThreads(prev => prev.map(t => t.id === thread!.id ? updatedThread : t));
      }

    } catch (error) {
      console.error('Error:', error);
      setProcessingStage('Error occurred');
    } finally {
      setIsProcessing(false);
      setProcessingStage('');
      setInput('');
      setStats(vectorStore.getStats());
    }
  };

  const createNewChat = () => {
    const newThread = ChatStorageService.createThread(forcedAgent || 'SUPERVISOR');
    setThreads([newThread, ...threads]);
    setActiveThreadId(newThread.id);
    setCurrentLogs([]);
  };

  const deleteThread = (threadId: string) => {
    if (window.confirm('Deletar esta conversa?')) {
      ChatStorageService.deleteThread(threadId);
      const updated = ChatStorageService.getAllThreads();
      setThreads(updated);
      
      if (activeThreadId === threadId) {
        setActiveThreadId(updated[0]?.id || null);
      }
    }
  };

  const filteredMessages = activeThread?.messages.filter(msg => 
    msg.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (msg.agent && msg.agent.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  return (
    <div className="h-full flex gap-0 bg-pool-900 relative overflow-hidden animate-in fade-in">
       
       {/* 🟢 SIDEBAR: THREADS LIST (NOVO) */}
       <div className="w-64 bg-pool-950 border-r border-pool-800 flex flex-col">
          <button 
            onClick={createNewChat}
            className="m-4 bg-pool-500 hover:bg-pool-600 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 font-bold transition-all shadow-lg"
          >
            <Plus size={16} />
            New Chat
          </button>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {threads.map(thread => (
              <div
                key={thread.id}
                onClick={() => setActiveThreadId(thread.id)}
                className={`group relative px-4 py-3 border-b border-pool-800 cursor-pointer hover:bg-pool-900 transition-colors ${
                  activeThreadId === thread.id ? 'bg-pool-900 border-l-4 border-l-pool-500' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate font-medium">{thread.title}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                      <MessageSquare size={10} />
                      <span>{thread.messages.length} msgs</span>
                      <span>•</span>
                      <span className="text-pool-400">{thread.agentMode}</span>
                    </div>
                  </div>
                  
                  {threads.length > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteThread(thread.id); }}
                      className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
       </div>

       {/* 🟡 PANEL 1: COMMAND DECK */}
       <div className="w-72 bg-pool-950 border-r border-pool-800 flex flex-col p-5 flex-shrink-0 z-20 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-pool-gold font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                <Activity size={16} /> Command Deck
            </h2>
            <button onClick={() => setIsHelpOpen(true)} className="text-gray-500 hover:text-white transition-colors">
                <HelpCircle size={18} />
            </button>
          </div>

          {/* Agent Status */}
          <div className="space-y-3 mb-8">
            <AgentStatusCard role="SUPERVISOR" active={currentAgent === 'SUPERVISOR'} />
            <AgentStatusCard role="GUARDIAN" active={currentAgent === 'GUARDIAN'} />
            <AgentStatusCard role="GROWTH" active={currentAgent === 'GROWTH'} />
            <AgentStatusCard role="ARCHITECT" active={currentAgent === 'ARCHITECT'} />
          </div>

          {/* Manual Override */}
          <div className="bg-pool-900 rounded-xl p-4 border border-pool-800 mb-6">
             <div className="flex justify-between items-center mb-3">
                 <span className="text-gray-300 text-xs font-bold uppercase">Manual Override</span>
                 {forcedAgent ? <ToggleRight className="text-red-500" size={20}/> : <ToggleLeft className="text-gray-600" size={20}/>}
             </div>
             
             <select 
                value={forcedAgent || 'AUTO'}
                onChange={(e) => setForcedAgent(e.target.value === 'AUTO' ? null : e.target.value as AgentRole)}
                className={`w-full p-2 rounded text-xs font-bold border outline-none transition-all ${
                    forcedAgent ? 'bg-red-900/20 border-red-500/50 text-red-400' : 'bg-pool-800 border-pool-700 text-gray-400'
                }`}
             >
                 <option value="AUTO">🤖 AUTO (Supervisor)</option>
                 <option value="GUARDIAN">🛡️ GUARDIAN</option>
                 <option value="GROWTH">📈 GROWTH</option>
                 <option value="ARCHITECT">🏗️ ARCHITECT</option>
             </select>
             {forcedAgent && <p className="text-[10px] text-red-400 mt-2 flex items-center gap-1"><AlertTriangle size={10}/> Supervisor Bypassed</p>}
          </div>

          {/* Memory Stats */}
          <div className="mt-auto">
             <div className="text-gray-500 text-[10px] uppercase font-bold mb-2">Neural Memory Health</div>
             <div className="grid grid-cols-2 gap-2">
                 <StatBox label="Core" value={stats.core} color="text-yellow-400" />
                 <StatBox label="Tech" value={stats.tech} color="text-purple-400" />
                 <StatBox label="Growth" value={stats.marketing} color="text-green-400" />
                 <StatBox label="Total" value={stats.totalDocs} color="text-white" />
             </div>
          </div>
       </div>

       {/* 🟣 PANEL 2: CHAT */}
       <div className="flex-1 flex flex-col bg-pool-900 relative z-10">
          
          {/* Header com Status */}
          <div className="px-6 py-3 border-b border-pool-800 flex items-center justify-between bg-pool-900/95 backdrop-blur z-20">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`}></div>
              <span className="text-xs font-mono text-gray-400">
                {isProcessing ? processingStage : `Active: ${currentAgent}`}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <Search className="text-pool-500" size={14} />
              <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs text-white w-40 placeholder-pool-600 font-mono"
              />
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar relative">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
                <BrainCircuit size={300} />
            </div>

            {filteredMessages.map((msg) => (
                <ChatBubble key={msg.id} message={msg} />
            ))}

            {isProcessing && (
                <div className="flex justify-start animate-pulse">
                    <div className="bg-pool-800 rounded-2xl rounded-bl-none p-4 flex items-center gap-3 border border-pool-700">
                         <div className="w-2 h-2 bg-pool-gold rounded-full animate-bounce"></div>
                         <div className="w-2 h-2 bg-pool-gold rounded-full animate-bounce delay-75"></div>
                         <div className="w-2 h-2 bg-pool-gold rounded-full animate-bounce delay-150"></div>
                         <span className="text-xs text-gray-400 font-mono">{processingStage}</span>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-pool-950 border-t border-pool-800">
            <div className="relative max-w-3xl mx-auto">
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Digite o comando para o sistema..."
                    disabled={isProcessing}
                    className="w-full bg-pool-900 border border-pool-700 rounded-xl py-4 pl-6 pr-14 text-white focus:border-pool-gold focus:outline-none shadow-inner font-mono text-sm disabled:opacity-50"
                />
                <button 
                    onClick={handleSend}
                    disabled={isProcessing}
                    className="absolute right-2 top-2 bottom-2 bg-pool-500 hover:bg-pool-400 text-white p-2 rounded-lg transition-colors disabled:opacity-50"
                >
                    <Send size={20} />
                </button>
            </div>
          </div>
       </div>

       {/* 🔵 PANEL 3: LOGS */}
       <div className="w-80 bg-black/40 border-l border-pool-800 flex flex-col font-mono text-xs">
          <div className="p-3 border-b border-pool-800 bg-pool-950 text-gray-400 font-bold uppercase tracking-wider flex items-center gap-2">
              <Terminal size={14} /> Audit Trail
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {currentLogs.length > 0 ? (
                  currentLogs.map((log, i) => (
                      <div key={i} className="flex flex-col gap-1 animate-in slide-in-from-right-2">
                          <div className="flex justify-between text-[10px] text-gray-600">
                              <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                              <span className={
                                  log.agent === 'SUPERVISOR' ? 'text-blue-500' :
                                  log.agent === 'GUARDIAN' ? 'text-yellow-500' :
                                  log.agent === 'GROWTH' ? 'text-green-500' : 'text-purple-500'
                              }>{log.agent}</span>
                          </div>
                          <div className="text-gray-300 break-words border-l-2 border-pool-700 pl-2">
                              {log.details}
                          </div>
                      </div>
                  ))
              ) : (
                  <div className="text-gray-700 text-center mt-10 italic">Waiting...</div>
              )}
              <div ref={logsEndRef} />
          </div>
       </div>

       {/* HELP MODAL (mesmo código anterior) */}
       {isHelpOpen && (
           <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
               <div className="bg-pool-900 border border-pool-600 rounded-2xl max-w-2xl p-6 relative">
                   <button onClick={() => setIsHelpOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
                   <h3 className="text-xl font-bold text-white mb-4">System Manual</h3>
                   <div className="text-sm text-gray-300 space-y-4">
                      <p>Intelligence Hub permite conversar com agentes especializados da PoolPays.</p>
                      <div className="grid grid-cols-2 gap-4">
                          <div className="bg-pool-800 p-3 rounded">
                              <div className="font-bold text-blue-400 mb-1">SUPERVISOR</div>
                              <p className="text-xs text-gray-400">Analisa e delega para o especialista correto</p>
                          </div>
                          <div className="bg-pool-800 p-3 rounded">
                              <div className="font-bold text-yellow-400 mb-1">GUARDIAN</div>
                              <p className="text-xs text-gray-400">Protege a narrativa da marca</p>
                          </div>
                          <div className="bg-pool-800 p-3 rounded">
                              <div className="font-bold text-green-400 mb-1">GROWTH</div>
                              <p className="text-xs text-gray-400">Cria conteúdo de marketing</p>
                          </div>
                          <div className="bg-pool-800 p-3 rounded">
                              <div className="font-bold text-purple-400 mb-1">ARCHITECT</div>
                              <p className="text-xs text-gray-400">Responde questões técnicas</p>
                          </div>
                      </div>
                   </div>
                   <button onClick={() => setIsHelpOpen(false)} className="mt-6 bg-pool-700 hover:bg-pool-600 text-white px-6 py-2 rounded-lg">Entendido</button>
               </div>
           </div>
       )}
    </div>
  );
}

// SUBCOMPONENTS (mesmo código anterior)
const AgentStatusCard: React.FC<{role: string; active: boolean}> = ({ role, active }) => {
    let color = 'bg-gray-800 border-gray-700 text-gray-500';
    let icon = <Cpu size={14} />;

    if (role === 'SUPERVISOR') { color = active ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-gray-800 border-gray-700 text-gray-600'; icon = <BrainCircuit size={14} />; }
    if (role === 'GUARDIAN') { color = active ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400' : 'bg-gray-800 border-gray-700 text-gray-600'; icon = <Shield size={14} />; }
    if (role === 'GROWTH') { color = active ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-gray-800 border-gray-700 text-gray-600'; icon = <TrendingUp size={14} />; }
    if (role === 'ARCHITECT') { color = active ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'bg-gray-800 border-gray-700 text-gray-600'; icon = <Cpu size={14} />; }

    return (
        <div className={`p-3 rounded border flex items-center justify-between transition-all ${color} ${active ? 'shadow-lg' : 'opacity-50'}`}>
            <div className="flex items-center gap-2 font-bold text-xs">
                {icon} {role}
            </div>
            {active && <div className="w-2 h-2 rounded-full bg-current animate-pulse"></div>}
        </div>
    );
};

const StatBox: React.FC<{label: string; value: number | string; color: string}> = ({ label, value, color }) => (
    <div className="bg-pool-900 border border-pool-800 p-2 rounded text-center">
        <div className={`text-lg font-bold ${color}`}>{value}</div>
        <div className="text-[9px] text-gray-500 uppercase">{label}</div>
    </div>
);

const ChatBubble: React.FC<{message: ChatMessage}> = ({ message }) => {
    const isUser = message.role === 'user';
    
    let agentStyle = 'border-pool-700 bg-pool-800 text-gray-200';
    let AgentIcon = BrainCircuit;

    if (!isUser) {
        switch(message.agent) {
            case 'GUARDIAN': agentStyle = 'border-yellow-500/30 bg-yellow-900/10 text-yellow-100'; AgentIcon = Shield; break;
            case 'GROWTH': agentStyle = 'border-green-500/30 bg-green-900/10 text-green-100'; AgentIcon = TrendingUp; break;
            case 'ARCHITECT': agentStyle = 'border-purple-500/30 bg-purple-900/10 text-purple-100'; AgentIcon = Cpu; break;
            case 'SUPERVISOR': agentStyle = 'border-blue-500/30 bg-blue-900/10 text-blue-100'; AgentIcon = BrainCircuit; break;
        }
    }

    return (
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
            {!isUser && (
                <div className="flex items-center gap-2 mb-1 ml-1">
                    <div className={`p-1 rounded-full ${agentStyle.split(' ')[1]}`}>
                        <AgentIcon size={12} />
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{message.agent}</span>
                </div>
            )}
            
            <div className={`max-w-[85%] rounded-2xl p-5 shadow-sm border ${isUser ? 'bg-pool-600 text-white border-transparent rounded-br-none' : `${agentStyle} rounded-bl-none`}`}>
                <div className="whitespace-pre-wrap leading-relaxed text-sm">{message.content}</div>
            </div>

            {!isUser && message.context && message.context.length > 0 && (
                <div className="mt-2 ml-2 flex flex-wrap gap-2">
                    {message.context.map((doc, i) => (
                        <div key={i} className="flex items-center gap-1 text-[10px] text-pool-400 bg-pool-950 px-2 py-1 rounded border border-pool-800">
                            <FileText size={10} />
                            {doc.metadata.title}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};