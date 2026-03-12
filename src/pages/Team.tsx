import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Mail, 
  Phone, 
  MoreVertical,
  Plus,
  ShieldAlert,
  Trash2,
  X,
  Check
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

const initialTeamMembers = [
  {
    id: 1,
    name: 'Gustavo Correa',
    role: 'CEO & Estrategista',
    email: 'gu.correa98@gmail.com',
    phone: '+55 11 99999-9999',
    permission: 'admin',
    projects: ['Lançamento Alpha', 'Evergreen Beta', 'Rebranding Institucional'],
    avatar: 'user1'
  },
  {
    id: 2,
    name: 'Ana Silva',
    role: 'Gestora de Tráfego',
    email: 'ana@projetobs.com',
    phone: '+55 11 98888-8888',
    permission: 'manager',
    projects: ['Lançamento Alpha', 'Evergreen Beta'],
    avatar: 'user2'
  },
  {
    id: 3,
    name: 'Carlos Mendes',
    role: 'Copywriter',
    email: 'carlos@projetobs.com',
    phone: '+55 11 97777-7777',
    permission: 'collaborator',
    projects: ['Lançamento Alpha', 'Campanha Black Friday'],
    avatar: 'user3'
  },
  {
    id: 4,
    name: 'Beatriz Costa',
    role: 'Designer',
    email: 'beatriz@projetobs.com',
    phone: '+55 11 96666-6666',
    permission: 'collaborator',
    projects: ['Rebranding Institucional', 'Campanha Black Friday'],
    avatar: 'user4'
  },
  {
    id: 5,
    name: 'Lucas Oliveira',
    role: 'Desenvolvedor Web',
    email: 'lucas@projetobs.com',
    phone: '+55 11 95555-5555',
    permission: 'collaborator',
    projects: ['Rebranding Institucional'],
    avatar: 'user5'
  },
  {
    id: 6,
    name: 'Mariana Santos',
    role: 'Suporte & CS',
    email: 'mariana@projetobs.com',
    phone: '+55 11 94444-4444',
    permission: 'collaborator',
    projects: ['Evergreen Beta'],
    avatar: 'user6'
  }
];

import { supabase } from '../lib/supabase';

