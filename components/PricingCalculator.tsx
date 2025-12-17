
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
import { Users, Building2, CheckCircle, ShieldCheck, Info } from 'lucide-react';

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
  onSaveHistory: (item: ProposalHistoryItem) => void;
  initialData?: ProposalHistoryItem | null;
}> = ({ onSaveHistory, initialData }) => {
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [isCnpjValid, setIsCnpjValid] = useState<boolean | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<RequeUnit>(RequeUnit.PONTA_GROSSA);
  const [numEmployees, setNumEmployees] = useState(1);
  const [riskLevel, setRiskLevel] = useState<RiskLevel>(RiskLevel.RISK_1);
  const [fidelity, setFidelity] = useState<FidelityModel>(FidelityModel.WITH_FIDELITY);
  const [showProposal, setShowProposal] = useState(false);

  useEffect(() => {
    if (initialData) {
      setCompanyName(initialData.companyName);
      setContactName(initialData.contactName);
      setCnpj(initialData.cnpj);
      setNumEmployees(initialData.numEmployees);
      setFidelity(initialData.fidelity);
      setSelectedUnit(initialData.selectedUnit);
      setRiskLevel(initialData.riskLevel);
      const numericOnly = initialData.cnpj.replace(/\D/g, '');
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

    // Regra de Faturamento: Express/Essencial com Fidelidade = Anual Antecipado
    let billingCycle = BillingCycle.MONTHLY;
    if (isFidelity && (activePlan === PlanType.EXPRESS || activePlan === PlanType.ESSENCIAL)) {
      billingCycle = BillingCycle.ANNUAL;
    }

    // Forma de Pagamento: Express sem fidelidade = Cartão. Demais = Boleto.
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
      clientDeliveryDate: '',
      docDeliveryDate: '',
      businessDays: 0,
      contractTotalCurrentCycle: initialAssinatura,
      initialPaymentAmount: initialAssinatura + programFee,
      isCustomQuote: monthlyBase === 0,
      commercialSummary: isFidelity 
        ? `Plano com Fidelidade 24 meses. Isenção integral do valor de elaboração dos programas (PGR/PCMSO).` 
        : `Plano sem fidelidade. Cobrança integral da taxa de elaboração dos programas.`
    };
  }, [numEmployees, riskLevel, fidelity, activePlan]);

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
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
          <div className="flex-1 w-full space-y-6">
            {/* Empresa */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-sm font-bold text-reque-navy uppercase mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-reque-orange" /> Dados do Contratante
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value.toUpperCase())} className="w-full p-2.5 border border-slate-300 rounded text-sm uppercase outline-none focus:border-reque-blue" placeholder="RAZÃO SOCIAL" />
                <div className="relative">
                  <input type="text" value={cnpj} onChange={e => {
                    const fmt = formatCNPJ(e.target.value);
                    setCnpj(fmt);
                    const clean = fmt.replace(/\D/g,'');
                    setIsCnpjValid(clean.length === 14 ? validateCNPJ(clean) : null);
                  }} maxLength={18} className={`w-full p-2.5 border rounded text-sm outline-none ${isCnpjValid === false ? 'border-red-300 bg-red-50' : 'border-slate-300 focus:border-reque-blue'}`} placeholder="CNPJ" />
                  {isCnpjValid === true && <CheckCircle className="absolute right-3 top-3 w-4 h-4 text-green-500" />}
                </div>
                <input type="text" value={contactName} onChange={e => setContactName(e.target.value.toUpperCase())} className="w-full p-2.5 border border-slate-300 rounded text-sm uppercase outline-none focus:border-reque-blue" placeholder="A/C (RESPONSÁVEL)" />
                <select value={selectedUnit} onChange={e => setSelectedUnit(e.target.value as RequeUnit)} className="w-full p-2.5 border border-slate-300 rounded text-sm bg-white outline-none focus:border-reque-blue">
                  {Object.values(RequeUnit).map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            {/* Dimensionamento */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-sm font-bold text-reque-navy uppercase mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-reque-orange" /> Dimensionamento ({activePlan})
              </h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-end mb-3">
                    <label className="text-xs font-bold text-slate-500">Número de Funcionários (Vidas)</label>
                    <span className="text-3xl font-black text-reque-blue">{numEmployees}</span>
                  </div>
                  <input type="range" min="1" max="200" value={numEmployees} onChange={e => setNumEmployees(parseInt(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none accent-reque-orange cursor-pointer" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Grau de Risco da Atividade</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[RiskLevel.RISK_1, RiskLevel.RISK_2, RiskLevel.RISK_3, RiskLevel.RISK_4].map(r => (
                        <button key={r} onClick={() => setRiskLevel(r)} className={`py-2 px-1 border rounded font-bold text-xs transition-all ${riskLevel === r ? 'bg-reque-blue text-white border-reque-blue shadow-md' : 'bg-white text-slate-400 hover:border-slate-400'}`}>
                          {r.split(' ')[1]}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 italic flex items-center gap-1">
                      <Info className="w-3 h-3" /> Essencial/Pró exigem Risco 2, 3 ou 4.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Modelo de Contratação</label>
                    <div className="flex flex-col gap-2">
                      <button onClick={() => setFidelity(FidelityModel.WITH_FIDELITY)} className={`p-2.5 border rounded-lg text-xs font-bold text-left transition-all flex items-center justify-between ${fidelity === FidelityModel.WITH_FIDELITY ? 'border-reque-orange bg-orange-50 text-reque-navy ring-1 ring-reque-orange' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}>
                        COM FIDELIDADE (ISENTO PGR)
                        {fidelity === FidelityModel.WITH_FIDELITY && <CheckCircle className="w-4 h-4 text-reque-orange" />}
                      </button>
                      <button onClick={() => setFidelity(FidelityModel.NO_FIDELITY)} className={`p-2.5 border rounded-lg text-xs font-bold text-left transition-all flex items-center justify-between ${fidelity === FidelityModel.NO_FIDELITY ? 'border-reque-orange bg-orange-50 text-reque-navy ring-1 ring-reque-orange' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}>
                        SEM FIDELIDADE (PAGAMENTO SETUP)
                        {fidelity === FidelityModel.NO_FIDELITY && <CheckCircle className="w-4 h-4 text-reque-orange" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Benefícios do Plano */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
               <h3 className="text-sm font-bold text-reque-navy uppercase mb-4 flex items-center gap-2">
                 <ShieldCheck className="w-4 h-4 text-reque-orange" /> Itens Inclusos no {activePlan}
               </h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                 {PLAN_SERVICES[activePlan].map((s, i) => (
                   <div key={i} className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-lg border border-slate-100 text-[10px] font-bold text-slate-600 uppercase leading-tight">
                     <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                     {s}
                   </div>
                 ))}
               </div>
            </div>
          </div>

          <div className="w-full lg:w-[380px] shrink-0">
            {calculationResult && (
              <SummaryCard 
                result={calculationResult} 
                onSaveHistory={() => {
                  onSaveHistory({
                    id: crypto.randomUUID(),
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
                    fidelity
                  });
                }}
                onGenerateProposal={() => {
                  if (!isCnpjValid || !companyName || !contactName) {
                    alert("Por favor, preencha Razão Social, Responsável e um CNPJ válido.");
                    return;
                  }
                  setShowProposal(true);
                }}
                isGenerateDisabled={!isCnpjValid || !companyName || !contactName}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
};
