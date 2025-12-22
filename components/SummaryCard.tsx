
import React, { useState, useEffect } from 'react';
import { PricingResult, BillingCycle } from '../types';
import { Calculator, Calendar, CreditCard, FileCheck, Info, FileText, Save, AlertTriangle, ChevronRight, CheckCircle2, ShieldCheck, Loader2, Check } from 'lucide-react';

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
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Resetar o estado de "salvo" se o resultado mudar (novos cálculos)
  useEffect(() => {
    setIsSaved(false);
  }, [result]);

  const handleSave = async () => {
    if (!onSaveHistory || isSaving) return;
    
    setIsSaving(true);
    try {
      // O App.tsx lida com a persistência no Supabase
      await onSaveHistory();
      setIsSaved(true);
      
      // Feedback temporário de sucesso
      setTimeout(() => {
        setIsSaved(false);
      }, 3000);
    } catch (error) {
      console.error("Erro ao salvar simulação:", error);
      alert("Erro ao salvar no banco de dados.");
    } finally {
      setIsSaving(false);
    }
  };

  // Cálculo para transparência na lista
  const assinaturaNoCiclo = result.billingCycle === BillingCycle.ANNUAL 
    ? result.monthlyValue * 12 
    : result.monthlyValue;

  return (
    <div className="bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden sticky top-6">
      {/* Brand Header */}
      <div className="bg-[#190c59] p-5 text-white flex items-center gap-3 border-b-4 border-[#ec9d23]">
        <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
          <Calculator className="w-5 h-5 text-[#ec9d23]" />
        </div>
        <div>
          <h2 className="font-bold text-lg leading-tight uppercase tracking-tight">Resumo de Investimento</h2>
          <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest">Book Empresarial 2025</p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        
        {/* LISTA DETALHADA E SEQUENCIAL */}
        <div className="space-y-1">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Composição de Valores</h3>
          
          <div className="space-y-3">
            {/* 1. Programas */}
            <div className="flex justify-between items-start py-3 border-b border-slate-50">
              <div className="flex gap-3">
                <div className="mt-0.5"><FileCheck className="w-4 h-4 text-reque-blue opacity-50" /></div>
                <div>
                  <p className="text-xs font-bold text-slate-700">Programas (PGR e PCMSO)</p>
                  <p className="text-[10px] text-slate-400">Taxa de elaboração técnica inicial</p>
                </div>
              </div>
              <div className="text-right">
                {result.programFeeDiscounted ? (
                  <div className="flex flex-col items-end">
                    <span className="text-[11px] font-black text-green-700 bg-green-100 px-3 py-1 rounded-lg border border-green-200 shadow-sm animate-pulse">BONIFICAÇÃO</span>
                    <span className="text-[11px] text-slate-400 line-through font-black mt-1.5 opacity-80">De {formatCurrency(result.originalProgramFee)}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-black text-slate-700">{formatCurrency(result.programFee)}</span>
                    <span className="text-[9px] font-black text-reque-orange uppercase tracking-tighter mt-0.5">Cobrança Única</span>
                  </div>
                )}
              </div>
            </div>

            {/* 2 e 3 Juntados. Assinatura e Recorrência */}
            <div className="flex justify-between items-start py-3 border-b border-slate-50 bg-slate-50/50 px-2 rounded-lg">
              <div className="flex gap-3">
                <div className="mt-0.5"><Calendar className="w-4 h-4 text-[#ec9d23] opacity-70" /></div>
                <div>
                  <p className="text-xs font-bold text-slate-700">Assinatura e Recorrência</p>
                  <p className="text-[10px] text-slate-400 font-medium">{result.billingCycle}</p>
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                <span className="text-sm font-black text-[#190c59]">
                  {formatCurrency(result.monthlyValue)}/mês
                </span>
                <span className="text-[9px] font-black text-reque-orange uppercase tracking-tighter">
                  {result.billingCycle === BillingCycle.ANNUAL ? 'Cobrança Anual' : 'Cobrança Mensal'}
                </span>
              </div>
            </div>

            {/* FIDELIDADE (Apenas se houver bonificação/fidelidade) */}
            {result.programFeeDiscounted && (
              <div className="flex justify-between items-start py-3 border-b border-slate-50">
                <div className="flex gap-3">
                  <div className="mt-0.5"><ShieldCheck className="w-4 h-4 text-reque-navy opacity-60" /></div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">Fidelidade Contratual</p>
                    <p className="text-[10px] text-slate-400 font-medium">Período de permanência mínima</p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className="text-[10px] font-black text-white bg-reque-navy px-2.5 py-1 rounded-md uppercase tracking-widest shadow-sm">
                    24 Meses
                  </span>
                </div>
              </div>
            )}

            {/* 4. Total Assinatura no Ciclo */}
            <div className="flex justify-between items-start py-3 border-b border-slate-50">
              <div className="flex gap-3">
                <div className="mt-0.5"><CreditCard className="w-4 h-4 text-reque-blue opacity-50" /></div>
                <div>
                  <p className="text-xs font-bold text-slate-700">Total anual assinatura</p>
                  <p className="text-[10px] text-slate-400 italic">
                    {result.billingCycle === BillingCycle.ANNUAL ? 'Pagamento antecipado (bonificação)' : 'Primeira mensalidade'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-slate-700">{formatCurrency(assinaturaNoCiclo)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* VALOR TOTAL DE ENTRADA (DESTAQUE) */}
        <div className="bg-[#190c59] p-5 rounded-2xl relative overflow-hidden shadow-lg border border-white/10">
           <div className="absolute top-0 right-0 p-2 opacity-10">
              <Calculator className="w-16 h-16 text-white" />
           </div>
           <div className="relative z-10">
              <span className="text-[10px] font-black text-[#ec9d23] uppercase tracking-[0.25em]">Valor Total da Entrada</span>
              <div className="flex items-baseline gap-1 mt-1 text-white">
                 <span className="text-3xl font-black tracking-tighter">
                    {result.isCustomQuote ? 'Sob Consulta' : formatCurrency(result.initialPaymentAmount)}
                 </span>
              </div>
              <p className="text-[9px] text-white/50 font-medium uppercase mt-2 border-t border-white/10 pt-2 flex items-center gap-1">
                 <Info className="w-3 h-3" /> Valor devido no ato da assinatura
              </p>
           </div>
        </div>

        {/* Commercial Summary Text */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <h3 className="text-[10px] font-bold text-[#190c59] uppercase tracking-widest mb-1">Modelo de Contratação</h3>
            <p className="text-[11px] text-slate-600 italic leading-relaxed">
              "{result.commercialSummary}"
            </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          {onSaveHistory && (
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className={`w-full py-3 border-2 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                isSaved 
                  ? 'bg-green-50 border-green-200 text-green-600' 
                  : 'bg-white border-slate-100 text-[#190c59] hover:bg-slate-50'
              } disabled:opacity-70`}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isSaved ? (
                <Check className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSaving ? 'Salvando...' : isSaved ? 'Simulação Salva!' : 'Salvar Simulação'}
            </button>
          )}

          {onGenerateProposal && (
            <div className="space-y-2">
              <button 
                onClick={() => {
                  // Salva automaticamente no histórico antes de gerar a proposta
                  if (onSaveHistory) onSaveHistory();
                  if (onGenerateProposal) onGenerateProposal();
                }}
                disabled={isGenerateDisabled}
                className={`w-full py-4 rounded-xl font-black shadow-xl transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-[0.15em] ${
                  isGenerateDisabled 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none border border-slate-200' 
                    : 'bg-[#190c59] hover:bg-[#1a067c] text-white'
                }`}
              >
                <FileText className="w-4 h-4" />
                Gerar Proposta Formal
              </button>
              {isGenerateDisabled && (
                <div className="flex items-center gap-1.5 justify-center text-[9px] text-red-500 font-bold uppercase tracking-widest">
                  <AlertTriangle className="w-3 h-3" />
                  Dados obrigatórios pendentes
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
