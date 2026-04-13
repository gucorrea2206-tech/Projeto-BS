import React, { useState, useEffect } from 'react';
import { 
  User, 
  Bell, 
  Save
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { db, auth } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  addDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';

export function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    role: '',
    phone: '',
    avatar: ''
  });

  const [notifications, setNotifications] = useState({
    push_new_message: true,
    push_mention: true,
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user?.email) return;
    try {
      const q = query(collection(db, 'team_members'), where('email', '==', user.email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const data = querySnapshot.docs[0].data();
        setProfile({
          name: data.name || '',
          email: data.email || '',
          role: data.role || '',
          phone: data.phone || '',
          avatar: data.avatar || ''
        });
      } else {
        setProfile(prev => ({ ...prev, email: user?.email || '' }));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setMessage({ text: 'A imagem deve ter no máximo 2MB.', type: 'error' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.email) return;
    setIsLoading(true);
    setMessage({ text: '', type: '' });
    try {
      // Check if user exists in team_members
      const q = query(collection(db, 'team_members'), where('email', '==', user.email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const memberDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, 'team_members', memberDoc.id), {
          name: profile.name,
          role: profile.role,
          phone: profile.phone,
          avatar: profile.avatar,
          updated_at: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'team_members'), {
          name: profile.name,
          email: user.email,
          role: profile.role,
          phone: profile.phone,
          avatar: profile.avatar,
          created_at: serverTimestamp()
        });
      }

      // Update auth metadata if name changed
      if (auth.currentUser && (profile.name || profile.avatar)) {
        await updateProfile(auth.currentUser, {
          displayName: profile.name || auth.currentUser.displayName,
          photoURL: profile.avatar || auth.currentUser.photoURL
        });
      }

      setMessage({ text: 'Perfil atualizado com sucesso!', type: 'success' });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setMessage({ text: 'Erro ao atualizar perfil.', type: 'error' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'notifications', label: 'Notificações', icon: Bell },
  ];

  const handleToggle = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex flex-col gap-8 h-full max-w-5xl mx-auto w-full">
      <header>
        <h1 className="text-2xl font-heading font-bold text-white">Configurações</h1>
        <p className="text-text-secondary mt-1">Gerencie suas preferências e dados da conta.</p>
      </header>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 glass-panel p-4 flex flex-col gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors w-full text-left",
                activeTab === tab.id 
                  ? "bg-primary/20 text-white border-l-2 border-primary" 
                  : "text-text-secondary hover:bg-secondary hover:text-white border-l-2 border-transparent"
              )}
            >
              <tab.icon size={18} className={activeTab === tab.id ? "text-accent" : ""} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 glass-card p-6 md:p-8 w-full">
          {message.text && (
            <div className={cn(
              "mb-6 p-4 rounded-lg text-sm font-medium",
              message.type === 'success' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
            )}>
              {message.text}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-heading font-bold text-white mb-4">Informações Pessoais</h3>
                <div className="flex items-center gap-6 mb-6">
                  <div className="w-20 h-20 rounded-full border-2 border-border bg-primary/20 flex items-center justify-center text-primary font-bold text-2xl overflow-hidden">
                    {profile.avatar?.startsWith('http') || profile.avatar?.startsWith('data:') ? (
                      <img src={profile.avatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : profile.avatar ? (
                      <img src={`https://picsum.photos/seed/${profile.avatar}/64/64`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      profile.name ? profile.name.substring(0, 2).toUpperCase() : user?.email?.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    <label className="px-4 py-2 rounded-lg bg-secondary text-white hover:bg-border transition-colors text-sm font-medium border border-border cursor-pointer">
                      Alterar Foto
                      <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                    </label>
                    <p className="text-xs text-text-secondary mt-2">JPG, GIF ou PNG. Máximo de 2MB.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">Nome Completo</label>
                    <input 
                      type="text" 
                      value={profile.name}
                      onChange={(e) => setProfile({...profile, name: e.target.value})}
                      className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">E-mail</label>
                    <input 
                      type="email" 
                      value={profile.email}
                      disabled
                      className="w-full bg-background/50 border border-border rounded-lg px-4 py-2.5 text-sm text-text-secondary cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">Cargo</label>
                    <input 
                      type="text" 
                      value={profile.role}
                      onChange={(e) => setProfile({...profile, role: e.target.value})}
                      className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">Telefone</label>
                    <input 
                      type="tel" 
                      value={profile.phone}
                      onChange={(e) => setProfile({...profile, phone: e.target.value})}
                      className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>
              </div>
              <div className="pt-6 border-t border-border flex justify-end">
                <button 
                  onClick={handleSaveProfile}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save size={18} />
                      Salvar Alterações
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-heading font-bold text-white mb-4">Preferências de Notificação</h3>
                <p className="text-sm text-text-secondary mb-6">Escolha como você deseja ser notificado sobre as atividades nos seus projetos. (Notificações por e-mail foram desativadas).</p>
                
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-white border-b border-border pb-2">Notificações no App</h4>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">Novas mensagens</p>
                        <p className="text-xs text-text-secondary">Seja notificado sobre novos comentários nas suas tarefas.</p>
                      </div>
                      <button 
                        onClick={() => handleToggle('push_new_message')}
                        className={cn("w-11 h-6 rounded-full transition-colors relative", notifications.push_new_message ? "bg-primary" : "bg-secondary border border-border")}
                      >
                        <div className={cn("absolute top-1 w-4 h-4 rounded-full bg-white transition-all", notifications.push_new_message ? "left-6" : "left-1")} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">Menções (@)</p>
                        <p className="text-xs text-text-secondary">Seja notificado quando alguém mencionar você.</p>
                      </div>
                      <button 
                        onClick={() => handleToggle('push_mention')}
                        className={cn("w-11 h-6 rounded-full transition-colors relative", notifications.push_mention ? "bg-primary" : "bg-secondary border border-border")}
                      >
                        <div className={cn("absolute top-1 w-4 h-4 rounded-full bg-white transition-all", notifications.push_mention ? "left-6" : "left-1")} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-border flex justify-end">
                <button 
                  onClick={() => setMessage({ text: 'Preferências salvas!', type: 'success' })}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors text-sm font-medium"
                >
                  <Save size={18} />
                  Salvar Preferências
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
