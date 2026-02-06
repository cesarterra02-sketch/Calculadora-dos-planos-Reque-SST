
import React, { useState, useMemo } from 'react';
import { User, ProposalHistoryItem } from '../types';
import { Building2, Hash, UserCircle, Users, Brain, Calculator, Save, Check, Loader2 } from 'lucide-react';
import { EMPLOYEE_RANGES } from '../constants';

const PSICO_PRICE_TABLE: Record<string, number> = {
  R1: 210, R2: 330, R3: 420, R4: 480, R5: 570, R6: 690, R7: 780, R8: 900, R9: 990, R10: 1110,
  R11: 1200, R12: 1320, R13: 1410, R14: 1530, R15: 1680, R16: 1800, R17: 1920, R18: 2040, R19: 2130, R20: 2280,
  R21: 2490, R22: 2670, R23: 2880, R24: 3060, R25: 3270, R26: 3480, R27: 3660, R28: 3870, R29: 4050, R30: 4260,
};

const formatCNPJ = (value: string) => {
  return value.replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .slice(0, 18);
};

export const FatoresPsicoCalculator: React.FC<{
  currentUser: User | null;
  onSaveHistory: (item: ProposalHistoryItem) => Promise<any>;
  initialData?: ProposalHistoryItem | null;
}> = ({ currentUser, onSaveHistory, initialData }) => {
  const [companyName, setCompanyName] = useState(initialData?.companyName || '');
  const [contactName, setContactName] = useState(initialData?.contactName || '');
  const [cnpj, setCnpj] = useState(initialData?.cnpj || '');
  const [numEmployees, setNumEmployees] = useState(initialData?.numEmployees || 1);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const calculatedValue = useMemo(() => {
    const range = EMPLOYEE_RANGES.find(r => numEmployees >= r.min && numEmployees <= r.max);
    return range ? PSICO_PRICE_TABLE[range.id] || 0 : 0;
  }, [numEmployees]);

  const formatCurrency = (v: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const handleSave = async () => {
    if (!companyName || !cnpj) {
      alert("Por favor, preencha Razão Social e CNPJ.");
      return;
    }
    setIsSaving(true);
    try {
      await onSaveHistory({
        id: initialData?.id || crypto.randomUUID(),
        type: 'venda_avulsa_psico',
        createdAt: new Date().toISOString(),
        companyName,
        contactName,
        cnpj,
        numEmployees,
        initialTotal: calculatedValue,
        valorAvulsoPsico: calculatedValue
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="border-l-4 border-reque-orange pl-5">
        <h2 className="text-2xl font-black text-reque-navy tracking-tight uppercase">Fatores Psicossocial</h2>
        <p className="text-slate-500 mt-1 font-medium text-xs">Calculadora de venda avulsa para aplicação psicossocial por faixa.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          {/* DADOS DO CLIENTE */}
          <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-[10px] font-black text-reque-navy uppercase mb-4 tracking-widest flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-reque-orange" /> Dados de Identificação
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase">Razão Social</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-2 w-3.5 h-3.5 text-slate-300" />
                  <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value.toUpperCase())} className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:bg-white focus:border-reque-orange transition-all" placeholder="RAZÃO SOCIAL" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase">CNPJ</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-2 w-3.5 h-3.5 text-slate-300" />
                  <input type="text" value={cnpj} onChange={e => setCnpj(formatCNPJ(e.target.value))} className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white transition-all" placeholder="00.000.000/0000-00" />
                </div>
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase">Responsável Comercial</label>
                <div className="relative">
                  <UserCircle className="absolute left-3 top-2 w-3.5 h-3.5 text-slate-300" />
                  <input type="text" value={contactName} onChange={e => setContactName(e.target.value.toUpperCase())} className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:bg-white transition-all" placeholder="NOME DO CONTATO" />
                </div>
              </div>
            </div>
          </section>

          {/* ENTRADA DE FUNCIONÁRIOS */}
          <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-[10px] font-black text-reque-navy uppercase mb-4 tracking-widest flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-reque-orange" /> Dimensionamento Psicossocial
            </h3>
            <div className="max-w-xs mx-auto text-center space-y-4">
              <div className="p-4 bg-slate-50 rounded-3xl border-2 border-slate-100 shadow-inner">
                <label className="block text-[9px] font-black text-slate-400 uppercase mb-2">Quantidade de Funcionários</label>
                <div className="flex items-center justify-center gap-4">
                  <button onClick={() => setNumEmployees(Math.max(1, numEmployees - 1))} className="w-8 h-8 rounded-full bg-white border border-slate-200 text-reque-navy font-black shadow-sm hover:bg-slate-100 transition-all">-</button>
                  <input type="number" value={numEmployees} onChange={e => setNumEmployees(Math.max(1, parseInt(e.target.value) || 0))} className="w-20 text-center text-xl font-black text-reque-navy bg-transparent outline-none border-b-2 border-reque-orange focus:border-reque-blue" />
                  <button onClick={() => setNumEmployees(Math.min(200, numEmployees + 1))} className="w-8 h-8 rounded-full bg-white border border-slate-200 text-reque-navy font-black shadow-sm hover:bg-slate-100 transition-all">+</button>
                </div>
                <p className="text-[10px] font-bold text-reque-orange mt-2 uppercase tracking-tighter">
                  {EMPLOYEE_RANGES.find(r => numEmployees >= r.min && numEmployees <= r.max)?.label || 'Faixa não definida'}
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* QUADRO DE RESULTADO */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden sticky top-6">
            <div className="bg-[#190c59] p-4 text-white flex items-center justify-between border-b-4 border-reque-orange">
              <div className="flex items-center gap-3">
                <Brain className="w-4 h-4 text-reque-orange" />
                <span className="font-black text-xs uppercase tracking-tighter">Proposta Avulsa</span>
              </div>
            </div>
            
            <div className="p-5 space-y-5">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-center shadow-inner relative overflow-hidden">
                <div className="relative z-10">
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-1">VALOR TOTAL DA PROPOSTA AVULSA</span>
                  <div className="text-3xl font-black text-reque-navy tracking-tighter">
                    {formatCurrency(calculatedValue)}
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-20 h-20 bg-reque-navy/5 -rotate-45 translate-x-8 -translate-y-8"></div>
              </div>

              <div className="space-y-2">
                <button 
                  onClick={handleSave} 
                  disabled={isSaving}
                  className={`w-full py-2.5 border-2 rounded-xl font-bold text-xs uppercase transition-all flex items-center justify-center gap-2 ${
                    isSaved ? 'bg-green-50 border-green-200 text-green-600' : 'bg-white border-slate-100 text-[#190c59] hover:bg-slate-50'
                  }`}
                >
                  {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : isSaved ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />}
                  {isSaving ? 'Salvando...' : isSaved ? 'Salvo!' : 'Salvar Simulação'}
                </button>
                <button className="w-full py-3 bg-[#190c59] text-white rounded-xl font-black text-xs uppercase shadow-lg hover:bg-reque-blue flex items-center justify-center gap-2">
                  <Calculator className="w-3.5 h-3.5 text-reque-orange" /> Gerar Proposta Formal
                </button>
              </div>
              
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[9px] text-slate-400 font-bold uppercase leading-tight text-center">
                  * Venda pontual exclusiva para aplicação psicossocial, não inclui assinatura recorrente SST.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
