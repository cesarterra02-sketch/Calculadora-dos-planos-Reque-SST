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
  RiskLevel,
  User,
  ExamItem
} from '../types';
import { 
  EMPLOYEE_RANGES, 
  MONTHLY_VALUES_EXPRESS,
  MONTHLY_VALUES_PRO,
  PROGRAM_FEES_TABLE, 
  PLAN_SERVICES,
  UNIT_EXAM_TABLES
} from '../constants';
import { SummaryCard } from './SummaryCard';
import { ProposalView } from './ProposalView'; 
import { Users, Building2, CheckCircle, ShieldCheck, Info, Sparkles, Hash, UserCircle, AlertCircle, CalendarDays, RefreshCcw, UserPlus, X, MapPin, Edit3, Settings2, Plus, Trash2, Save as SaveIcon, ArrowDownToLine, ChevronUp, ChevronDown } from 'lucide-react';

const formatDocument = (value: string) => {
  const cleanValue = value.replace(/\D/g, '');
  
  if (cleanValue.length <= 11) {
    return cleanValue
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .slice(0, 14);
  } else {
    return cleanValue
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18);
  }
};

const validateCPF = (cpf: string): boolean => {
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  let add = 0;
  for (let i = 0; i < 9; i++) add += parseInt(cpf.charAt(i)) * (10 - i);
  let rev = 11 - (add % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cpf.charAt(9))) return false;
  add = 0;
  for (let i = 0; i < 10; i++) add += parseInt(cpf.charAt(i)) * (11 - i);
  rev = 11 - (add % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cpf.charAt(10))) return false;
  return true;
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

const validateDocument = (doc: string): boolean => {
  const clean = doc.replace(/\D/g, '');
  if (clean.length === 11) return validateCPF(clean);
  if (clean.length === 14) return validateCNPJ(clean);
  return false;
};

