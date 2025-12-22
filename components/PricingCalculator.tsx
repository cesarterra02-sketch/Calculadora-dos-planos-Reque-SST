
import { GoogleGenAI } from "@google/genai";
import React, { useState, useEffect, useMemo } from 'react';
import { 
  PlanType, 
  FidelityModel, 
  PricingResult, 
  EmployeeRange,
  BillingCycle,
  PaymentMethod,
  ProposalHistoryItem,
  RequeUnit,
  RiskLevel
} from '../types';
import { 
  EMPLOYEE_RANGES, 
  MONTHLY_VALUES_EXPRESS,
  MONTHLY_VALUES_PRO,
  PROGRAM_FEES_TABLE, 
  PLAN_SERVICES 
} from '../constants';
import { SummaryCard } from './SummaryCard';
import { ProposalView } from './ProposalView'; 
import { Users, Building2, CheckCircle, ShieldCheck, Info, Sparkles, Hash, UserCircle, AlertCircle, CalendarDays } from 'lucide-react';

const formatCNPJ = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .slice(0, 18);
};

const validateCNPJ = (cnpj: string): boolean => {
  cnpj = cnpj.replace(/[^\d]+/g, '');
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
  let tamanho = cnpj.length - 2;
  let numeros = cnpj.substring(0, tamanho);
  let digitos = cnpj.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
  if (resultado != parseInt(digitos.charAt(0))) return false;
  tamanho = tamanho + 1;
  numeros = cnpj.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
  return resultado == parseInt(digitos.charAt(1));
};

