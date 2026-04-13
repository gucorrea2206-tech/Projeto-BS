import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
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
import { cn } from '../lib/utils';

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

export function Team() {
  const { user, isAdmin } = useAuth();
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<any | null>(null);

  const [newMember, setNewMember] = useState({
    name: '',
    role: '',
    email: '',
    phone: '',
    permission: 'collaborator'
  });

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    setError(null);

    const unsubTeam = onSnapshot(query(collection(db, 'team_members'), orderBy('name')), (snapshot) => {
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
            role: isAdmin ? 'Administrador' : 'Colaborador',
            permission: isAdmin ? 'admin' : 'collaborator'
          }
        ];
      }
      setTeamMembers(updatedMembers.filter(Boolean));
      setIsLoading(false);
    }, (err) => {
      console.error('Error fetching team members:', err);
      setError('Erro ao carregar dados da equipe');
      setIsLoading(false);
    });

    const unsubProjects = onSnapshot(collection(db, 'projects'), (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const parsedProjects = projectsData.map(p => {
        let team: string[] = [];
        if ((p as any).description) {
          try {
            const parsed = JSON.parse((p as any).description);
            if (parsed && typeof parsed === 'object' && Array.isArray(parsed.team)) {
              team = parsed.team;
            }
          } catch (e) {
            // Not JSON
          }
        }
        return { name: (p as any).name, team };
      });
      setProjects(parsedProjects);
    });

    const unsubTasks = onSnapshot(collection(db, 'tasks'), (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubTeam();
      unsubProjects();
      unsubTasks();
    };
  }, [user, isAdmin]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name || !newMember.email) return;

    const newMemberData = {
      ...newMember,
      avatar: `user${Math.floor(Math.random() * 100)}`,
      created_at: serverTimestamp()
    };

    try {
      await addDoc(collection(db, 'team_members'), newMemberData);
      setIsAddingMember(false);
      setNewMember({ name: '', role: '', email: '', phone: '', permission: 'collaborator' });
    } catch (error: any) {
      console.error('Error adding member to Firestore:', error);
      alert('Ocorreu um erro ao adicionar o membro. Tente novamente.');
    }
  };

  const handleRemoveMember = async (id: any) => {
    try {
      await deleteDoc(doc(db, 'team_members', id));
    } catch (error) {
      console.error('Error removing member from Firestore:', error);
    } finally {
      setActiveMenuId(null);
      setMemberToRemove(null);
    }
  };

  return (
    <div className="flex flex-col gap-8 h-full relative" onClick={() => setActiveMenuId(null)}>
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-white">Equipe</h1>
          <p className="text-text-secondary mt-1">Gerencie os membros da sua equipe e permissões.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setIsAddingMember(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors text-sm font-medium"
          >
            <Plus size={18} />
            Adicionar Membro
          </button>
        )}
      </header>

      {/* Team Grid */}
      {error ? (
        <div className="flex flex-col items-center justify-center py-20 text-red-500">
          <ShieldAlert size={48} className="mb-4 opacity-50" />
          <p className="font-medium text-lg">Erro ao carregar equipe</p>
          <p className="text-sm opacity-80 mt-2">{error}</p>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {teamMembers.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-text-secondary">
              <Users size={48} className="mb-4 opacity-20" />
              <p>Nenhum membro encontrado.</p>
            </div>
          )}
          {teamMembers.map((member, idx) => {
            try {
              const memberProjects = projects
                .filter(p => p.team && Array.isArray(p.team) && p.team.includes(member.name))
                .map(p => p.name);
                
              return (
              <div key={member.id || member.email || idx} className="glass-card flex flex-col overflow-hidden group hover:border-primary/50 transition-colors relative">
                <div className="p-6 flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      {typeof member.avatar === 'string' && (member.avatar.startsWith('http') || member.avatar.startsWith('data:')) ? (
                        <img 
                          src={member.avatar} 
                          alt={member.name || 'User'} 
                          className="w-16 h-16 rounded-full border-2 border-border object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : typeof member.avatar === 'string' && member.avatar && !member.avatar.includes('@') ? (
                        <img 
                          src={`https://picsum.photos/seed/${member.avatar}/64/64`} 
                          alt={member.name || 'User'} 
                          className="w-16 h-16 rounded-full border-2 border-border object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full border-2 border-border bg-primary/20 flex items-center justify-center text-primary font-bold text-xl">
                          {member.name ? String(member.name).substring(0, 2).toUpperCase() : String(member.email || '').substring(0, 2).toUpperCase() || 'U'}
                        </div>
                      )}
                      <div>
                        <h3 className="font-heading font-bold text-lg text-white group-hover:text-primary transition-colors">
                          {member.name || 'Usuário'}
                        </h3>
                        <p className="text-sm text-text-secondary">
                          {member.role || 'Membro'}
                        </p>
                        <p className="text-xs text-text-secondary/70 mt-0.5">
                          {member.email || 'Sem e-mail'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {isAdmin && member.id !== 'current-user' && (
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
                                setMemberToRemove(member.id);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-500/10 transition-colors text-left"
                            >
                              <Trash2 size={16} />
                              Remover Membro
                            </button>
                          </div>
                        )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5",
                      member.permission === 'admin' && "bg-primary/10 text-accent border-primary/20",
                      member.permission === 'manager' && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                      member.permission === 'collaborator' && "bg-secondary text-text-secondary border-border",
                      !member.permission && "bg-secondary text-text-secondary border-border"
                    )}>
                      {member.permission === 'admin' && <ShieldAlert size={12} />}
                      {member.permission === 'admin' && 'Admin'}
                      {member.permission === 'manager' && <Check size={12} />}
                      {member.permission === 'manager' && 'Gestor'}
                      {(member.permission === 'collaborator' || !member.permission) && 'Colaborador'}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 text-sm text-text-secondary mt-4 pt-4 border-t border-border">
                    <div className="flex items-center gap-2">
                      <Mail size={16} />
                      <a href={`mailto:${member.email}`} className="hover:text-white transition-colors">
                        {member.email || 'Sem e-mail'}
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
                      Projetos ({memberProjects.length || 0})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {memberProjects.map((project: string, idx: number) => (
                        <span 
                          key={idx}
                          className="px-2 py-1 rounded-md text-xs font-medium bg-secondary text-text-secondary border border-border"
                        >
                          {project}
                        </span>
                      ))}
                      {memberProjects.length === 0 && (
                        <span className="text-xs text-text-secondary italic">Nenhum projeto</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              );
            } catch (err) {
              console.error('Error rendering member:', member, err);
              return (
                <div key={Math.random()} className="glass-card p-6 border-red-500/50">
                  <p className="text-red-500">Erro ao carregar membro.</p>
                </div>
              );
            }
          })}
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

      {memberToRemove !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-heading font-bold text-white">Remover Membro</h2>
            </div>
            <div className="p-6">
              <p className="text-text-secondary">Tem certeza que deseja remover este membro? Esta ação não pode ser desfeita.</p>
            </div>
            <div className="p-6 border-t border-border flex justify-end gap-3 bg-background/50">
              <button 
                onClick={() => setMemberToRemove(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleRemoveMember(memberToRemove)}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
