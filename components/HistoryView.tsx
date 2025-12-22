
import React from 'react';
import { ProposalHistoryItem, FidelityModel } from '../types';
import { Clock, ArrowLeft, RotateCcw, Trash2, FileSearch, Truck, FileText } from 'lucide-react';

interface HistoryViewProps {
  history: ProposalHistoryItem[];
  onEdit: (item: ProposalHistoryItem) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
  isAdmin: boolean;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ history, onEdit, onDelete, onBack, isAdmin }) => {
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const handleDeleteClick = (id: string, companyName: string) => {
    if (window.confirm(`Deseja realmente excluir a proposta da empresa "${companyName}"? Esta ação não pode ser desfeita.`)) {
      onDelete(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-reque-navy font-bold hover:text-reque-blue transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar para Calculadora
        </button>
        <h2 className="text-2xl font-bold text-reque-navy flex items-center gap-3">
          <Clock className="w-6 h-6 text-reque-orange" />
          Histórico de Propostas
        </h2>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-slate-200">
          <FileSearch className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-600">Nenhuma simulação salva</h3>
          <p className="text-slate-400 text-sm mt-1">
            As simulações que você salvar aparecerão aqui para consulta futura.
          </p>
          <button 
             onClick={onBack}
             className="mt-6 px-6 py-2 bg-reque-navy text-white font-bold rounded-lg hover:bg-reque-blue transition-colors"
          >
            Nova Simulação
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
                  <th className="px-6 py-4">Detalhes</th>
                  <th className="px-6 py-4 text-right">Valor Total</th>
                  <th className="px-6 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((item) => (
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
                      {item.type === 'incompany' ? (
                        <div className="text-xs text-slate-500">
                          {item.inCompanyDetails?.profs.length} profissionais • {item.inCompanyDetails?.exams.length} exames
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500">
                          {item.numEmployees} vidas • {item.fidelity === FidelityModel.WITH_FIDELITY ? 'Fidelidade 24m' : 'Sem Fidelidade'}
                        </div>
                      )}
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
                            onClick={() => handleDeleteClick(item.id, item.companyName)}
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
    </div>
  );
};
