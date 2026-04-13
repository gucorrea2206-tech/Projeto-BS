import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, User as UserIcon } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

export function Login() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Por favor, insira seu e-mail para redefinir a senha.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage('E-mail de redefinição de senha enviado! Verifique sua caixa de entrada.');
    } catch (err: any) {
      console.warn('Reset password error:', err.message || err);
      setError(err.message || 'Ocorreu um erro ao tentar redefinir a senha.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        
        if (firebaseUser) {
          await updateProfile(firebaseUser, {
            displayName: name
          });

          const isDefaultAdmin = email === 'gu.correa98@gmail.com' || email === 'gu.correa2206@gmail.com';
          const role = isDefaultAdmin ? 'admin' : 'collaborator';
          
          // Create user profile
          await setDoc(doc(db, 'users', firebaseUser.uid), {
            uid: firebaseUser.uid,
            name: name || email.split('@')[0],
            email: email,
            avatar: '',
            role: role,
            isAdmin: role === 'admin'
          });

          // Add to team_members
          await setDoc(doc(db, 'team_members', firebaseUser.uid), {
            name: name || email.split('@')[0],
            email: email,
            role: isDefaultAdmin ? 'Administrador' : 'Colaborador',
            permission: isDefaultAdmin ? 'admin' : 'collaborator',
            avatar: '',
            created_at: new Date().toISOString()
          });
          
          navigate('/');
        }
      }
    } catch (err: any) {
      console.error('Auth error detail:', err);
      let message = 'Ocorreu um erro ao autenticar.';
      
      if (err.code === 'auth/operation-not-allowed') {
        message = 'O provedor de E-mail/Senha não está ativado no console do Firebase. Por favor, ative-o em Authentication > Sign-in method ou use o Login com Google.';
      } else if (err.code === 'auth/email-already-in-use') {
        message = 'Este e-mail já está em uso.';
      } else if (err.code === 'auth/invalid-credential') {
        message = 'E-mail ou senha incorretos.';
      } else if (err.code === 'auth/weak-password') {
        message = 'A senha deve ter pelo menos 6 caracteres.';
      } else {
        message = err.message || message;
      }
      
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      if (firebaseUser) {
        const isDefaultAdmin = firebaseUser.email === 'gu.correa98@gmail.com' || firebaseUser.email === 'gu.correa2206@gmail.com';
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          const role = isDefaultAdmin ? 'admin' : 'collaborator';
          await setDoc(userRef, {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Novo Membro',
            email: firebaseUser.email,
            avatar: firebaseUser.photoURL || '',
            role: role,
            isAdmin: role === 'admin'
          });

          await setDoc(doc(db, 'team_members', firebaseUser.uid), {
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Novo Membro',
            email: firebaseUser.email,
            role: role === 'admin' ? 'Administrador' : 'Colaborador',
            permission: role === 'admin' ? 'admin' : 'collaborator',
            avatar: firebaseUser.photoURL || '',
            created_at: new Date().toISOString()
          });
        }
        navigate('/');
      }
    } catch (err: any) {
      console.error('Google Auth error:', err);
      setError(err.message || 'Erro ao entrar com Google.');
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
              {isForgotPassword ? 'Redefinir Senha' : isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
            </h2>
            <p className="text-text-secondary">
              {isForgotPassword ? 'Digite seu e-mail para receber um link de redefinição.' : isLogin ? 'Acesse sua conta para continuar.' : 'Preencha os dados abaixo para começar.'}
            </p>
          </div>

          <form onSubmit={isForgotPassword ? handleForgotPassword : handleSubmit} className="glass-card p-8 space-y-6">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center">
                {error}
              </div>
            )}
            
            {successMessage && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-500 text-sm text-center">
                {successMessage}
              </div>
            )}

            <div className="space-y-4">
              {!isLogin && !isForgotPassword && (
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
                      required={!isLogin && !isForgotPassword}
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

              {!isForgotPassword && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-text-secondary">Senha</label>
                    {isLogin && (
                      <button 
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(true);
                          setError(null);
                          setSuccessMessage(null);
                        }}
                        className="text-xs font-medium text-primary hover:text-accent transition-colors"
                      >
                        Esqueceu a senha?
                      </button>
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
                      required={!isForgotPassword}
                      placeholder="••••••••"
                      className="w-full bg-background border border-border rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-text-secondary/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    />
                  </div>
                </div>
              )}
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
                  {isForgotPassword ? 'Enviar link de recuperação' : isLogin ? 'Entrar na Plataforma' : 'Criar Conta'}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            {!isForgotPassword && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-text-secondary">Ou continue com</span>
                </div>
              </div>
            )}

            {!isForgotPassword && (
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-secondary border border-border text-white font-medium hover:bg-white/5 transition-all disabled:opacity-70"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                Google
              </button>
            )}
          </form>

          <p className="text-center text-sm text-text-secondary">
            {isForgotPassword ? (
              <button 
                onClick={() => {
                  setIsForgotPassword(false);
                  setIsLogin(true);
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="font-medium text-primary hover:text-accent transition-colors"
              >
                Voltar para o login
              </button>
            ) : isLogin ? (
              <>
                Não tem uma conta?{' '}
                <button 
                  onClick={() => setIsLogin(false)}
                  className="font-medium text-primary hover:text-accent transition-colors"
                >
                  Crie agora
                </button>
              </>
            ) : (
              <>
                Já tem uma conta?{' '}
                <button 
                  onClick={() => setIsLogin(true)}
                  className="font-medium text-primary hover:text-accent transition-colors"
                >
                  Faça login
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