export const PricingCalculator: React.FC<{
  onSaveHistory: (item: ProposalHistoryItem) => Promise<any>;
  initialData?: ProposalHistoryItem | null;
  canGenerateProposal?: boolean;
}> = ({ onSaveHistory, initialData, canGenerateProposal = true }) => {
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [isCnpjValid, setIsCnpjValid] = useState<boolean | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<RequeUnit>(RequeUnit.PONTA_GROSSA);
  const [numEmployees, setNumEmployees] = useState(1);
  const [riskLevel, setRiskLevel] = useState<RiskLevel>(RiskLevel.RISK_1);
  const [fidelity, setFidelity] = useState<FidelityModel>(FidelityModel.WITH_FIDELITY);
  const [clientDeliveryDate, setClientDeliveryDate] = useState('');
  const [docDeliveryDate, setDocDeliveryDate] = useState('');
  const [showProposal, setShowProposal] = useState(false);

  useEffect(() => {
    if (initialData) {
      setCompanyName(initialData.companyName || '');
      setContactName(initialData.contactName || '');
      setCnpj(initialData.cnpj || '');
      setNumEmployees(initialData.numEmployees || 1);
      setFidelity(initialData.fidelity || FidelityModel.WITH_FIDELITY);
      setSelectedUnit(initialData.selectedUnit || RequeUnit.PONTA_GROSSA);
      setRiskLevel(initialData.riskLevel || RiskLevel.RISK_1);
      setClientDeliveryDate(initialData.clientDeliveryDate || '');
      setDocDeliveryDate(initialData.docDeliveryDate || '');
      const numericOnly = (initialData.cnpj || '').replace(/\D/g, '');
      if (numericOnly.length === 14) setIsCnpjValid(validateCNPJ(numericOnly));
    }
  }, [initialData]);

  const activePlan = useMemo(() => {
    if (riskLevel === RiskLevel.RISK_1) return PlanType.EXPRESS;
    if (numEmployees <= 20) return PlanType.ESSENCIAL;
    return PlanType.PRO;
  }, [numEmployees, riskLevel]);

  const calculationResult: PricingResult | null = useMemo(() => {
    const range = EMPLOYEE_RANGES.find(r => numEmployees >= r.min && numEmployees <= r.max);
    if (!range) return null;

    const monthlyTable = activePlan === PlanType.PRO ? MONTHLY_VALUES_PRO : MONTHLY_VALUES_EXPRESS;
    const monthlyBase = monthlyTable[range.id] || 0;
    const programFeeBase = PROGRAM_FEES_TABLE[range.id] || 0;

    const isFidelity = fidelity === FidelityModel.WITH_FIDELITY;
    const programFee = isFidelity ? 0 : programFeeBase;

    let billingCycle = BillingCycle.MONTHLY;
    if (isFidelity && (activePlan === PlanType.EXPRESS || activePlan === PlanType.ESSENCIAL)) {
      billingCycle = BillingCycle.ANNUAL;
    }

    const paymentMethod = (activePlan === PlanType.EXPRESS && !isFidelity) 
      ? PaymentMethod.CREDIT_CARD 
      : PaymentMethod.BOLETO;

    const initialAssinatura = billingCycle === BillingCycle.ANNUAL ? monthlyBase * 12 : monthlyBase;

    return {
      rangeLabel: range.label,
      monthlyValue: monthlyBase,
      billingCycle,
      paymentMethod,
      programFee,
      originalProgramFee: programFeeBase,
      programFeeDiscounted: isFidelity,
      riskLevel,
      clientDeliveryDate,
      docDeliveryDate,
      businessDays: 19,
      contractTotalCurrentCycle: initialAssinatura,
      initialPaymentAmount: initialAssinatura + programFee,
      isCustomQuote: monthlyBase === 0,
      commercialSummary: isFidelity 
        ? `Plano com Fidelidade 24 meses. Isenção integral do valor de elaboração dos programas (PGR/PCMSO).` 
        : `Plano sem fidelidade. Cobrança integral da taxa de elaboração dos programas.`
    };
  }, [numEmployees, riskLevel, fidelity, activePlan, clientDeliveryDate, docDeliveryDate]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {showProposal && calculationResult ? (
        <div className="fixed inset-0 z-50 overflow-auto bg-slate-100">
           <ProposalView 
            result={calculationResult} 
            plan={activePlan} 
            fidelity={fidelity}
            employees={numEmployees}
            companyName={companyName}
            contactName={contactName}
            cnpj={cnpj}
            selectedUnit={selectedUnit}
            onBack={() => setShowProposal(false)}
          />
        </div>
      ) : (
        <>
          <div className="flex-1 w-full space-y-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60">
              <h3 className="text-[11px] font-black text-reque-navy uppercase mb-4 tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-reque-orange" /> Dados do Contratante
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-7">
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 w-4 h-4 text-slate-300" />
                    <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value.toUpperCase())} className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:border-reque-blue focus:ring-4 focus:ring-reque-blue/5 transition-all" placeholder="RAZÃO SOCIAL DA EMPRESA" />
                  </div>
                </div>
                <div className="md:col-span-5">
                  <div className="relative">
                    <Hash className="absolute left-3 top-3 w-4 h-4 text-slate-300" />
                    <input type="text" value={cnpj} onChange={e => {
                      const fmt = formatCNPJ(e.target.value);
                      setCnpj(fmt);
                      const clean = fmt.replace(/\D/g,'');
                      setIsCnpjValid(clean.length === 14 ? validateCNPJ(clean) : null);
                    }} maxLength={18} className={`w-full pl-10 pr-3 py-2.5 border rounded-xl text-xs font-bold outline-none transition-all ${isCnpjValid === false ? 'border-red-500 bg-red-50 text-red-900 ring-1 ring-red-500' : 'border-slate-200 focus:border-reque-blue focus:ring-4 focus:ring-reque-blue/5'}`} placeholder="00.000.000/0000-00" />
                    {isCnpjValid === true && <CheckCircle className="absolute right-3 top-3 w-4 h-4 text-green-500" />}
                    {isCnpjValid === false && <AlertCircle className="absolute right-3 top-3 w-4 h-4 text-red-500" />}
                  </div>
                  {isCnpjValid === false && (
                    <p className="text-[10px] text-red-500 font-bold mt-1 ml-1 flex items-center gap-1 uppercase tracking-tighter">
                      CNPJ Inválido ou Incompleto
                    </p>
                  )}
                </div>
                <div className="md:col-span-6">
                  <div className="relative">
                    <UserCircle className="absolute left-3 top-3 w-4 h-4 text-slate-300" />
                    <input type="text" value={contactName} onChange={e => setContactName(e.target.value.toUpperCase())} className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:border-reque-blue focus:ring-4 focus:ring-reque-blue/5 transition-all" placeholder="A/C RESPONSÁVEL COMERCIAL" />
                  </div>
                </div>
                <div className="md:col-span-6">
                  <select value={selectedUnit} onChange={e => setSelectedUnit(e.target.value as RequeUnit)} className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-bold bg-white outline-none focus:border-reque-blue focus:ring-4 focus:ring-reque-blue/5 transition-all cursor-pointer">
                    {Object.values(RequeUnit).map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>

                <div className="md:col-span-6">
                  <label className="block text-[9px] font-black text-slate-400 mb-1 uppercase ml-1">Entrega das Descrições (Cliente)</label>
                  <div className="relative">
                    <CalendarDays className="absolute left-3 top-3 w-4 h-4 text-slate-300 pointer-events-none" />
                    <input 
                      type="date" 
                      value={clientDeliveryDate} 
                      onChange={e => setClientDeliveryDate(e.target.value)} 
                      className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-reque-blue focus:ring-4 focus:ring-reque-blue/5 transition-all" 
                    />
                  </div>
                </div>
                <div className="md:col-span-6">
                  <label className="block text-[9px] font-black text-slate-400 mb-1 uppercase ml-1">Entrega Combinada (Programas)</label>
                  <div className="relative">
                    <CalendarDays className="absolute left-3 top-3 w-4 h-4 text-slate-300 pointer-events-none" />
                    <input 
                      type="date" 
                      value={docDeliveryDate} 
                      onChange={e => setDocDeliveryDate(e.target.value)} 
                      className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-reque-blue focus:ring-4 focus:ring-reque-blue/5 transition-all" 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[11px] font-black text-reque-navy uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-reque-orange" /> Dimensionamento
                </h3>
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                  <span className="text-[9px] font-black text-slate-400 uppercase">Sugestão:</span>
                  <span className="px-3 py-0.5 bg-[#190c59] text-white text-[10px] font-black rounded-lg shadow-sm flex items-center gap-1.5 border border-white/10">
                    <Sparkles className="w-3 h-3 text-[#ec9d23]" />
                    {activePlan.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nº de Funcionários</label>
                      <p className="text-[9px] text-slate-400 italic">Total de vidas ativas no contrato</p>
                    </div>
                    <span className="text-4xl font-black text-reque-navy tracking-tighter">{numEmployees}</span>
                  </div>
                  <input type="range" min="1" max="200" value={numEmployees} onChange={e => setNumEmployees(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none accent-reque-orange cursor-pointer hover:accent-reque-navy transition-all" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest">Grau de Risco</label>
                    <div className="flex gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-100">
                      {[RiskLevel.RISK_1, RiskLevel.RISK_2, RiskLevel.RISK_3, RiskLevel.RISK_4].map(r => (
                        <button key={r} onClick={() => setRiskLevel(r)} className={`flex-1 py-2 rounded-lg font-black text-[11px] transition-all ${riskLevel === r ? 'bg-white text-reque-navy shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>
                          {r.split(' ')[1]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest">Modelo Fidelidade</label>
                    <div className="flex gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-100">
                      <button onClick={() => setFidelity(FidelityModel.WITH_FIDELITY)} className={`flex-1 py-2 px-2 rounded-lg font-black text-[9px] uppercase tracking-tighter transition-all ${fidelity === FidelityModel.WITH_FIDELITY ? 'bg-reque-orange text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                        COM FIDELIDADE
                      </button>
                      <button onClick={() => setFidelity(FidelityModel.NO_FIDELITY)} className={`flex-1 py-2 px-2 rounded-lg font-black text-[9px] uppercase tracking-tighter transition-all ${fidelity === FidelityModel.NO_FIDELITY ? 'bg-white text-reque-navy shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>
                        SEM FIDELIDADE
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60">
               <div className="flex items-center gap-2 mb-4">
                 <ShieldCheck className="w-4 h-4 text-[#ec9d23]" />
                 <h3 className="text-[11px] font-black text-reque-navy uppercase tracking-wider">Itens do Plano</h3>
                 <span className="h-px flex-1 bg-slate-100"></span>
                 <span className="text-[10px] font-black text-reque-navy bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{activePlan}</span>
               </div>
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                 {PLAN_SERVICES[activePlan].map((s, i) => (
                   <div key={i} className="flex items-center gap-1.5 p-2 bg-slate-50/50 rounded-lg border border-slate-100/50 text-[9px] font-bold text-slate-500 uppercase leading-tight hover:bg-slate-50 transition-colors">
                     <CheckCircle className="w-2.5 h-2.5 text-green-500 shrink-0" />
                     {s}
                   </div>
                 ))}
               </div>
            </div>
          </div>

          <div className="w-full lg:w-[350px] shrink-0">
            {calculationResult && (
              <SummaryCard 
                result={calculationResult} 
                onSaveHistory={() => {
                  return onSaveHistory({
                    id: crypto.randomUUID(),
                    type: 'standard',
                    createdAt: new Date().toISOString(),
                    companyName,
                    contactName,
                    cnpj,
                    selectedUnit,
                    plan: activePlan,
                    numEmployees,
                    riskLevel,
                    monthlyValue: calculationResult.monthlyValue,
                    initialTotal: calculationResult.initialPaymentAmount,
                    fidelity,
                    clientDeliveryDate,
                    docDeliveryDate
                  });
                }}
                onGenerateProposal={canGenerateProposal ? () => {
                  if (!isCnpjValid) {
                    alert("O CNPJ informado é inválido.");
                    return;
                  }
                  if (!companyName || !contactName) {
                    alert("Por favor, preencha Razão Social e Responsável.");
                    return;
                  }
                  setShowProposal(true);
                } : undefined}
                isGenerateDisabled={!isCnpjValid || !companyName || !contactName || !canGenerateProposal}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
};