export function Team() {
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  const [newMember, setNewMember] = useState({
    name: '',
    role: '',
    email: '',
    phone: '',
    permission: 'collaborator'
  });

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setTeamMembers(data || []);
      // Sync with localStorage for components that still use it
      localStorage.setItem('team-members', JSON.stringify(data || []));
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name || !newMember.email) return;

    try {
      const { data, error } = await supabase
        .from('team_members')
        .insert({
          ...newMember,
          avatar: `user${Math.floor(Math.random() * 100)}`
        })
        .select()
        .single();

      if (error) throw error;

      setTeamMembers([data, ...teamMembers]);
      localStorage.setItem('team-members', JSON.stringify([data, ...teamMembers]));
      setIsAddingMember(false);
      setNewMember({ name: '', role: '', email: '', phone: '', permission: 'collaborator' });
    } catch (error) {
      console.error('Error adding member:', error);
      alert('Erro ao adicionar membro. Verifique se o e-mail já está cadastrado.');
    }
  };

  const handleRemoveMember = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja remover este membro?')) return;

    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', id);

      if (error) throw error;

      const updated = teamMembers.filter(m => m.id !== id);
      setTeamMembers(updated);
      localStorage.setItem('team-members', JSON.stringify(updated));
      setActiveMenuId(null);
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Erro ao remover membro.');
    }
  };

  return (
    <div className="flex flex-col gap-8 h-full relative" onClick={() => setActiveMenuId(null)}>
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-white">Equipe</h1>
          <p className="text-text-secondary mt-1">Gerencie os membros da sua equipe e permissões.</p>
        </div>
        <button 
          onClick={() => setIsAddingMember(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors text-sm font-medium"
        >
          <Plus size={18} />
          Adicionar Membro
        </button>
      </header>

      {/* Team Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {teamMembers.map(member => (
            <div key={member.id} className="glass-card flex flex-col overflow-hidden group hover:border-primary/50 transition-colors relative">
              <div className="p-6 flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <img 
                      src={`https://picsum.photos/seed/${member.avatar}/64/64`} 
                      alt={member.name} 
                      className="w-16 h-16 rounded-full border-2 border-border object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h3 className="font-heading font-bold text-lg text-white group-hover:text-primary transition-colors">
                        {member.name}
                      </h3>
                      <p className="text-sm text-text-secondary">
                        {member.role}
                      </p>
                    </div>
                  </div>
                  <div className="relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === member.id ? null : member.id);
                      }}
                      className="text-text-secondary hover:text-white transition-colors p-1"
                    >
                      <MoreVertical size={18} />
                    </button>
                    
                    {activeMenuId === member.id && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-lg shadow-xl z-10 overflow-hidden">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveMember(member.id);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-500/10 transition-colors text-left"
                        >
                          <Trash2 size={16} />
                          Remover Membro
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <span className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5",
                    member.permission === 'admin' && "bg-primary/10 text-accent border-primary/20",
                    member.permission === 'manager' && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                    member.permission === 'collaborator' && "bg-secondary text-text-secondary border-border"
                  )}>
                    {member.permission === 'admin' && <ShieldAlert size={12} />}
                    {member.permission === 'admin' && 'Admin'}
                    {member.permission === 'manager' && <Check size={12} />}
                    {member.permission === 'manager' && 'Gestor'}
                    {member.permission === 'collaborator' && 'Colaborador'}
                  </span>
                </div>

                <div className="flex flex-col gap-2 text-sm text-text-secondary mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Mail size={16} />
                    <a href={`mailto:${member.email}`} className="hover:text-white transition-colors">
                      {member.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={16} />
                    <a href={`tel:${member.phone}`} className="hover:text-white transition-colors">
                      {member.phone || 'Não informado'}
                    </a>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">
                    Projetos ({member.projects?.length || 0})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {member.projects?.map((project: string, idx: number) => (
                      <span 
                        key={idx}
                        className="px-2 py-1 rounded-md text-xs font-medium bg-secondary text-text-secondary border border-border"
                      >
                        {project}
                      </span>
                    ))}
                    {(!member.projects || member.projects.length === 0) && (
                      <span className="text-xs text-text-secondary italic">Nenhum projeto</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Member Modal */}
      {isAddingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-heading font-bold text-white">Adicionar Membro</h2>
              <button 
                onClick={() => setIsAddingMember(false)}
                className="text-text-secondary hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddMember} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">Nome Completo</label>
                <input 
                  type="text" 
                  required
                  value={newMember.name}
                  onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors"
                  placeholder="Ex: João Silva"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">E-mail</label>
                <input 
                  type="email" 
                  required
                  value={newMember.email}
                  onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors"
                  placeholder="joao@exemplo.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary">Cargo</label>
                  <input 
                    type="text" 
                    value={newMember.role}
                    onChange={(e) => setNewMember({...newMember, role: e.target.value})}
                    className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors"
                    placeholder="Ex: Designer"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary">Telefone</label>
                  <input 
                    type="tel" 
                    value={newMember.phone}
                    onChange={(e) => setNewMember({...newMember, phone: e.target.value})}
                    className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors"
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">Permissão</label>
                <select 
                  value={newMember.permission || ''}
                  onChange={(e) => setNewMember({...newMember, permission: e.target.value})}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors appearance-none"
                >
                  <option value="collaborator">Colaborador</option>
                  <option value="manager">Gestor</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsAddingMember(false)}
                  className="flex-1 py-2.5 rounded-lg border border-border text-white hover:bg-white/5 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors font-medium"
                >
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
