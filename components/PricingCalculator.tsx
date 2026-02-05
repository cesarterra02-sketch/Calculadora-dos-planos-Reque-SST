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
  UPDATE_FEE_TABLE,
  PLAN_SERVICES,
  UNIT_EXAM_TABLES
} from '../constants';
import { SummaryCard } from './SummaryCard';
import { ProposalView } from './ProposalView'; 
import { Users, Building2, CheckCircle, ShieldCheck, Info, Sparkles, Hash, UserCircle, AlertCircle, CalendarDays, RefreshCcw, UserPlus, X, MapPin, Edit3, Settings2, Plus, Trash2, Save as SaveIcon, ArrowDownToLine, ChevronUp, ChevronDown, TrendingUp, DollarSign, LayoutGrid, Search, FileEdit } from 'lucide-react';

const formatDocument = (value: string) => {
  const cleanValue = value.replace(/\D/g, '');
  if (cleanValue.length <= 11) {
    return cleanValue.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').slice(0, 14);
  } else {
    return cleanValue.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2').slice(0, 18);
  }
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
  const [selectedUnit, setSelectedUnit] = useState<RequeUnit>(RequeUnit.PONTA_GROSSA);
  const [numEmployees, setNumEmployees] = useState(1);
  const [externalLivesCount, setExternalLivesCount] = useState(0);
  const [riskLevel, setRiskLevel] = useState<RiskLevel>(RiskLevel.RISK_1);
  const [fidelity, setFidelity] = useState<FidelityModel>(FidelityModel.WITH_FIDELITY);
  const [isRenewal, setIsRenewal] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [currentAssinatura, setCurrentAssinatura] = useState<number>(0);
  const [clientDeliveryDate, setClientDeliveryDate] = useState('');
  const [docDeliveryDate, setDocDeliveryDate] = useState('');
  const [showProposal, setShowProposal] = useState(false);
  const [selectedInstallments, setSelectedInstallments] = useState(1);
  const [specialDiscount, setSpecialDiscount] = useState(0);

  // Estados da Tabela Personalizada (Modal)
  const [isExamsModalOpen, setIsExamsModalOpen] = useState(false);
  const [isCustomTable, setIsCustomTable] = useState(false);
  const [customExams, setCustomExams] = useState<any[]>([]);
  const [customCity, setCustomCity] = useState('');
  const [modalExamSearch, setModalExamSearch] = useState<ExamItem[]>([]);
  const [searchingIndex, setSearchingIndex] = useState<number | null>(null);

  useEffect(() => {
    if (initialData) {
      setCompanyName(initialData.companyName || '');
      setContactName(initialData.contactName || '');
      setCnpj(formatDocument(initialData.cnpj || ''));
      setNumEmployees(initialData.numEmployees || 1);
      setRiskLevel(initialData.riskLevel || RiskLevel.RISK_1);
      setIsRenewal(initialData.isRenewal || false);
      setSelectedUnit(initialData.selectedUnit || RequeUnit.PONTA_GROSSA);
      setClientDeliveryDate(initialData.clientDeliveryDate || '');
      setSpecialDiscount(initialData.specialDiscount || 0);
    }
  }, [initialData]);

  const activePlan = useMemo(() => {
    if (riskLevel === RiskLevel.RISK_1) return PlanType.EXPRESS;
    if (numEmployees <= 20) return PlanType.ESSENCIAL;
    return PlanType.PRO;
  }, [numEmployees, riskLevel]);

  const pricingResult = useMemo((): PricingResult => {
    const range = EMPLOYEE_RANGES.find(r => numEmployees >= r.min && numEmployees <= r.max) || EMPLOYEE_RANGES[0];
    const isPro = activePlan === PlanType.PRO;
    const baseMonthlyValue = (isPro ? MONTHLY_VALUES_PRO[range.id] : MONTHLY_VALUES_EXPRESS[range.id]) || 0;
    const originalProgramFee = PROGRAM_FEES_TABLE[range.id] || 0;
    
    let programFee = isUpdateMode ? UPDATE_FEE_TABLE[range.id] : (isRenewal ? originalProgramFee * 0.5 : originalProgramFee);
    if (fidelity === FidelityModel.WITH_FIDELITY && !isUpdateMode) programFee = 0;

    // Regra de Negócio: Fidelidade exige 12 meses antecipados de assinatura
    const isFidelityActive = fidelity === FidelityModel.WITH_FIDELITY;
    const calculatedInitialTotal = programFee + (isFidelityActive ? baseMonthlyValue * 12 : baseMonthlyValue);

    return {
      rangeLabel: range.label,
      monthlyValue: baseMonthlyValue,
      billingCycle: isFidelityActive ? BillingCycle.ANNUAL : BillingCycle.MONTHLY,
      paymentMethod: PaymentMethod.BOLETO,
      programFee,
      originalProgramFee,
      programFeeDiscounted: (isRenewal || isFidelityActive) && !isUpdateMode,
      isRenewal: isRenewal || isUpdateMode,
      riskLevel,
      clientDeliveryDate,
      docDeliveryDate,
      businessDays: 19,
      contractTotalCurrentCycle: calculatedInitialTotal,
      initialPaymentAmount: calculatedInitialTotal,
      isCustomQuote: false,
      commercialSummary: isUpdateMode ? `Upgrade Sugerido: ${activePlan}` : '',
      externalLivesCount,
      schedulingCostTotal: 0,
      specialDiscount,
      isRenovação: isRenewal,
      totalWithDiscount: calculatedInitialTotal
    };
  }, [numEmployees, activePlan, fidelity, isRenewal, isUpdateMode, riskLevel, clientDeliveryDate, externalLivesCount, specialDiscount]);

  const handleSaveSimulation = async () => {
    const item: ProposalHistoryItem = {
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
      monthlyValue: pricingResult.monthlyValue,
      initialTotal: pricingResult.totalWithDiscount - specialDiscount,
      fidelity,
      isRenewal,
      specialDiscount,
      clientDeliveryDate,
      docDeliveryDate: pricingResult.docDeliveryDate
    };
    return onSaveHistory(item);
  };

  // Modal Handlers
  const openExamsModal = () => {
    if (customExams.length === 0) {
      setCustomExams(UNIT_EXAM_TABLES[selectedUnit].map(e => ({ ...e, margin: 0, price: 0 })));
      setCustomCity(selectedUnit.replace('Unidade Reque ', ''));
    }
    setIsExamsModalOpen(true);
  };

  const handleExamChange = (index: number, field: string, value: any) => {
    const newExams = [...customExams];
    newExams[index] = { ...newExams[index], [field]: value };
    setCustomExams(newExams);
  };

  const handleExamSearch = (query: string, index: number) => {
    handleExamChange(index, 'name', query.toUpperCase());
    if (query.length >= 2) {
      const allAvailable = Object.values(UNIT_EXAM_TABLES).flat();
      const unique = Array.from(new Map(allAvailable.map(item => [item.name, item])).values()) as ExamItem[];
      setModalExamSearch(unique.filter(e => e.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8));
      setSearchingIndex(index);
    } else {
      setModalExamSearch([]);
      setSearchingIndex(null);
    }
  };

  const selectExamFromSearch = (exam: ExamItem, index: number) => {
    const newExams = [...customExams];
    newExams[index] = { ...exam, name: exam.name.toUpperCase(), category: exam.category.toUpperCase(), margin: 0, price: 0 };
    setCustomExams(newExams);
    setModalExamSearch([]);
    setSearchingIndex(null);
  };

  const addExamRow = () => setCustomExams([...customExams, { category: 'COMPLEMENTARES', name: '', price: 0, deadline: 'mesmo dia', margin: 0 }]);

  const moveExamUp = (idx: number) => {
    if (idx === 0) return;
    const newExams = [...customExams];
    [newExams[idx - 1], newExams[idx]] = [newExams[idx], newExams[idx - 1]];
    setCustomExams(newExams);
  };

  const moveExamDown = (idx: number) => {
    if (idx === customExams.length - 1) return;
    const newExams = [...customExams];
    [newExams[idx + 1], newExams[idx]] = [newExams[idx], newExams[idx + 1]];
    setCustomExams(newExams);
  };

  const applyMarginToAllBelow = (index: number) => {
    const marginValue = customExams[index].margin || 0;
    const newExams = customExams.map((exam, idx) => {
      if (idx > index) {
        return { ...exam, margin: marginValue };
      }
      return exam;
    });
    setCustomExams(newExams);
  };

  if (showProposal) {
    return <ProposalView result={pricingResult} plan={activePlan} fidelity={fidelity} employees={numEmployees} companyName={companyName} contactName={contactName} cnpj={cnpj} selectedUnit={selectedUnit} selectedInstallments={selectedInstallments} isCustomTable={isCustomTable} customExams={customExams} customCity={customCity} onBack={() => setShowProposal(false)} />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
      <div className="lg:col-span-8 space-y-5">
        
        {/* ABAS DE SELEÇÃO */}
        <div className="flex justify-end mb-2">
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
            <button onClick={() => { setIsRenewal(false); setIsUpdateMode(false); }} className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg font-black text-[9px] uppercase transition-all ${(!isRenewal && !isUpdateMode) ? 'bg-white text-reque-navy shadow-sm ring-1 ring-slate-200' : 'text-slate-400'}`}>
              <UserPlus className="w-3 h-3" /> Cliente Novo
            </button>
            <button onClick={() => { setIsRenewal(true); setIsUpdateMode(false); }} className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg font-black text-[9px] uppercase transition-all ${(isRenewal && !isUpdateMode) ? 'bg-reque-navy text-white shadow-sm' : 'text-slate-400'}`}>
              <RefreshCcw className="w-3 h-3" /> Renovação (50%)
            </button>
            <button onClick={() => { setIsUpdateMode(true); setIsRenewal(false); }} className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg font-black text-[9px] uppercase transition-all ${isUpdateMode ? 'bg-reque-orange text-white shadow-sm' : 'text-slate-400'}`}>
              <TrendingUp className="w-3 h-3" /> Atualização
            </button>
          </div>
        </div>

        {/* 1. DADOS DO CONTRATANTE */}
        <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-[10px] font-black text-reque-navy uppercase mb-5 tracking-widest flex items-center gap-2">
            <Building2 className="w-4 h-4 text-reque-orange" /> Dados do Contratante
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Razão Social da Empresa</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-300" />
                <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value.toUpperCase())} className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:bg-white focus:border-reque-orange transition-all" placeholder="RAZÃO SOCIAL" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase ml-1">CPF ou CNPJ</label>
              <div className="relative">
                <Hash className="absolute left-3 top-3.5 w-3.5 h-3.5 text-slate-300" />
                <input type="text" value={cnpj} onChange={e => setCnpj(formatDocument(e.target.value))} className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white transition-all" placeholder="00.000.000/0000-00" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase ml-1">A/C Responsável Comercial</label>
              <div className="relative">
                <UserCircle className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-300" />
                <input type="text" value={contactName} onChange={e => setContactName(e.target.value.toUpperCase())} className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:bg-white transition-all" placeholder="NOME DO CONTATO" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Unidade Referência Exames</label>
              <select value={selectedUnit} onChange={e => setSelectedUnit(e.target.value as RequeUnit)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white transition-all">
                {Object.values(RequeUnit).map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
        </section>

        {/* 2. PRAZOS DE ENTREGA */}
        <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-[10px] font-black text-reque-navy uppercase mb-5 tracking-widest flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-reque-orange" /> Prazos de Entrega
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Entrega das Descrições (Cliente)</label>
              <input type="date" value={clientDeliveryDate} onChange={e => setClientDeliveryDate(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white transition-all" />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Entrega Combinada (Programas)</label>
              <input type="date" disabled className="w-full p-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold opacity-60" value={docDeliveryDate} />
            </div>
          </div>
        </section>

        {/* 3. PARÂMETROS DO PLANO */}
        <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-[10px] font-black text-reque-navy uppercase mb-5 tracking-widest flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-reque-orange" /> Parâmetros do Plano
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Grau de Risco</label>
              <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
                {[RiskLevel.RISK_1, RiskLevel.RISK_2, RiskLevel.RISK_3, RiskLevel.RISK_4].map((r, i) => (
                  <button key={r} onClick={() => setRiskLevel(r)} className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all ${riskLevel === r ? 'bg-white text-reque-navy shadow-sm ring-1 ring-slate-200' : 'text-slate-400'}`}>
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Modelo Fidelidade</label>
              <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
                <button onClick={() => setFidelity(FidelityModel.WITH_FIDELITY)} className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${fidelity === FidelityModel.WITH_FIDELITY ? 'bg-reque-orange text-white shadow-sm' : 'text-slate-400'}`}>Com Fidelidade</button>
                <button onClick={() => setFidelity(FidelityModel.NO_FIDELITY)} className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${fidelity === FidelityModel.NO_FIDELITY ? 'bg-white text-reque-navy shadow-sm ring-1 ring-slate-200' : 'text-slate-400'}`}>Sem Fidelidade</button>
              </div>
            </div>
            {!isUpdateMode && (
              <div className="md:col-span-2 flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <input type="checkbox" id="rest-renewal" checked={isRenewal} onChange={e => setIsRenewal(e.target.checked)} className="w-5 h-5 accent-reque-orange cursor-pointer" />
                <label htmlFor="rest-renewal" className="text-[10px] font-black text-reque-navy uppercase cursor-pointer">Renovação de Contrato (50% Off PGR/PCMSO)</label>
              </div>
            )}
          </div>
        </section>

        {/* 4. DIMENSIONAMENTO */}
        <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-[10px] font-black text-reque-navy uppercase tracking-widest flex items-center gap-2">
              <Users className="w-4 h-4 text-reque-orange" /> Dimensionamento
            </h3>
            <div className="flex items-center gap-2">
               <span className="text-[8px] font-black text-slate-400 uppercase">Sugestão:</span>
               <span className="bg-reque-navy text-white text-[9px] font-black px-3 py-1 rounded-full border border-white/10 uppercase">{activePlan}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                   <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Nº de Funcionários</label>
                   <p className="text-[8px] text-slate-300 font-bold uppercase leading-none">Total de vidas ativas</p>
                </div>
                <span className="text-3xl font-black text-reque-navy tracking-tighter">{numEmployees}</span>
              </div>
              <input type="range" min="1" max="200" value={numEmployees} onChange={e => setNumEmployees(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-reque-orange" />
            </div>
            <div className="space-y-4 border-l border-slate-100 pl-6">
              <div className="flex justify-between items-end">
                <div>
                   <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Gestão de Agendamento</label>
                   <p className="text-[8px] text-slate-300 font-bold uppercase leading-none">Vidas fora das unidades Reque</p>
                </div>
                <span className="text-3xl font-black text-reque-orange tracking-tighter">{externalLivesCount}</span>
              </div>
              <input type="range" min="0" max="100" value={externalLivesCount} onChange={e => setExternalLivesCount(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-reque-orange" />
            </div>
          </div>
        </section>

        {/* 6. TABELA DE EXAMES (Trigger para Modal com Destaque Orange conforme Print) */}
        {!isUpdateMode && (
          <section className={`bg-white p-5 rounded-2xl shadow-sm border transition-all duration-300 ${isCustomTable ? 'border-reque-orange ring-1 ring-reque-orange/10' : 'border-slate-200'}`}>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-[10px] font-black text-reque-navy uppercase tracking-widest flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-reque-orange" /> Tabela de Exames
                </h3>
                {isCustomTable && (
                  <span className="bg-reque-orange text-white text-[8px] font-black px-2.5 py-0.5 rounded uppercase tracking-tighter">Customizada</span>
                )}
              </div>
              
              <div className="flex items-center bg-slate-50 rounded-xl p-1 border border-slate-200">
                <span className="text-[8px] font-black text-slate-400 uppercase px-3">Personalizada?</span>
                <div className="flex gap-1 bg-white p-0.5 rounded-lg border border-slate-100 shadow-inner">
                  <button 
                    onClick={() => setIsCustomTable(false)}
                    className={`py-1.5 px-4 rounded-md font-black text-[9px] uppercase transition-all ${!isCustomTable ? 'bg-slate-100 text-slate-500 shadow-sm' : 'text-slate-300 hover:text-slate-400'}`}
                  >
                    Não
                  </button>
                  <button 
                    onClick={() => {
                      setIsCustomTable(true);
                      if (customExams.length === 0) openExamsModal();
                    }}
                    className={`py-1.5 px-4 rounded-md font-black text-[9px] uppercase transition-all ${isCustomTable ? 'bg-reque-orange text-white shadow-md' : 'text-slate-300 hover:text-slate-400'}`}
                  >
                    Sim
                  </button>
                </div>
              </div>
            </div>

            {isCustomTable && (
              <button 
                onClick={openExamsModal}
                className="w-full py-4 bg-white border border-reque-orange/30 rounded-xl flex items-center justify-center gap-3 group hover:border-reque-orange transition-all animate-in slide-in-from-top-2 duration-300 shadow-sm"
              >
                <Edit3 className="w-4 h-4 text-reque-orange group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black text-reque-orange uppercase tracking-widest">
                  Configurar Tabela Personalizada ({selectedUnit.replace('Unidade Reque ', '').toUpperCase()})
                </span>
              </button>
            )}
          </section>
        )}

        {/* 7. ITENS DO PLANO */}
        <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
           <div className="flex items-center gap-2 mb-4">
             <ShieldCheck className="w-4 h-4 text-[#ec9d23]" />
             <h3 className="text-[10px] font-black text-reque-navy uppercase tracking-widest">Itens do Plano</h3>
             <span className="h-px flex-1 bg-slate-50"></span>
             <span className="text-[9px] font-black text-reque-navy bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{activePlan}</span>
           </div>
           <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
             {PLAN_SERVICES[activePlan].map((s, i) => (
               <div key={i} className="flex items-center gap-1.5 p-2 rounded-lg border border-slate-100 text-[8px] font-black uppercase leading-tight bg-slate-50/50">
                 <CheckCircle className="w-2.5 h-2.5 text-green-500 shrink-0" />
                 {s}
               </div>
             ))}
           </div>
        </section>
      </div>

      <div className="lg:col-span-4">
        <SummaryCard 
          result={pricingResult} 
          plan={activePlan} 
          fidelity={fidelity} 
          currentUser={currentUser} 
          selectedInstallments={selectedInstallments} 
          onInstallmentsChange={setSelectedInstallments} 
          onGenerateProposal={() => setShowProposal(true)} 
          onSaveHistory={handleSaveSimulation}
          isGenerateDisabled={!canGenerateProposal || !companyName} 
          specialDiscount={specialDiscount} 
          setSpecialDiscount={setSpecialDiscount} 
        />
      </div>

      {/* MODAL DE EXAMES PERSONALIZADOS */}
      {isExamsModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#190c59] p-6 text-white flex justify-between items-center shrink-0">
               <div>
                  <h3 className="text-lg font-black uppercase tracking-tight leading-none flex items-center gap-3">
                    ANEXO - TABELA DE VALORES EXAMES | <span className="text-reque-orange">{customCity || 'NOME DA CIDADE'}</span>
                  </h3>
                  <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest mt-2">Configuração técnica de valores personalizados para anexo de proposta</p>
               </div>
               <button onClick={() => setIsExamsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X className="w-6 h-6" /></button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
               <div className="flex gap-4 items-end bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="flex-1">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Cidade / Unidade do Anexo</label>
                     <input type="text" value={customCity} onChange={e => setCustomCity(e.target.value.toUpperCase())} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase outline-none focus:border-reque-orange" placeholder="EX: PONTA GROSSA" />
                  </div>
                  <button onClick={addExamRow} className="px-6 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-[#190c59] text-[10px] font-black uppercase flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm"><Plus className="w-4 h-4" /> Adicionar Novo Exame</button>
               </div>

               <div className="flex flex-col lg:flex-row gap-2">
                 {/* TABELA PRINCIPAL */}
                 <div className="flex-1 border border-slate-200 rounded-2xl overflow-visible shadow-sm">
                    <table className="w-full text-left border-collapse table-fixed">
                       <thead>
                          <tr className="bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-[0.15em] h-10 border-b border-slate-200">
                             <th className="px-4 w-[18%]">Tipo de Exame</th>
                             <th className="px-4 w-[35%]">Nome do Exame</th>
                             <th className="px-4 text-center w-[15%]">Valor PCMSO (R$)</th>
                             <th className="px-4 text-center w-[18%]">Prazo de Resultados</th>
                             <th className="px-4 text-center w-[14%]">Ação</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                          {customExams.map((exam, idx) => (
                             <tr key={idx} className="h-10 group hover:bg-slate-50/50 transition-colors">
                                <td className="px-4">
                                   <input type="text" value={exam.category} onChange={e => handleExamChange(idx, 'category', e.target.value.toUpperCase())} className="w-full bg-transparent outline-none text-[10px] font-bold text-slate-400 uppercase" />
                                </td>
                                <td className="px-4">
                                   <div className="relative">
                                      <input type="text" value={exam.name} onChange={e => handleExamSearch(e.target.value, idx)} className="w-full bg-transparent outline-none text-[10px] font-black text-reque-navy uppercase" placeholder="BUSCAR EXAME..." />
                                      {searchingIndex === idx && modalExamSearch.length > 0 && (
                                         <div className={`absolute z-[300] w-full bg-white border border-slate-200 rounded-xl shadow-2xl max-h-48 overflow-auto animate-in fade-in duration-200 ${idx > customExams.length - 5 ? 'bottom-full mb-2' : 'top-full mt-1'}`}>
                                            {modalExamSearch.map((res, rIdx) => (
                                               <button key={rIdx} onClick={() => selectExamFromSearch(res, idx)} className="w-full text-left p-2.5 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors">
                                                  <p className="text-[10px] font-black text-reque-navy uppercase">{res.name}</p>
                                                  <p className="text-[8px] text-reque-orange font-black uppercase">{res.category}</p>
                                               </button>
                                            ))}
                                         </div>
                                      )}
                                   </div>
                                </td>
                                <td className="px-4 text-center">
                                   <div className="flex items-center justify-center gap-1">
                                      <span className="text-[10px] font-black text-slate-300">R$</span>
                                      <input type="number" value={exam.price} onChange={e => handleExamChange(idx, 'price', Number(e.target.value))} className="w-16 bg-transparent text-center outline-none text-[10px] font-black text-reque-navy" />
                                   </div>
                                </td>
                                <td className="px-4 text-center">
                                   <input type="text" value={exam.deadline} onChange={e => handleExamChange(idx, 'deadline', e.target.value)} className="w-full bg-transparent text-center outline-none text-[9px] font-bold text-slate-500 uppercase" />
                                </td>
                                <td className="px-4 text-center">
                                   <div className="flex items-center justify-center gap-2">
                                      <button onClick={() => moveExamUp(idx)} className="text-slate-300 hover:text-reque-navy transition-colors p-1"><ChevronUp className="w-4 h-4" /></button>
                                      <button onClick={() => moveExamDown(idx)} className="text-slate-300 hover:text-reque-navy transition-colors p-1"><ChevronDown className="w-4 h-4" /></button>
                                      <button onClick={() => setCustomExams(customExams.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-red-500 transition-colors p-1"><Trash2 className="w-4 h-4" /></button>
                                   </div>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>

                 {/* COLUNA DE MARGEM SEPARADA */}
                 <div className="w-24 border border-slate-200 rounded-2xl overflow-hidden shadow-sm shrink-0">
                    <div className="bg-[#190c59] text-white text-[9px] font-black uppercase tracking-widest h-10 flex items-center justify-center">Margem (%)</div>
                    <div className="divide-y divide-slate-100">
                       {customExams.map((exam, idx) => (
                          <div key={idx} className="h-10 flex items-center justify-center px-1 relative group bg-white hover:bg-slate-50/50">
                             <input 
                                type="number" 
                                value={exam.margin || 0} 
                                onChange={e => handleExamChange(idx, 'margin', Number(e.target.value))} 
                                className="w-full bg-transparent text-center outline-none text-[10px] font-black text-reque-orange" 
                             />
                             <span className="text-[8px] font-black text-slate-300">%</span>
                             {idx < customExams.length - 1 && (
                                <button 
                                   onClick={() => applyMarginToAllBelow(idx)}
                                   className="absolute right-0.5 text-slate-300 hover:text-reque-orange transition-colors opacity-0 group-hover:opacity-100 p-0.5"
                                   title="Aplicar para todos abaixo"
                                >
                                   <ArrowDownToLine className="w-3 h-3" />
                                </button>
                             )}
                          </div>
                       ))}
                    </div>
                 </div>
               </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-between gap-4 shrink-0">
               <button onClick={() => setIsExamsModalOpen(false)} className="px-8 py-3 bg-white border-2 border-slate-200 rounded-2xl text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all">Cancelar Alterações</button>
               <button 
                  onClick={() => { setIsCustomTable(true); setIsExamsModalOpen(false); }} 
                  className="px-10 py-3 bg-[#190c59] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-reque-blue transition-all flex items-center gap-2"
               >
                  <SaveIcon className="w-4 h-4 text-reque-orange" /> Confirmar e Aplicar Tabela
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};