import React, { useState, useEffect, useRef } from 'react';
import { 
  FolderKanban, 
  DollarSign, 
  CircleAlert, 
  ArrowUpRight,
  ArrowDownRight,
  X,
  Calendar as CalendarIcon,
  Check,
  CheckCircle,
  GripHorizontal,
  MessageSquare,
  Settings,
  Plus
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy, 
  doc, 
  updateDoc 
} from 'firebase/firestore';

const AVAILABLE_WIDGETS = [
  { id: 'metric-projects', title: 'Projetos Ativos', type: 'metric' },
  { id: 'metric-mentions', title: 'Menções em Atividades', type: 'metric' },
  { id: 'metric-overdue', title: 'Tarefas Atrasadas', type: 'metric' },
  { id: 'metric-revenue-roi', title: 'Receita do Mês & ROI', type: 'metric' },
  { id: 'list-my-activities', title: 'Minhas Atividades', type: 'list' },
];

const DEFAULT_LAYOUT = [
  'metric-projects',
  'metric-mentions',
  'metric-overdue',
  'list-my-activities'
];

function MetricCard({ title, value, trend, trendValue, icon: Icon, colorClass = "text-accent", onRemove, isEditing }: any) {
  return (
    <div className="glass-card p-6 flex flex-col gap-4 relative group">
      {isEditing && (
        <button 
          onClick={onRemove}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
        >
          <X size={14} />
        </button>
      )}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-secondary">{title}</span>
        <div className="p-2 bg-secondary rounded-lg">
          <Icon size={20} className={colorClass} />
        </div>
      </div>
      <div>
        <h3 className="text-3xl font-heading font-bold text-white">{value}</h3>
        {trendValue && (
          <div className="flex items-center gap-2 mt-2">
            {trend === 'up' ? (
              <ArrowUpRight size={16} className="text-emerald-500" />
            ) : trend === 'down' ? (
              <ArrowDownRight size={16} className="text-red-500" />
            ) : null}
            <span className={cn(
              "text-sm font-medium",
              trend === 'up' ? "text-emerald-500" : trend === 'down' ? "text-red-500" : "text-text-secondary"
            )}>
              {trendValue}
            </span>
            <span className="text-xs text-text-secondary">vs. mês anterior</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [layout, setLayout] = useState<string[]>(() => {
    const saved = localStorage.getItem('dashboard-layout-v3');
    return saved ? JSON.parse(saved) : DEFAULT_LAYOUT;
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [financialRecords, setFinancialRecords] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    // Real-time listeners
    const unsubProjects = onSnapshot(collection(db, 'projects'), (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubTasks = onSnapshot(query(collection(db, 'tasks'), orderBy('date', 'asc')), (snapshot) => {
      const allTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTasks(allTasks);
    });

    const unsubFinancial = onSnapshot(collection(db, 'financial_records'), (snapshot) => {
      setFinancialRecords(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubTeam = onSnapshot(collection(db, 'team_members'), (snapshot) => {
      setTeamMembers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubProjects();
      unsubTasks();
      unsubFinancial();
      unsubTeam();
    };
  }, [user]);

  const currentUserAvatar = teamMembers.find(m => m?.email === user?.email)?.avatar;

  const filteredTasks = tasks
    .filter(task => {
      if (user?.email) return task.user === user.email || task.user === currentUserAvatar;
      return false;
    })
    .filter(task => task.status !== 'done');

  const totalRevenue = financialRecords
    .filter(r => r.type === 'income')
    .reduce((acc, curr) => acc + curr.value, 0);
  
  const totalExpenses = financialRecords
    .filter(r => r.type === 'expense')
    .reduce((acc, curr) => acc + curr.value, 0);

  const roi = totalExpenses > 0 ? ((totalRevenue - totalExpenses) / totalExpenses * 100).toFixed(0) : '0';

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, position: number) => {
    dragItem.current = position;
    e.currentTarget.style.opacity = '0.5';
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, position: number) => {
    dragOverItem.current = position;
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.style.opacity = '1';
    if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
      const newLayout = [...layout];
      const draggedItemContent = newLayout[dragItem.current];
      newLayout.splice(dragItem.current, 1);
      newLayout.splice(dragOverItem.current, 0, draggedItemContent);
      setLayout(newLayout);
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };

  useEffect(() => {
    localStorage.setItem('dashboard-layout-v3', JSON.stringify(layout));
  }, [layout]);

  const removeWidget = (id: string) => {
    setLayout(prev => prev.filter(w => w !== id));
  };

  const addWidget = (id: string) => {
    if (!layout.includes(id)) {
      setLayout(prev => [...prev, id]);
    }
    setShowAddWidget(false);
  };

  const updateTaskStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'tasks', id), { status: newStatus });
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const updateTaskDate = async (id: string, newDate: string) => {
    try {
      await updateDoc(doc(db, 'tasks', id), { date: newDate });
    } catch (error) {
      console.error('Error updating task date:', error);
    }
  };

  const renderWidget = (id: string, index: number) => {
    const dragProps = isEditing ? {
      draggable: true,
      onDragStart: (e: React.DragEvent<HTMLDivElement>) => handleDragStart(e, index),
      onDragEnter: (e: React.DragEvent<HTMLDivElement>) => handleDragEnter(e, index),
      onDragEnd: handleDragEnd,
      onDragOver: (e: React.DragEvent<HTMLDivElement>) => e.preventDefault(),
      className: "cursor-move relative group",
    } : { className: "relative group" };

    const renderContent = () => {
      switch (id) {
        case 'metric-mentions':
          const mentionsCount = filteredTasks.length;
          return <MetricCard key={id} title="Menções em Atividades" value={mentionsCount.toString()} trend="neutral" trendValue="" icon={MessageSquare} onRemove={() => removeWidget(id)} isEditing={isEditing} />;
        case 'metric-projects':
          const activeProjectsCount = projects.filter(p => p.status === 'active').length;
          return <MetricCard key={id} title="Projetos Ativos" value={activeProjectsCount.toString()} trend="up" trendValue="" icon={FolderKanban} onRemove={() => removeWidget(id)} isEditing={isEditing} />;
        case 'metric-revenue-roi':
          return <MetricCard key={id} title="Receita Total & ROI" value={`R$ ${totalRevenue.toLocaleString('pt-BR')}`} trend="up" trendValue={`ROI: ${roi}%`} icon={DollarSign} colorClass="text-emerald-500" onRemove={() => removeWidget(id)} isEditing={isEditing} />;
        case 'metric-overdue':
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const overdueCount = tasks.filter(t => {
            const taskDate = new Date(t.date + 'T00:00:00');
            return taskDate < today && t.status !== 'done';
          }).length;
          const hasOverdue = overdueCount > 0;
          return <MetricCard key={id} title="Tarefas Atrasadas" value={overdueCount.toString()} trend="" trendValue="" icon={hasOverdue ? CircleAlert : CheckCircle} colorClass={hasOverdue ? "text-red-500" : "text-emerald-500"} onRemove={() => removeWidget(id)} isEditing={isEditing} />;
        
        case 'list-my-activities':
          return (
            <div key={id} className="glass-panel p-6 flex flex-col gap-6 relative h-full">
              {isEditing && (
                <button onClick={() => removeWidget(id)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <X size={14} />
                </button>
              )}
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-lg text-white">Minhas Atividades</h3>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => window.location.href = '/activities'}
                    className="text-sm text-primary hover:text-accent font-medium transition-colors"
                  >
                    Ver todas
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-border text-text-secondary text-sm">
                      <th className="pb-3 font-medium">Tarefa</th>
                      <th className="pb-3 font-medium">Projeto</th>
                      <th className="pb-3 font-medium">Data</th>
                      <th className="pb-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.map((task) => (
                      <tr key={task.id} className="border-b border-border/50 hover:bg-card/50 transition-colors">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            {(() => {
                              const member = teamMembers.find(m => m?.email === task.user || m?.avatar === task.user);
                              const avatar = member?.avatar || task.user;
                              return avatar?.startsWith('http') || avatar?.startsWith('data:') ? (
                                <img 
                                  src={avatar} 
                                  alt="User" 
                                  title={member?.name || 'Usuário'}
                                  className="w-8 h-8 rounded-full border border-border object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : avatar ? (
                                <img 
                                  src={`https://picsum.photos/seed/${avatar}/32/32`} 
                                  alt="User" 
                                  title={member?.name || 'Usuário'}
                                  className="w-8 h-8 rounded-full border border-border object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full border border-border bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                                  U
                                </div>
                              );
                            })()}
                            <span className={cn("text-sm font-medium", task.status === 'done' ? "text-text-secondary line-through" : "text-white")}>
                              {task.title}
                            </span>
                          </div>
                        </td>
                        <td className="py-4">
                          <span className="text-xs text-text-secondary bg-secondary px-2 py-1 rounded-md border border-border">
                            {task.project}
                          </span>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <CalendarIcon size={14} className="text-text-secondary" />
                            <input 
                              type="date" 
                              value={task.date}
                              onChange={(e) => updateTaskDate(task.id, e.target.value)}
                              className="bg-transparent text-sm text-text-secondary focus:text-white focus:outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                            />
                          </div>
                        </td>
                        <td className="py-4">
                          <select 
                            value={task.status || ''}
                            onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                            className={cn(
                              "text-xs font-medium px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none appearance-none",
                              task.status === 'pending' && "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
                              task.status === 'in-progress' && "bg-primary/10 text-accent border-primary/20",
                              task.status === 'todo' && "bg-secondary text-text-secondary border-border",
                              task.status === 'done' && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            )}
                          >
                            <option value="todo" className="bg-background text-white">A fazer</option>
                            <option value="pending" className="bg-background text-white">Pendente</option>
                            <option value="in-progress" className="bg-background text-white">Em andamento</option>
                            <option value="done" className="bg-background text-white">Concluído</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
          
        default:
          return null;
      }
    };

    return (
      <div key={id} {...dragProps} className={cn(dragProps.className, "h-full")}>
        {isEditing && (
          <div className="absolute top-2 right-2 z-20 cursor-grab active:cursor-grabbing p-1 bg-black/50 rounded-md text-white/50 hover:text-white transition-colors">
            <GripHorizontal size={16} />
          </div>
        )}
        {renderContent()}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-white">Dashboard</h1>
          <p className="text-text-secondary mt-1">Visão geral da sua operação de marketing.</p>
        </div>
        <div className="flex items-center gap-3 relative">
          {isEditing ? (
            <>
              <button 
                onClick={() => setShowAddWidget(!showAddWidget)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-primary text-primary hover:bg-primary/10 transition-colors text-sm font-medium"
              >
                <Plus size={16} />
                Adicionar Bloco
              </button>
              <button 
                onClick={() => { setIsEditing(false); setShowAddWidget(false); }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors text-sm font-medium"
              >
                <Check size={16} />
                Concluir Edição
              </button>
              
              {showAddWidget && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="p-3 border-b border-border bg-secondary/50">
                    <h4 className="text-sm font-medium text-white">Blocos Disponíveis</h4>
                  </div>
                  <div className="max-h-64 overflow-y-auto p-2">
                    {AVAILABLE_WIDGETS.filter(w => !layout.includes(w.id)).length === 0 ? (
                      <p className="text-xs text-text-secondary p-2 text-center">Todos os blocos já foram adicionados.</p>
                    ) : (
                      AVAILABLE_WIDGETS.filter(w => !layout.includes(w.id)).map(widget => (
                        <button
                          key={widget.id}
                          onClick={() => addWidget(widget.id)}
                          className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:text-white hover:bg-secondary rounded-lg transition-colors flex items-center justify-between group"
                        >
                          {widget.title}
                          <Plus size={14} className="opacity-0 group-hover:opacity-100 text-primary" />
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <button 
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary border border-border text-white hover:border-primary/50 transition-colors text-sm font-medium"
            >
              <Settings size={16} />
              Editar Dashboard
            </button>
          )}
        </div>
      </header>

      {layout.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {layout.map((id, index) => {
            const type = AVAILABLE_WIDGETS.find(w => w.id === id)?.type;
            const colSpanClass = 
              type === 'metric' ? 'col-span-1' : 
              'col-span-1 md:col-span-3';
            
            return (
              <div key={id} className={colSpanClass}>
                {renderWidget(id, index)}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 glass-panel border-dashed">
          <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
            <Settings size={24} className="text-text-secondary" />
          </div>
          <h3 className="text-lg font-heading font-bold text-white mb-2">Dashboard Vazio</h3>
          <p className="text-text-secondary text-center max-w-md mb-6">
            Você removeu todos os blocos. Clique em "Editar Dashboard" para adicionar novos blocos e personalizar sua visão.
          </p>
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors text-sm font-medium"
            >
              Editar Dashboard
            </button>
          )}
        </div>
      )}
    </div>
  );
}

