import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Wand2, 
  CheckCircle2,
  Loader2,
  Plus,
  X
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { GoogleGenAI } from "@google/genai";
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isActionable?: boolean;
  actionData?: any;
};

const initialMessages: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: 'Olá! Sou seu assistente de IA do Projeto BS. Como posso ajudar com seus lançamentos, tarefas ou finanças hoje?'
  }
];

const suggestions = [
  "Quais atividades tem pra mim?",
  "Qual projeto devemos priorizar?",
  "Como está a receita este mês?",
  "Explique brevemente minhas tarefas"
];

export function AIAssistant() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [appData, setAppData] = useState<any>({ tasks: [], financial: [], team: [] });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchAppData();
    }
  }, [isOpen]);

  const fetchAppData = async () => {
    try {
      const [tasksRes, financialRes, teamRes] = await Promise.all([
        supabase.from('tasks').select('*'),
        supabase.from('financial_records').select('*'),
        supabase.from('team_members').select('*')
      ]);

      setAppData({
        tasks: tasksRes.data || [],
        financial: financialRes.data || [],
        team: teamRes.data || []
      });
    } catch (error) {
      console.error('Error fetching app data for AI:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isTyping, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      const context = `
        Você é o Assistente do Projeto BS, uma plataforma de gestão de lançamentos e marketing.
        Dados atuais da aplicação:
        - Usuário logado: ${user?.email}
        - Membros da equipe: ${JSON.stringify(appData.team.map((m: any) => ({ name: m.name, role: m.role, avatar: m.avatar })))}
        - Tarefas: ${JSON.stringify(appData.tasks.map((t: any) => ({ title: t.title, status: t.status, date: t.date, user: t.user })))}
        - Registros Financeiros: ${JSON.stringify(appData.financial.map((f: any) => ({ desc: f.description, val: f.value, type: f.type, date: f.date })))}
        
        Instruções:
        - Responda de forma concisa e profissional.
        - Se perguntarem "quais atividades tem pra mim", procure por tarefas onde o 'user' corresponde ao avatar do usuário logado (ou se for o admin, mostre as dele).
        - Se perguntarem sobre receita, some os valores do tipo 'income' nos registros financeiros.
        - Se pedirem para priorizar, sugira focar nas tarefas pendentes com data mais próxima.
        - Use Markdown para formatar a resposta.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          { role: 'user', parts: [{ text: context }] },
          ...messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
          { role: 'user', parts: [{ text: input }] }
        ]
      });

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.text || 'Desculpe, não consegui processar sua solicitação.'
      };
      
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Houve um erro ao processar sua solicitação. Verifique sua conexão ou tente novamente mais tarde.'
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:bg-primary-hover hover:scale-105 transition-all duration-300",
          isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
        )}
      >
        <Bot size={24} />
      </button>

      {/* Chat Window */}
      <div className={cn(
        "fixed bottom-6 right-6 z-50 w-[400px] h-[600px] max-h-[80vh] flex flex-col overflow-hidden rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl transition-all duration-300 origin-bottom-right",
        isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"
      )}>
        {/* Background Atmosphere */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] opacity-50" />
        </div>

        {/* Header */}
        <header className="relative z-10 flex items-center justify-between p-4 border-b border-border/50 bg-background/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center shadow-[0_0_30px_rgba(124,58,237,0.3)]">
              <Bot size={20} className="text-accent" />
            </div>
            <div>
              <h1 className="text-lg font-heading font-bold text-white flex items-center gap-2">
                Assistente BS <Sparkles size={14} className="text-accent" />
              </h1>
              <p className="text-xs text-text-secondary">IA para Marketing</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 text-text-secondary hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </header>

      {/* Chat Area */}
      <div className="relative z-10 flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={cn(
              "flex gap-4 max-w-[80%]",
              msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1",
              msg.role === 'user' ? "bg-secondary border border-border" : "bg-primary/20 border border-primary/30 text-accent"
            )}>
              {msg.role === 'user' ? (
                <img 
                  src="https://picsum.photos/seed/user1/32/32" 
                  alt="User" 
                  className="w-full h-full rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <Bot size={16} />
              )}
            </div>
            
            <div className="flex flex-col gap-2">
              <div className={cn(
                "p-4 rounded-2xl text-sm leading-relaxed",
                msg.role === 'user' 
                  ? "bg-primary text-white rounded-tr-sm" 
                  : "bg-secondary/80 backdrop-blur-sm border border-border text-text-primary rounded-tl-sm"
              )}>
                {msg.content}
              </div>

              {/* Actionable Preview Card */}
              {msg.isActionable && msg.actionData && (
                <div className="mt-2 bg-background border border-border rounded-xl p-4 shadow-lg w-full">
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border">
                    <Wand2 size={16} className="text-accent" />
                    <h4 className="font-heading font-bold text-white text-sm">{msg.actionData.title}</h4>
                  </div>
                  <div className="space-y-2 mb-4">
                    {msg.actionData.tasks.map((task: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-2">
                        <div className="mt-0.5 text-text-secondary">
                          <CheckCircle2 size={14} />
                        </div>
                        <div>
                          <p className="text-xs text-white">{task.title}</p>
                          <p className="text-[10px] text-text-secondary">{task.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="w-full py-2 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors text-xs font-medium flex items-center justify-center gap-2">
                    <Plus size={14} />
                    Criar Tarefas
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex gap-4 max-w-[80%]">
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 text-accent flex items-center justify-center shrink-0 mt-1">
              <Bot size={16} />
            </div>
            <div className="p-4 rounded-2xl bg-secondary/80 backdrop-blur-sm border border-border rounded-tl-sm flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-accent" />
              <span className="text-sm text-text-secondary">Analisando dados...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="relative z-10 p-6 bg-background/80 backdrop-blur-md border-t border-border/50">
        {/* Suggestions */}
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {suggestions.map((sug, idx) => (
              <button 
                key={idx}
                onClick={() => setInput(sug)}
                className="px-3 py-1.5 rounded-full border border-border bg-secondary/50 text-xs text-text-secondary hover:text-white hover:border-primary/50 transition-colors"
              >
                {sug}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSend} className="relative">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte sobre funis, métricas ou peça para criar tarefas..."
            className="w-full bg-secondary/80 border border-border rounded-xl pl-4 pr-14 py-4 text-sm text-white placeholder:text-text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-lg"
          />
          <button 
            type="submit"
            disabled={!input.trim() || isTyping}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-primary text-white hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
    </>
  );
}
