
import React, { useState, useMemo } from 'react';
import { ProposalHistoryItem } from '../types';
import { 
  Clock, 
  ArrowLeft, 
  RotateCcw, 
  Trash2, 
  FileSearch, 
  Truck, 
  FileText, 
  AlertTriangle, 
  X, 
  Loader2, 
  User, 
  Search, 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  DollarSign,
  FileCheck,
  Users,
  Sparkles
} from 'lucide-react';
import { supabase } from '../supabaseClient';

interface HistoryViewProps {
  history: ProposalHistoryItem[];
  onEdit: (item: ProposalHistoryItem) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
  isAdmin: boolean;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ history, onEdit, onDelete, onBack, isAdmin }) => {
  const [itemToDelete, setItemToDelete] = useState<{ id: string, name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const handleDelete = async () => {
    if (!itemToDelete) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('reque_proposals')
        .delete()
        .eq('id', itemToDelete.id);
        
      if (error) throw error;
      
      onDelete(itemToDelete.id);
      setItemToDelete(null);
    } catch (error: any) {
      console.error("Erro ao excluir:", error.message);
      alert(`Erro técnico ao tentar excluir: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredHistory = history.filter(item => {
    const term = searchTerm.toLowerCase();
    return (
      item.companyName.toLowerCase().includes(term) ||
      item.contactName.toLowerCase().includes(term) ||
      item.cnpj.toLowerCase().includes(term)
    );
  });

  // Estatísticas por Vendedor
  const sellerStats = useMemo(() => {
    const stats: Record<string, { count: number, total: number }> = {};
    
    // Filtramos apenas propostas do mês atual para o resumo
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    history.forEach(item => {
      const itemDate = new Date(item.createdAt);
      if (itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear) {
        const seller = item.createdBy || 'Sistema';
        if (!stats[seller]) stats[seller] = { count: 0, total: 0 };
        stats[seller].count += 1;
        stats[seller].total += item.initialTotal;
      }
    });

    return Object.entries(stats).sort((a, b) => b[1].total - a[1].total);
  }, [history]);

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-reque-navy font-bold hover:text-reque-blue transition-colors shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar para Calculadora
        </button>

        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1a067c]" />
          <input 
            type="text" 
            placeholder="Pesquisa Histórico" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border-2 border-[#1a067c]/30 rounded-lg text-sm font-bold text-reque-navy outline-none focus:border-[#1a067c] transition-all"
          />
        </div>

        <h2 className="text-2xl font-bold text-reque-navy flex items-center gap-3 shrink-0">
          <Clock className="w-6 h-6 text-reque-orange" />
          Histórico de Propostas
        </h2>
      </div>

      {/* DASHBOARD DE ESTATÍSTICAS POR VENDEDOR */}
      {isAdmin && history.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 col-span-1 md:col-span-2">
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-[11px] font-black text-reque-navy uppercase tracking-widest flex items-center gap-2">
                 <BarChart3 className="w-4 h-4 text-reque-orange" /> Performance Mensal por Vendedor
               </h3>
               <span className="text-[9px] font-bold text-slate-400 uppercase">Mês Atual</span>
            </div>
            <div className="space-y-4">
               {sellerStats.length === 0 ? (
                 <p className="text-[10px] text-slate-400 italic">Nenhuma proposta criada no mês vigente.</p>
               ) : sellerStats.map(([name, data]) => (
                 <div key={name} className="relative">
                    <div className="flex justify-between items-end mb-1">
                       <span className="text-[10px] font-black text-reque-navy uppercase">{name}</span>
                       <div className="text-right">
                          <span className="text-[10px] font-black text-reque-navy block">{formatCurrency(data.total)}</span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase">{data.count} Propostas</span>
                       </div>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                       <div 
                        className="h-full bg-reque-orange rounded-full transition-all duration-1000" 
                        style={{ width: `${Math.min(100, (data.total / (sellerStats[0][1].total || 1)) * 100)}%` }}
                       />
                    </div>
                 </div>
               ))}
            </div>
          </div>

          <div className="bg-reque-navy p-5 rounded-2xl shadow-lg border border-white/10 flex flex-col justify-between">
             <div>
                <h3 className="text-[10px] font-black text-reque-orange uppercase tracking-widest flex items-center gap-2 mb-4">
                   <TrendingUp className="w-4 h-4" /> Resumo de Receita
                </h3>
                <div className="space-y-4">
                   <div>
                      <p className="text-[9px] text-white/50 font-bold uppercase tracking-tight">Total Projetado (Mês)</p>
                      <p className="text-2xl font-black text-white tracking-tighter">
                        {formatCurrency(sellerStats.reduce((acc, curr) => acc + curr[1].total, 0))}
                      </p>
                   </div>
                   <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                      <div className="p-2 bg-reque-orange rounded-lg">
                        <FileCheck className="w-4 h-4 text-reque-navy" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-white uppercase leading-none">
                           {sellerStats.reduce((acc, curr) => acc + curr[1].count, 0)}
                        </p>
                        <p className="text-[8px] text-white/40 font-bold uppercase tracking-widest mt-1">Simulações Ativas</p>
                      </div>
                   </div>
                </div>
             </div>
             <p className="text-[8px] text-white/30 font-bold italic mt-4">* Dados sincronizados em tempo real com a nuvem.</p>
          </div>
        </div>
      )}

      {history.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-slate-200">
          <FileSearch className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-600">Você ainda não possui propostas salvas.</h3>
          <p className="text-slate-400 text-sm mt-1">
            As simulações que você realizar e salvar aparecerão aqui.
          </p>
          <button 
             onClick={onBack}
             className="mt-6 px-6 py-2 bg-reque-navy text-white font-bold rounded-lg hover:bg-reque-blue transition-colors"
          >
            Nova Simulação
          </button>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-slate-200">
          <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-600">Nenhum resultado encontrado.</h3>
          <p className="text-slate-400 text-sm mt-1">
            Tente ajustar os termos da sua pesquisa.
          </p>
          <button 
             onClick={() => setSearchTerm('')}
             className="mt-6 px-6 py-2 border-2 border-reque-navy text-reque-navy font-bold rounded-lg hover:bg-slate-50 transition-colors"
          >
            Limpar Pesquisa
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-500">
                <tr>
                  <th className="px-6 py-4">Data/Hora</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Empresa / Contato</th>
                  <th className="px-6 py-4">Informações Prévias</th>
                  <th className="px-6 py-4">Criado por / Status</th>
                  <th className="px-6 py-4 text-right">Valor Total</th>
                  <th className="px-6 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                       <div className="flex flex-col">
                         <span className="font-bold text-slate-700">
                           {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                         </span>
                         <span className="text-xs text-slate-400">
                           {new Date(item.createdAt).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                         </span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className={`px-2 py-1 rounded text-[10px] font-black uppercase flex items-center gap-1.5 w-fit ${
                         item.type === 'incompany' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                       }`}>
                         {item.type === 'incompany' ? <Truck className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                         {item.type === 'incompany' ? 'In Company' : 'Planos SST'}
                       </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-reque-navy">{item.companyName}</div>
                      <div className="text-xs text-slate-400">
                        {item.contactName} • {item.cnpj || 'Sem CNPJ'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex flex-col gap-1 text-[10px] font-bold text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3 h-3 text-reque-orange" />
                            <span>{item.numEmployees || '0'} Vidas Ativas</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-reque-navy opacity-50" />
                            <span>{item.plan || 'Plano Personalizado'}</span>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3 h-3 text-reque-orange opacity-70" />
                          <span className="text-[10px] font-black text-reque-navy uppercase truncate max-w-[120px]" title={item.createdBy}>
                            {item.createdBy || 'Sistema'}
                          </span>
                        </div>
                        {item.type === 'incompany' ? (
                          <span className="text-[9px] font-black text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-100 uppercase tracking-tighter w-fit">
                            MARGEM: {item.margemAlvoAplicada || '30'}%
                          </span>
                        ) : (
                          <span className="text-[9px] text-slate-300 font-black italic uppercase tracking-tighter">Acesso Web Standard</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-reque-navy">
                      {formatCurrency(item.initialTotal)}
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => onEdit(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 border border-indigo-200 transition-colors text-xs font-bold"
                          title="Recuperar simulação"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Editar
                        </button>
                        {isAdmin && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setItemToDelete({ id: item.id, name: item.companyName }); }}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Excluir proposta permanentemente"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {itemToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-red-100 rounded-xl">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <button 
                  onClick={() => setItemToDelete(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <h3 className="text-lg font-black text-reque-navy uppercase tracking-tight mb-2">Confirmar Exclusão?</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                Você está prestes a excluir permanentemente a proposta da empresa 
                <strong className="text-reque-navy"> {itemToDelete.name}</strong>. 
                Esta ação não pode ser desfeita no banco de dados.
              </p>
            </div>
            
            <div className="bg-slate-50 px-6 py-4 flex gap-3">
              <button 
                onClick={() => setItemToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-3 bg-red-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-red-700 shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  'Excluir Permanentemente'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
