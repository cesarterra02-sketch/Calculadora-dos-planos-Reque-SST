
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
  BASE_PRICING_TABLE, 
  PROGRAM_FEES_TABLE, 
  PLAN_SERVICES 
} from '../constants';
import { SummaryCard } from './SummaryCard';
import { ProposalView } from './ProposalView'; 
import { Users, Building2, CheckCircle, XCircle, MapPin, CalendarDays, ShieldCheck, Zap } from 'lucide-react';

// --- Helper: CNPJ Logic ---
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
  if (cnpj === '') return false;
  if (cnpj.length !== 14) return false;

  // Eliminate known invalid CNPJs
  if (/^(\d)\1+$/.test(cnpj)) return false;

  // Validate DVs
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
  if (resultado != parseInt(digitos.charAt(1))) return false;

  return true;
};

// --- Helper: Business Days Calculation ---
const countBusinessDays = (startDateStr: string, endDateStr: string): number => {
  if (!startDateStr || !endDateStr) return 0;
  
  let count = 0;
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  
  // Normalize to start of day to avoid time issues
  start.setHours(0,0,0,0);
  end.setHours(0,0,0,0);

  if (end < start) return 0;

  const cur = new Date(start);
  while (cur <= end) {
    const dayOfWeek = cur.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  
  return count;
};

interface PricingCalculatorProps {
  onSaveHistory: (item: ProposalHistoryItem) => void;
  initialData?: ProposalHistoryItem | null;
}

export const PricingCalculator: React.FC<PricingCalculatorProps> = ({ onSaveHistory, initialData }) => {
  // --- State Inputs ---
  const [companyName, setCompanyName] = useState<string>('');
  const [contactName, setContactName] = useState<string>('');
  const [cnpj, setCnpj] = useState<string>('');
  const [isCnpjValid, setIsCnpjValid] = useState<boolean | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<RequeUnit>(RequeUnit.PONTA_GROSSA);
  const [numEmployees, setNumEmployees] = useState<number>(1);
  const [riskLevel, setRiskLevel] = useState<RiskLevel>(RiskLevel.RISK_1);
  const [fidelity, setFidelity] = useState<FidelityModel>(FidelityModel.WITH_FIDELITY);
  const [showProposal, setShowProposal] = useState<boolean>(false); 
  
  // Dates
  const [clientDeliveryDate, setClientDeliveryDate] = useState<string>('');
  const [docDeliveryDate, setDocDeliveryDate] = useState<string>('');

  // --- Load Initial Data (Edit Mode) ---
  useEffect(() => {
    if (initialData) {
      setCompanyName(initialData.companyName);
      setContactName(initialData.contactName);
      setCnpj(initialData.cnpj);
      setNumEmployees(initialData.numEmployees);
      setFidelity(initialData.fidelity);
      if (initialData.selectedUnit) setSelectedUnit(initialData.selectedUnit);
      if (initialData.riskLevel) setRiskLevel(initialData.riskLevel);
      if (initialData.clientDeliveryDate) setClientDeliveryDate(initialData.clientDeliveryDate);
      if (initialData.docDeliveryDate) setDocDeliveryDate(initialData.docDeliveryDate);
      
      // Re-validate CNPJ if present
      if (initialData.cnpj) {
         const numericOnly = initialData.cnpj.replace(/\D/g, '');
         if (numericOnly.length === 14) setIsCnpjValid(validateCNPJ(numericOnly));
      }
      setShowProposal(false); 
    }
  }, [initialData]);

  // --- Handlers ---
  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formatted = formatCNPJ(rawValue);
    setCnpj(formatted);

    const numericOnly = formatted.replace(/\D/g, '');
    
    if (numericOnly.length === 14) {
      setIsCnpjValid(validateCNPJ(numericOnly));
    } else if (numericOnly.length === 0) {
      setIsCnpjValid(null);
    } else {
      setIsCnpjValid(null);
    }
  };

  // --- Derived State: Plan Logic based on PDF ---
  const activePlan = useMemo(() => {
    if (numEmployees > 20) return PlanType.PRO;
    return PlanType.EXPRESS;
  }, [numEmployees]);


  // --- Calculation Logic ---
  const calculationResult: PricingResult | null = useMemo(() => {
    // 1. Identify Range
    const identifiedRange: EmployeeRange | undefined = EMPLOYEE_RANGES.find(
      (r) => numEmployees >= r.min && numEmployees <= r.max
    );

    if (!identifiedRange) {
      return null;
    }

    // Days Calculation
    const daysCount = countBusinessDays(clientDeliveryDate, docDeliveryDate);

    // 2. Handle SST PRO (CUSTOM QUOTE)
    if (activePlan === PlanType.PRO) {
       return {
          rangeLabel: identifiedRange.label,
          monthlyValue: 0,
          billingCycle: BillingCycle.MONTHLY,
          paymentMethod: PaymentMethod.BOLETO,
          programFee: 0,
          originalProgramFee: 0,
          programFeeDiscounted: false,
          riskLevel: riskLevel,
          clientDeliveryDate,
          docDeliveryDate,
          businessDays: daysCount,
          contractTotalCurrentCycle: 0, 
          initialPaymentAmount: 0,
          isCustomQuote: true,
          commercialSummary: `SST Pró (Acima de 20 vidas). Necessário análise personalizada pelo departamento comercial considerando Grau de Risco e particularidades.`,
        };
    }

    // 3. Handle SST EXPRESS
    if (!BASE_PRICING_TABLE[PlanType.EXPRESS]) return null;

    const monthlyBase = BASE_PRICING_TABLE[PlanType.EXPRESS][identifiedRange.id];
    const programFeeBase = PROGRAM_FEES_TABLE[identifiedRange.id] || 0;

    if (monthlyBase === 0) return null;

    let finalBillingCycle = BillingCycle.MONTHLY;
    let finalProgramFee = programFeeBase;
    let isFeeDiscounted = false;
    let cycleTotal = 0;
    
    if (fidelity === FidelityModel.WITH_FIDELITY) {
      finalBillingCycle = BillingCycle.ANNUAL;
      isFeeDiscounted = true;
      finalProgramFee = 0; 
      cycleTotal = monthlyBase * 12; 
    } else {
      finalBillingCycle = BillingCycle.MONTHLY;
      isFeeDiscounted = false;
      finalProgramFee = programFeeBase;
      cycleTotal = monthlyBase;
    }

    const summaryText = fidelity === FidelityModel.WITH_FIDELITY 
      ? `Plano com Fidelidade 24 meses. Isenção total da taxa de implantação (Economia de R$ ${programFeeBase.toFixed(2)}).`
      : 'Plano sem fidelidade. Taxa de implantação integral aplicada.';

    return {
      rangeLabel: identifiedRange.label,
      monthlyValue: monthlyBase,
      billingCycle: finalBillingCycle,
      paymentMethod: PaymentMethod.CREDIT_CARD,
      programFee: finalProgramFee,
      originalProgramFee: programFeeBase,
      programFeeDiscounted: isFeeDiscounted,
      riskLevel: riskLevel,
      clientDeliveryDate,
      docDeliveryDate,
      businessDays: daysCount,
      contractTotalCurrentCycle: cycleTotal,
      initialPaymentAmount: cycleTotal + finalProgramFee,
      isCustomQuote: false,
      commercialSummary: summaryText
    };

  }, [
    numEmployees, 
    riskLevel, 
    fidelity, 
    activePlan, 
    clientDeliveryDate, 
    docDeliveryDate
  ]);

  const handleSave = () => {
    if (calculationResult) {
      const historyItem: ProposalHistoryItem = {
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
        fidelity,
        clientDeliveryDate,
        docDeliveryDate,
      };
      onSaveHistory(historyItem);
    }
  };

  const toggleProposalView = () => {
    if (!companyName || !contactName) {
      alert("Por favor, preencha o Nome da Empresa e do Responsável para gerar a proposta.");
      return;
    }
    setShowProposal(true);
  };

  if (showProposal && calculationResult) {
    return (
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
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      {/* --- LEFT COLUMN: INPUTS & SERVICES --- */}
      <div className="flex-1 w-full space-y-6">
        
        {/* 1. Identificação */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
           <h3 className="text-sm font-bold text-reque-navy uppercase tracking-wider mb-4 flex items-center gap-2">
             <Building2 className="w-4 h-4 text-reque-orange" />
             Dados da Empresa
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Razão Social / Nome</label>
                <input 
                  type="text" 
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value.toUpperCase())}
                  className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-reque-blue/20 outline-none uppercase"
                  placeholder="EX: INDÚSTRIA ABC LTDA"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">CNPJ</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={cnpj}
                    onChange={handleCnpjChange}
                    maxLength={18}
                    className={`w-full p-2 border rounded text-sm focus:ring-2 focus:ring-reque-blue/20 outline-none pr-8 ${
                      isCnpjValid === false ? 'border-red-300 bg-red-50' : 
                      isCnpjValid === true ? 'border-green-300 bg-green-50' : 'border-slate-300'
                    }`}
                    placeholder="00.000.000/0001-00"
                  />
                  <div className="absolute right-2 top-2.5">
                    {isCnpjValid === true && <CheckCircle className="w-4 h-4 text-green-500" />}
                    {isCnpjValid === false && <XCircle className="w-4 h-4 text-red-500" />}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Responsável / Contato</label>
                <input 
                  type="text" 
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value.toUpperCase())}
                  className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-reque-blue/20 outline-none uppercase"
                  placeholder="NOME DO SOLICITANTE"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Unidade de Referência</label>
                <div className="relative">
                  <MapPin className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                  <select 
                    value={selectedUnit}
                    onChange={(e) => setSelectedUnit(e.target.value as RequeUnit)}
                    className="w-full pl-9 p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-reque-blue/20 outline-none appearance-none bg-white"
                  >
                    {Object.values(RequeUnit).map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>
           </div>
        </div>

        {/* 2. Parâmetros de Precificação */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden">
           {activePlan === PlanType.PRO && (
             <div className="absolute top-0 right-0 bg-reque-navy text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
               <Zap className="w-3 h-3 text-reque-orange" />
               SST PRÓ ATIVO
             </div>
           )}

           <h3 className="text-sm font-bold text-reque-navy uppercase tracking-wider mb-4 flex items-center gap-2">
             <Users className="w-4 h-4 text-reque-orange" />
             Dimensionamento
           </h3>

           <div className="space-y-6">
             {/* Slider Vidas */}
             <div>
               <div className="flex justify-between items-end mb-2">
                 <label className="text-xs font-bold text-slate-500">Número de Vidas (Funcionários)</label>
                 <span className="text-2xl font-extrabold text-reque-blue">{numEmployees}</span>
               </div>
               <input 
                  type="range" 
                  min="1" 
                  max="100" 
                  value={numEmployees}
                  onChange={(e) => setNumEmployees(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-reque-orange"
               />
               <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                 <span>1</span>
                 <span>20 (Limite Express)</span>
                 <span>100+</span>
               </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {/* Risk Level */}
               <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">Grau de Risco</label>
                  <div className="grid grid-cols-1 gap-2">
                    {[RiskLevel.RISK_1, RiskLevel.RISK_2, RiskLevel.RISK_3, RiskLevel.RISK_4].map((r) => (
                      <label key={r} className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer transition-all ${riskLevel === r ? 'border-reque-blue bg-blue-50 text-reque-blue shadow-sm' : 'border-slate-200 hover:border-slate-300'}`}>
                        <input 
                          type="radio" 
                          name="risk"
                          className="text-reque-blue focus:ring-reque-blue accent-reque-blue"
                          checked={riskLevel === r}
                          onChange={() => setRiskLevel(r)}
                        />
                        <span className="text-xs font-medium">{r}</span>
                      </label>
                    ))}
                  </div>
               </div>
               
               {/* Fidelity */}
               <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">Plano de Fidelidade</label>
                  <div className="flex flex-col gap-2">
                    <label className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer transition-all ${fidelity === FidelityModel.WITH_FIDELITY ? 'border-reque-orange bg-orange-50 text-reque-dark shadow-sm' : 'border-slate-200 hover:border-slate-300'}`}>
                       <input 
                          type="radio" 
                          name="fidelity"
                          className="text-reque-orange focus:ring-reque-orange accent-reque-orange"
                          checked={fidelity === FidelityModel.WITH_FIDELITY}
                          onChange={() => setFidelity(FidelityModel.WITH_FIDELITY)}
                        />
                       <div>
                         <span className="block text-xs font-bold">Com Fidelidade (24m)</span>
                         <span className="block text-[10px] text-slate-500">Isenção Taxa Implantação</span>
                       </div>
                    </label>

                    <label className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer transition-all ${fidelity === FidelityModel.NO_FIDELITY ? 'border-reque-orange bg-orange-50 text-reque-dark shadow-sm' : 'border-slate-200 hover:border-slate-300'}`}>
                       <input 
                          type="radio" 
                          name="fidelity"
                          className="text-reque-orange focus:ring-reque-orange accent-reque-orange"
                          checked={fidelity === FidelityModel.NO_FIDELITY}
                          onChange={() => setFidelity(FidelityModel.NO_FIDELITY)}
                        />
                       <div>
                         <span className="block text-xs font-bold">Sem Fidelidade</span>
                         <span className="block text-[10px] text-slate-500">Paga Taxa Implantação</span>
                       </div>
                    </label>
                  </div>
               </div>
             </div>
           </div>
        </div>

        {/* 3. Prazos */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
           <h3 className="text-sm font-bold text-reque-navy uppercase tracking-wider mb-4 flex items-center gap-2">
             <CalendarDays className="w-4 h-4 text-reque-orange" />
             Prazos e Entregas
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Entrega Doc. Cliente (Modelo 1)</label>
                <input 
                  type="date" 
                  value={clientDeliveryDate}
                  onChange={(e) => setClientDeliveryDate(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-reque-blue/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Entrega Doc. Reque (PGR/PCMSO)</label>
                <input 
                  type="date" 
                  value={docDeliveryDate}
                  onChange={(e) => setDocDeliveryDate(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-reque-blue/20 outline-none"
                />
              </div>
           </div>
           {calculationResult && calculationResult.businessDays > 0 && (
              <div className="mt-3 text-xs bg-slate-50 p-2 rounded text-slate-600 flex gap-2 items-center">
                 <span className="font-bold">Prazo calculado:</span>
                 {calculationResult.businessDays} dias úteis
              </div>
           )}
        </div>

        {/* 4. Serviços Inclusos (MOVED HERE) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
           <h3 className="text-sm font-bold text-reque-navy uppercase tracking-wider mb-4 flex items-center gap-2">
             <ShieldCheck className="w-4 h-4 text-reque-orange" />
             Incluso no Plano {activePlan}
           </h3>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
             {PLAN_SERVICES[activePlan].map((service, idx) => (
               <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-lg hover:bg-slate-100 hover:border-reque-blue/20 transition-all group">
                  <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 group-hover:border-reque-blue/30 group-hover:bg-blue-50 transition-colors">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <span className="text-xs font-bold text-slate-600 leading-tight">{service}</span>
               </div>
             ))}
           </div>
        </div>

      </div>

      {/* --- RIGHT COLUMN: SUMMARY --- */}
      <div className="w-full lg:w-[380px] shrink-0 space-y-4">
        {calculationResult && (
          <SummaryCard 
            result={calculationResult} 
            onSaveHistory={handleSave}
            onGenerateProposal={toggleProposalView}
          />
        )}
      </div>
    </div>
  );
};
