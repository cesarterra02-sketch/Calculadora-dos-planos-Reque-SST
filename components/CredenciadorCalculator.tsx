
import React, { useState, useEffect, useMemo } from 'react';
import { RequeUnit, ExamItem, User, ProposalHistoryItem } from '../types';
import { UNIT_EXAM_TABLES } from '../constants';
import { CredenciadorContractView } from './CredenciadorContractView';
import { CredenciadorProposalView } from './CredenciadorProposalView';
import { 
  Building2, 
  Hash, 
  UserCircle, 
  MapPin, 
  Plus, 
  Trash2, 
  ArrowDownToLine, 
  Save, 
  Network,
  FileText,
  AlertCircle,
  Loader2,
  Check,
  X,
  LayoutGrid
} from 'lucide-react';

const formatCNPJ = (value: string) => {
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

const formatCPF = (value: string) => {
  const clean = value.replace(/\D/g, '');
  return clean
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .slice(0, 14);
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

const formatCEP = (value: string) => {
  const clean = value.replace(/\D/g, '');
  return clean
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/\.(\d{3})(\d)/, '.$1-$2')
    .slice(0, 10);
};

const validateCEP = (cep: string) => {
  return cep.replace(/\D/g, '').length === 8;
};

export const CredenciadorCalculator: React.FC<{
  currentUser: User | null;
  onSaveHistory: (item: ProposalHistoryItem) => Promise<any>;
  initialData?: ProposalHistoryItem | null;
}> = ({ currentUser, onSaveHistory, initialData }) => {
  const [companyName, setCompanyName] = useState(initialData?.companyName || '');
  const [contactName, setContactName] = useState(initialData?.contactName || '');
  const [cnpj, setCnpj] = useState(initialData?.cnpj || '');
  const [isCnpjValid, setIsCnpjValid] = useState<boolean | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showContractView, setShowContractView] = useState(false);
  const [showProposalView, setShowProposalView] = useState(false);

  // Estados para dados do contrato
  const [showContractModal, setShowContractModal] = useState(false);
  const [isCepValidModal, setIsCepValidModal] = useState<boolean | null>(null);
  const [isCpfValidModal, setIsCpfValidModal] = useState<boolean | null>(null);
  
  const [contractData, setContractData] = useState(() => {
    const details = initialData?.inCompanyDetails as any;
    return {
      logradouro: details?.contractData?.logradouro || '',
      fachada: details?.contractData?.fachada || '',
      bairro: details?.contractData?.bairro || '',
      cidadeUf: details?.contractData?.cidadeUf || '',
      cep: details?.contractData?.cep || '',
      responsavelLegal: details?.contractData?.responsavelLegal || '',
      cpfResponsavel: details?.contractData?.cpfResponsavel || '',
      unidadeAtendimento: details?.contractData?.unidadeAtendimento || ''
    };
  });

  // Validação se os dados do contrato estão preenchidos para destaque visual
  const isContractDataFilled = useMemo(() => {
    const allFilled = Object.values(contractData).every(value => value && value.toString().trim() !== '');
    const validCep = validateCEP(contractData.cep);
    const validCpf = validateCPF(contractData.cpfResponsavel);
    return allFilled && validCep && validCpf;
  }, [contractData]);

  // 1. Estado para múltiplas unidades selecionadas
  const [selectedUnits, setSelectedUnits] = useState<RequeUnit[]>(() => {
    if (initialData?.inCompanyDetails?.credenciadorUnits) {
      return initialData.inCompanyDetails.credenciadorUnits.map((u: any) => u.unit as RequeUnit);
    }
    return [RequeUnit.PONTA_GROSSA];
  });

  // 2. Estado para os exames de cada unidade (Map Unit -> Exams)
  const [unitExamsMap, setUnitExamsMap] = useState<Record<string, any[]>>(() => {
    const initialMap: Record<string, any[]> = {};
    
    if (initialData?.inCompanyDetails?.credenciadorUnits) {
      initialData.inCompanyDetails.credenciadorUnits.forEach((u: any) => {
        initialMap[u.unit] = u.exams;
      });
    } else {
      // Valor padrão inicial para Ponta Grossa
      initialMap[RequeUnit.PONTA_GROSSA] = UNIT_EXAM_TABLES[RequeUnit.PONTA_GROSSA].map(exam => ({
        ...exam,
        category: exam.category.toUpperCase(),
        name: exam.name.toUpperCase(),
        costPrice: 0,
        margin: 0,
        price: exam.price
      }));
    }
    return initialMap;
  });

  const [modalExamSearch, setModalExamSearch] = useState<ExamItem[]>([]);
  const [searchingContext, setSearchingContext] = useState<{ unit: string, index: number } | null>(null);

  const toggleUnit = (unit: RequeUnit) => {
    if (selectedUnits.includes(unit)) {
      if (selectedUnits.length === 1) return; // Garante ao menos uma unidade
      setSelectedUnits(prev => prev.filter(u => u !== unit));
    } else {
      setSelectedUnits(prev => [...prev, unit]);
      // Inicializa a tabela se não existir no map
      if (!unitExamsMap[unit]) {
        const tableExams = UNIT_EXAM_TABLES[unit] || [];
        setUnitExamsMap(prev => ({
          ...prev,
          [unit]: tableExams.map(exam => ({
            ...exam,
            category: exam.category.toUpperCase(),
            name: exam.name.toUpperCase(),
            costPrice: 0,
            margin: 0,
            price: exam.price
          }))
        }));
      }
    }
  };

  const handleCnpjChange = (value: string) => {
    const formatted = formatCNPJ(value);
    setCnpj(formatted);
    const clean = formatted.replace(/\D/g, '');
    if (clean.length === 14) {
      setIsCnpjValid(validateCNPJ(clean));
    } else {
      setIsCnpjValid(null);
    }
  };

  const handleCnpjBlur = () => {
    const clean = cnpj.replace(/\D/g, '');
    if (clean.length > 0) {
      setIsCnpjValid(validateCNPJ(clean));
    }
  };

  const handleExamChange = (unit: string, index: number, field: string, value: any) => {
    const unitExams = [...(unitExamsMap[unit] || [])];
    if (!unitExams[index]) return;

    unitExams[index] = { ...unitExams[index], [field]: value };
    
    const cost = Number(unitExams[index].costPrice) || 0;
    const price = Number(unitExams[index].price) || 0;
    const margin = Number(unitExams[index].margin) || 0;

    if (field === 'costPrice') {
      unitExams[index].margin = price > 0 ? Number(((price - cost) / price * 100).toFixed(2)) : 0;
    } 
    else if (field === 'margin') {
      unitExams[index].costPrice = Number((price * (1 - margin / 100)).toFixed(2));
    }
    else if (field === 'price') {
      unitExams[index].margin = price > 0 ? Number(((price - cost) / price * 100).toFixed(2)) : 0;
    }
    
    setUnitExamsMap(prev => ({ ...prev, [unit]: unitExams }));
  };

  const applyMarginToAllBelow = (unit: string, index: number) => {
    const unitExams = unitExamsMap[unit] || [];
    const marginValue = unitExams[index].margin;
    
    const newExams = unitExams.map((exam, idx) => {
      if (idx > index) {
        const price = Number(exam.price) || 0;
        const newCost = Number((price * (1 - marginValue / 100)).toFixed(2));
        return { ...exam, margin: marginValue, costPrice: newCost };
      }
      return exam;
    });
    
    setUnitExamsMap(prev => ({ ...prev, [unit]: newExams }));
  };

  const addExam = (unit: string) => {
    setUnitExamsMap(prev => ({
      ...prev,
      [unit]: [...(prev[unit] || []), { category: 'COMPLEMENTARES', name: '', costPrice: 0, margin: 0, price: 0, deadline: 'mesmo dia' }]
    }));
  };

  const removeExam = (unit: string, index: number) => {
    setUnitExamsMap(prev => ({
      ...prev,
      [unit]: (prev[unit] || []).filter((_, i) => i !== index)
    }));
  };

  const handleSearch = (unit: string, query: string, index: number) => {
    handleExamChange(unit, index, 'name', query.toUpperCase());
    if (query.length >= 2) {
      const allAvailableExams = Object.values(UNIT_EXAM_TABLES).flat();
      const uniqueExamsMap = new Map();
      allAvailableExams.forEach(item => {
        if (!uniqueExamsMap.has(item.name)) {
          uniqueExamsMap.set(item.name, item);
        }
      });
      const uniqueExams = Array.from(uniqueExamsMap.values()) as ExamItem[];
      const filtered = uniqueExams.filter(e => e.name.toLowerCase().includes(query.toLowerCase())).slice(0, 10);
      setModalExamSearch(filtered);
      setSearchingContext({ unit, index });
    } else {
      setModalExamSearch([]);
      setSearchingContext(null);
    }
  };

  const selectExamFromSearch = (unit: string, exam: ExamItem, index: number) => {
    const unitExams = [...(unitExamsMap[unit] || [])];
    unitExams[index] = { 
      ...unitExams[index], 
      name: exam.name.toUpperCase(), 
      category: exam.category.toUpperCase(),
      deadline: exam.deadline,
      costPrice: 0,
      margin: 0,
      price: exam.price
    };
    setUnitExamsMap(prev => ({ ...prev, [unit]: unitExams }));
    setModalExamSearch([]);
    setSearchingContext(null);
  };

  const handleSaveSimulation = async () => {
    if (!companyName) {
      alert("Por favor, preencha a Razão Social da Empresa para salvar a simulação.");
      return;
    }
    
    setIsSaving(true);
    try {
      // Agrupamento de todas as tabelas em um objeto JSON
      const credenciadorUnits = selectedUnits.map(unit => ({
        unit,
        exams: unitExamsMap[unit]
      }));

      const totalSimulationValue = credenciadorUnits.reduce((acc, curr) => 
        acc + curr.exams.reduce((sum, e) => sum + (Number(e.price) || 0), 0)
      , 0);
      
      await onSaveHistory({
        id: initialData?.id, // Cirúrgico: Não enviar UUID novo se for insert, permitir que o Supabase gere
        type: 'credenciador',
        createdAt: new Date().toISOString(),
        companyName,
        contactName,
        cnpj,
        selectedUnit: selectedUnits[0], 
        initialTotal: totalSimulationValue,
        inCompanyDetails: {
          credenciadorUnits, 
          contractData 
        }
      });
      
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      console.error("Erro ao salvar simulação:", error);
      alert("Ocorreu um erro técnico ao salvar a simulação.");
    } finally {
      setIsSaving(false);
    }
  };

  if (showContractView) {
    return (
      <CredenciadorContractView 
        onBack={() => setShowContractView(false)}
        contractData={contractData}
        companyName={companyName}
        cnpj={cnpj}
        selectedUnits={selectedUnits}
        unitExamsMap={unitExamsMap}
      />
    );
  }

  if (showProposalView) {
    return (
      <CredenciadorProposalView 
        onBack={() => setShowProposalView(false)}
        companyName={companyName}
        contactName={contactName}
        cnpj={cnpj}
        selectedUnits={selectedUnits}
        unitExamsMap={unitExamsMap}
      />
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="border-l-4 border-reque-orange pl-5">
        <h2 className="text-3xl font-black text-reque-navy tracking-tight">Calculadora Credenciador</h2>
        <p className="text-slate-500 mt-1 font-medium">Gestão de custos e formação de preços para rede credenciada multi-unidade.</p>
      </div>

      {/* HEADER: DADOS DO CONTRATANTE */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xs font-black text-reque-navy uppercase tracking-widest flex items-center gap-2">
            <Building2 className="w-4 h-4 text-reque-orange" /> Dados do Credenciado
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-8">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Razão Social da Empresa</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-3 w-4 h-4 text-slate-300" />
              <input 
                type="text" 
                value={companyName} 
                onChange={e => setCompanyName(e.target.value.toUpperCase())} 
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:bg-white focus:border-reque-orange transition-all" 
                placeholder="RAZÃO SOCIAL DA EMPRESA" 
              />
            </div>
          </div>
          <div className="md:col-span-4">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">CNPJ</label>
            <div className="relative">
              <Hash className="absolute left-3 top-3 w-4 h-4 text-slate-300" />
              <input 
                type="text" 
                value={cnpj} 
                onChange={e => handleCnpjChange(e.target.value)} 
                onBlur={handleCnpjBlur}
                className={`w-full pl-10 pr-3 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold outline-none focus:bg-white transition-all ${isCnpjValid === false ? 'border-red-500 ring-1 ring-red-500 bg-red-50' : 'border-slate-200 focus:border-reque-orange'}`} 
                placeholder="00.000.000/0000-00" 
              />
              {isCnpjValid === false && (
                <p className="text-[9px] text-red-500 font-bold uppercase mt-1 ml-1 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="w-3 h-3" /> CNPJ inválido ou incompleto
                </p>
              )}
            </div>
          </div>
          <div className="md:col-span-12">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">A/C Responsável Comercial</label>
            <div className="relative">
              <UserCircle className="absolute left-3 top-3 w-4 h-4 text-slate-300" />
              <input 
                type="text" 
                value={contactName} 
                onChange={e => setContactName(e.target.value.toUpperCase())} 
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:bg-white focus:border-reque-orange transition-all" 
                placeholder="NOME DO RESPONSÁVEL" 
              />
            </div>
          </div>

          {/* MULTI-SELECT UNIDADES */}
          <div className="md:col-span-12 pt-4">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <MapPin className="w-4 h-4 text-reque-orange" /> Seleção de Unidades (Tabelas Simultâneas)
              </label>
              <button 
                onClick={() => setShowContractModal(true)}
                className={`px-4 py-1.5 border-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm ${
                  isContractDataFilled 
                    ? 'bg-green-600 border-green-600 text-white shadow-lg shadow-green-100 ring-2 ring-green-100' 
                    : 'border-reque-blue text-reque-blue hover:bg-reque-blue hover:text-white'
                }`}
              >
                {isContractDataFilled ? <Check className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                {isContractDataFilled ? 'Contrato Pronto' : 'Dados para o Contrato'}
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {Object.values(RequeUnit).map(unit => (
                <button
                  key={unit}
                  onClick={() => toggleUnit(unit)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-[9px] font-black transition-all border ${
                    selectedUnits.includes(unit) 
                      ? 'bg-reque-navy text-white border-reque-navy shadow-md ring-2 ring-reque-navy/10' 
                      : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="truncate">{unit.replace('Unidade Reque ', '')}</span>
                  {selectedUnits.includes(unit) && <Check className="w-3 h-3 text-reque-orange ml-2 shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CORPO: RENDERIZAÇÃO DINÂMICA DAS TABELAS */}
      <div className="space-y-12">
        {selectedUnits.map((unitKey) => (
          <div key={unitKey} className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
               <div className="w-full">
                  <h3 className="text-xl font-black text-reque-navy uppercase tracking-tight flex items-center gap-3">
                    FORMAÇÃO DE PREÇOS | <span className="text-reque-orange">{unitKey.replace('Unidade Reque ', '').toUpperCase()}</span>
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 italic">Configuração técnica de custos e margens isolada para esta unidade</p>
               </div>
               <button 
                 onClick={() => addExam(unitKey)}
                 className="px-6 py-3 bg-reque-orange/10 text-reque-orange rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-reque-orange hover:text-white transition-all flex items-center gap-2 border border-reque-orange/20 shrink-0"
               >
                 <Plus className="w-4 h-4" /> Adicionar Exame
               </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 items-start">
              {/* Tabela Unitária */}
              <div className="flex-1 border border-slate-300 rounded-2xl overflow-hidden shadow-sm bg-white w-full">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse table-fixed min-w-[900px]">
                    <thead>
                      <tr className="bg-[#190c59] text-white text-[10px] font-black uppercase tracking-widest h-[32px]">
                        <th className="px-4 w-[18%] border-r border-white/10">TIPO DE EXAME</th>
                        <th className="px-4 w-[30%]">NOME DO EXAME</th>
                        <th className="px-4 text-center w-[15%] border-l border-white/10 uppercase leading-tight">Valor de Custo (R$)</th>
                        <th className="px-4 text-center w-[15%] border-l border-white/10 uppercase leading-tight">Valor de Venda (R$)</th>
                        <th className="px-4 text-center w-[15%] border-l border-white/10 uppercase leading-tight">Prazo Resultados</th>
                        <th className="px-4 text-center w-[60px] border-l border-white/10 uppercase">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {(unitExamsMap[unitKey] || []).map((exam, idx) => (
                        <tr key={idx} className={`h-[32px] ${idx % 2 === 0 ? 'bg-white' : 'bg-[#f0f2f5]/40'}`}>
                          <td className="px-4 border-r border-slate-100">
                            <input 
                              type="text" 
                              value={exam.category} 
                              onChange={(e) => handleExamChange(unitKey, idx, 'category', e.target.value.toUpperCase())}
                              className="w-full bg-transparent outline-none focus:bg-white px-1 py-0 rounded transition-colors uppercase truncate text-[10px] font-bold"
                            />
                          </td>
                          <td className="px-4">
                            <div className="relative">
                              <input 
                                type="text" 
                                value={exam.name} 
                                onChange={(e) => handleSearch(unitKey, e.target.value, idx)}
                                className="w-full bg-transparent outline-none focus:bg-white px-1 py-0 rounded transition-colors uppercase truncate text-[10px] font-bold"
                                placeholder="NOME DO EXAME"
                              />
                              {searchingContext?.unit === unitKey && searchingContext?.index === idx && modalExamSearch.length > 0 && (
                                <div className="absolute z-[130] mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-2xl max-h-52 overflow-auto">
                                  {modalExamSearch.map((res, rIdx) => (
                                    <button 
                                      key={rIdx} 
                                      onClick={() => selectExamFromSearch(unitKey, res, idx)} 
                                      className="w-full text-left p-3 hover:bg-slate-50 border-b border-slate-50 last:border-0"
                                    >
                                      <div className="text-[10px] font-black text-reque-navy uppercase">{res.name}</div>
                                      <div className="text-[9px] text-reque-orange font-bold">Categoria: {res.category.toUpperCase()}</div>
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
                                value={exam.costPrice} 
                                onChange={(e) => handleExamChange(unitKey, idx, 'costPrice', Number(e.target.value))}
                                className="w-full pl-8 pr-2 py-0 bg-transparent outline-none focus:bg-white rounded transition-colors text-right font-black text-slate-400 text-[10px]"
                              />
                            </div>
                          </td>
                          <td className="px-4 border-l border-slate-100 text-center">
                            <div className="relative inline-block w-full">
                              <span className="absolute left-2 top-0.5 text-slate-300 text-[10px]">R$</span>
                              <input 
                                type="number" 
                                value={exam.price} 
                                onChange={(e) => handleExamChange(unitKey, idx, 'price', Number(e.target.value))}
                                className="w-full pl-8 pr-2 py-0 bg-transparent outline-none focus:bg-white rounded transition-colors text-right font-black text-reque-navy text-[10px]"
                              />
                            </div>
                          </td>
                          <td className="px-4 border-l border-slate-100 text-center">
                            <input 
                              type="text" 
                              value={exam.deadline} 
                              onChange={(e) => handleExamChange(unitKey, idx, 'deadline', e.target.value)}
                              className="w-full bg-transparent outline-none focus:bg-white px-1 py-0 rounded transition-colors text-center text-[10px] font-bold"
                            />
                          </td>
                          <td className="px-4 border-l border-slate-100 text-center">
                            <button 
                              onClick={() => removeExam(unitKey, idx)}
                              className="p-0.5 text-slate-300 hover:text-red-500 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Coluna de Margem Isolada da Unidade */}
              <div className="w-full lg:w-32 border border-slate-300 rounded-2xl overflow-hidden shadow-sm bg-white shrink-0">
                <div className="bg-[#190c59] text-white text-[10px] font-black uppercase tracking-widest h-[32px] flex items-center justify-center">MARGEM (%)</div>
                <div className="divide-y divide-slate-200">
                  {(unitExamsMap[unitKey] || []).map((exam, idx) => (
                    <div key={idx} className={`h-[32px] flex items-center justify-center px-2 ${idx % 2 === 0 ? 'bg-white' : 'bg-[#f0f2f5]/40'}`}>
                      <div className="relative flex items-center w-full group">
                        <input 
                          type="number" 
                          value={exam.margin || 0} 
                          onChange={(e) => handleExamChange(unitKey, idx, 'margin', Number(e.target.value))}
                          className="w-full pl-2 pr-6 py-0 bg-transparent outline-none focus:bg-white rounded transition-colors text-center font-black text-reque-orange text-[10px]"
                        />
                        <span className="absolute right-6 top-1 text-[8px] text-slate-300">%</span>
                        {idx < (unitExamsMap[unitKey] || []).length - 1 && (
                          <button 
                            onClick={() => applyMarginToAllBelow(unitKey, idx)}
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
          </div>
        ))}
      </div>

      {/* FOOTER: AÇÕES GLOBAIS */}
      <div className="mt-12 flex flex-col md:flex-row gap-4 max-w-4xl mx-auto">
         <button 
           onClick={handleSaveSimulation}
           disabled={isSaving}
           className={`flex-1 py-4 border-2 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm ${
             isSaved ? 'bg-green-50 border-green-200 text-green-600' : 'bg-white border-reque-navy text-reque-navy hover:bg-slate-50'
           } disabled:opacity-70`}
         >
           {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : isSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
           {isSaving ? 'Salvando...' : isSaved ? 'Simulações Salvas!' : 'Salvar Todas as Tabelas'}
         </button>
         <button 
           onClick={() => {
              if (!companyName || !contactName || !cnpj) {
                alert("Por favor, preencha Razão Social, Responsável e CNPJ para gerar a proposta.");
                return;
              }
              setShowProposalView(true);
           }}
           className="flex-[1.5] py-4 bg-reque-navy text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-reque-blue transition-all flex items-center justify-center gap-2"
         >
           <FileText className="w-4 h-4 text-reque-orange" /> Gerar Proposta Consolidada
         </button>
      </div>

      {/* MODAL DE DADOS PARA O CONTRATO */}
      {showContractModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-reque-navy p-6 flex justify-between items-center text-white">
              <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-3">
                <FileText className="w-6 h-6 text-reque-orange" /> Dados Adicionais para Contrato
              </h3>
              <button onClick={() => setShowContractModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Logradouro</label>
                <input 
                  type="text" 
                  value={contractData.logradouro} 
                  onChange={e => setContractData({...contractData, logradouro: e.target.value.toUpperCase()})}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:bg-white focus:border-reque-orange transition-all"
                  placeholder="AV. / RUA / LOGRADOURO COMPLETO"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Fachada (Somente Números)</label>
                <input 
                  type="text" 
                  value={contractData.fachada} 
                  onChange={e => setContractData({...contractData, fachada: e.target.value.replace(/\D/g, '')})}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:bg-white focus:border-reque-orange transition-all"
                  placeholder="EX: 555"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Bairro</label>
                <input 
                  type="text" 
                  value={contractData.bairro} 
                  onChange={e => setContractData({...contractData, bairro: e.target.value.toUpperCase()})}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:bg-white focus:border-reque-orange transition-all"
                  placeholder="BAIRRO"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Cidade-UF</label>
                <input 
                  type="text" 
                  value={contractData.cidadeUf} 
                  onChange={e => setContractData({...contractData, cidadeUf: e.target.value.toUpperCase()})}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:bg-white focus:border-reque-orange transition-all"
                  placeholder="CIDADE - UF"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest text-reque-navy">CEP</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={contractData.cep} 
                    onChange={e => {
                      const fmt = formatCEP(e.target.value);
                      setContractData({...contractData, cep: fmt});
                      if (fmt.replace(/\D/g, '').length === 8) {
                        setIsCepValidModal(validateCEP(fmt));
                      } else {
                        setIsCepValidModal(null);
                      }
                    }}
                    className={`w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold outline-none focus:bg-white transition-all ${isCepValidModal === false ? 'border-red-500 ring-1 ring-red-500 bg-red-50' : 'border-slate-200 focus:border-reque-orange'}`}
                    placeholder="84.073-170"
                  />
                  {isCepValidModal === false && (
                    <p className="text-[9px] text-red-500 font-bold uppercase mt-1 ml-1 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                      <AlertCircle className="w-3 h-3" /> CEP incompleto (8 dígitos)
                    </p>
                  )}
                </div>
              </div>

              <div className="md:col-span-2 border-t border-slate-100 pt-4 mt-2">
                <label className="block text-[10px] font-black text-reque-navy uppercase mb-1 tracking-widest">Nome Completo do Responsável Legal</label>
                <input 
                  type="text" 
                  value={contractData.responsavelLegal} 
                  onChange={e => setContractData({...contractData, responsavelLegal: e.target.value.toUpperCase()})}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:bg-white focus:border-reque-orange transition-all"
                  placeholder="NOME COMPLETO DO RESPONSÁVEL LEGAL"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-reque-navy uppercase mb-1 tracking-widest">CPF</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={contractData.cpfResponsavel} 
                    onChange={e => {
                      const fmt = formatCPF(e.target.value);
                      setContractData({...contractData, cpfResponsavel: fmt});
                      if (fmt.replace(/\D/g, '').length === 11) {
                        setIsCpfValidModal(validateCPF(fmt));
                      } else {
                        setIsCpfValidModal(null);
                      }
                    }}
                    className={`w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold outline-none focus:bg-white transition-all ${isCpfValidModal === false ? 'border-red-500 ring-1 ring-red-500 bg-red-50' : 'border-slate-200 focus:border-reque-orange'}`}
                    placeholder="000.000.000-00"
                  />
                  {isCpfValidModal === false && (
                    <p className="text-[9px] text-red-500 font-bold uppercase mt-1 ml-1 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                      <AlertCircle className="w-3 h-3" /> CPF inválido ou incompleto
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Unidade de Atendimento</label>
                <select 
                  value={contractData.unidadeAtendimento} 
                  onChange={e => setContractData({...contractData, unidadeAtendimento: e.target.value})}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-reque-orange transition-all cursor-pointer"
                >
                  <option value="">SELECIONE UMA EMPRESA...</option>
                  <option value="G MED BOURGUIGON SERVICOS CLINICOS LTDA">G MED BOURGUIGON SERVICOS CLINICOS LTDA</option>
                  <option value="REQUEMED - CLINICA DE MEDICINA DO TRABALHO LTDA">REQUEMED - CLINICA DE MEDICINA DO TRABALHO LTDA</option>
                  <option value="ZR CLINICA DE MEDICINA DO TRABALHO LTDA">ZR CLINICA DE MEDICINA DO TRABALHO LTDA</option>
                </select>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-200 flex gap-3">
              <button 
                onClick={() => setShowContractModal(false)}
                className="flex-1 py-3 bg-white border border-slate-200 text-slate-500 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  if (!isContractDataFilled) {
                    alert("Por favor, preencha corretamente todos os dados (incluindo CEP e CPF válidos) para gerar o contrato.");
                    return;
                  }
                  setShowContractView(true);
                  setShowContractModal(false);
                }}
                className="flex-1 py-3 bg-reque-navy text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg hover:bg-reque-blue transition-all"
              >
                Gerar Contrato
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
