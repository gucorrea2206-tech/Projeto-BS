import { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  GitMerge, 
  FolderKanban, 
  CheckSquare, 
  LineChart, 
  Users, 
  Bot, 
  Settings,
  Menu,
  X,
  LogOut,
  Bell,
  Search,
  Lock
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  limit, 
  doc, 
  updateDoc 
} from 'firebase/firestore';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: FolderKanban, label: 'Projetos', path: '/projects' },
  { icon: CheckSquare, label: 'Atividades', path: '/activities' },
  { icon: LineChart, label: 'Financeiro', path: '/financial' },
  { icon: Users, label: 'Equipe', path: '/team' },
  { icon: Lock, label: 'Acessos', path: '/accesses' },
  { icon: Settings, label: 'Configurações', path: '/settings' },
];

export function Layout() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const location = useLocation();
  const { user, isAdmin, signOut } = useAuth();

  useEffect(() => {
    if (!user?.email) return;

    const unsubProfile = onSnapshot(query(collection(db, 'team_members'), where('email', '==', user.email)), (snapshot) => {
      if (!snapshot.empty) {
        setUserProfile({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      }
    });

    const unsubNotifications = onSnapshot(query(
      collection(db, 'notifications'), 
      where('user_id', '==', user.uid), 
      orderBy('created_at', 'desc'), 
      limit(5)
    ), (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubProfile();
      unsubNotifications();
    };
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Hide sidebar on login page
  if (location.pathname === '/login') {
    return <Outlet />;
  }

  const userInitials = user?.email ? user.email.substring(0, 2).toUpperCase() : 'U';
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário';

  return (
    <div className="flex h-screen overflow-hidden bg-background text-text-primary">
      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-background transition-all duration-300 md:relative",
          isCollapsed ? "w-20" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className={cn("flex h-16 items-center border-b border-border relative", isCollapsed ? "justify-center" : "justify-between px-4")}>
          {isCollapsed ? (
            <div className="relative">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-white font-heading font-bold text-xl">
                BS
              </div>
              <button 
                onClick={() => setIsCollapsed(false)} 
                className="absolute -right-6 top-1/2 -translate-y-1/2 hidden md:flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-border text-text-secondary hover:text-white hover:bg-secondary transition-colors shadow-md z-10"
                title="Expandir menu"
              >
                <Menu size={12} />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-white font-heading font-bold text-xl">
                  BS
                </div>
                <span className="font-heading font-bold text-lg whitespace-nowrap">Projeto BS</span>
              </div>
              <button 
                onClick={() => setIsCollapsed(true)}
                className="hidden md:flex p-2 text-text-secondary hover:text-white transition-colors"
              >
                <Menu size={20} />
              </button>
            </>
          )}
          
          {/* Mobile close button is always visible on mobile when sidebar is open */}
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden p-2 text-text-secondary hover:text-white transition-colors absolute right-4"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-2 p-4 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-3 transition-all duration-200 group relative",
                  isActive 
                    ? "bg-primary/20 text-white" 
                    : "text-text-secondary hover:bg-secondary hover:text-white",
                  isCollapsed ? "justify-center" : "justify-start"
                )}
                title={isCollapsed ? item.label : undefined}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-primary rounded-r-full" />
                )}
                <item.icon 
                  size={20} 
                  className={cn(
                    "shrink-0 transition-colors",
                    isActive ? "text-accent" : "text-text-secondary group-hover:text-white"
                  )} 
                />
                {!isCollapsed && (
                  <span className="font-medium whitespace-nowrap">{item.label}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border flex flex-col gap-4">
          <div className={cn(
            "flex items-center gap-3",
            isCollapsed ? "justify-center" : "justify-start"
          )}>
            <div className="h-10 w-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold shrink-0 overflow-hidden">
              {(userProfile?.avatar || user?.user_metadata?.avatar_url)?.startsWith('http') || (userProfile?.avatar || user?.user_metadata?.avatar_url)?.startsWith('data:') ? (
                <img src={userProfile?.avatar || user?.user_metadata?.avatar_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (userProfile?.avatar || user?.user_metadata?.avatar_url) ? (
                <img src={`https://picsum.photos/seed/${userProfile?.avatar || user?.user_metadata?.avatar_url}/64/64`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : userInitials}
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden flex-1">
                <p className="text-sm font-medium text-white truncate">{userName}</p>
                <p className="text-xs text-text-secondary truncate">{user?.email}</p>
              </div>
            )}
          </div>
          
          <button 
            onClick={signOut}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-text-secondary hover:text-red-400 hover:bg-red-400/10 transition-colors",
              isCollapsed ? "justify-center" : "justify-start"
            )}
            title="Sair"
          >
            <LogOut size={20} className="shrink-0" />
            {!isCollapsed && <span className="font-medium">Sair</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Desktop Top Bar */}
        <header className="hidden md:flex h-16 items-center justify-between border-b border-border bg-background px-8 shrink-0">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative w-full">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input 
                type="text" 
                placeholder="Buscar em projetos, tarefas..." 
                className="w-full bg-secondary/50 border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-text-secondary hover:text-white hover:bg-secondary rounded-lg transition-colors relative"
              >
                <Bell size={20} />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border border-background" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
                  <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/30">
                    <h4 className="font-heading font-bold text-sm text-white">Notificações</h4>
                    <button className="text-xs text-primary hover:text-accent transition-colors">Marcar todas como lidas</button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-text-secondary text-sm">
                        Nenhuma notificação por enquanto.
                      </div>
                    ) : (
                      notifications.map(notification => (
                        <button 
                          key={notification.id}
                          onClick={() => markAsRead(notification.id)}
                          className={cn(
                            "w-full text-left p-4 border-b border-border/50 hover:bg-secondary/50 transition-colors flex gap-3",
                            !notification.read && "bg-primary/5"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                            notification.type === 'mention' ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"
                          )}>
                            <Bell size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white line-clamp-2">{notification.message}</p>
                            <p className="text-xs text-text-secondary mt-1">
                              {new Date(notification.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                  <div className="p-3 text-center border-t border-border bg-secondary/10">
                    <button className="text-xs text-text-secondary hover:text-white transition-colors">Ver todas as notificações</button>
                  </div>
                </div>
              )}
            </div>
            <div className="h-8 w-px bg-border mx-2" />
            <div className="flex items-center gap-3">
              <div className="text-right hidden lg:block">
                <p className="text-sm font-medium text-white">{userName}</p>
                <p className="text-xs text-text-secondary">{isAdmin ? 'Admin' : 'Equipe'}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold overflow-hidden">
                {(userProfile?.avatar || user?.user_metadata?.avatar_url)?.startsWith('http') || (userProfile?.avatar || user?.user_metadata?.avatar_url)?.startsWith('data:') ? (
                  <img src={userProfile?.avatar || user?.user_metadata?.avatar_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (userProfile?.avatar || user?.user_metadata?.avatar_url) ? (
                  <img src={`https://picsum.photos/seed/${userProfile?.avatar || user?.user_metadata?.avatar_url}/64/64`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : userInitials}
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-background px-4 md:hidden shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-white font-heading font-bold text-sm">
              BS
            </div>
            <span className="font-heading font-bold">Projeto BS</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-text-secondary hover:text-white relative">
              <Bell size={20} />
              {notifications.some(n => !n.read) && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border border-background" />
              )}
            </button>
            <button 
              onClick={() => setIsMobileOpen(true)}
              className="p-2 text-text-secondary hover:text-white"
            >
              <Menu size={24} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
