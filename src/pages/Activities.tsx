import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Calendar as CalendarIcon, 
  LayoutList, 
  KanbanSquare, 
  Plus,
  MoreVertical,
  Clock,
  AlertCircle,
  AlignLeft,
  X,
  Trash2
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

import { supabase } from '../lib/supabase';

const initialTasks = [
  { id: 1, title: 'Revisar copy da landing page', description: 'Revisar a copy focando nos gatilhos mentais.', project: 'Lançamento Alpha', date: '2026-08-15', status: 'todo', priority: 'high', user: 'user1' },
];

interface ActivitiesProps {
  hideHeader?: boolean;
  defaultProject?: string;
}

export function Activities({ hideHeader = false, defaultProject }: ActivitiesProps) {
  const [view, setView] = useState<'list' | 'kanban' | 'calendar'>('list');
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<string[]>(['Geral']);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [selectedUserFilter, setSelectedUserFilter] = useState('all');
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  useEffect(() => {
    fetchTeamMembers();
    fetchTasks();
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('name')
        .order('name');
      
      if (error) throw error;
      const projectNames = data?.map(p => p.name) || [];
      if (!projectNames.includes('Geral')) {
        projectNames.push('Geral');
      }
      setProjects(projectNames);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

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
      setNewTask(prev => ({ ...prev, user: teamMembers[0].avatar }));
    }
  }, [teamMembers]);

  useEffect(() => {
    setNewTask(prev => ({ ...prev, project: defaultProject || 'Geral' }));
  }, [defaultProject]);

  const baseFilteredTasks = tasks
    .filter(task => defaultProject ? task.project === defaultProject : true)
    .filter(task => selectedUserFilter === 'all' || task.user === selectedUserFilter)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const listTasks = baseFilteredTasks.filter(task => task.status !== 'done' && task.status !== 'done_late');

  const toggleTaskStatus = async (taskId: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    let newStatus = 'todo';
    if (task.status !== 'done' && task.status !== 'done_late') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const taskDate = new Date(task.date + 'T00:00:00');
      newStatus = taskDate < today ? 'done_late' : 'done';
    }
    
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId);
      
      if (error) throw error;
      
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      if (selectedTask?.id === taskId) {
        setSelectedTask({ ...selectedTask, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const updateTaskStatus = async (taskId: number, newStatus: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    let finalStatus = newStatus;
    if (newStatus === 'done') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const taskDate = new Date(task.date + 'T00:00:00');
      finalStatus = taskDate < today ? 'done_late' : 'done';
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: finalStatus })
        .eq('id', taskId);
      
      if (error) throw error;
      
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: finalStatus } : t));
      if (selectedTask?.id === taskId) {
        setSelectedTask({ ...selectedTask, status: finalStatus });
      }
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title) {
      alert('Por favor, insira um título para a tarefa.');
      return;
    }

    // Ensure a user is selected if team members exist
    const taskToInsert = { ...newTask };
    if (!taskToInsert.user && teamMembers.length > 0) {
      taskToInsert.user = teamMembers[0].avatar;
    }

    try {
      console.log('Attempting to insert task:', taskToInsert);
      const { data, error, status, statusText } = await supabase
        .from('tasks')
        .insert([taskToInsert])
        .select()
        .single();
      
      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          status,
          statusText
        });
        throw error;
      }

      if (!data) {
        throw new Error('Nenhum dado retornado após a inserção.');
      }

      setTasks([data, ...tasks]);
      setIsAddingTask(false);
      setNewTask({
        title: '',
        description: '',
        project: defaultProject || 'Geral',
        date: new Date().toISOString().split('T')[0],
        priority: 'medium',
        status: 'todo',
        user: teamMembers.length > 0 ? teamMembers[0].avatar : ''
      });
      alert('Tarefa criada com sucesso!');
    } catch (error: any) {
      console.error('Full error object:', error);
      const errorMessage = error.message || 'Erro desconhecido';
      const errorDetail = error.details ? ` (${error.details})` : '';
      alert(`Erro ao criar tarefa: ${errorMessage}${errorDetail}\n\nVerifique se as tabelas foram criadas no Supabase.`);
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta tarefa?')) {
      try {
        const { error } = await supabase
          .from('tasks')
          .delete()
          .eq('id', id);
        
        if (error) throw error;

        setTasks(tasks.filter(t => t.id !== id));
        setActiveMenuId(null);
        if (selectedTask?.id === id) setSelectedTask(null);
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  return (
    <div className="flex flex-col gap-8 h-full relative" onClick={() => setActiveMenuId(null)}>
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
            <select 
              className="bg-background border border-border rounded-md px-3 py-1 text-sm text-text-secondary focus:outline-none focus:border-primary"
              value={selectedUserFilter || ''}
              onChange={(e) => setSelectedUserFilter(e.target.value)}
            >
              <option value="all">Todos os usuários</option>
              {teamMembers.map(member => (
                <option key={member.id} value={member.avatar}>{member.name}</option>
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
                <KanbanSquare size={18} />
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
                {listTasks.map((task, idx) => (
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
                        checked={task.status === 'done' || task.status === 'done_late'}
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
                          (task.status === 'done' || task.status === 'done_late') ? "text-text-secondary line-through" : "text-white"
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
                      <img 
                        src={`https://picsum.photos/seed/${task.user}/32/32`} 
                        alt="User" 
                        title={teamMembers.find(m => m.avatar === task.user)?.name || 'Usuário'}
                        className="w-8 h-8 rounded-full border border-border object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-sm text-text-secondary whitespace-nowrap">
                        <Clock size={14} />
                        {task.date}
                      </div>
                    </td>
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <select 
                        value={task.status === 'done_late' ? 'done' : task.status || ''}
                        onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                        className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-medium border appearance-none cursor-pointer outline-none",
                          task.status === 'in-progress' && "bg-primary/10 text-accent border-primary/20",
                          task.status === 'todo' && "bg-secondary text-text-secondary border-border",
                          (task.status === 'done' || task.status === 'done_late') && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
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
                                handleDeleteTask(task.id);
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
                ))}
              </tbody>
            </table>
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
                ? (t.status === 'done' || t.status === 'done_late')
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
                                  handleDeleteTask(task.id);
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
                        (task.status === 'done' || task.status === 'done_late') ? "text-text-secondary line-through" : "text-white"
                      )}>{task.title}</h4>
                      
                      <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/50">
                        <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                          <Clock size={12} />
                          {task.date}
                        </div>
                        <div className="flex items-center gap-2">
                          {task.description && <AlignLeft size={12} className="text-text-secondary" />}
                          <img 
                            src={`https://picsum.photos/seed/${task.user}/24/24`} 
                            alt="User" 
                            title={teamMembers.find(m => m.avatar === task.user)?.name || 'Usuário'}
                            className="w-6 h-6 rounded-full border border-border object-cover"
                            referrerPolicy="no-referrer"
                          />
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

      {/* Calendar View (Placeholder) */}
      {view === 'calendar' && (
        <div className="glass-panel flex-1 flex items-center justify-center flex-col gap-4 text-text-secondary">
          <CalendarIcon size={48} className="opacity-20" />
          <p>Visualização de calendário em desenvolvimento.</p>
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
                  checked={selectedTask.status === 'done' || selectedTask.status === 'done_late'}
                  onChange={() => {
                    toggleTaskStatus(selectedTask.id);
                  }}
                  className="rounded border-border bg-background text-primary focus:ring-primary w-5 h-5 cursor-pointer" 
                />
                <h3 className="font-heading font-bold text-white">Detalhes da Tarefa</h3>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    if (window.confirm('Tem certeza que deseja excluir esta tarefa?')) {
                      setTasks(tasks.filter(t => t.id !== selectedTask.id));
                      setSelectedTask(null);
                    }
                  }}
                  className="p-2 text-text-secondary hover:text-red-500 transition-colors"
                  title="Excluir Tarefa"
                >
                  <AlertCircle size={20} />
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
                  className={cn(
                    "w-full bg-transparent text-xl font-heading font-bold focus:outline-none focus:border-b focus:border-primary pb-1 transition-all",
                    (selectedTask.status === 'done' || selectedTask.status === 'done_late') ? "text-text-secondary line-through" : "text-white"
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-text-secondary uppercase tracking-wider font-medium">Status</span>
                  <select 
                    value={selectedTask.status === 'done_late' ? 'done' : selectedTask.status || ''}
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
                            await supabase.from('tasks').update({ user: newUser }).eq('id', selectedTask.id);
                            setTasks(tasks.map(t => t.id === selectedTask.id ? { ...t, user: newUser } : t));
                          } catch (err) {
                            console.error('Error updating task user:', err);
                          }
                        }}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-transparent focus:outline-none focus:border-primary transition-colors appearance-none"
                      >
                        {teamMembers.map(member => (
                          <option key={member.id} value={member.avatar} className="text-white bg-card">{member.name}</option>
                        ))}
                      </select>
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-2">
                        {teamMembers.find(m => m.avatar === selectedTask.user) && (
                          <>
                            <img 
                              src={`https://picsum.photos/seed/${selectedTask.user}/20/20`} 
                              className="w-5 h-5 rounded-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <span className="text-sm text-white">{teamMembers.find(m => m.avatar === selectedTask.user)?.name}</span>
                          </>
                        )}
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
                      className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-transparent focus:outline-none focus:border-primary transition-colors appearance-none"
                    >
                      {teamMembers.map(member => (
                        <option key={member.id} value={member.avatar} className="text-white bg-card">{member.name}</option>
                      ))}
                    </select>
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-2">
                      {teamMembers.find(m => m.avatar === newTask.user) && (
                        <>
                          <img 
                            src={`https://picsum.photos/seed/${newTask.user}/24/24`} 
                            className="w-6 h-6 rounded-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <span className="text-sm text-white">{teamMembers.find(m => m.avatar === newTask.user)?.name}</span>
                        </>
                      )}
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
    </div>
  );
}
