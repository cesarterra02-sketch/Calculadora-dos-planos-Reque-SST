
import React, { useState, useEffect } from 'react';
import { PricingResult, BillingCycle, PlanType, User } from '../types';
import { StorageService } from '../storageService';
import { 
  Calculator, 
  Calendar, 
  CreditCard, 
  FileCheck, 
  Info, 
  FileText, 
  Save, 
  ShieldCheck, 
  Loader2, 
  Check, 
  Settings, 
  X,
  CreditCard as CardIcon,
  Sparkles,
  RefreshCcw
} from 'lucide-react';

interface SummaryCardProps {
  result: PricingResult;
  plan: PlanType;
  currentUser: User | null;
  onGenerateProposal?: () => void;
  onSaveHistory?: () => void;
  isGenerateDisabled?: boolean;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ 
  result, 
  plan,
  currentUser,
  onGenerateProposal, 
  onSaveHistory,
  isGenerateDisabled = false
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [selectedInstallments, setSelectedInstallments] = useState(1);
  const [interestRates, setInterestRates] = useState<Record<number, number>>({});
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isUpdatingRates, setIsUpdatingRates] = useState(false);
  const [tempRates, setTempRates] = useState<Record<number, number>>({});

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  useEffect(() => {
    setIsSaved(false);
    loadInterestRates();
  }, [result]);

  const loadInterestRates = async () => {
    try {
      const settings = await StorageService.getPaymentSettings();
      const ratesMap: Record<number, number> = {};
      
      for (let i = 1; i <= 12; i++) {
        ratesMap[i] = 0;
      }
      
      if (settings && settings.length > 0) {
        settings.forEach((s: any) => {
          ratesMap[s.installment_number] = Number(s.interest_rate) || 0;
        });
      }
      
      // Isenção fixa 1-3
      for (let i = 1; i <= 3; i++) {
        ratesMap[i] = 0;
      }
      
      setInterestRates(ratesMap);
      setTempRates({...ratesMap});
    } catch (error) {
      console.error("Erro ao carregar taxas:", error);
    }
  };

  const handleSaveRates = async () => {
    setIsUpdatingRates(true);
    try {
      const payload = Object.entries(tempRates)
        .filter(([num]) => parseInt(num) >= 4)
        .map(([num, rate]) => ({
          installment_number: parseInt(num),
          interest_rate: Number(rate) || 0
        }));
      
      await StorageService.updatePaymentSettings(payload);
      
      // Atualiza o estado da UI imediatamente
      setInterestRates({...tempRates});
      setIsAdminPanelOpen(false);
    } catch (e: any) {
      alert(`Erro: ${e?.message || 'Falha ao salvar'}`);
    } finally {
      setIsUpdatingRates(false);
    }
  };

  const handleSave = async () => {
    if (!onSaveHistory || isSaving) return;
    setIsSaving(true);
    try {
      await onSaveHistory();
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      alert("Erro ao salvar simulação.");
    } finally {
      setIsSaving(false);
    }
  };

  const showInstallments = plan === PlanType.EXPRESS || plan === PlanType.ESSENCIAL;
  const currentInterestRate = interestRates[selectedInstallments] || 0;
  
  // Lógica Financeira: Valor + Juros
  const interestAmount = (result.initialPaymentAmount * currentInterestRate) / 100;
  const finalTotalWithInterest = result.initialPaymentAmount + interestAmount;
  const installmentValue = finalTotalWithInterest / selectedInstallments;

  const assinaturaNoCiclo = result.billingCycle === BillingCycle.ANNUAL 
    ? result.monthlyValue * 12 
    : result.monthlyValue;

  const monthlyBase = result.monthlyValue - (result.schedulingCostTotal || 0);

  return (
    <div className="bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden sticky top-6">
      <div className="bg-[#190c59] p-5 text-white flex items-center justify-between border-b-4 border-[#ec9d23]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
            <Calculator className="w-5 h-5 text-[#ec9d23]" />
          </div>
          <div>
            <h2 className="font-bold text-lg leading-tight uppercase tracking-tight">Resumo da Oferta</h2>
            <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest">
              Book Empresarial 2025 • {plan.toUpperCase()}
            </p>
          </div>
        </div>
        
        {currentUser?.role === 'admin' && (
          <button 
            onClick={() => {
              setTempRates({...interestRates});
              setIsAdminPanelOpen(true);
            }}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5 text-[#ec9d23]" />
          </button>
        )}
      </div>

      <div className="p-6 space-y-6">
        <div className="space-y-1">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Composição de Valores</h3>
          
          <div className="space-y-3">
            {/* Item do Plano Selecionado */}
            <div className="flex justify-between items-start py-3 border-b border-slate-50">
              <div className="flex gap-3">
                <div className="mt-0.5"><Sparkles className="w-4 h-4 text-reque-orange opacity-70" /></div>
                <div>
                  <p className="text-xs font-bold text-slate-700 uppercase">Plano Selecionado</p>
                  <p className="text-[10px] text-slate-400 font-medium">Categoria {plan}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-reque-navy bg-slate-100 px-2.5 py-1 rounded-md uppercase tracking-tighter">OFERTA ATIVA</span>
              </div>
            </div>

            {result.programFeeDiscounted && !result.isRenewal && (
              <div className="flex justify-between items-start py-3 border-b border-slate-50">
                <div className="flex gap-3">
                  <div className="mt-0.5"><ShieldCheck className="w-4 h-4 text-reque-navy opacity-60" /></div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">Fidelidade Contratual</p>
                    <p className="text-[10px] text-slate-400 font-medium">Período de permanência mínima</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black text-white bg-reque-navy px-2.5 py-1 rounded-md uppercase tracking-widest">24 Meses</span>
                </div>
              </div>
            )}

            <div className="flex justify-between items-start py-3 border-b border-slate-50">
              <div className="flex gap-3">
                <div className="mt-0.5">
                  {result.isRenewal ? <RefreshCcw className="w-4 h-4 text-reque-orange opacity-70" /> : <FileCheck className="w-4 h-4 text-reque-blue opacity-50" />}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700">{result.isRenewal ? 'Revisão e Manutenção (Programas)' : 'Programas (PGR e PCMSO)'}</p>
                  <p className="text-[10px] text-slate-400">{result.isRenewal ? 'Ciclo de renovação vigente' : 'Taxa de elaboração técnica inicial'}</p>
                </div>
              </div>
              <div className="text-right">
                {result.programFeeDiscounted ? (
                  <div className="flex flex-col items-end">
                    <span className={`text-[11px] font-black ${result.isRenewal ? 'text-reque-orange bg-orange-50 border-orange-200' : 'text-green-700 bg-green-100 border-green-200'} px-3 py-1 rounded-lg border`}>
                      {result.isRenewal ? '50% DESCONTO' : 'BONIFICAÇÃO'}
                    </span>
                    <div className="flex flex-col items-end mt-1">
                      {result.isRenewal && <span className="text-[11px] font-black text-reque-navy">{formatCurrency(result.programFee)}</span>}
                      <span className="text-[11px] text-slate-400 line-through font-black">De {formatCurrency(result.originalProgramFee)}</span>
                    </div>
                  </div>
                ) : (
                  <span className="text-sm font-black text-slate-700">{formatCurrency(result.programFee)}</span>
                )}
              </div>
            </div>

            <div className="flex justify-between items-start py-3 border-b border-slate-50">
              <div className="flex gap-3">
                <div className="mt-0.5"><Calendar className="w-4 h-4 text-[#ec9d23] opacity-70" /></div>
                <div>
                  <p className="text-xs font-bold text-slate-700">Assinatura SST Base</p>
                  <p className="text-[10px] text-slate-400 font-medium">{result.rangeLabel}</p>
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                <span className="text-sm font-black text-[#190c59]">{formatCurrency(monthlyBase)}/mês</span>
                {result.billingCycle === BillingCycle.ANNUAL && (
                  <span className="text-[9px] font-black text-reque-orange uppercase mt-1">Anual Antecipado</span>
                )}
              </div>
            </div>

            {plan !== PlanType.PRO && (
              <div className="flex justify-between items-start py-3 bg-slate-50/50 px-2 rounded-lg">
                <div className="flex gap-3">
                  <div className="mt-0.5"><CreditCard className="w-4 h-4 text-reque-blue opacity-50" /></div>
                  <div><p className="text-xs font-bold text-slate-700">Total anual do plano</p></div>
                </div>
                <span className="text-sm font-bold text-[#190c59]">{formatCurrency(assinaturaNoCiclo)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#190c59] p-5 rounded-2xl relative overflow-hidden shadow-lg border border-white/10">
           <div className="relative z-10">
              <span className="text-[10px] font-black text-[#ec9d23] uppercase tracking-[0.25em]">Valor total da Oferta</span>
              <div className="flex items-baseline gap-1 mt-1 text-white">
                 <span className="text-3xl font-black tracking-tighter">
                    {result.isCustomQuote ? 'Sob Consulta' : formatCurrency(finalTotalWithInterest)}
                 </span>
              </div>
              
              {showInstallments && !result.isCustomQuote && (
                <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-white/60 uppercase flex items-center gap-2">
                      <CardIcon className="w-3.5 h-3.5 text-[#ec9d23]" /> Simular Parcelamento
                    </label>
                    <select 
                      value={selectedInstallments}
                      onChange={(e) => setSelectedInstallments(parseInt(e.target.value))}
                      className="bg-white/10 border border-white/20 rounded-lg text-white text-[11px] font-bold py-1 px-2 outline-none"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => {
                        const rate = interestRates[n] || 0;
                        return (
                          <option key={n} value={n} className="bg-[#190c59] text-white">
                            {n}x {rate > 0 ? `(+${rate.toFixed(2)}%)` : n > 1 ? '(Sem Juros)' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-2xl font-black text-[#ec9d23] tracking-tighter">
                        {formatCurrency(installmentValue)}<span className="text-xs text-white/40 ml-1 font-bold">/mês</span>
                      </p>
                      {currentInterestRate > 0 ? (
                        <p className="text-[9px] text-[#ec9d23] font-black uppercase mt-0.5 animate-pulse">
                          Taxa de {currentInterestRate.toFixed(2)}% | Valor Principal: {formatCurrency(result.initialPaymentAmount)}
                        </p>
                      ) : selectedInstallments > 1 ? (
                        <p className="text-[9px] text-green-400 font-bold uppercase mt-0.5">Parcelamento Isento</p>
                      ) : null}
                    </div>
                    {selectedInstallments > 1 && (
                      <div className="text-right">
                        <span className="text-[8px] font-black text-white/30 uppercase block mb-0.5">Acréscimo Juros</span>
                        <span className="text-[10px] font-black text-white/60 bg-white/5 px-2 py-1 rounded">
                          {formatCurrency(interestAmount)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <p className="text-[9px] text-white/50 font-medium uppercase mt-4 border-t border-white/10 pt-2 flex items-center gap-1">
                 <Info className="w-3 h-3" /> Inclui Programas + Ciclo Inicial ({result.billingCycle === BillingCycle.ANNUAL ? '12m' : '1m'})
              </p>
           </div>
        </div>

        <div className="space-y-3 pt-2">
          {onSaveHistory && (
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className={`w-full py-3 border-2 rounded-xl font-bold text-xs uppercase transition-all flex items-center justify-center gap-2 ${
                isSaved ? 'bg-green-50 border-green-200 text-green-600' : 'bg-white border-slate-100 text-[#190c59] hover:bg-slate-50'
              }`}
            >
              {isSaving ? <Loader2 className="animate-spin" /> : isSaved ? <Check /> : <Save />}
              {isSaving ? 'Salvando...' : isSaved ? 'Salvo!' : 'Salvar Simulação'}
            </button>
          )}

          {onGenerateProposal && (
            <button 
              onClick={onGenerateProposal}
              disabled={isGenerateDisabled}
              className="w-full py-4 bg-[#190c59] text-white rounded-xl font-black text-xs uppercase shadow-xl hover:bg-[#1a067c] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FileText className="w-4 h-4" /> Gerar Proposta Formal
            </button>
          )}
        </div>
      </div>

      {isAdminPanelOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#190c59]/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-[#190c59] p-6 flex justify-between items-center text-white">
              <h3 className="text-lg font-black uppercase tracking-tight">Taxas de Juros (Cartão)</h3>
              <button onClick={() => setIsAdminPanelOpen(false)} className="p-2 hover:bg-white/10 rounded-xl"><X /></button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                <Info className="w-4 h-4 text-reque-blue shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-500 font-bold uppercase">
                  Parcelas 1 a 3 são isentas (0%). <br/>
                  Configurações abaixo são salvas localmente caso a tabela do Supabase não exista.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                  <div key={n} className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      {n} Parcelas (%)
                    </label>
                    <div className="relative">
                      <input 
                        type="number" 
                        step="0.01"
                        value={tempRates[n] || 0}
                        onChange={(e) => setTempRates({...tempRates, [n]: parseFloat(e.target.value) || 0})}
                        className="w-full pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                      />
                      <span className="absolute right-3 top-2.5 text-slate-300 font-black">%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
              <button onClick={() => setIsAdminPanelOpen(false)} className="flex-1 py-3 bg-white border border-slate-200 text-slate-400 font-black text-[10px] uppercase rounded-xl">Cancelar</button>
              <button onClick={handleSaveRates} disabled={isUpdatingRates} className="flex-1 py-3 bg-[#190c59] text-white font-black text-[10px] uppercase rounded-xl shadow-lg flex items-center justify-center gap-2">
                {isUpdatingRates ? <Loader2 className="animate-spin" /> : <Check />}
                Salvar Configurações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
