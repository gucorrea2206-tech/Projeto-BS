import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Sparkles, User as UserIcon } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function Login() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate('/');
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            }
          }
        });
        
        if (error) throw error;
        
        if (data.user) {
          // Add to team_members table
          const role = email === 'gu.correa98@gmail.com' ? 'Administrador' : 'Colaborador';
          const permission = email === 'gu.correa98@gmail.com' ? 'admin' : 'collaborator';
          
          const { data: existingMember } = await supabase
            .from('team_members')
            .select('id')
            .eq('email', email)
            .maybeSingle();

          if (!existingMember) {
            await supabase.from('team_members').insert({
              name: name || email.split('@')[0],
              email: email,
              role: role,
              permission: permission
            });
          }
          
          if (data.session) {
            navigate('/');
          } else {
            setError('Conta criada! Verifique seu e-mail para confirmar o cadastro.');
          }
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Ocorreu um erro ao autenticar.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background text-text-primary overflow-hidden">
      {/* Left Panel - Branding (Hidden on Mobile) */}
      <div className="hidden lg:flex flex-1 relative flex-col justify-center items-center p-12 overflow-hidden border-r border-border/50">
        {/* Abstract Background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse delay-1000" />
        
        <div className="relative z-10 flex flex-col items-center text-center max-w-lg">
          <div className="w-20 h-20 bg-primary/20 border border-primary/30 rounded-2xl flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(124,58,237,0.4)]">
            <span className="font-heading font-bold text-4xl text-white">BS</span>
          </div>
          <h1 className="text-4xl font-heading font-bold text-white mb-6 leading-tight">
            Gestão inteligente do projeto Bruno Simplício
          </h1>
          <p className="text-lg text-text-secondary">
            Funis, tarefas, equipe e financeiro em uma única plataforma potencializada por inteligência artificial.
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 relative z-10">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <div className="lg:hidden w-16 h-16 bg-primary/20 border border-primary/30 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(124,58,237,0.3)]">
              <span className="font-heading font-bold text-2xl text-white">BS</span>
            </div>
            <h2 className="text-3xl font-heading font-bold text-white mb-2">
              {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
            </h2>
            <p className="text-text-secondary">
              {isLogin ? 'Acesse sua conta para continuar.' : 'Preencha os dados abaixo para começar.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="glass-card p-8 space-y-6">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary">Nome completo</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <UserIcon size={18} className="text-text-secondary group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={!isLogin}
                      placeholder="Seu nome"
                      className="w-full bg-background border border-border rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-text-secondary/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">E-mail</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail size={18} className="text-text-secondary group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="seu@email.com"
                    className="w-full bg-background border border-border rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-text-secondary/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-text-secondary">Senha</label>
                  {isLogin && (
                    <a href="#" className="text-xs font-medium text-primary hover:text-accent transition-colors">
                      Esqueceu a senha?
                    </a>
                  )}
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={18} className="text-text-secondary group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-background border border-border rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-text-secondary/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Entrar na Plataforma' : 'Criar Conta'}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-text-secondary">
            {isLogin ? 'Não tem uma conta? ' : 'Já tem uma conta? '}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="font-medium text-primary hover:text-accent transition-colors"
            >
              {isLogin ? 'Crie agora' : 'Faça login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
