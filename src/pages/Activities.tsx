import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Calendar as CalendarIcon, 
  LayoutList, 
  SquareKanban, 
  Plus,
  MoreVertical,
  Clock,
  CircleAlert,
  AlignLeft,
  X,
  Trash2,
  MessageCircle,
  Copy,
  Check
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { GoogleGenAI } from "@google/genai";

import { db } from '../lib/firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  where
} from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const initialTasks = [
  { id: 1, title: 'Revisar copy da landing page', description: 'Revisar a copy focando nos gatilhos mentais.', project: 'Lançamento Alpha', date: '2026-08-15', status: 'todo', priority: 'high', user: 'user1' },
];

interface ActivitiesProps {
  hideHeader?: boolean;
  defaultProject?: string;
}

export function Activities({ hideHeader = false, defaultProject }: ActivitiesProps) {
  const { user, isAdmin } = useAuth();
  const [view, setView] = useState<'list' | 'kanban' | 'calendar'>('list');
  const [listTab, setListTab] = useState<'active' | 'completed'>('active');
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<string[]>(['Geral']);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [selectedUserFilter, setSelectedUserFilter] = useState('all');
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [taskToDelete, setTaskToDelete] = useState<number | null>(null);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);

    const unsubTeam = onSnapshot(collection(db, 'team_members'), (snapshot) => {
      const members = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      let updatedMembers: any[] = members;
      if (user && !updatedMembers.find(m => m.email === user.email)) {
        updatedMembers = [
          ...updatedMembers,
          {
            id: 'current-user',
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Eu',
            email: user.email,
            avatar: user.user_metadata?.avatar_url || `user${Math.floor(Math.random() * 100)}`,
            role: isAdmin ? 'Administrador' : 'Colaborador'
          }
        ];
      }
      setTeamMembers(updatedMembers.filter(Boolean));
    });

    const unsubTasks = onSnapshot(query(collection(db, 'tasks'), orderBy('created_at', 'desc')), (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setIsLoading(false);
    });

    const unsubProjects = onSnapshot(collection(db, 'projects'), (snapshot) => {
      const projectNames = snapshot.docs.map(doc => (doc.data() as any).name) || [];
      if (!projectNames.includes('Geral')) {
        projectNames.push('Geral');
      }
      setProjects(projectNames);
    });

    return () => {
      unsubTeam();
      unsubTasks();
      unsubProjects();
    };
  }, [user, isAdmin]);

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    project: defaultProject || 'Geral',
    date: new Date().toISOString().split('T')[0],
    priority: 'medium',
    status: 'todo',
    user: ''
  });

  useEffect(() => {
    if (teamMembers.length > 0 && !newTask.user) {
      // If the current user is in the team, select them by default
      const currentUserMember = teamMembers.find(m => m?.email === user?.email);
      if (currentUserMember) {
        setNewTask(prev => ({ ...prev, user: currentUserMember.email }));
      } else if (teamMembers.length === 1) {
        // If there's only one member, select them
        setNewTask(prev => ({ ...prev, user: teamMembers[0].email }));
      }
    }
  }, [teamMembers, user, newTask.user]);

  useEffect(() => {
    setNewTask(prev => ({ ...prev, project: defaultProject || 'Geral' }));
  }, [defaultProject]);

  const baseFilteredTasks = tasks
    .filter(task => defaultProject ? task.project === defaultProject : true)
    .filter(task => {
      if (selectedUserFilter === 'all') return true;
      const member = teamMembers.find(m => m?.email === selectedUserFilter);
      return task.user === selectedUserFilter || (member && task.user === member.avatar);
    })
    .sort((a, b) => {
      // Sort by date ascending (oldest first)
      const dateA = new Date(a.date + 'T00:00:00').getTime();
      const dateB = new Date(b.date + 'T00:00:00').getTime();
      return dateA - dateB;
    });

  const listTasks = baseFilteredTasks.filter(task => 
    listTab === 'active' ? task.status !== 'done' : task.status === 'done'
  );

  const toggleTaskStatus = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    let newStatus = 'todo';
    if (task.status !== 'done') {
      newStatus = 'done';
    }
    
    try {
      await updateDoc(doc(db, 'tasks', taskId), { status: newStatus });
      if (selectedTask?.id === taskId) {
        setSelectedTask({ ...selectedTask, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating task status in Firestore:', error);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'tasks', taskId), { status: newStatus });
      if (selectedTask?.id === taskId) {
        setSelectedTask({ ...selectedTask, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating task status in Firestore:', error);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days = [];
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false
      });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }
    return days;
  };

  const updateTaskField = async (taskId: string, field: string, value: any) => {
    try {
      await updateDoc(doc(db, 'tasks', taskId), { [field]: value });
    } catch (error) {
      console.error(`Error updating task ${field} in Firestore:`, error);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title) {
      alert('Por favor, insira um título para a tarefa.');
      return;
    }

    if (!newTask.user) {
      alert('Por favor, selecione um responsável para a tarefa.');
      return;
    }

    const taskToInsert = { 
      ...newTask,
      created_at: serverTimestamp()
    };

    try {
      await addDoc(collection(db, 'tasks'), taskToInsert);
      setIsAddingTask(false);
      setNewTask({
        title: '',
        description: '',
        project: defaultProject || 'Geral',
        date: new Date().toISOString().split('T')[0],
        priority: 'medium',
        status: 'todo',
        user: newTask.user
      });
    } catch (error: any) {
      console.error('Error adding task to Firestore:', error);
      alert(`Erro ao criar tarefa: ${error.message}`);
    }
  };

  const generateWhatsAppMessage = async () => {
    if (selectedUserFilter === 'all') return;
    
    setIsGenerating(true);
    setIsWhatsAppModalOpen(true);
    setGeneratedMessage('');
    
    try {
      const selectedMember = teamMembers.find(m => m.email === selectedUserFilter);
      const userName = selectedMember?.name || selectedUserFilter;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];
      
      const userTasks = tasks.filter(t => {
        const member = teamMembers.find(m => m?.email === selectedUserFilter);
        return (t.user === selectedUserFilter || (member && t.user === member.avatar)) && t.status !== 'done';
      });
      
      const overdue = userTasks.filter(t => new Date(t.date + 'T00:00:00') < today);
      const forToday = userTasks.filter(t => t.date === todayStr);
      const upcoming = userTasks.filter(t => new Date(t.date + 'T00:00:00') > today && t.date !== todayStr);
      
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : '');
      
      if (!apiKey) {
        throw new Error('Gemini API Key não encontrada. Verifique as variáveis de ambiente.');
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `
        Você é um assistente de gestão de projetos. Crie uma mensagem de WhatsApp estruturada e profissional para o colaborador ${userName}.
        A mensagem deve listar as tarefas pendentes dele, priorizando as atrasadas.
        
        Tarefas Atrasadas:
        ${overdue.map(t => `- ${t.title} (Prazo: ${t.date})`).join('\n')}
        
        Tarefas para Hoje:
        ${forToday.map(t => `- ${t.title}`).join('\n')}
        
        Tarefas Futuras:
        ${upcoming.map(t => `- ${t.title} (Prazo: ${t.date})`).join('\n')}
        
        Instruções:
        1. Use emojis para tornar a mensagem amigável.
        2. Seja direto e motivador.
        3. Organize em seções claras: 🚨 ATRASADAS, 📅 PARA HOJE, 🚀 PRÓXIMAS.
        4. Se não houver tarefas em alguma seção, não mencione a seção ou diga algo positivo.
        5. Retorne APENAS o texto da mensagem formatado para WhatsApp.
      `;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      
      setGeneratedMessage(response.text || 'Não foi possível gerar a mensagem.');
    } catch (error) {
      console.error('Error generating AI message:', error);
      setGeneratedMessage('Erro ao gerar mensagem com IA. Por favor, tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedMessage);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDeleteTask = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta tarefa?')) return;
    try {
      await deleteDoc(doc(db, 'tasks', id));
      setActiveMenuId(null);
      if (selectedTask?.id === id) setSelectedTask(null);
      setTaskToDelete(null);
    } catch (error) {
      console.error('Error deleting task from Firestore:', error);
    }
  };

  return (
    <div className="flex flex-col gap-8 relative" onClick={() => setActiveMenuId(null)}>
      {hideHeader && (
        <div className="flex justify-end">
          <button 
            onClick={() => setIsAddingTask(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors text-sm font-medium"
          >
            <Plus size={18} />
            Nova Tarefa
          </button>
        </div>
      )}
      {!hideHeader && (
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-white">Atividades</h1>
            <p className="text-text-secondary mt-1">Organize suas tarefas e prazos.</p>
          </div>
          <div className="flex items-center gap-4">
            {isAdmin && selectedUserFilter !== 'all' && (
              <button 
                onClick={generateWhatsAppMessage}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors text-sm font-medium"
                title="Enviar resumo por WhatsApp"
              >
                <MessageCircle size={16} />
                Enviar Resumo
              </button>
            )}
            <select 
              className="bg-background border border-border rounded-md px-3 py-1 text-sm text-text-secondary focus:outline-none focus:border-primary"
              value={selectedUserFilter || ''}
              onChange={(e) => setSelectedUserFilter(e.target.value)}
            >
              <option value="all">Todos os usuários</option>
              {teamMembers.map(member => (
                <option key={member.id} value={member.email}>{member.name}</option>
              ))}
            </select>
            <div className="flex bg-secondary rounded-lg p-1 border border-border">
              <button 
                onClick={() => setView('list')}
                className={cn(
                  "p-2 rounded-md transition-colors",
                  view === 'list' ? "bg-card text-white shadow-sm" : "text-text-secondary hover:text-white"
                )}
              >
                <LayoutList size={18} />
              </button>
              <button 
                onClick={() => setView('kanban')}
                className={cn(
                  "p-2 rounded-md transition-colors",
                  view === 'kanban' ? "bg-card text-white shadow-sm" : "text-text-secondary hover:text-white"
                )}
              >
                <SquareKanban size={18} />
              </button>
              <button 
                onClick={() => setView('calendar')}
                className={cn(
                  "p-2 rounded-md transition-colors",
                  view === 'calendar' ? "bg-card text-white shadow-sm" : "text-text-secondary hover:text-white"
                )}
              >
                <CalendarIcon size={18} />
              </button>
            </div>
            <button 
              onClick={() => setIsAddingTask(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors text-sm font-medium"
            >
              <Plus size={18} />
              Nova Tarefa
            </button>
          </div>
        </header>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="flex flex-col gap-4">
          <div className="flex gap-4 border-b border-border">
            <button 
              onClick={() => setListTab('active')}
              className={cn(
                "pb-2 px-1 text-sm font-medium transition-colors relative",
                listTab === 'active' ? "text-primary" : "text-text-secondary hover:text-white"
              )}
            >
              Pendentes
              {listTab === 'active' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
            </button>
            <button 
              onClick={() => setListTab('completed')}
              className={cn(
                "pb-2 px-1 text-sm font-medium transition-colors relative",
                listTab === 'completed' ? "text-primary" : "text-text-secondary hover:text-white"
              )}
            >
              Finalizadas
              {listTab === 'completed' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
            </button>
          </div>

          <div className="glass-panel overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-card/50">
                  <th className="p-4 font-medium text-text-secondary text-sm w-12">
                    <CheckSquare size={16} />
                  </th>
                  <th className="p-4 font-medium text-text-secondary text-sm">Tarefa</th>
                  <th className="p-4 font-medium text-text-secondary text-sm">Projeto</th>
                  <th className="p-4 font-medium text-text-secondary text-sm">Responsável</th>
                  <th className="p-4 font-medium text-text-secondary text-sm">Prazo</th>
                  <th className="p-4 font-medium text-text-secondary text-sm">Status</th>
                  <th className="p-4 font-medium text-text-secondary text-sm w-12"></th>
                </tr>
              </thead>
              <tbody>
                {listTasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-text-secondary">
                      {listTab === 'active' ? 'Nenhuma tarefa pendente.' : 'Nenhuma tarefa finalizada.'}
                    </td>
                  </tr>
                ) : (
                  listTasks.map((task, idx) => (
                    <tr 
                      key={task.id} 
                      className={cn(
                        "border-b border-border/50 hover:bg-card/50 transition-colors group cursor-pointer",
                        idx === listTasks.length - 1 && "border-b-0"
                      )}
                      onClick={() => setSelectedTask(task)}
                    >
                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={task.status === 'done'}
                          onChange={() => toggleTaskStatus(task.id)}
                          className="rounded border-border bg-background text-primary focus:ring-primary w-4 h-4 cursor-pointer" 
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-2 h-2 rounded-full shrink-0",
                            task.priority === 'high' ? "bg-red-500" : 
                            task.priority === 'medium' ? "bg-yellow-500" : "bg-emerald-500"
                          )} />
                          <span className={cn(
                            "font-medium text-sm transition-all",
                            task.status === 'done' ? "text-text-secondary line-through" : "text-white"
                          )}>
                            {task.title}
                          </span>
                          {task.description && (
                            <AlignLeft size={14} className="text-text-secondary shrink-0" />
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-secondary text-text-secondary border-border whitespace-nowrap">
                          {task.project}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {(() => {
                            const member = teamMembers.find(m => m?.email === task.user || m?.avatar === task.user);
                            const avatar = member?.avatar || task.user;
                            const name = member?.name || task.user;
                            
                            return (
                              <>
                                {avatar?.startsWith('http') || avatar?.startsWith('data:') ? (
                                  <img 
                                    src={avatar} 
                                    alt={name} 
                                    title={name}
                                    className="w-8 h-8 rounded-full border border-border object-cover shrink-0"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : avatar ? (
                                  <img 
                                    src={`https://picsum.photos/seed/${avatar}/32/32`} 
                                    alt={name} 
                                    title={name}
                                    className="w-8 h-8 rounded-full border border-border object-cover shrink-0"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full border border-border bg-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                                    {name.substring(0, 1).toUpperCase()}
                                  </div>
                                )}
                                <span className="text-xs text-text-secondary truncate max-w-[100px] hidden sm:inline">
                                  {name}
                                </span>
                              </>
                            );
                          })()}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-sm text-text-secondary whitespace-nowrap">
                          <Clock size={14} />
                          {task.date}
                        </div>
                      </td>
                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        <select 
                          value={task.status || ''}
                          onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                          className={cn(
                            "px-2.5 py-1 rounded-full text-xs font-medium border appearance-none cursor-pointer outline-none",
                            task.status === 'in-progress' && "bg-primary/10 text-accent border-primary/20",
                            task.status === 'todo' && "bg-secondary text-text-secondary border-border",
                            task.status === 'done' && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          )}
                        >
                          <option value="todo" className="bg-card text-white">A fazer</option>
                          <option value="in-progress" className="bg-card text-white">Em andamento</option>
                          <option value="done" className="bg-card text-white">Concluído</option>
                        </select>
                      </td>
                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        <div className="relative">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(activeMenuId === task.id ? null : task.id);
                            }}
                            className="text-text-secondary hover:text-white transition-opacity"
                          >
                            <MoreVertical size={18} />
                          </button>
                          
                          {activeMenuId === task.id && (
                            <div className="absolute right-0 top-full mt-1 w-32 bg-card border border-border rounded-lg shadow-xl z-20 overflow-hidden">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTaskToDelete(task.id);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors text-left"
                              >
                                <Trash2 size={14} />
                                Excluir
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )}

      {/* Kanban View (Simplified) */}
      {view === 'kanban' && (
        <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
          {['A fazer', 'Em andamento', 'Concluído'].map((column, colIdx) => {
            const columnStatus = column === 'A fazer' ? 'todo' : column === 'Em andamento' ? 'in-progress' : 'done';
            const columnTasks = baseFilteredTasks.filter(t => 
              columnStatus === 'done' 
                ? t.status === 'done'
                : t.status === columnStatus
            );
            
            return (
              <div key={colIdx} className="w-80 shrink-0 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-bold text-white">{column}</h3>
                  <span className="text-xs font-medium text-text-secondary bg-secondary px-2 py-1 rounded-full">
                    {columnTasks.length}
                  </span>
                </div>
                
                <div className="flex-1 glass-panel p-3 flex flex-col gap-3 min-h-[200px]">
                  {columnTasks.map(task => (
                    <div 
                      key={task.id} 
                      onClick={() => setSelectedTask(task)}
                      className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            task.priority === 'high' ? "bg-red-500" : 
                            task.priority === 'medium' ? "bg-yellow-500" : "bg-emerald-500"
                          )} />
                          <span className="text-xs font-medium text-text-secondary">{task.project}</span>
                        </div>
                        <div className="relative">
                          <button 
                            className="text-text-secondary hover:text-white" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(activeMenuId === task.id ? null : task.id);
                            }}
                          >
                            <MoreVertical size={14} />
                          </button>

                          {activeMenuId === task.id && (
                            <div className="absolute right-0 top-full mt-1 w-32 bg-card border border-border rounded-lg shadow-xl z-20 overflow-hidden">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTaskToDelete(task.id);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors text-left"
                              >
                                <Trash2 size={14} />
                                Excluir
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <h4 className={cn(
                        "text-sm font-medium mb-4 line-clamp-2",
                        task.status === 'done' ? "text-text-secondary line-through" : "text-white"
                      )}>{task.title}</h4>
                      
                      <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/50">
                        <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                          <Clock size={12} />
                          {task.date}
                        </div>
                        <div className="flex items-center gap-2">
                          {task.description && <AlignLeft size={12} className="text-text-secondary" />}
                          {(() => {
                            const member = teamMembers.find(m => m?.email === task.user || m?.avatar === task.user);
                            const avatar = member?.avatar || task.user;
                            return avatar?.startsWith('http') || avatar?.startsWith('data:') ? (
                              <img 
                                src={avatar} 
                                alt="User" 
                                title={member?.name || 'Usuário'}
                                className="w-6 h-6 rounded-full border border-border object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : avatar ? (
                              <img 
                                src={`https://picsum.photos/seed/${avatar}/24/24`} 
                                alt="User" 
                                title={member?.name || 'Usuário'}
                                className="w-6 h-6 rounded-full border border-border object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full border border-border bg-primary/20 flex items-center justify-center text-primary font-bold text-[10px]">
                                U
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <button 
                    onClick={() => setIsAddingTask(true)}
                    className="flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed border-border text-text-secondary hover:text-white hover:border-primary/50 transition-colors text-sm font-medium mt-2"
                  >
                    <Plus size={16} />
                    Adicionar Tarefa
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Calendar View */}
      {view === 'calendar' && (
        <div className="glass-panel flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="text-lg font-bold text-white capitalize">
              {currentMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                className="p-2 text-text-secondary hover:text-white transition-colors rounded-lg hover:bg-white/5"
              >
                &lt;
              </button>
              <button 
                onClick={() => setCurrentMonth(new Date())}
                className="px-3 py-1 text-sm font-medium text-text-secondary hover:text-white transition-colors rounded-lg hover:bg-white/5"
              >
                Hoje
              </button>
              <button 
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                className="p-2 text-text-secondary hover:text-white transition-colors rounded-lg hover:bg-white/5"
              >
                &gt;
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-7 gap-4 min-w-[800px]">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-text-secondary pb-2 border-b border-border">
                  {day}
                </div>
              ))}
              {getDaysInMonth(currentMonth).map((dayObj, idx) => {
                const dateStr = `${dayObj.date.getFullYear()}-${String(dayObj.date.getMonth() + 1).padStart(2, '0')}-${String(dayObj.date.getDate()).padStart(2, '0')}`;
                const dayTasks = baseFilteredTasks.filter(t => t.date === dateStr);
                const today = new Date();
                const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                const isToday = todayStr === dateStr;
                
                return (
                  <div 
                    key={idx} 
                    className={cn(
                      "min-h-[120px] p-2 rounded-lg border flex flex-col gap-2 transition-colors",
                      dayObj.isCurrentMonth ? "bg-card/30 border-border/50" : "opacity-50 border-transparent",
                      isToday && "border-primary/50 bg-primary/5"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full",
                        isToday ? "bg-primary text-white" : "text-text-secondary"
                      )}>
                        {dayObj.date.getDate()}
                      </span>
                      {dayTasks.length > 0 && (
                        <span className="text-xs text-text-secondary font-medium">
                          {dayTasks.length}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 overflow-y-auto flex-1 no-scrollbar">
                      {dayTasks.map(task => (
                        <div 
                          key={task.id}
                          onClick={() => setSelectedTask(task)}
                          className={cn(
                            "text-xs px-2 py-1.5 rounded truncate cursor-pointer transition-colors border",
                            task.status === 'done' 
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 line-through opacity-70" 
                              : task.status === 'in-progress'
                                ? "bg-primary/10 text-accent border-primary/20"
                                : "bg-secondary text-white border-border hover:border-text-secondary/30"
                          )}
                          title={task.title}
                        >
                          {task.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Task Details Sidebar */}
      <div className={cn(
        "fixed inset-y-0 right-0 w-96 glass-panel border-l border-border transition-transform duration-300 z-50 flex flex-col shadow-2xl",
        selectedTask ? "translate-x-0" : "translate-x-full"
      )}>
        {selectedTask && (
          <>
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  checked={selectedTask.status === 'done'}
                  onChange={() => {
                    toggleTaskStatus(selectedTask.id);
                  }}
                  className="rounded border-border bg-background text-primary focus:ring-primary w-5 h-5 cursor-pointer" 
                />
                <h3 className="font-heading font-bold text-white">Detalhes da Tarefa</h3>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setTaskToDelete(selectedTask.id)}
                  className="p-2 text-text-secondary hover:text-red-500 transition-colors"
                  title="Excluir Tarefa"
                >
                  <CircleAlert size={20} />
                </button>
                <button onClick={() => setSelectedTask(null)} className="p-2 text-text-secondary hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <input 
                  type="text"
                  value={selectedTask.title}
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    setSelectedTask({ ...selectedTask, title: newTitle });
                    setTasks(tasks.map(t => t.id === selectedTask.id ? { ...t, title: newTitle } : t));
                  }}
                  onBlur={() => updateTaskField(selectedTask.id, 'title', selectedTask.title)}
                  className={cn(
                    "w-full bg-transparent text-xl font-heading font-bold focus:outline-none focus:border-b focus:border-primary pb-1 transition-all",
                    selectedTask.status === 'done' ? "text-text-secondary line-through" : "text-white"
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-text-secondary uppercase tracking-wider font-medium">Status</span>
                  <select 
                    value={selectedTask.status || ''}
                    onChange={(e) => {
                      updateTaskStatus(selectedTask.id, e.target.value);
                    }}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                  >
                    <option value="todo">A fazer</option>
                    <option value="in-progress">Em andamento</option>
                    <option value="done">Concluído</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-text-secondary uppercase tracking-wider font-medium">Responsável</span>
                    <div className="relative">
                      <select 
                        value={selectedTask.user || ''}
                        onChange={async (e) => {
                          const newUser = e.target.value;
                          setSelectedTask({ ...selectedTask, user: newUser });
                          try {
                            await updateDoc(doc(db, 'tasks', selectedTask.id), { user: newUser });
                            setTasks(tasks.map(t => t.id === selectedTask.id ? { ...t, user: newUser } : t));
                          } catch (err) {
                            console.error('Error updating task user:', err);
                          }
                        }}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-transparent focus:outline-none focus:border-primary transition-colors appearance-none"
                      >
                        {teamMembers.map(member => (
                          <option key={member.id} value={member.email} className="text-white bg-card">{member.name}</option>
                        ))}
                      </select>
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-2">
                        {(() => {
                          const member = teamMembers.find(m => m?.email === selectedTask.user || m?.avatar === selectedTask.user);
                          if (!member) return null;
                          const avatar = member.avatar || selectedTask.user;
                          return (
                            <>
                              {avatar?.startsWith('http') || avatar?.startsWith('data:') ? (
                                <img 
                                  src={avatar} 
                                  className="w-5 h-5 rounded-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : avatar ? (
                                <img 
                                  src={`https://picsum.photos/seed/${avatar}/20/20`} 
                                  className="w-5 h-5 rounded-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-5 h-5 rounded-full border border-border bg-primary/20 flex items-center justify-center text-primary font-bold text-[10px]">
                                  U
                                </div>
                              )}
                              <span className="text-sm text-white">{member.name}</span>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-text-secondary uppercase tracking-wider font-medium">Prazo</span>
                  <input 
                    type="date"
                    value={selectedTask.date}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      setSelectedTask({ ...selectedTask, date: newDate });
                      setTasks(tasks.map(t => t.id === selectedTask.id ? { ...t, date: newDate } : t));
                    }}
                    onBlur={() => updateTaskField(selectedTask.id, 'date', selectedTask.date)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary transition-colors [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-text-secondary uppercase tracking-wider flex items-center gap-2">
                  <AlignLeft size={14} />
                  Descrição / Instruções
                </label>
                <textarea 
                  value={selectedTask.description || ''}
                  onChange={(e) => {
                    const newDesc = e.target.value;
                    setSelectedTask({ ...selectedTask, description: newDesc });
                    setTasks(tasks.map(t => t.id === selectedTask.id ? { ...t, description: newDesc } : t));
                  }}
                  onBlur={() => updateTaskField(selectedTask.id, 'description', selectedTask.description)}
                  placeholder="Adicione detalhes, links ou instruções para esta tarefa..."
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary transition-colors resize-none h-32"
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add Task Modal */}
      {isAddingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-heading font-bold text-white">Nova Tarefa</h2>
              <button 
                onClick={() => setIsAddingTask(false)}
                className="text-text-secondary hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddTask} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">Título da Tarefa</label>
                <input 
                  type="text" 
                  required
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors"
                  placeholder="Ex: Revisar copy da landing page"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">Descrição</label>
                <textarea 
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors resize-none h-24"
                  placeholder="Detalhes da tarefa..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {!hideHeader && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">Projeto</label>
                    <select 
                      value={newTask.project || ''}
                      onChange={(e) => setNewTask({...newTask, project: e.target.value})}
                      className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors appearance-none"
                    >
                      {projects.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className={cn("space-y-2", hideHeader ? "col-span-2" : "")}>
                  <label className="text-sm font-medium text-text-secondary">Responsável</label>
                  <div className="relative">
                    <select 
                      value={newTask.user || ''}
                      onChange={(e) => setNewTask({...newTask, user: e.target.value})}
                      className={cn(
                        "w-full bg-background border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary transition-colors appearance-none",
                        newTask.user ? "text-transparent" : "text-text-secondary"
                      )}
                      required
                    >
                      <option value="" disabled className="text-text-secondary bg-card">Selecione um responsável</option>
                      {teamMembers.map(member => (
                        <option key={member.id} value={member.email} className="text-white bg-card">{member.name}</option>
                      ))}
                    </select>
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-2">
                      {(() => {
                        const member = teamMembers.find(m => m?.email === newTask.user || m?.avatar === newTask.user);
                        if (!member) return null;
                        const avatar = member.avatar || newTask.user;
                        return (
                          <>
                            {avatar?.startsWith('http') || avatar?.startsWith('data:') ? (
                              <img 
                                src={avatar} 
                                className="w-6 h-6 rounded-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : avatar ? (
                              <img 
                                src={`https://picsum.photos/seed/${avatar}/24/24`} 
                                className="w-6 h-6 rounded-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full border border-border bg-primary/20 flex items-center justify-center text-primary font-bold text-[10px]">
                                U
                              </div>
                            )}
                            <span className="text-sm text-white">{member.name}</span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <label className="text-sm font-medium text-text-secondary">Prazo</label>
                  <input 
                    type="date" 
                    value={newTask.date}
                    onChange={(e) => setNewTask({...newTask, date: e.target.value})}
                    className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                  />
                </div>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsAddingTask(false)}
                  className="flex-1 py-2.5 rounded-lg border border-border text-white hover:bg-white/5 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors font-medium"
                >
                  Criar Tarefa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {taskToDelete !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-heading font-bold text-white">Excluir Tarefa</h2>
            </div>
            <div className="p-6">
              <p className="text-text-secondary">Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.</p>
            </div>
            <div className="p-6 border-t border-border flex justify-end gap-3 bg-background/50">
              <button 
                onClick={() => setTaskToDelete(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleDeleteTask(taskToDelete)}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Modal */}
      {isWhatsAppModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <MessageCircle size={20} className="text-emerald-500" />
                </div>
                <h2 className="text-xl font-heading font-bold text-white">Resumo para WhatsApp</h2>
              </div>
              <button 
                onClick={() => setIsWhatsAppModalOpen(false)}
                className="text-text-secondary hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                  <p className="text-text-secondary animate-pulse">Gerando mensagem personalizada com IA...</p>
                </div>
              ) : (
                <div className="bg-background border border-border rounded-lg p-4 whitespace-pre-wrap text-sm text-white font-mono leading-relaxed">
                  {generatedMessage}
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-border bg-secondary/30 flex gap-3">
              <button 
                onClick={() => setIsWhatsAppModalOpen(false)}
                className="flex-1 py-2.5 rounded-lg border border-border text-white hover:bg-white/5 transition-colors font-medium text-sm"
              >
                Fechar
              </button>
              <button 
                onClick={copyToClipboard}
                disabled={isGenerating || !generatedMessage}
                className="flex-1 py-2.5 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isCopied ? (
                  <>
                    <Check size={18} />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy size={18} />
                    Copiar Mensagem
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