export const PricingCalculator: React.FC<{
  currentUser: User | null;
  onSaveHistory: (item: ProposalHistoryItem) => Promise<any>;
  initialData?: ProposalHistoryItem | null;
  canGenerateProposal?: boolean;
}> = ({ currentUser, onSaveHistory, initialData, canGenerateProposal = true }) => {
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [cnpj, setCnpj] = useState(''); 
  const [isDocumentValid, setIsDocumentValid] = useState<boolean | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<RequeUnit>(RequeUnit.PONTA_GROSSA);
  const [numEmployees, setNumEmployees] = useState(1);
  const [externalLivesCount, setExternalLivesCount] = useState(0);
  const [riskLevel, setRiskLevel] = useState<RiskLevel>(RiskLevel.RISK_1);
  const [fidelity, setFidelity] = useState<FidelityModel>(FidelityModel.WITH_FIDELITY);
  const [isRenewal, setIsRenewal] = useState(false);
  const [isCustomTable, setIsCustomTable] = useState(false);
  const [specialDiscount, setSpecialDiscount] = useState<number>(0);
  const [clientDeliveryDate, setClientDeliveryDate] = useState('');
  const [docDeliveryDate, setDocDeliveryDate] = useState('');
  const [showProposal, setShowProposal] = useState(false);
  const [selectedInstallments, setSelectedInstallments] = useState(1);
  const [isSimulationSaved, setIsSimulationSaved] = useState(false);
  const [showSaveAlert, setShowSaveAlert] = useState(false);

  // Estados para o Modal de Exames Customizados
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [customCity, setCustomCity] = useState('');
  const [customExams, setCustomExams] = useState<any[]>(
    UNIT_EXAM_TABLES[RequeUnit.PONTA_GROSSA].map(exam => ({
      ...exam,
      category: exam.category.toUpperCase(),
      name: exam.name.toUpperCase(),
      basePrice: 0,
      price: 0,
      margin: 0
    }))
  );
  const [modalExamSearch, setModalExamSearch] = useState<ExamItem[]>([]);
  const [modalSearchingIndex, setModalSearchingIndex] = useState<number | null>(null);

  useEffect(() => {
    if (initialData) {
      setCompanyName(initialData.companyName || '');
      setContactName(initialData.contactName || '');
      const formattedDoc = formatDocument(initialData.cnpj || '');
      setCnpj(formattedDoc);
      setNumEmployees(initialData.numEmployees || 1);
      setExternalLivesCount(initialData.externalLivesCount || 0);
      setFidelity(initialData.fidelity || FidelityModel.WITH_FIDELITY);
      setIsRenewal(initialData.isRenewal || false);
      setSpecialDiscount(initialData.specialDiscount || 0);
      setSelectedUnit(initialData.selectedUnit || RequeUnit.PONTA_GROSSA);
      setRiskLevel(initialData.riskLevel || RiskLevel.RISK_1);
      setClientDeliveryDate(initialData.clientDeliveryDate || '');
      setDocDeliveryDate(initialData.docDeliveryDate || '');
      setIsDocumentValid(validateDocument(formattedDoc));
      setIsSimulationSaved(true);
    }
  }, [initialData]);

  // Regra de Validação: Monitoramento de alterações para controle de salvamento
  useEffect(() => {
    if (initialData) {
      const hasChanges = 
        companyName !== (initialData.companyName || '') ||
        contactName !== (initialData.contactName || '') ||
        cnpj.replace(/\D/g, '') !== (initialData.cnpj || '').replace(/\D/g, '') ||
        numEmployees !== (initialData.numEmployees || 1) ||
        externalLivesCount !== (initialData.externalLivesCount || 0) ||
        riskLevel !== (initialData.riskLevel || RiskLevel.RISK_1) ||
        fidelity !== (initialData.fidelity || FidelityModel.WITH_FIDELITY) ||
        isRenewal !== (initialData.isRenewal || false) ||
        specialDiscount !== (initialData.specialDiscount || 0) ||
        selectedUnit !== (initialData.selectedUnit || RequeUnit.PONTA_GROSSA) ||
        clientDeliveryDate !== (initialData.clientDeliveryDate || '') ||
        docDeliveryDate !== (initialData.docDeliveryDate || '');

      setIsSimulationSaved(!hasChanges);
    } else {
      if (companyName || contactName || cnpj) {
        setIsSimulationSaved(false);
      }
    }
  }, [
    companyName, contactName, cnpj, numEmployees, externalLivesCount, 
    riskLevel, fidelity, isRenewal, specialDiscount, selectedUnit, 
    clientDeliveryDate, docDeliveryDate, initialData, isCustomTable
  ]);

  const activePlan = useMemo(() => {
    if (riskLevel === RiskLevel.RISK_1) return PlanType.EXPRESS;
    if (numEmployees <= 20) return PlanType.ESSENCIAL;
    return PlanType.PRO;
  }, [numEmployees, riskLevel]);

  const isCPF = useMemo(() => {
    return cnpj.replace(/\D/g, '').length === 11;
  }, [cnpj]);

  const planItems = useMemo(() => {
    const originalItems = PLAN_SERVICES[activePlan];
    if (isCPF) {
      return originalItems.map(item => 
        item === 'Elaboração de PGR' ? 'Elaboração de PGRTR' : item
      );
    }
    return originalItems;
  }, [activePlan, isCPF]);

  const calculationResult: PricingResult | null = useMemo(() => {
    const range = EMPLOYEE_RANGES.find(r => numEmployees >= r.min && numEmployees <= r.max);
    if (!range) return null;

    const monthlyTable = activePlan === PlanType.PRO ? MONTHLY_VALUES_PRO : MONTHLY_VALUES_EXPRESS;
    const monthlyBase = monthlyTable[range.id] || 0;
    const programFeeBase = PROGRAM_FEES_TABLE[range.id] || 0;

    const schedulingCostTotal = externalLivesCount * 5.50;
    const monthlyValue = monthlyBase + schedulingCostTotal;

    const isFidelity = fidelity === FidelityModel.WITH_FIDELITY;
    const baseFee = isFidelity ? 0 : programFeeBase;
    const programFee = isRenewal && !isFidelity ? baseFee * 0.5 : baseFee;

    let billingCycle = BillingCycle.MONTHLY;
    if (isFidelity && (activePlan === PlanType.EXPRESS || activePlan === PlanType.ESSENCIAL)) {
      billingCycle = BillingCycle.ANNUAL;
    }

    const paymentMethod = (activePlan === PlanType.EXPRESS) 
      ? PaymentMethod.CREDIT_CARD 
      : PaymentMethod.BOLETO;

    const initialAssinatura = billingCycle === BillingCycle.ANNUAL ? monthlyValue * 12 : monthlyValue;

    return {
      rangeLabel: range.label,
      monthlyValue: monthlyValue,
      billingCycle,
      paymentMethod,
      programFee,
      isRenewal,
      specialDiscount,
      originalProgramFee: programFeeBase,
      programFeeDiscounted: isFidelity || isRenewal,
      riskLevel,
      clientDeliveryDate,
      docDeliveryDate,
      businessDays: 19,
      contractTotalCurrentCycle: initialAssinatura,
      initialPaymentAmount: initialAssinatura + programFee,
      isCustomQuote: monthlyBase === 0,
      externalLivesCount,
      schedulingCostTotal,
      isRenovação: isRenewal,
      totalWithDiscount: Math.max(0, (initialAssinatura + programFee) - specialDiscount),
      commercialSummary: isFidelity 
        ? `Plano com Fidelidade 24 meses. Isenção integral do valor de elaboração dos programas (${isCPF ? 'PGRTR' : 'PGR'}/PCMSO).${externalLivesCount > 0 ? ` Inclui gestão de agendamento para ${externalLivesCount} vidas externas.` : ''}` 
        : `${isRenewal ? `Renovação de plano com 50% de desconto na revisão técnica. ` : `Plano sem fidelidade. `}Cobrança integral da taxa de elaboração dos programas.${externalLivesCount > 0 ? ` Inclui gestão de agendamento para ${externalLivesCount} vidas externas.` : ''}`
    };
  }, [numEmployees, externalLivesCount, riskLevel, fidelity, activePlan, clientDeliveryDate, docDeliveryDate, isRenewal, specialDiscount, isCPF]);

  const addCustomExam = () => {
    setCustomExams([...customExams, { category: 'COMPLEMENTARES', name: '', price: 0, basePrice: 0, margin: 0, deadline: 'mesmo dia' }]);
  };

  const removeCustomExam = (index: number) => {
    setCustomExams(customExams.filter((_, i) => i !== index));
  };

  const moveCustomExam = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= customExams.length) return;
    
    const newExams = [...customExams];
    const item = newExams[index];
    newExams[index] = newExams[newIndex];
    newExams[newIndex] = item;
    setCustomExams(newExams);
  };

  const handleCustomExamChange = (index: number, field: string, value: any) => {
    const newExams = [...customExams];
    newExams[index] = { ...newExams[index], [field]: value };
    
    // Lógica cirúrgica: Ao editar o preço manualmente, atualizamos o preço base e resetamos a margem
    if (field === 'price') {
      newExams[index].basePrice = value;
      newExams[index].margin = 0;
    }
    
    setCustomExams(newExams);
  };

  const handleMarginUpdate = (index: number, marginValue: number) => {
    const newExams = [...customExams];
    const item = newExams[index];
    item.margin = marginValue;
    // Lógica cirúrgica: Preço = Preço Base * (1 + Margem/100)
    item.price = Number((item.basePrice * (1 + marginValue / 100)).toFixed(2));
    setCustomExams(newExams);
  };

  const applyMarginToAllBelow = (index: number) => {
    const marginValue = customExams[index].margin;
    const newExams = customExams.map((exam, idx) => {
      if (idx > index) {
        const updatedItem = { ...exam, margin: marginValue };
        updatedItem.price = Number((updatedItem.basePrice * (1 + marginValue / 100)).toFixed(2));
        return updatedItem;
      }
      return exam;
    });
    setCustomExams(newExams);
  };

  const handleModalExamSearch = (query: string, index: number) => {
    handleCustomExamChange(index, 'name', query.toUpperCase());
    if (query.length >= 2) {
      const allAvailableExams = Object.values(UNIT_EXAM_TABLES).flat();
      const uniqueExamsMap = new Map();
      allAvailableExams.forEach(item => {
        if (!uniqueExamsMap.has(item.name)) {
          uniqueExamsMap.set(item.name, item);
        }
      });
      const uniqueExams = Array.from(uniqueExamsMap.values());
      
      const filtered = uniqueExams.filter(e => 
        e.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10);
      
      setModalExamSearch(filtered);
      setModalSearchingIndex(index);
    } else {
      setModalExamSearch([]);
      setModalSearchingIndex(null);
    }
  };

  const selectExamForModal = (exam: ExamItem, index: number) => {
    const newExams = [...customExams];
    newExams[index] = { 
      ...newExams[index], 
      name: exam.name.toUpperCase(), 
      price: exam.price,
      basePrice: exam.price,
      margin: 0,
      category: exam.category.toUpperCase(),
      deadline: exam.deadline
    };
    setCustomExams(newExams);
    setModalExamSearch([]);
    setModalSearchingIndex(null);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start relative">
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
            selectedInstallments={selectedInstallments}
            specialDiscount={specialDiscount}
            isCustomTable={isCustomTable}
            customExams={customExams}
            customCity={customCity}
          />
        </div>
      ) : (
        <>
          <div className="flex-1 w-full space-y-4">
            {/* 1. DADOS DO CONTRATANTE */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[11px] font-black text-reque-navy uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-reque-orange" /> Dados do Contratante
                </h3>
                
                <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
                  <button 
                    onClick={() => { setIsRenewal(false); setSpecialDiscount(0); }}
                    className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg font-black text-[9px] uppercase transition-all ${!isRenewal ? 'bg-white text-reque-navy shadow-sm ring-1 ring-slate-200' : 'text-slate-400'}`}
                  >
                    <UserPlus className="w-3 h-3" /> Cliente Novo
                  </button>
                  <button 
                    onClick={() => setIsRenewal(true)}
                    className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg font-black text-[9px] uppercase transition-all ${isRenewal ? 'bg-reque-navy text-white shadow-sm' : 'text-slate-400'}`}
                  >
                    <RefreshCcw className="w-3 h-3" /> Renovação (50%)
                  </button>
                </div>
              </div>
              
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
                      const fmt = formatDocument(e.target.value);
                      setCnpj(fmt);
                      setIsDocumentValid(validateDocument(fmt));
                    }} className={`w-full pl-10 pr-3 py-2.5 border rounded-xl text-xs font-bold outline-none transition-all ${isDocumentValid === false ? 'border-red-500 bg-red-50 text-red-900 ring-1 ring-red-500' : 'border-slate-200 focus:border-reque-blue focus:ring-4 focus:ring-reque-blue/5'}`} placeholder="CPF OU CNPJ" />
                  </div>
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
              </div>
            </div>

            {/* 2. PRAZOS DE ENTREGA */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60">
              <h3 className="text-xs font-black text-reque-navy uppercase mb-6 tracking-widest flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-reque-orange" /> Prazos de Entrega
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
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
                <div>
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

            {/* 3. PARÂMETROS DO PLANO */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60">
              <h3 className="text-xs font-black text-reque-navy uppercase mb-6 tracking-widest flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-reque-orange" /> Parâmetros do Plano
              </h3>
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

            {/* 4. DIMENSIONAMENTO */}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                    <div className="flex justify-between items-end mb-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nº de Funcionários</label>
                        <p className="text-[9px] text-slate-400 italic">Total de vidas ativas</p>
                      </div>
                      <span className="text-4xl font-black text-reque-navy tracking-tighter">{numEmployees}</span>
                    </div>
                    <input type="range" min="1" max="200" value={numEmployees} onChange={e => {
                      const val = parseInt(e.target.value);
                      setNumEmployees(val);
                      if (externalLivesCount > val) setExternalLivesCount(val);
                    }} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none accent-reque-orange cursor-pointer hover:accent-reque-navy transition-all" />
                  </div>

                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                    <div className="flex justify-between items-end mb-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          Gestão de agendamento
                        </label>
                        <p className="text-[9px] text-slate-400 italic">Vidas atendidas fora das unidades Reque</p>
                      </div>
                      <span className="text-4xl font-black text-reque-orange tracking-tighter">{externalLivesCount}</span>
                    </div>
                    <input type="range" min="0" max={numEmployees} value={externalLivesCount} onChange={e => setExternalLivesCount(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none accent-reque-orange cursor-pointer hover:accent-reque-navy transition-all" />
                    <div className="flex justify-between mt-1 px-1">
                       <span className="text-[8px] font-bold text-slate-400 uppercase">Interno (Reque)</span>
                       <span className="text-[8px] font-bold text-reque-orange uppercase">Externo (+R$ 5,50/vida)</span>
                    </div>
                  </div>
              </div>
            </div>

            {/* 5. TABELA DE EXAMES */}
            <div className={`p-5 rounded-2xl shadow-sm border transition-all duration-500 ${isCustomTable ? 'bg-orange-50/40 border-reque-orange ring-4 ring-reque-orange/10 shadow-lg shadow-orange-100/50' : 'bg-white border-slate-200/60'}`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-black text-reque-navy uppercase flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-reque-orange" /> Tabela de Exames
                  {isCustomTable && <span className="ml-2 text-[8px] bg-reque-orange text-white px-2 py-0.5 rounded-full font-black animate-pulse">CUSTOMIZADA</span>}
                </h3>
                <div className="flex items-center gap-3 bg-slate-50 p-1 rounded-xl border border-slate-100">
                   <span className="text-[9px] font-black text-slate-400 uppercase px-2">Personalizada?</span>
                   <button onClick={() => setIsCustomTable(false)} className={`py-1.5 px-4 rounded-lg text-[10px] font-black transition-all ${!isCustomTable ? 'bg-reque-navy text-white shadow-sm' : 'text-slate-400'}`}>NÃO</button>
                   <button onClick={() => setIsCustomTable(true)} className={`py-1.5 px-4 rounded-lg text-[10px] font-black transition-all ${isCustomTable ? 'bg-reque-orange text-white shadow-sm' : 'text-slate-400'}`}>SIM</button>
                </div>
              </div>
              {isCustomTable && (
                <button 
                  onClick={() => setIsExamModalOpen(true)}
                  className="w-full py-3 bg-white border-2 border-reque-orange/50 rounded-xl text-[10px] font-black uppercase text-reque-orange flex items-center justify-center gap-2 hover:bg-orange-50 transition-all shadow-sm"
                >
                  <Edit3 className="w-4 h-4" /> Configurar Tabela Personalizada ({customCity || selectedUnit.replace('Unidade Reque ', '').toUpperCase()})
                </button>
              )}
            </div>

            {/* 6. ITENS DO PLANO */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60">
               <div className="flex items-center gap-2 mb-4">
                 <ShieldCheck className="w-4 h-4 text-[#ec9d23]" />
                 <h3 className="text-[11px] font-black text-reque-navy uppercase tracking-wider">Itens do Plano</h3>
                 <span className="h-px flex-1 bg-slate-100"></span>
                 <span className="text-[10px] font-black text-reque-navy bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{activePlan}</span>
               </div>
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                 {planItems.map((s, i) => (
                   <div key={i} className={`flex items-center gap-1.5 p-2 rounded-lg border text-[9px] font-bold uppercase leading-tight transition-colors ${s === 'Elaboração de PGR' ? 'Elaboração de PGRTR' : s}`}>
                     <CheckCircle className={`w-2.5 h-2.5 shrink-0 ${s === 'Elaboração de PGRTR' ? 'text-orange-600' : 'text-green-500'}`} />
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
                plan={activePlan}
                fidelity={fidelity}
                currentUser={currentUser}
                selectedInstallments={selectedInstallments}
                onInstallmentsChange={setSelectedInstallments}
                specialDiscount={specialDiscount}
                setSpecialDiscount={setSpecialDiscount}
                onSaveHistory={async () => {
                  const res = await onSaveHistory({
                    id: initialData?.id || crypto.randomUUID(),
                    type: 'standard',
                    createdAt: new Date().toISOString(),
                    companyName,
                    contactName,
                    cnpj,
                    selectedUnit,
                    plan: activePlan,
                    numEmployees,
                    externalLivesCount,
                    riskLevel,
                    isRenewal,
                    specialDiscount,
                    monthlyValue: calculationResult.monthlyValue,
                    initialTotal: calculationResult.initialPaymentAmount - specialDiscount,
                    fidelity,
                    clientDeliveryDate,
                    docDeliveryDate
                  });
                  setIsSimulationSaved(true);
                  return res;
                }}
                onGenerateProposal={canGenerateProposal ? () => {
                  if (!isSimulationSaved) {
                    setShowSaveAlert(true);
                    return;
                  }
                  if (!isDocumentValid) {
                    alert("O CPF/CNPJ informado é inválido.");
                    return;
                  }
                  if (!companyName || !contactName) {
                    alert("Por favor, preencha Razão Social e Responsável.");
                    return;
                  }
                  setShowProposal(true);
                } : undefined}
                isGenerateDisabled={!isDocumentValid || !companyName || !contactName || !canGenerateProposal}
              />
            )}
          </div>
        </>
      )}

      {/* MODAL DE CONFIGURAÇÃO DE TABELA PERSONALIZADA */}
      {isExamModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300 overflow-auto">
          <div className="bg-white w-full max-w-[1380px] rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex-1">
                 <h3 className="text-xl font-black text-reque-navy uppercase tracking-tight flex items-center gap-4">
                   ANEXO - TABELA DE VALORES EXAMES | 
                   <div className="relative">
                      <input 
                        type="text" 
                        value={customCity} 
                        onChange={(e) => setCustomCity(e.target.value.toUpperCase())}
                        className="bg-white border-b-2 border-reque-orange outline-none px-2 py-1 text-reque-navy w-[450px] placeholder:text-slate-300 transition-all focus:w-[550px]"
                        placeholder="NOME DA CIDADE"
                      />
                   </div>
                 </h3>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Configuração técnica de valores personalizados para anexo de proposta</p>
              </div>
              <button onClick={() => setIsExamModalOpen(false)} className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-red-500 rounded-2xl shadow-sm transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto flex-1">
              <div className="flex gap-4 items-start">
                {/* Bloco da Tabela Principal */}
                <div className="flex-1 border border-slate-300 rounded-2xl overflow-hidden shadow-sm bg-white">
                  <table className="w-full text-left border-collapse table-fixed">
                    <thead>
                      <tr className="bg-[#190c59] text-white text-[10px] font-black uppercase tracking-widest h-[32px]">
                        <th className="px-4 w-[18%] border-r border-white/10">TIPO DE EXAME</th>
                        <th className="px-4 w-[40%]">NOME DO EXAME</th>
                        <th className="px-4 text-center w-[18%] border-l border-white/10 uppercase leading-tight">Valor PCMSO da Reque SST</th>
                        <th className="px-4 text-center w-[18%] border-l border-white/10 uppercase leading-tight">Prazo de Resultados</th>
                        <th className="px-4 text-center w-[80px] border-l border-white/10 uppercase">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs font-bold text-slate-600">
                      {customExams.map((exam, idx) => (
                        <tr key={idx} className={`h-[32px] ${idx % 2 === 0 ? 'bg-white' : 'bg-[#f0f2f5]/40'}`}>
                          <td className="px-4 border-r border-slate-100">
                            <input 
                              type="text" 
                              value={exam.category} 
                              onChange={(e) => handleCustomExamChange(idx, 'category', e.target.value.toUpperCase())}
                              className="w-full bg-transparent outline-none focus:bg-white px-1 py-0 rounded transition-colors uppercase truncate text-[10px]"
                            />
                          </td>
                          <td className="px-4">
                            <div className="relative">
                              <input 
                                type="text" 
                                value={exam.name} 
                                onChange={(e) => handleModalExamSearch(e.target.value, idx)}
                                className="w-full bg-transparent outline-none focus:bg-white px-1 py-0 rounded transition-colors uppercase truncate text-[10px]"
                                placeholder="NOME DO EXAME"
                              />
                              {modalSearchingIndex === idx && modalExamSearch.length > 0 && (
                                <div className="absolute z-[130] mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-2xl max-h-52 overflow-auto animate-in fade-in slide-in-from-top-2">
                                  {modalExamSearch.map((res, rIdx) => (
                                    <button 
                                      key={rIdx} 
                                      onClick={() => selectExamForModal(res, idx)} 
                                      className="w-full text-left p-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors"
                                    >
                                      <div className="text-[10px] font-black text-reque-navy uppercase">{res.name}</div>
                                      <div className="text-[9px] text-reque-orange font-bold">Sugestão: {res.category.toUpperCase()} | R$ {res.price}</div>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 border-l border-slate-100 text-center">
                            <div className="relative inline-block w-full">
                              <span className="absolute left-2 top-0.5 text-slate-300 text-[10px]">R$</span>
                              <input 
                                type="number" 
                                value={exam.price} 
                                onChange={(e) => handleCustomExamChange(idx, 'price', Number(e.target.value))}
                                className="w-full pl-8 pr-2 py-0 bg-transparent outline-none focus:bg-white rounded transition-colors text-right font-black text-reque-navy text-[10px]"
                              />
                            </div>
                          </td>
                          <td className="px-4 border-l border-slate-100 text-center">
                            <input 
                              type="text" 
                              value={exam.deadline} 
                              onChange={(e) => handleCustomExamChange(idx, 'deadline', e.target.value)}
                              className="w-full bg-transparent outline-none focus:bg-white px-1 py-0 rounded transition-colors text-center text-[10px]"
                            />
                          </td>
                          <td className="px-4 border-l border-slate-100 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button 
                                onClick={() => moveCustomExam(idx, 'up')}
                                disabled={idx === 0}
                                className="p-0.5 text-slate-300 hover:text-reque-navy disabled:opacity-0 transition-all"
                                title="Subir"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => moveCustomExam(idx, 'down')}
                                disabled={idx === customExams.length - 1}
                                className="p-0.5 text-slate-300 hover:text-reque-navy disabled:opacity-0 transition-all"
                                title="Descer"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => removeCustomExam(idx)}
                                className="p-0.5 text-slate-300 hover:text-red-500 transition-all ml-1"
                                title="Remover"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Bloco Isolado da Margem */}
                <div className="w-32 border border-slate-300 rounded-2xl overflow-hidden shadow-sm bg-white shrink-0">
                  <div className="bg-[#190c59] text-white text-[10px] font-black uppercase tracking-widest h-[32px] flex items-center justify-center">MARGEM (%)</div>
                  <div className="divide-y divide-slate-200">
                    {customExams.map((exam, idx) => (
                      <div key={idx} className={`h-[32px] flex items-center justify-center px-2 ${idx % 2 === 0 ? 'bg-white' : 'bg-[#f0f2f5]/40'}`}>
                        <div className="relative flex items-center w-full group">
                          <input 
                            type="number" 
                            value={exam.margin || 0} 
                            onChange={(e) => handleMarginUpdate(idx, Number(e.target.value))}
                            className="w-full pl-2 pr-6 py-0 bg-transparent outline-none focus:bg-white rounded transition-colors text-center font-black text-reque-orange text-[10px]"
                          />
                          <span className="absolute right-6 top-1 text-[8px] text-slate-300">%</span>
                          {idx < customExams.length - 1 && (
                            <button 
                              onClick={() => applyMarginToAllBelow(idx)}
                              className="absolute right-1 text-slate-300 hover:text-reque-orange transition-colors p-0.5 rounded hover:bg-orange-50"
                              title="Repetir margem para todas as linhas abaixo"
                            >
                              <ArrowDownToLine className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <button 
                onClick={addCustomExam}
                className="mt-6 w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-400 font-black text-xs uppercase tracking-widest hover:border-reque-orange hover:text-reque-orange transition-all flex items-center justify-center gap-3 bg-slate-50/50"
              >
                <Plus className="w-5 h-5" /> Adicionar Novo Exame à Tabela
              </button>
            </div>

            <div className="p-8 bg-slate-100 border-t border-slate-200 flex gap-4">
              <button 
                onClick={() => setIsExamModalOpen(false)}
                className="flex-1 py-4 bg-white border border-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all"
              >
                Cancelar Alterações
              </button>
              <button 
                onClick={() => setIsExamModalOpen(false)}
                className="flex-[2] py-4 bg-reque-navy text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-reque-navy/20 hover:bg-reque-blue transition-all flex items-center justify-center gap-3"
              >
                <SaveIcon className="w-5 h-5 text-reque-orange" /> Confirmar e Aplicar Tabela
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ALERTA DE SALVAMENTO OBRIGATÓRIO */}
      {showSaveAlert && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border-4 border-reque-orange overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-reque-orange p-6 flex flex-col items-center text-white text-center">
              <div className="p-4 bg-white/20 rounded-full mb-4">
                <AlertCircle className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight">ATENÇÃO</h3>
            </div>
            
            <div className="p-8 text-center space-y-6">
              <p className="text-sm font-bold text-slate-600 leading-relaxed italic">
                "A geração da proposta somente será permitida após o salvamento da simulação. Certifique-se de concluir e salvar a simulação antes de prosseguir."
              </p>
              
              <button 
                onClick={() => setShowSaveAlert(false)}
                className="w-full py-4 bg-reque-navy text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl hover:bg-reque-blue transition-all flex items-center justify-center gap-2"
              >
                ENTENDI E VOU SALVAR
              </button>
            </div>
            
            <button 
              onClick={() => setShowSaveAlert(false)}
              className="absolute top-4 right-4 p-2 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};