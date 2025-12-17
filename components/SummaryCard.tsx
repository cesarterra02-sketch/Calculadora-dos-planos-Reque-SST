
import React from 'react';
import { PricingResult } from '../types';
import { Calculator, Calendar, CreditCard, FileCheck, Info, FileText, Save, AlertTriangle } from 'lucide-react';

interface SummaryCardProps {
  result: PricingResult;
  onGenerateProposal?: () => void;
  onSaveHistory?: () => void;
  isGenerateDisabled?: boolean;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ 
  result, 
  onGenerateProposal, 
  onSaveHistory,
  isGenerateDisabled = false
}) => {
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden sticky top-6">
      {/* Brand Header */}
      <div className="bg-reque-navy p-5 text-white flex items-center gap-3">
        <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
          <Calculator className="w-5 h-5 text-reque-orange" />
        </div>
        <div>
          <h2 className="font-bold text-lg leading-tight">Resumo da Proposta</h2>
          <p className="text-xs text-white/60">Cálculo Book Empresarial 2025</p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        
        {/* BIG NUMBERS */}
        <div className="grid grid-cols-2 gap-4">
           {/* Monthly Ref */}
           <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-center text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wide mb-1">Valor Mensal Base</span>
              <span className="text-xl font-extrabold text-reque-navy">
                {result.isCustomQuote ? 'Sob Consulta' : formatCurrency(result.monthlyValue)}
              </span>
           </div>
           {/* Initial Payment */}
           <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex flex-col justify-center text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-reque-orange"></div>
              <span className="text-[10px] uppercase font-bold text-indigo-800 tracking-wide mb-1">Pagamento Inicial</span>
              <span className="text-xl font-extrabold text-reque-blue">
                {result.isCustomQuote ? 'Sob Consulta' : formatCurrency(result.initialPaymentAmount)}
              </span>
              <span className="text-[9px] text-indigo-600 mt-1 font-medium leading-tight">
                (Assinatura + Programas)
              </span>
           </div>
        </div>

        {/* DETAILS LIST */}
        <div className="space-y-3 text-sm">
          
          <div className="flex justify-between items-center py-2 border-b border-slate-100 border-dashed">
            <span className="text-slate-500 flex items-center gap-2 font-medium">
              <Calendar className="w-4 h-4 text-reque-blue" /> Ciclo de Cobrança
            </span>
            <span className="font-bold text-reque-navy text-right max-w-[50%] leading-tight">
               {result.billingCycle}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-slate-100 border-dashed">
            <span className="text-slate-500 flex items-center gap-2 font-medium">
              <CreditCard className="w-4 h-4 text-reque-blue" /> Forma de Pagamento
            </span>
            <span className="font-bold text-reque-navy">
               {result.paymentMethod}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-slate-100 border-dashed">
             <span className="text-slate-500 flex items-center gap-2 font-medium">
              <FileCheck className="w-4 h-4 text-reque-blue" /> Taxa PGR/PCMSO
            </span>
            <div className="text-right">
               {result.isCustomQuote ? (
                  <span className="font-bold text-reque-orange">Sob Consulta</span>
               ) : result.programFeeDiscounted ? (
                 <div className="flex flex-col items-end">
                    <span className="font-bold text-green-600 text-xs bg-green-100 px-2 py-0.5 rounded-full">
                      ISENTO
                    </span>
                    <span className="text-[10px] text-slate-400 line-through">
                      De {formatCurrency(result.originalProgramFee)}
                    </span>
                 </div>
               ) : (
                 <span className="font-bold text-reque-orange">
                   {formatCurrency(result.programFee)}
                 </span>
               )}
            </div>
          </div>
        </div>

        {/* Commercial Summary Text */}
        <div className="bg-reque-navy/5 p-4 rounded-lg border border-reque-navy/10 flex gap-3">
          <Info className="w-5 h-5 text-reque-blue shrink-0 mt-0.5" />
          <div>
            <h3 className="text-[10px] font-bold text-reque-blue uppercase tracking-widest mb-1">Nota Comercial</h3>
            <p className="text-xs text-slate-600 italic leading-relaxed">
              "{result.commercialSummary}"
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 mt-4">
          {onSaveHistory && (
            <button 
              onClick={onSaveHistory}
              className="w-full py-2 bg-white border-2 border-reque-navy/10 text-reque-navy rounded-lg font-bold shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Salvar Simulação
            </button>
          )}

          {onGenerateProposal && (
            <div className="space-y-2">
              <button 
                onClick={onGenerateProposal}
                disabled={isGenerateDisabled}
                className={`w-full py-3 rounded-lg font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${
                  isGenerateDisabled 
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' 
                    : 'bg-reque-navy hover:bg-reque-blue text-white'
                }`}
              >
                <FileText className="w-5 h-5" />
                Gerar Proposta Formal
              </button>
              {isGenerateDisabled && (
                <div className="flex items-center gap-1.5 justify-center text-[10px] text-red-500 font-bold uppercase tracking-tight">
                  <AlertTriangle className="w-3 h-3" />
                  Preencha o CNPJ corretamente
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
