import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ExternalLink, Copy, Check, Lock, Eye, EyeOff } from 'lucide-react';
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
import { cn } from '../lib/utils';
import CryptoJS from 'crypto-js';

const SECRET_KEY = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'default-secret-key-for-accesses';

interface Access {
  id: string;
  name: string;
  link: string;
  email: string;
  encrypted_password: string;
  created_at: string;
}

export function Accesses() {
  const [accesses, setAccesses] = useState<Access[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newAccess, setNewAccess] = useState({ name: '', link: '', email: '', password: '' });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const { isAdmin } = useAuth();

  useEffect(() => {
    const q = query(collection(db, 'accesses'), orderBy('created_at', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Access));
      setAccesses(data);
    }, (error) => {
      console.error('Error fetching accesses:', error);
    });

    return () => unsubscribe();
  }, []);

  const handleAddAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Encrypt password before saving
    const encryptedPassword = CryptoJS.AES.encrypt(newAccess.password, SECRET_KEY).toString();
    
    const newAccessData = {
      name: newAccess.name,
      link: newAccess.link,
      email: newAccess.email,
      encrypted_password: encryptedPassword,
      created_at: serverTimestamp()
    };

    try {
      await addDoc(collection(db, 'accesses'), newAccessData);
      setIsAdding(false);
      setNewAccess({ name: '', link: '', email: '', password: '' });
    } catch (error) {
      console.error('Error adding access:', error);
    }
  };

  const handleDeleteAccess = async (id: string) => {
    if (!isAdmin) return;
    
    if (!confirm('Tem certeza que deseja deletar este acesso?')) return;

    try {
      await deleteDoc(doc(db, 'accesses', id));
    } catch (error) {
      console.error('Error deleting access:', error);
    }
  };

  const copyToClipboard = (text: string, id: string, isEncrypted = false) => {
    let textToCopy = text;
    if (isEncrypted) {
      try {
        const bytes = CryptoJS.AES.decrypt(text, SECRET_KEY);
        textToCopy = bytes.toString(CryptoJS.enc.Utf8);
      } catch (e) {
        console.error('Failed to decrypt password for copying');
      }
    }
    
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getDecryptedPassword = (encrypted: string) => {
    try {
      const bytes = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (e) {
      return 'Erro ao descriptografar';
    }
  };

  return (
    <div className="flex flex-col gap-8 h-full">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-white flex items-center gap-2">
            <Lock className="text-primary" />
            Acessos
          </h1>
          <p className="text-text-secondary mt-1">Gerencie os acessos importantes do projeto.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors text-sm font-medium"
        >
          <Plus size={18} />
          Novo Acesso
        </button>
      </header>

      <div className="glass-panel rounded-xl overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-card/50">
                <th className="p-4 font-medium text-text-secondary text-sm">Nome</th>
                <th className="p-4 font-medium text-text-secondary text-sm">Link</th>
                <th className="p-4 font-medium text-text-secondary text-sm">E-mail / Usuário</th>
                <th className="p-4 font-medium text-text-secondary text-sm">Senha</th>
                {isAdmin && <th className="p-4 font-medium text-text-secondary text-sm w-16">Ações</th>}
              </tr>
            </thead>
            <tbody>
              {accesses.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className="p-8 text-center text-text-secondary">
                    Nenhum acesso cadastrado.
                  </td>
                </tr>
              ) : (
                accesses.map((access) => (
                  <tr key={access.id} className="border-b border-border/50 hover:bg-card/50 transition-colors">
                    <td className="p-4 text-white font-medium">{access.name}</td>
                    <td className="p-4">
                      <a 
                        href={access.link.startsWith('http') ? access.link : `https://${access.link}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        {access.link}
                        <ExternalLink size={14} />
                      </a>
                    </td>
                    <td className="p-4 text-text-secondary">
                      <div className="flex items-center gap-2">
                        {access.email}
                        <button 
                          onClick={() => copyToClipboard(access.email, `${access.id}-email`)}
                          className="text-text-secondary hover:text-white transition-colors"
                          title="Copiar e-mail"
                        >
                          {copiedId === `${access.id}-email` ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </td>
                    <td className="p-4 text-text-secondary">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">
                          {visiblePasswords[access.id] 
                            ? getDecryptedPassword(access.encrypted_password) 
                            : '••••••••'}
                        </span>
                        <button 
                          onClick={() => togglePasswordVisibility(access.id)}
                          className="text-text-secondary hover:text-white transition-colors ml-2"
                          title={visiblePasswords[access.id] ? "Ocultar senha" : "Mostrar senha"}
                        >
                          {visiblePasswords[access.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button 
                          onClick={() => copyToClipboard(access.encrypted_password, `${access.id}-pwd`, true)}
                          className="text-text-secondary hover:text-white transition-colors"
                          title="Copiar senha"
                        >
                          {copiedId === `${access.id}-pwd` ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </td>
                    {isAdmin && (
                      <td className="p-4">
                        <button 
                          onClick={() => handleDeleteAccess(access.id)}
                          className="p-2 text-text-secondary hover:text-red-500 transition-colors rounded-lg hover:bg-red-500/10"
                          title="Deletar acesso"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-heading font-bold text-white">Novo Acesso</h2>
              <button 
                onClick={() => setIsAdding(false)}
                className="text-text-secondary hover:text-white transition-colors"
              >
                <Plus size={20} className="rotate-45" />
              </button>
            </div>
            <form onSubmit={handleAddAccess} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">Nome do Serviço</label>
                <input 
                  type="text" 
                  required
                  value={newAccess.name}
                  onChange={(e) => setNewAccess({...newAccess, name: e.target.value})}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors"
                  placeholder="Ex: Hostinger, Facebook Ads"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">Link</label>
                <input 
                  type="text" 
                  required
                  value={newAccess.link}
                  onChange={(e) => setNewAccess({...newAccess, link: e.target.value})}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors"
                  placeholder="Ex: hostinger.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">E-mail / Usuário</label>
                <input 
                  type="text" 
                  required
                  value={newAccess.email}
                  onChange={(e) => setNewAccess({...newAccess, email: e.target.value})}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors"
                  placeholder="Ex: contato@empresa.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">Senha</label>
                <input 
                  type="text" 
                  required
                  value={newAccess.password}
                  onChange={(e) => setNewAccess({...newAccess, password: e.target.value})}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors"
                  placeholder="Senha de acesso"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-border text-white hover:bg-white/5 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors font-medium"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
