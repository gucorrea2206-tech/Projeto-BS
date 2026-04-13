import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight,
  Download,
  Filter,
  Plus,
  X,
  Trash2,
  Repeat
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { cn } from '@/src/lib/utils';
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

function MetricCard({ title, value, trend, trendValue, icon: Icon, colorClass }: any) {
  return (
    <div className="glass-card p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-secondary">{title}</span>
        <div className="p-2 bg-secondary rounded-lg">
          <Icon size={20} className={colorClass} />
        </div>
      </div>
      <div>
        <h3 className="text-3xl font-heading font-bold text-white">{value}</h3>
        <div className="flex items-center gap-2 mt-2">
          {trend === 'up' ? (
            <ArrowUpRight size={16} className="text-emerald-500" />
          ) : (
            <ArrowDownRight size={16} className="text-red-500" />
          )}
          <span className={cn(
            "text-sm font-medium",
            trend === 'up' ? "text-emerald-500" : "text-red-500"
          )}>
            {trendValue}
          </span>
          <span className="text-xs text-text-secondary">vs. mês anterior</span>
        </div>
      </div>
    </div>
  );
}

export function Financial() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingRecord, setIsAddingRecord] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<number | null>(null);
  const [dateFilter, setDateFilter] = useState('all');
  const [newRecord, setNewRecord] = useState({
    type: 'income',
    description: '',
    value: '',
    category: '',
    project: '',
    date: new Date().toISOString().split('T')[0],
    isRecurring: false
  });

  useEffect(() => {
    const q = query(collection(db, 'financial_records'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTransactions(data);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredTransactions = transactions.filter(t => {
    if (dateFilter === 'all') return true;
    const txDate = new Date(t.date);
    const now = new Date();
    if (dateFilter === 'this_month') {
      return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
    }
    if (dateFilter === 'last_month') {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return txDate.getMonth() === lastMonth.getMonth() && txDate.getFullYear() === lastMonth.getFullYear();
    }
    if (dateFilter === 'this_year') {
      return txDate.getFullYear() === now.getFullYear();
    }
    return true;
  });

  const incomes = filteredTransactions.filter(t => t.type === 'income');
  const expenses = filteredTransactions.filter(t => t.type === 'expense');

  const totalIncome = incomes.reduce((acc, curr) => acc + curr.value, 0);
  const totalExpense = expenses.reduce((acc, curr) => acc + curr.value, 0);
  const netProfit = totalIncome - totalExpense;

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecord.description || !newRecord.value) return;

    try {
      const record = {
        description: newRecord.description,
        category: newRecord.category || 'Geral',
        value: parseFloat(newRecord.value),
        date: newRecord.date,
        project: newRecord.project || 'Geral',
        type: newRecord.type,
        isRecurring: newRecord.isRecurring,
        created_at: serverTimestamp()
      };

      await addDoc(collection(db, 'financial_records'), record);
      
      setIsAddingRecord(false);
      setNewRecord({
        type: 'income',
        description: '',
        value: '',
        category: '',
        project: '',
        date: new Date().toISOString().split('T')[0],
        isRecurring: false
      });
    } catch (error: any) {
      console.error('Error adding record to Firestore:', error);
      alert(`Erro ao adicionar registro: ${error.message}`);
    }
  };

  const confirmDelete = async () => {
    if (recordToDelete !== null) {
      try {
        await deleteDoc(doc(db, 'financial_records', recordToDelete.toString()));
        setRecordToDelete(null);
      } catch (error) {
        console.error('Error deleting record from Firestore:', error);
      }
    }
  };

  return (
    <div className="flex flex-col gap-8 relative">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-white">Financeiro</h1>
          <p className="text-text-secondary mt-1">Controle de receitas, despesas e fluxo de caixa.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <select
              value={dateFilter || ''}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full sm:w-auto appearance-none bg-secondary border border-border rounded-lg px-4 py-2 pr-10 text-sm text-white focus:outline-none focus:border-primary transition-colors cursor-pointer"
            >
              <option value="all">Todo o período</option>
              <option value="this_month">Este mês</option>
              <option value="last_month">Mês passado</option>
              <option value="this_year">Este ano</option>
            </select>
            <Filter size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
          </div>
          <button 
            onClick={() => setIsAddingRecord(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors text-sm font-medium"
          >
            <Plus size={18} />
            Novo Lançamento
          </button>
        </div>
      </header>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard 
          title="Receita Total" 
          value={`R$ ${totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          trend="up" 
          trendValue="+15%" 
          icon={TrendingUp}
          colorClass="text-emerald-500"
        />
        <MetricCard 
          title="Despesas" 
          value={`R$ ${totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          trend="up" 
          trendValue="+5%" 
          icon={TrendingDown}
          colorClass="text-red-500"
        />
        <MetricCard 
          title="Lucro Líquido" 
          value={`R$ ${netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          trend={netProfit >= 0 ? "up" : "down"} 
          trendValue="+22%" 
          icon={DollarSign}
          colorClass={netProfit >= 0 ? "text-primary" : "text-red-500"}
        />
      </div>

      {/* Parallel Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incomes */}
        <div className="glass-panel overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border flex items-center justify-between bg-emerald-500/5">
            <h3 className="font-heading font-bold text-lg text-emerald-500 flex items-center gap-2">
              <TrendingUp size={20} />
              Entradas
            </h3>
            <span className="text-sm font-medium text-white">
              R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[400px]">
            {incomes.length === 0 ? (
              <div className="p-8 text-center text-text-secondary">Nenhuma entrada registrada.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <tbody>
                  {incomes.map((transaction, idx) => (
                    <tr 
                      key={transaction.id} 
                      className={cn(
                        "border-b border-border/50 hover:bg-card/50 transition-colors group",
                        idx === incomes.length - 1 && "border-b-0"
                      )}
                    >
                      <td className="p-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-white">{transaction.description}</span>
                            {transaction.isRecurring && (
                              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-medium uppercase tracking-wider">
                                <Repeat size={10} />
                                Recorrente
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-text-secondary">{transaction.date} • {transaction.project}</span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <span className="font-medium text-sm text-emerald-500">
                            + R$ {transaction.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          <button 
                            onClick={() => setRecordToDelete(transaction.id)}
                            className="text-text-secondary hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Expenses */}
        <div className="glass-panel overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border flex items-center justify-between bg-red-500/5">
            <h3 className="font-heading font-bold text-lg text-red-500 flex items-center gap-2">
              <TrendingDown size={20} />
              Saídas
            </h3>
            <span className="text-sm font-medium text-white">
              R$ {totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[400px]">
            {expenses.length === 0 ? (
              <div className="p-8 text-center text-text-secondary">Nenhuma saída registrada.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <tbody>
                  {expenses.map((transaction, idx) => (
                    <tr 
                      key={transaction.id} 
                      className={cn(
                        "border-b border-border/50 hover:bg-card/50 transition-colors group",
                        idx === expenses.length - 1 && "border-b-0"
                      )}
                    >
                      <td className="p-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-white">{transaction.description}</span>
                            {transaction.isRecurring && (
                              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-medium uppercase tracking-wider">
                                <Repeat size={10} />
                                Recorrente
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-text-secondary">{transaction.date} • {transaction.project}</span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <span className="font-medium text-sm text-red-500">
                            - R$ {transaction.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          <button 
                            onClick={() => setRecordToDelete(transaction.id)}
                            className="text-text-secondary hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Add Record Modal */}
      {isAddingRecord && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md flex flex-col shadow-2xl">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-heading font-bold text-lg text-white">Novo Lançamento</h3>
              <button onClick={() => setIsAddingRecord(false)} className="text-text-secondary hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddRecord} className="p-6 flex flex-col gap-4">
              <div className="flex gap-4">
                <label className="flex-1 flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="type" 
                    value="income" 
                    checked={newRecord.type === 'income'}
                    onChange={(e) => setNewRecord({...newRecord, type: e.target.value})}
                    className="text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className={cn("text-sm font-medium", newRecord.type === 'income' ? "text-emerald-500" : "text-text-secondary")}>Entrada</span>
                </label>
                <label className="flex-1 flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="type" 
                    value="expense" 
                    checked={newRecord.type === 'expense'}
                    onChange={(e) => setNewRecord({...newRecord, type: e.target.value})}
                    className="text-red-500 focus:ring-red-500"
                  />
                  <span className={cn("text-sm font-medium", newRecord.type === 'expense' ? "text-red-500" : "text-text-secondary")}>Saída</span>
                </label>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Descrição</label>
                <input 
                  type="text" 
                  required
                  value={newRecord.description}
                  onChange={(e) => setNewRecord({...newRecord, description: e.target.value})}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                  placeholder="Ex: Venda Curso Alpha"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Valor (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  value={newRecord.value}
                  onChange={(e) => setNewRecord({...newRecord, value: e.target.value})}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                  placeholder="0.00"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Data</label>
                  <input 
                    type="date" 
                    required
                    value={newRecord.date}
                    onChange={(e) => setNewRecord({...newRecord, date: e.target.value})}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Categoria</label>
                  <input 
                    type="text" 
                    value={newRecord.category}
                    onChange={(e) => setNewRecord({...newRecord, category: e.target.value})}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                    placeholder="Ex: Receita, Tráfego..."
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Projeto (Opcional)</label>
                <input 
                  type="text" 
                  value={newRecord.project}
                  onChange={(e) => setNewRecord({...newRecord, project: e.target.value})}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                  placeholder="Ex: Lançamento Alpha"
                />
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input 
                  type="checkbox" 
                  id="isRecurring"
                  checked={newRecord.isRecurring}
                  onChange={e => setNewRecord({...newRecord, isRecurring: e.target.checked})}
                  className="w-4 h-4 rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-background"
                />
                <label htmlFor="isRecurring" className="text-sm font-medium text-white cursor-pointer select-none">
                  Lançamento recorrente (mensal)
                </label>
              </div>

              <button type="submit" className="w-full py-2 mt-2 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors text-sm font-medium">
                Salvar Lançamento
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {recordToDelete !== null && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-sm flex flex-col shadow-2xl p-6 gap-6 text-center">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <Trash2 size={32} />
            </div>
            <div>
              <h3 className="font-heading font-bold text-xl text-white mb-2">Excluir Lançamento</h3>
              <p className="text-text-secondary text-sm">
                Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setRecordToDelete(null)}
                className="flex-1 py-2.5 rounded-lg border border-border text-white hover:bg-white/5 transition-colors font-medium text-sm"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors font-medium text-sm"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
