import { useState, useEffect } from 'react';
import { 
  FolderKanban, 
  MoreVertical, 
  Calendar, 
  Users, 
  Target,
  Plus,
  ArrowLeft,
  CheckCircle,
  ChevronRight,
  Edit2,
  Trash2,
  Repeat,
  Tag
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Funnels } from './Funnels';
import { Activities } from './Activities';
import { supabase } from '../lib/supabase';

export function Projects() {
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [creationStep, setCreationStep] = useState(1);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [projectDetailsTab, setProjectDetailsTab] = useState('overview');
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    type: 'Lançamento',
    recurrence: '',
    startDate: '',
    endDate: '',
    status: 'active',
    team: [] as string[],
    color: 'bg-primary'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [projectsRes, tasksRes, teamRes] = await Promise.all([
        supabase.from('projects').select('*').order('created_at', { ascending: false }),
        supabase.from('tasks').select('*'),
        supabase.from('team_members').select('*')
      ]);

      if (projectsRes.error) throw projectsRes.error;
      if (tasksRes.error) throw tasksRes.error;
      if (teamRes.error) throw teamRes.error;

      setTasks(tasksRes.data || []);
      setTeamMembers(teamRes.data || []);
      
      const parsedProjects = (projectsRes.data || []).map(p => {
        let parsedDesc = { text: p.description, type: 'Lançamento', recurrence: '', team: [], color: 'bg-primary' };
        try {
          const parsed = JSON.parse(p.description);
          if (parsed && typeof parsed === 'object' && parsed.text !== undefined) {
            parsedDesc = { ...parsedDesc, ...parsed };
          }
        } catch (e) {
          // It's just a regular string
        }
        
        // Calculate progress
        const projectTasks = (tasksRes.data || []).filter(t => t.project === p.name);
        const completedTasks = projectTasks.filter(t => t.status === 'done' || t.status === 'done_late').length;
        const progress = projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : 0;

        return {
          ...p,
          descriptionText: parsedDesc.text,
          type: parsedDesc.type,
          recurrence: parsedDesc.recurrence,
          team: parsedDesc.team,
          color: parsedDesc.color,
          progress
        };
      });

      setProjectsList(parsedProjects);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProjects = projectsList.filter(p => {
    if (activeTab === 'all') return true;
    return p.status === activeTab;
  });

  const handleCreateProject = async () => {
    try {
      const descObj = {
        text: projectForm.description,
        type: projectForm.type,
        recurrence: projectForm.recurrence,
        team: projectForm.team,
        color: projectForm.color
      };

      const { data, error } = await supabase
        .from('projects')
        .insert([{
          name: projectForm.name,
          description: JSON.stringify(descObj),
          status: projectForm.status,
          start_date: projectForm.startDate || null,
          end_date: projectForm.endDate || null,
          progress: 0
        }])
        .select()
        .single();

      if (error) throw error;
      
      await fetchData();
      setIsCreatingProject(false);
      setCreationStep(1);
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const handleEditProject = async () => {
    if (!selectedProject) return;
    
    try {
      const descObj = {
        text: projectForm.description,
        type: projectForm.type,
        recurrence: projectForm.recurrence,
        team: projectForm.team,
        color: projectForm.color
      };

      const { error } = await supabase
        .from('projects')
        .update({
          name: projectForm.name,
          description: JSON.stringify(descObj),
          status: projectForm.status,
          start_date: projectForm.startDate || null,
          end_date: projectForm.endDate || null
        })
        .eq('id', selectedProject.id);

      if (error) throw error;
      
      await fetchData();
      
      // Update selected project view
      setSelectedProject({
        ...selectedProject,
        name: projectForm.name,
        descriptionText: projectForm.description,
        type: projectForm.type,
        recurrence: projectForm.recurrence,
        team: projectForm.team,
        color: projectForm.color,
        status: projectForm.status,
        start_date: projectForm.startDate,
        end_date: projectForm.endDate
      });
      
      setIsEditingProject(false);
    } catch (error) {
      console.error('Error updating project:', error);
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
      setProjectsList(prev => prev.filter(p => p.id !== id));
      setActiveMenuId(null);
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const openEditProject = (projectToEdit = selectedProject) => {
    if (!projectToEdit) return;
    setProjectForm({
      name: projectToEdit.name,
      description: projectToEdit.descriptionText,
      type: projectToEdit.type || 'Lançamento',
      recurrence: projectToEdit.recurrence || '',
      startDate: projectToEdit.start_date || '',
      endDate: projectToEdit.end_date || '',
      status: projectToEdit.status,
      team: projectToEdit.team || [],
      color: projectToEdit.color || 'bg-primary'
    });
    setSelectedProject(projectToEdit);
    setCreationStep(1);
    setIsEditingProject(true);
    setActiveMenuId(null);
  };

  const openCreateProject = () => {
    setProjectForm({
      name: '',
      description: '',
      type: 'Lançamento',
      recurrence: '',
      startDate: '',
      endDate: '',
      status: 'active',
      team: [],
      color: 'bg-primary'
    });
    setIsCreatingProject(true);
    setCreationStep(1);
  };

  if (isCreatingProject || isEditingProject) {
    const isEditing = isEditingProject;
    const handleNext = () => setCreationStep(prev => prev + 1);
    const handleBack = () => setCreationStep(prev => prev - 1);
    const handleCancel = () => {
      setIsCreatingProject(false);
      setIsEditingProject(false);
      setCreationStep(1);
    };

    return (
      <div className="flex flex-col gap-8 h-full">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleCancel}
              className="p-2 rounded-lg hover:bg-white/5 text-text-secondary hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-heading font-bold text-white">
                {isEditing ? 'Editar Projeto' : 'Novo Projeto'}
              </h1>
              <p className="text-text-secondary mt-1">
                {isEditing ? 'Atualize as informações do projeto.' : 'Siga os passos para criar um novo projeto.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className={cn(creationStep >= 1 ? "text-primary" : "text-text-secondary")}>Detalhes</span>
            <ChevronRight size={16} className="text-text-secondary" />
            <span className={cn(creationStep >= 2 ? "text-primary" : "text-text-secondary")}>Funil</span>
            <ChevronRight size={16} className="text-text-secondary" />
            <span className={cn(creationStep >= 3 ? "text-primary" : "text-text-secondary")}>Revisão</span>
          </div>
        </header>

        <div className="flex-1 overflow-hidden flex flex-col">
          {creationStep === 1 && (
            <div className="max-w-2xl mx-auto w-full glass-card p-8 rounded-xl space-y-6 overflow-y-auto">
              <h2 className="text-xl font-heading font-bold text-white mb-6">Informações Básicas</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary">Nome do Projeto</label>
                  <input 
                    type="text" 
                    value={projectForm.name}
                    onChange={e => setProjectForm({...projectForm, name: e.target.value})}
                    placeholder="Ex: Lançamento Semente" 
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">Tipo</label>
                    <select 
                      value={projectForm.type}
                      onChange={e => setProjectForm({...projectForm, type: e.target.value})}
                      className="w-full bg-background border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                    >
                      <option value="Lançamento">Lançamento</option>
                      <option value="Perpétuo">Perpétuo</option>
                      <option value="Institucional">Institucional</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">Recorrência (Opcional)</label>
                    <input 
                      type="text" 
                      value={projectForm.recurrence}
                      onChange={e => setProjectForm({...projectForm, recurrence: e.target.value})}
                      placeholder="Ex: Toda sexta-feira" 
                      className="w-full bg-background border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary">Descrição</label>
                  <textarea 
                    value={projectForm.description}
                    onChange={e => setProjectForm({...projectForm, description: e.target.value})}
                    placeholder="Descreva o objetivo deste projeto..." 
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors resize-none h-32" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary">Equipe do Projeto</label>
                  <div className="flex flex-wrap gap-2">
                    {teamMembers.map(member => (
                      <button
                        key={member.id}
                        onClick={() => {
                          const isSelected = projectForm.team.includes(member.name);
                          setProjectForm({
                            ...projectForm,
                            team: isSelected 
                              ? projectForm.team.filter(t => t !== member.name)
                              : [...projectForm.team, member.name]
                          });
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors flex items-center gap-2",
                          projectForm.team.includes(member.name)
                            ? "bg-primary/20 border-primary text-white"
                            : "bg-background border-border text-text-secondary hover:text-white hover:border-text-secondary"
                        )}
                      >
                        <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[10px] text-white">
                          {member.name.charAt(0)}
                        </div>
                        {member.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">Data de Início</label>
                    <input 
                      type="date" 
                      value={projectForm.startDate}
                      onChange={e => setProjectForm({...projectForm, startDate: e.target.value})}
                      className="w-full bg-background border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">Data de Término</label>
                    <input 
                      type="date" 
                      value={projectForm.endDate}
                      onChange={e => setProjectForm({...projectForm, endDate: e.target.value})}
                      className="w-full bg-background border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert" 
                    />
                  </div>
                </div>
                {isEditing && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-text-secondary">Status</label>
                      <select 
                        value={projectForm.status || ''}
                        onChange={e => setProjectForm({...projectForm, status: e.target.value})}
                        className="w-full bg-background border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                      >
                        <option value="active">Em andamento</option>
                        <option value="paused">Pausado</option>
                        <option value="completed">Concluído</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end pt-6">
                <button 
                  onClick={handleNext}
                  className="px-6 py-3 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors font-medium"
                >
                  Próximo Passo
                </button>
              </div>
            </div>
          )}

          {creationStep === 2 && (
            <div className="flex-1 flex flex-col h-full">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-heading font-bold text-white">Desenhe o Funil do Projeto</h2>
                <p className="text-sm text-text-secondary">Todo projeto precisa de um funil mapeado.</p>
              </div>
              <div className="flex-1 min-h-[500px] border border-border rounded-xl overflow-hidden">
                <Funnels hideHeader />
              </div>
              <div className="flex justify-between pt-6">
                <button 
                  onClick={handleBack}
                  className="px-6 py-3 rounded-lg border border-border text-white hover:bg-white/5 transition-colors font-medium"
                >
                  Voltar
                </button>
                <button 
                  onClick={handleNext}
                  className="px-6 py-3 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors font-medium"
                >
                  Próximo Passo
                </button>
              </div>
            </div>
          )}

          {creationStep === 3 && (
            <div className="max-w-2xl mx-auto w-full glass-card p-8 rounded-xl space-y-8 text-center">
              <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40} />
              </div>
              <div>
                <h2 className="text-2xl font-heading font-bold text-white mb-2">Projeto Quase Pronto!</h2>
                <p className="text-text-secondary">Revise as informações e {isEditing ? 'salve' : 'crie'} seu projeto.</p>
              </div>
              <div className="bg-background rounded-lg p-6 text-left space-y-4 border border-border">
                <div>
                  <span className="text-xs text-text-secondary uppercase tracking-wider font-medium">Nome</span>
                  <p className="text-white font-medium mt-1">{projectForm.name || 'Lançamento Semente'}</p>
                </div>
                <div className="flex gap-8">
                  <div>
                    <span className="text-xs text-text-secondary uppercase tracking-wider font-medium">Tipo</span>
                    <p className="text-white font-medium mt-1">{projectForm.type}</p>
                  </div>
                  {projectForm.recurrence && (
                    <div>
                      <span className="text-xs text-text-secondary uppercase tracking-wider font-medium">Recorrência</span>
                      <p className="text-white font-medium mt-1">{projectForm.recurrence}</p>
                    </div>
                  )}
                </div>
                <div>
                  <span className="text-xs text-text-secondary uppercase tracking-wider font-medium">Funil</span>
                  <p className="text-white font-medium mt-1">Funil mapeado</p>
                </div>
              </div>
              <div className="flex justify-between pt-6">
                <button 
                  onClick={handleBack}
                  className="px-6 py-3 rounded-lg border border-border text-white hover:bg-white/5 transition-colors font-medium"
                >
                  Voltar
                </button>
                <button 
                  onClick={isEditing ? handleEditProject : handleCreateProject}
                  className="px-6 py-3 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors font-medium"
                >
                  {isEditing ? 'Salvar Alterações' : 'Criar Projeto'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (selectedProject) {
    return (
      <div className="flex flex-col gap-8 h-full">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSelectedProject(null)}
              className="p-2 rounded-lg hover:bg-white/5 text-text-secondary hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-heading font-bold text-white">{selectedProject.name}</h1>
                <span className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium border",
                  selectedProject.status === 'active' && "bg-primary/10 text-accent border-primary/20",
                  selectedProject.status === 'paused' && "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
                  selectedProject.status === 'completed' && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                )}>
                  {selectedProject.status === 'active' && 'Em andamento'}
                  {selectedProject.status === 'paused' && 'Pausado'}
                  {selectedProject.status === 'completed' && 'Concluído'}
                </span>
                
                {selectedProject.type && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-blue-500/10 text-blue-400 border-blue-500/20 flex items-center gap-1">
                    <Tag size={12} />
                    {selectedProject.type}
                  </span>
                )}
                
                {selectedProject.recurrence && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-purple-500/10 text-purple-400 border-purple-500/20 flex items-center gap-1">
                    <Repeat size={12} />
                    {selectedProject.recurrence}
                  </span>
                )}
              </div>
              <p className="text-text-secondary mt-1">{selectedProject.descriptionText}</p>
            </div>
          </div>
          <button 
            onClick={() => openEditProject(selectedProject)}
            className="p-2 text-text-secondary hover:text-white transition-colors"
          >
            <MoreVertical size={20} />
          </button>
        </header>

        {/* Tabs */}
        <div className="flex items-center gap-6 border-b border-border">
          {[
            { id: 'overview', label: 'Visão Geral' },
            { id: 'funnel', label: 'Funil do Projeto' },
            { id: 'activities', label: 'Atividades' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setProjectDetailsTab(tab.id)}
              className={cn(
                "pb-4 text-sm font-medium transition-colors relative",
                projectDetailsTab === tab.id ? "text-white" : "text-text-secondary hover:text-white"
              )}
            >
              {tab.label}
              {projectDetailsTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-hidden">
          {projectDetailsTab === 'overview' && (
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 space-y-6">
                <div className="glass-card p-6 rounded-xl relative group">
                  <div className="flex items-center gap-3 mb-4">
                    <button 
                      onClick={() => openEditProject(selectedProject)}
                      className="text-text-secondary hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Editar"
                    >
                      <Edit2 size={16} />
                    </button>
                    <h3 className="font-heading font-bold text-white">Progresso</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full rounded-full", selectedProject.color || 'bg-primary')} 
                        style={{ width: `${selectedProject.progress}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-white">{selectedProject.progress}%</span>
                  </div>
                </div>
                <div className="glass-card p-6 rounded-xl relative group">
                  <div className="flex items-center gap-3 mb-4">
                    <button 
                      onClick={() => openEditProject(selectedProject)}
                      className="text-text-secondary hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Editar"
                    >
                      <Edit2 size={16} />
                    </button>
                    <h3 className="font-heading font-bold text-white">Descrição</h3>
                  </div>
                  <p className="text-text-secondary">{selectedProject.descriptionText}</p>
                </div>
              </div>
              <div className="space-y-6">
                <div className="glass-card p-6 rounded-xl relative group">
                  <div className="flex items-center gap-3 mb-4">
                    <button 
                      onClick={() => openEditProject(selectedProject)}
                      className="text-text-secondary hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Editar"
                    >
                      <Edit2 size={16} />
                    </button>
                    <h3 className="font-heading font-bold text-white">Detalhes</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary flex items-center gap-2"><Calendar size={16} /> Início</span>
                      <span className="text-sm font-medium text-white">{selectedProject.start_date ? new Date(selectedProject.start_date).toLocaleDateString('pt-BR') : '-'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary flex items-center gap-2"><Calendar size={16} /> Prazo</span>
                      <span className="text-sm font-medium text-white">{selectedProject.end_date ? new Date(selectedProject.end_date).toLocaleDateString('pt-BR') : 'Contínuo'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="glass-card p-6 rounded-xl relative group">
                  <div className="flex items-center gap-3 mb-4">
                    <button 
                      onClick={() => openEditProject(selectedProject)}
                      className="text-text-secondary hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Editar"
                    >
                      <Edit2 size={16} />
                    </button>
                    <h3 className="font-heading font-bold text-white">Equipe</h3>
                  </div>
                  <div className="flex flex-col gap-3">
                    {selectedProject.team && selectedProject.team.length > 0 ? (
                      selectedProject.team.map((memberName: string) => {
                        const member = teamMembers.find(m => m.name === memberName);
                        return (
                          <div key={memberName} className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-medium text-white">
                              {memberName.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{memberName}</p>
                              {member && <p className="text-xs text-text-secondary">{member.role}</p>}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-text-secondary">Nenhum membro atribuído.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          {projectDetailsTab === 'funnel' && (
            <div className="h-full border border-border rounded-xl overflow-hidden">
              <Funnels hideHeader />
            </div>
          )}
          {projectDetailsTab === 'activities' && (
            <div className="h-full">
              <Activities hideHeader defaultProject={selectedProject.name} />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 h-full">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-white">Projetos</h1>
          <p className="text-text-secondary mt-1">Gerencie seus lançamentos e campanhas.</p>
        </div>
        <button 
          onClick={openCreateProject}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors text-sm font-medium"
        >
          <Plus size={18} />
          Novo Projeto
        </button>
      </header>

      <div className="flex items-center gap-2 border-b border-border">
        {[
          { id: 'all', label: 'Todos' },
          { id: 'active', label: 'Em andamento' },
          { id: 'paused', label: 'Pausados' },
          { id: 'completed', label: 'Concluídos' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-3 text-sm font-medium transition-colors relative",
              activeTab === tab.id ? "text-white" : "text-text-secondary hover:text-white"
            )}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
            <FolderKanban size={24} className="text-text-secondary" />
          </div>
          <h3 className="text-lg font-heading font-bold text-white mb-2">Nenhum projeto encontrado</h3>
          <p className="text-text-secondary max-w-md">
            Você ainda não tem projetos nesta categoria. Clique em "Novo Projeto" para começar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div key={project.id} className="glass-card p-6 flex flex-col gap-6 group hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setSelectedProject(project)}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", "bg-primary/10 text-primary")}>
                    <FolderKanban size={20} />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-white group-hover:text-primary transition-colors">{project.name}</h3>
                    <span className={cn(
                      "text-xs font-medium",
                      project.status === 'active' ? "text-accent" :
                      project.status === 'paused' ? "text-yellow-500" :
                      "text-emerald-500"
                    )}>
                      {project.status === 'active' && 'Em andamento'}
                      {project.status === 'paused' && 'Pausado'}
                      {project.status === 'completed' && 'Concluído'}
                    </span>
                  </div>
                </div>
                <div className="relative" onClick={e => e.stopPropagation()}>
                  <button 
                    onClick={() => setActiveMenuId(activeMenuId === project.id ? null : project.id)}
                    className="p-1 text-text-secondary hover:text-white transition-colors rounded-lg hover:bg-white/5"
                  >
                    <MoreVertical size={18} />
                  </button>
                  
                  {activeMenuId === project.id && (
                    <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                      <button 
                        onClick={() => openEditProject(project)}
                        className="w-full text-left px-4 py-2.5 text-sm text-text-secondary hover:text-white hover:bg-secondary transition-colors flex items-center gap-2"
                      >
                        <Edit2 size={16} />
                        Editar Projeto
                      </button>
                      <button 
                        onClick={() => handleDeleteProject(project.id)}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                      >
                        <Trash2 size={16} />
                        Excluir Projeto
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {project.type && (
                  <span className="px-2 py-1 rounded-md text-[10px] font-medium border bg-blue-500/10 text-blue-400 border-blue-500/20 flex items-center gap-1">
                    <Tag size={10} />
                    {project.type}
                  </span>
                )}
                {project.recurrence && (
                  <span className="px-2 py-1 rounded-md text-[10px] font-medium border bg-purple-500/10 text-purple-400 border-purple-500/20 flex items-center gap-1">
                    <Repeat size={10} />
                    {project.recurrence}
                  </span>
                )}
              </div>

              <p className="text-sm text-text-secondary line-clamp-2 flex-1">
                {project.descriptionText}
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary font-medium">Progresso</span>
                    <span className="text-white font-bold">{project.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full rounded-full", project.color || 'bg-primary')} 
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <Calendar size={14} />
                    {project.end_date ? new Date(project.end_date).toLocaleDateString('pt-BR') : 'Contínuo'}
                  </div>
                  <div className="flex items-center gap-3">
                    {project.team && project.team.length > 0 && (
                      <div className="flex -space-x-2">
                        {project.team.slice(0, 3).map((memberName: string, i: number) => (
                          <div 
                            key={i} 
                            className="w-6 h-6 rounded-full bg-secondary border-2 border-background flex items-center justify-center text-[8px] font-bold text-white"
                            title={memberName}
                          >
                            {memberName.charAt(0)}
                          </div>
                        ))}
                        {project.team.length > 3 && (
                          <div className="w-6 h-6 rounded-full bg-secondary border-2 border-background flex items-center justify-center text-[8px] font-bold text-text-secondary">
                            +{project.team.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-xs text-text-secondary">
                      <Target size={14} />
                      {tasks.filter(t => t.project === project.name).length} tarefas
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
