
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Truck, 
  Users, 
  Building2, 
  Hash, 
  UserCircle, 
  Plus, 
  Trash2, 
  FileText, 
  Calculator as CalcIcon, 
  Save,
  Loader2,
  Check,
  Search,
  Percent,
  TrendingUp,
  Receipt
} from 'lucide-react';
import { ProfessionalInCompany, ExamInCompany, VehicleInCompany, ProposalHistoryItem } from '../types';
import { InCompanyProposalView } from './InCompanyProposalView';
import { supabase } from '../supabaseClient';

const PROF_RATES = {
  'Técnico de Enfermagem': 35.0,
  'Coletadora': 35.0,
  'Psicólogo': 45.0,
  'Fonoaudiólogo': 62.5,
  'Médico': 110.0,
  'Motorista': 50.0
};

const VEHICLE_RATES = {
  'Trailer': 2.5,
  'Camioneta': 1.5,
  'Carro pequeno': 1.2
};

const formatCNPJ = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .slice(0, 18);
};

export const InCompanyCalculator: React.FC<{
  onSaveHistory: (item: ProposalHistoryItem) => Promise<any>;
  initialData?: ProposalHistoryItem | null;
}> = ({ onSaveHistory, initialData }) => {
  const [companyName, setCompanyName] = useState(initialData?.companyName || '');
  const [cnpj, setCnpj] = useState(initialData?.cnpj || '');
  const [contactName, setContactName] = useState(initialData?.contactName || '');
  const [executionDays, setExecutionDays] = useState(initialData?.inCompanyDetails?.executionDays || 1);
  const [vehicles, setVehicles] = useState<VehicleInCompany[]>(initialData?.inCompanyDetails?.vehicles || [
    { id: '1', type: 'Carro pequeno', distance: 0, pedagios: 0, isDoctorOwnCar: false }
  ]);
  const [isEarlyDeparture, setIsEarlyDeparture] = useState(initialData?.inCompanyDetails?.isEarlyDeparture || false); 
  const [mealsPerDay, setMealsPerDay] = useState<1 | 2>(initialData?.inCompanyDetails?.mealsPerDay as (1|2) || 1); 
  
  // Parâmetros Financeiros Restaurados
  const [taxRate, setTaxRate] = useState(15);
  const [comissionRate, setComissionRate] = useState(5);
  const [targetMargin, setTargetMargin] = useState(30);
  
  const [printCost, setPrintCost] = useState(0);
  const [hotelCost, setHotelCost] = useState(0);
  
  const [profs, setProfs] = useState<ProfessionalInCompany[]>(initialData?.inCompanyDetails?.profs || [
    { id: '1', type: 'Técnico de Enfermagem', quantity: 1, executionHours: 8, travelHours: 2, hourlyRate: 35 }
  ]);
  const [exams, setExams] = useState<ExamInCompany[]>(initialData?.inCompanyDetails?.exams || [
    { id: '1', name: 'AVALIAÇÃO CLÍNICA', quantity: 1, clientPrice: 50, costPrice: 20 }
  ]);
  
  // Estados para integração com Supabase (Exames)
  const [allExamsFromDb, setAllExamsFromDb] = useState<any[]>([]);
  const [filteredExams, setFilteredExams] = useState<any[]>([]);
  const [searchingRowIndex, setSearchingRowIndex] = useState<number | null>(null);
  const [isFetchingExams, setIsFetchingExams] = useState(false);
  
  const [showProposal, setShowProposal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Carregar exames do banco
  useEffect(() => {
    const fetchExams = async () => {
      setIsFetchingExams(true);
      try {
        const { data, error } = await supabase
          .from('exames')
          .select('nome, valor');
        
        if (!error && data) {
          setAllExamsFromDb(data);
        }
      } catch (err) {
        console.error("Erro ao carregar exames do Supabase:", err);
      } finally {
        setIsFetchingExams(false);
      }
    };
    fetchExams();
  }, []);

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const results = useMemo(() => {
    const profCosts = profs.reduce((acc, p) => {
      const rate = PROF_RATES[p.type as keyof typeof PROF_RATES] || 35;
      return acc + (p.executionHours + p.travelHours) * rate * p.quantity;
    }, 0);

    const transportTotals = vehicles.reduce((acc, v) => {
      acc.km += v.distance;
      acc.pedagios += v.pedagios;
      return acc;
    }, { km: 0, pedagios: 0 });

    const travelCost = vehicles.reduce((acc, v) => {
      const rate = VEHICLE_RATES[v.type as keyof typeof VEHICLE_RATES] || 1.2;
      let cost = v.distance * rate + v.pedagios;
      if (v.isDoctorOwnCar) {
        cost += (v.distance * rate + v.pedagios);
      }
      return acc + cost;
    }, 0);

    const totalProfsCount = profs.reduce((acc, p) => acc + p.quantity, 0);
    const cafe = 12.0;
    const refeicao = 35.0;
    let foodCost = isEarlyDeparture 
      ? totalProfsCount * (cafe + refeicao) * mealsPerDay * executionDays
      : totalProfsCount * refeicao * executionDays;

    const totalExtra = Number(printCost) + Number(hotelCost);
    const logisticCost = profCosts + travelCost + foodCost + totalExtra;

    const examStats = exams.reduce((acc, e) => {
      acc.custoTotal += e.costPrice * e.quantity;
      acc.receitaTotal += e.clientPrice * e.quantity;
      return acc;
    }, { custoTotal: 0, receitaTotal: 0 });

    const totalOperationCost = logisticCost + examStats.custoTotal;
    
    // Lógica de Mark-up com os campos restaurados
    const taxAndComission = (Number(taxRate) + Number(comissionRate)) / 100;
    const divisor = 1 - taxAndComission;
    
    // Cálculo final aplicando a Margem Alvo sobre o custo total bruto (incluindo mark-up de impostos)
    const finalValue = divisor > 0 
      ? (totalOperationCost / divisor) * (1 + (Number(targetMargin) / 100)) 
      : 0;
      
    const taxaInCompany = finalValue - examStats.receitaTotal;

    return { 
      profCosts, 
      travelCost, 
      transportTotals, 
      foodCost, 
      totalExtra, 
      logisticCost, 
      totalOperationCost, 
      examStats, 
      finalValue, 
      taxaInCompany 
    };
  }, [profs, vehicles, isEarlyDeparture, mealsPerDay, executionDays, printCost, hotelCost, exams, taxRate, comissionRate, targetMargin]);

  const handleExamInputChange = (query: string, index: number) => {
    const newExams = [...exams];
    newExams[index].name = query.toUpperCase();
    setExams(newExams);

    if (query.length >= 2) {
      const filtered = allExamsFromDb.filter(exam => 
        exam.nome.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10);
      setFilteredExams(filtered);
      setSearchingRowIndex(index);
    } else {
      setFilteredExams([]);
      setSearchingRowIndex(null);
    }
  };

  const selectExamFromDb = (exam: any, index: number) => {
    const newExams = [...exams];
    // Regra: Truncar em 50 caracteres
    newExams[index].name = exam.nome.substring(0, 50).toUpperCase();
    // Preenchimento automático do valor unitário do cliente
    newExams[index].clientPrice = Number(exam.valor);
    setExams(newExams);
    setFilteredExams([]);
    setSearchingRowIndex(null);
  };

  const addProf = () => setProfs([...profs, { id: crypto.randomUUID(), type: 'Médico', quantity: 1, executionHours: 8, travelHours: 1, hourlyRate: 110 }]);
  const addVehicle = () => setVehicles([...vehicles, { id: crypto.randomUUID(), type: 'Carro pequeno', distance: 0, pedagios: 0, isDoctorOwnCar: false }]);
  const addExam = () => setExams([...exams, { id: crypto.randomUUID(), name: '', quantity: 1, clientPrice: 0, costPrice: 0 }]);

  const handleSaveSimulation = async () => {
    if (!companyName) {
      alert("Por favor, preencha a Razão Social para salvar.");
      return;
    }
    setIsSaving(true);
    try {
      await onSaveHistory({
        id: crypto.randomUUID(),
        type: 'incompany',
        createdAt: new Date().toISOString(),
        companyName,
        contactName,
        cnpj,
        initialTotal: results.finalValue,
        inCompanyDetails: {
          profs, vehicles, exams, executionDays, isEarlyDeparture, mealsPerDay,
          taxaInCompany: results.taxaInCompany,
          receitaExames: results.examStats.receitaTotal
        }
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (e) {
      alert("Erro ao salvar no banco de dados.");
    } finally {
      setIsSaving(false);
    }
  };

  if (showProposal) {
    return (
      <InCompanyProposalView 
        companyName={companyName} cnpj={cnpj} contactName={contactName} profs={profs} exams={exams} 
        finalValue={results.finalValue} receitaExames={results.examStats.receitaTotal} 
        taxaInCompany={results.taxaInCompany} onBack={() => setShowProposal(false)}
      />
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="border-l-4 border-reque-orange pl-5">
        <h2 className="text-3xl font-black text-reque-navy tracking-tight">Atendimento In Company</h2>
        <p className="text-slate-500 mt-1 font-medium">Dimensionamento de operações móveis e exames no local.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          {/* Dados Contratante */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-xs font-black text-reque-navy uppercase mb-6 tracking-widest flex items-center gap-2">
              <Building2 className="w-4 h-4 text-reque-orange" /> Dados do Contratante
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-8">
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Razão Social</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 w-4 h-4 text-slate-300" />
                  <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value.toUpperCase())} className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:bg-white transition-all" placeholder="NOME DA EMPRESA" />
                </div>
              </div>
              <div className="md:col-span-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">CNPJ</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-3 w-4 h-4 text-slate-300" />
                  <input type="text" value={cnpj} onChange={e => setCnpj(formatCNPJ(e.target.value))} maxLength={18} className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white transition-all" placeholder="00.000.000/0000-00" />
                </div>
              </div>
              <div className="md:col-span-12">
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Responsável</label>
                <div className="relative">
                  <UserCircle className="absolute left-3 top-3 w-4 h-4 text-slate-300" />
                  <input type="text" value={contactName} onChange={e => setContactName(e.target.value.toUpperCase())} className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:bg-white transition-all" placeholder="NOME DO RESPONSÁVEL COMERCIAL" />
                </div>
              </div>
            </div>
          </section>

          {/* Deslocamento */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xs font-black text-reque-navy uppercase tracking-widest flex items-center gap-2">
                <Truck className="w-4 h-4 text-reque-orange" /> 1. Dados de Deslocamento (Veículos)
              </h3>
              <button onClick={addVehicle} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-reque-navy border border-slate-200 transition-all flex items-center gap-2 text-[10px] font-black uppercase">
                <Plus className="w-3.5 h-3.5" /> Adicionar Veículo
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
               {vehicles.map((v, idx) => (
                 <div key={v.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 items-end">
                    <div className="md:col-span-3">
                      <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Tipo de Veículo</label>
                      <select value={v.type} onChange={e => {
                        const newVehicles = [...vehicles];
                        newVehicles[idx].type = e.target.value as any;
                        setVehicles(newVehicles);
                      }} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold">
                        {Object.keys(VEHICLE_RATES).map(type => <option key={type} value={type}>{type}</option>)}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Km Total</label>
                      <input type="number" value={v.distance} onChange={e => {
                        const newVehicles = [...vehicles];
                        newVehicles[idx].distance = Number(e.target.value);
                        setVehicles(newVehicles);
                      }} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Pedágios (R$)</label>
                      <input type="number" value={v.pedagios} onChange={e => {
                        const newVehicles = [...vehicles];
                        newVehicles[idx].pedagios = Number(e.target.value);
                        setVehicles(newVehicles);
                      }} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" />
                    </div>
                    <div className="md:col-span-4 flex items-center gap-2 pb-2">
                      <input type="checkbox" checked={v.isDoctorOwnCar} onChange={e => {
                        const newVehicles = [...vehicles];
                        newVehicles[idx].isDoctorOwnCar = e.target.checked;
                        setVehicles(newVehicles);
                      }} className="w-4 h-4 rounded border-slate-300 accent-reque-orange cursor-pointer" id={`doctor-${v.id}`} />
                      <label htmlFor={`doctor-${v.id}`} className="text-[9px] font-black text-reque-navy uppercase tracking-tighter cursor-pointer">Médico usa carro próprio?</label>
                    </div>
                    <div className="md:col-span-1">
                      {vehicles.length > 1 && (
                        <button onClick={() => setVehicles(vehicles.filter(item => item.id !== v.id))} className="w-full p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all">
                          <Trash2 className="w-4 h-4 mx-auto" />
                        </button>
                      )}
                    </div>
                 </div>
               ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-6">
              <div className="space-y-4">
                <div className="flex gap-4">
                   <div className="flex-1">
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Deslocamento (Km Total)</label>
                      <div className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-500">
                        {results.transportTotals.km} Km
                      </div>
                   </div>
                   <div className="flex-1">
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Pedágio (R$ Total)</label>
                      <div className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-500">
                        {formatCurrency(results.transportTotals.pedagios)}
                      </div>
                   </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Dias de Execução</label>
                  <input type="number" value={executionDays} onChange={e => setExecutionDays(Number(e.target.value))} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <input type="checkbox" checked={isEarlyDeparture} onChange={e => setIsEarlyDeparture(e.target.checked)} className="w-5 h-5 rounded border-slate-300 accent-reque-orange cursor-pointer" id="early" />
                  <label htmlFor="early" className="text-[10px] font-black text-reque-navy uppercase tracking-tighter cursor-pointer">Saída antes das 6h30?</label>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Refeições p/ Dia</label>
                  <div className="flex gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
                    <button onClick={() => setMealsPerDay(1)} className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${mealsPerDay === 1 ? 'bg-reque-navy text-white shadow-sm' : 'text-slate-400'}`}>1 Refeição</button>
                    <button onClick={() => setMealsPerDay(2)} className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${mealsPerDay === 2 ? 'bg-reque-navy text-white shadow-sm' : 'text-slate-400'}`}>2 Refeições</button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Profissionais */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xs font-black text-reque-navy uppercase tracking-widest flex items-center gap-2">
                <Users className="w-4 h-4 text-reque-orange" /> 2. Profissionais Envolvidos
              </h3>
              <button onClick={addProf} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-reque-navy border border-slate-200 transition-all flex items-center gap-2 text-[10px] font-black uppercase">
                <Plus className="w-3.5 h-3.5" /> Adicionar
              </button>
            </div>
            <div className="space-y-3">
              {profs.map((p, idx) => (
                <div key={p.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 items-end">
                  <div className="md:col-span-3">
                    <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Especialidade</label>
                    <select value={p.type} onChange={e => {
                      const newProfs = [...profs];
                      newProfs[idx].type = e.target.value;
                      setProfs(newProfs);
                    }} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold">
                      {Object.keys(PROF_RATES).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Qtd</label>
                    <input type="number" value={p.quantity} onChange={e => {
                      const newProfs = [...profs];
                      newProfs[idx].quantity = Number(e.target.value);
                      setProfs(newProfs);
                    }} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" />
                  </div>
                  <div className="md:col-span-3">
                    <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Horas Exec.</label>
                    <input type="number" value={p.executionHours} onChange={e => {
                      const newProfs = [...profs];
                      newProfs[idx].executionHours = Number(e.target.value);
                      setProfs(newProfs);
                    }} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" />
                  </div>
                  <div className="md:col-span-3">
                    <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Horas Desloc.</label>
                    <input type="number" value={p.travelHours} onChange={e => {
                      const newProfs = [...profs];
                      newProfs[idx].travelHours = Number(e.target.value);
                      setProfs(newProfs);
                    }} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" />
                  </div>
                  <div className="md:col-span-1">
                    <button onClick={() => setProfs(profs.filter(item => item.id !== p.id))} className="w-full p-2.5 text-red-500 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Tabela de Exames - Integração Supabase (Campo 6) */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xs font-black text-reque-navy uppercase tracking-widest flex items-center gap-2">
                <FileText className="w-4 h-4 text-reque-orange" /> 6. Tabela de Exames
                {isFetchingExams && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
              </h3>
              <button onClick={addExam} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-reque-navy border border-slate-200 transition-all flex items-center gap-2 text-[10px] font-black uppercase">
                <Plus className="w-3.5 h-3.5" /> Novo Exame
              </button>
            </div>
            <div className="overflow-x-visible">
              <table className="w-full text-[10px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-black uppercase tracking-widest">
                    <th className="pb-3 px-2 w-[35%]">Exame (Busca Cloud)</th>
                    <th className="pb-3 px-1 text-center">Qtd</th>
                    <th className="pb-3 px-1 text-right">Valor Unit.</th>
                    <th className="pb-3 px-1 text-right">Custo Unit.</th>
                    <th className="pb-3 px-1 text-right text-reque-orange font-black">Margem (R$)</th>
                    <th className="pb-3 px-1 text-right font-black text-reque-navy">Receita Total</th>
                    <th className="pb-3 px-1 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {exams.map((e, idx) => (
                    <tr key={e.id} className="group hover:bg-slate-50/50">
                      <td className="py-2 px-1 relative">
                        <div className="relative">
                          <input 
                            type="text" 
                            value={e.name} 
                            autoComplete="off"
                            onChange={val => handleExamInputChange(val.target.value, idx)}
                            onFocus={() => { if(e.name.length > 1) handleExamInputChange(e.name, idx); }}
                            className="w-full p-2 border border-slate-200 rounded-lg bg-white font-bold text-reque-navy outline-none focus:border-reque-orange transition-all uppercase" 
                            placeholder="PESQUISAR EXAME NO BANCO..." 
                          />
                          
                          {/* Dropdown de Autocomplete - Z-INDEX ELEVADO */}
                          {searchingRowIndex === idx && filteredExams.length > 0 && (
                            <div className="absolute z-[100] mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-2xl max-h-52 overflow-auto animate-in fade-in slide-in-from-top-2">
                               {filteredExams.map((res, rIdx) => (
                                 <button 
                                  key={rIdx} 
                                  onClick={() => selectExamFromDb(res, idx)}
                                  className="w-full text-left p-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors"
                                 >
                                    <div className="text-[10px] font-black text-reque-navy uppercase">{res.nome}</div>
                                    <div className="text-[9px] text-reque-orange font-bold">Preço de Tabela: {formatCurrency(res.valor)}</div>
                                 </button>
                               ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-1">
                        <input type="number" value={e.quantity} onChange={val => { const n = [...exams]; n[idx].quantity = Number(val.target.value); setExams(n); }} className="w-12 p-2 bg-white border border-slate-200 rounded-lg text-center font-bold" />
                      </td>
                      <td className="py-2 px-1">
                        <input type="number" value={e.clientPrice} onChange={val => { const n = [...exams]; n[idx].clientPrice = Number(val.target.value); setExams(n); }} className="w-20 p-2 bg-white border border-slate-200 rounded-lg font-bold text-right" />
                      </td>
                      <td className="py-2 px-1">
                        <input type="number" value={e.costPrice} onChange={val => { const n = [...exams]; n[idx].costPrice = Number(val.target.value); setExams(n); }} className="w-20 p-2 bg-white border border-slate-200 rounded-lg font-bold text-right" />
                      </td>
                      <td className="py-2 px-1 text-right font-black text-reque-orange">{formatCurrency(e.clientPrice - e.costPrice)}</td>
                      <td className="py-2 px-1 text-right font-black text-reque-navy">{formatCurrency(e.clientPrice * e.quantity)}</td>
                      <td className="py-2 px-1 text-right">
                        <button onClick={() => setExams(exams.filter(item => item.id !== e.id))} className="text-red-300 hover:text-red-500 transition-colors p-2"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 7. Parâmetros de Precificação - Restaurados */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-xs font-black text-reque-navy uppercase mb-6 tracking-widest flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-reque-orange" /> 7. Parâmetros Financeiros
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 flex items-center gap-1.5">
                  <Receipt className="w-3 h-3" /> Impostos (%)
                </label>
                <div className="relative">
                   <input 
                    type="number" 
                    value={taxRate} 
                    onChange={e => setTaxRate(Number(e.target.value))} 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-reque-orange transition-all" 
                  />
                  <div className="absolute right-3 top-2.5 text-slate-300 font-bold">%</div>
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 flex items-center gap-1.5">
                  <Percent className="w-3 h-3" /> Comissão (%)
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={comissionRate} 
                    onChange={e => setComissionRate(Number(e.target.value))} 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-reque-orange transition-all" 
                  />
                  <div className="absolute right-3 top-2.5 text-slate-300 font-bold">%</div>
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 flex items-center gap-1.5">
                  <TrendingUp className="w-3 h-3" /> Margem Alvo (%)
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={targetMargin} 
                    onChange={e => setTargetMargin(Number(e.target.value))} 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-reque-orange transition-all" 
                  />
                  <div className="absolute right-3 top-2.5 text-slate-300 font-bold">%</div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-slate-100">
               <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Outros Custos (Impressão R$)</label>
                 <input type="number" value={printCost} onChange={e => setPrintCost(Number(e.target.value))} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none transition-all" />
               </div>
               <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Hospedagem (R$)</label>
                 <input type="number" value={hotelCost} onChange={e => setHotelCost(Number(e.target.value))} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none transition-all" />
               </div>
            </div>
          </section>
        </div>

        {/* Resumo Lateral */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden sticky top-6">
            <div className="bg-reque-navy p-5 text-white flex items-center justify-between border-b-4 border-reque-orange">
              <div className="flex items-center gap-3">
                <CalcIcon className="w-5 h-5 text-reque-orange" />
                <span className="font-black uppercase tracking-tighter">Resumo da Operação</span>
              </div>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Horas Técnicas</span>
                  <span className="text-xs font-bold text-reque-navy">{formatCurrency(results.profCosts)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Deslocamento</span>
                  <span className="text-xs font-bold text-reque-navy">{formatCurrency(results.travelCost)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Custo Operacional Total</span>
                  <span className="text-xs font-black text-reque-navy">{formatCurrency(results.totalOperationCost)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-50 bg-orange-50/30 px-2 rounded">
                  <span className="text-[10px] font-black text-reque-orange uppercase">Receita Total Exames</span>
                  <span className="text-xs font-black text-reque-orange">{formatCurrency(results.examStats.receitaTotal)}</span>
                </div>
              </div>

              <div className="bg-reque-navy p-5 rounded-2xl relative overflow-hidden shadow-2xl">
                <div className="relative z-10">
                  <span className="text-[10px] font-black text-reque-orange uppercase tracking-[0.25em]">Valor Total da Proposta</span>
                  <div className="text-3xl font-black text-white tracking-tighter mt-1">{formatCurrency(results.finalValue)}</div>
                  <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                    <span className="text-[9px] text-white/50 font-bold uppercase">Taxa In Company</span>
                    <span className="text-xs text-reque-orange font-black">{formatCurrency(results.taxaInCompany)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                 <button 
                  onClick={handleSaveSimulation} 
                  disabled={isSaving}
                  className={`w-full py-3 border-2 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                    isSaved ? 'bg-green-50 border-green-200 text-green-600' : 'bg-white border-slate-100 text-[#190c59] hover:bg-slate-50'
                  } disabled:opacity-70`}
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : isSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {isSaving ? 'Salvando...' : isSaved ? 'Salvo!' : 'Salvar Simulação'}
                 </button>
                 <button onClick={() => setShowProposal(true)} className="w-full py-4 bg-reque-orange hover:bg-reque-orange/90 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2">
                    <FileText className="w-4 h-4" /> Gerar Proposta In Company
                 </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
