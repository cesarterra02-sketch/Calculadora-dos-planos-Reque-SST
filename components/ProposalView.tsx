
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { PricingResult, PlanType, FidelityModel, BillingCycle, RequeUnit } from '../types';
import { PLAN_SERVICES, UNIT_EXAM_TABLES, SYSTEM_FEATURES } from '../constants';
import { StorageService } from '../storageService';
import { 
  Printer, 
  Download, 
  Loader2, 
  ArrowLeft, 
  CheckSquare, 
  CreditCard, 
  Clock, 
  AlertTriangle, 
  Truck, 
  User, 
  Mail,
  Users,
  Briefcase,
  CheckCircle2,
  Building2,
  Plus
} from 'lucide-react';

declare var html2pdf: any;

const A4Page: React.FC<{ 
  children: React.ReactNode; 
  pageNumber: number; 
  totalPages: number; 
  plan: string;
}> = ({ children, pageNumber, totalPages, plan }) => (
  <div className="page-a4 relative flex flex-col font-sans antialiased text-slate-800 bg-white shadow-2xl print:shadow-none overflow-hidden">
    {/* Page Header Identidade Visual */}
    <div className="bg-[#190c59] w-full px-[12mm] py-4 flex justify-between items-end text-white shrink-0 relative overflow-hidden">
      <div className="flex flex-col z-10">
        <span className="text-2xl font-[900] tracking-tighter leading-none">Reque</span>
        <span className="text-[9px] font-bold uppercase tracking-[0.2em] mt-1.5 text-white/90 whitespace-nowrap font-sans">SAÚDE E SEGURANÇA DO TRABALHO</span>
      </div>
      <div className="text-right flex flex-col z-10">
        <span className="text-[12px] font-extrabold uppercase tracking-tight leading-none mb-1">PROPOSTA TÉCNICA COMERCIAL</span>
        <span className="text-[8px] font-semibold text-white/50 uppercase tracking-widest">REF: {plan}</span>
      </div>
      <div className="absolute top-0 right-0 w-[500px] h-full bg-white/5 skew-x-[-20deg] translate-x-40 pointer-events-none"></div>
    </div>
    <div className="h-[4px] bg-[#ec9d23] w-full shrink-0"></div>

    {/* Conteúdo */}
    <div className="page-content flex flex-col flex-1 px-[12mm] py-6">
      {children}
    </div>
    
    {/* Rodapé */}
    <div className="h-10 px-[12mm] flex items-center justify-between text-[8px] text-slate-600 shrink-0 font-bold border-t border-slate-200 bg-white uppercase tracking-widest italic mt-auto">
       <span>REQUE SST - CONSULTORIA EM SAÚDE E SEGURANÇA DO TRABALHO</span>
       <span className="font-bold bg-slate-100 px-3 py-1 rounded-full not-italic text-slate-800">PÁGINA {pageNumber} DE {totalPages}</span>
    </div>
  </div>
);

export const ProposalView: React.FC<{
  result: PricingResult;
  plan: PlanType;
  fidelity: FidelityModel;
  employees: number;
  companyName: string;
  contactName: string;
  cnpj: string;
  selectedUnit: RequeUnit;
  onBack: () => void;
  selectedInstallments: number;
  specialDiscount?: number;
}> = ({ result, plan, fidelity, employees, companyName, contactName, cnpj, selectedUnit, onBack, selectedInstallments, specialDiscount }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [interestRates, setInterestRates] = useState<Record<number, number>>({});
  const contentRef = useRef<HTMLDivElement>(null);
  
  const discountValue = Number(specialDiscount || result?.specialDiscount || 0);
  
  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '___/___/_____';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const isCPF = useMemo(() => cnpj.replace(/\D/g, '').length === 11, [cnpj]);
  const isFidelityActive = fidelity === FidelityModel.WITH_FIDELITY;

  useEffect(() => {
    const loadRates = async () => {
      try {
        const settings = await StorageService.getPaymentSettings();
        const ratesMap: Record<number, number> = {};
        for (let i = 1; i <= 12; i++) ratesMap[i] = 0;
        if (Array.isArray(settings)) {
          settings.forEach((s: any) => { ratesMap[s.installment_number] = Number(s.interest_rate) || 0; });
        }
        for (let i = 1; i <= 3; i++) ratesMap[i] = 0;
        setInterestRates(ratesMap);
      } catch (e) { console.error(e); }
    };
    loadRates();
  }, []);

  const currentDate = new Date().toLocaleDateString('pt-BR');
  const validadeDate = "10 dias";

  const EXAMS_PER_PAGE = 45; 
  const allExams = UNIT_EXAM_TABLES[selectedUnit] || [];
  const examPages = useMemo(() => {
    const pages = [];
    for (let i = 0; i < allExams.length; i += EXAMS_PER_PAGE) { pages.push(allExams.slice(i, i + EXAMS_PER_PAGE)); }
    return pages;
  }, [allExams, EXAMS_PER_PAGE]);

  const totalPages = 2 + examPages.length;

  const planItemsForPdf = useMemo(() => {
    const originalItems = PLAN_SERVICES[plan];
    if (isCPF) {
      return originalItems.map(item => item === 'Elaboração de PGR' ? 'Elaboração de PGRTR' : item);
    }
    return originalItems;
  }, [plan, isCPF]);

  const handleDownloadPDF = async () => {
    if (!contentRef.current) return;
    setIsGenerating(true);
    const opt = { 
      margin: 0, 
      filename: `Proposta_Reque_${companyName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`, 
      image: { type: 'jpeg', quality: 0.98 }, 
      html2canvas: { scale: 2.5, useCORS: true, letterRendering: true, backgroundColor: '#ffffff', width: 793 }, 
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: 'css' } 
    };
    try { 
      const pages = contentRef.current.querySelectorAll('.page-a4');
      pages.forEach((p: any) => {
        p.style.setProperty('margin', '0', 'important');
        p.style.setProperty('box-shadow', 'none', 'important');
        p.style.setProperty('height', '296.5mm', 'important'); 
      });
      await html2pdf().set(opt).from(contentRef.current).save(); 
      pages.forEach((p: any) => {
        p.style.setProperty('margin', '0 auto 32px auto', 'important');
        p.style.setProperty('box-shadow', '0 25px 50px -12px rgb(0 0 0 / 0.25)', 'important');
        p.style.setProperty('height', '297mm', 'important');
      });
    } catch (e) { console.error(e); } finally { setIsGenerating(false); }
  };

  const currentInterestRate = (plan === PlanType.PRO && !isFidelityActive) ? 0 : (interestRates[selectedInstallments] || 0);
  const TRANSACTION_FIXED_FEE = 0.49;
  const baseTotal = Math.max(0, (result?.initialPaymentAmount || 0) - discountValue);
  
  const interestAmount = currentInterestRate > 0 
    ? ((baseTotal * currentInterestRate) / 100) + TRANSACTION_FIXED_FEE 
    : 0;

  const finalTotalWithInterest = baseTotal + interestAmount;
  const installmentValue = finalTotalWithInterest / selectedInstallments;

  return (
    <div className="bg-slate-200/50 min-h-screen pb-12 print:bg-white print:p-0">
      <style>{`
        .page-a4 { width: 210mm; height: 297mm; margin: 0 auto 32px auto; padding: 0; overflow: hidden; background: white; position: relative; page-break-after: always; }
        .page-a4:last-child { page-break-after: auto; margin-bottom: 0; }
        .page-content { width: 100%; padding: 8mm 12mm; }
        @media print { .no-print { display: none !important; } .page-a4 { box-shadow: none !important; margin: 0 !important; } }
      `}</style>

      <div className="w-full bg-white/95 backdrop-blur-md border-b border-slate-300 sticky top-0 z-50 no-print px-4 py-3 mb-8 shadow-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <button onClick={onBack} className="px-5 py-2 bg-white border border-slate-300 rounded-xl text-[11px] font-bold uppercase flex items-center gap-2 hover:bg-slate-100 transition-all text-reque-navy shadow-sm">
            <ArrowLeft className="w-4 h-4" /> VOLTAR AO PAINEL
          </button>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="px-5 py-2 bg-white border border-slate-300 rounded-xl text-[11px] font-bold flex items-center gap-2 hover:bg-slate-100 text-slate-700 shadow-sm">
              <Printer className="w-4 h-4" /> IMPRIMIR
            </button>
            <button onClick={handleDownloadPDF} disabled={isGenerating} className="px-7 py-2 bg-[#190c59] text-white rounded-xl font-bold flex items-center gap-2 text-[11px] uppercase shadow-lg hover:bg-reque-blue transition-all disabled:opacity-50">
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} EXPORTAR PDF
            </button>
          </div>
        </div>
      </div>

      <div ref={contentRef} className="proposal-container">
        
        {/* PÁGINA 1 */}
        <A4Page pageNumber={1} totalPages={totalPages} plan={plan.toUpperCase()}>
          {/* Header Dados do Cliente */}
          <div className="bg-[#f0f2f5] border border-slate-200 rounded-2xl p-5 flex justify-between items-start mb-6">
            <div className="space-y-1.5 flex-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">DADOS DO CLIENTE</span>
              <h2 className="text-[13px] font-[800] text-reque-navy uppercase leading-tight">{companyName || 'NOME DA EMPRESA'}</h2>
              <div className="text-[9px] font-bold text-slate-600 mt-1">
                <p>CONTATO: <span className="text-slate-500 uppercase">{contactName || 'NÃO INFORMADO'}</span></p>
                <p>{isCPF ? 'CPF:' : 'CNPJ:'} <span className="text-slate-500">{cnpj || '00.000.000/0000-00'}</span></p>
              </div>
            </div>
            <div className="text-right border-l border-slate-200 pl-6 space-y-1 min-w-[120px]">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">EMISSÃO</span>
              <p className="text-[13px] font-black text-reque-navy leading-none mb-1.5">{currentDate}</p>
              <div className="bg-white border border-slate-200 rounded px-3 py-1 text-[8px] font-black text-slate-500 inline-block shadow-sm">Validade: {validadeDate}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-6 mb-6">
            {/* 1. ESCOCO DE SERVIÇOS */}
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
              <h3 className="text-[10px] font-black text-reque-navy uppercase mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#ec9d23]"></span> 1. ESCOPO DE SERVIÇOS
              </h3>
              <ul className="grid grid-cols-1 gap-y-1 text-[9px] font-bold text-slate-600">
                {planItemsForPdf.map((s, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-reque-orange font-black text-xs leading-none">•</span> {s}
                  </li>
                ))}
              </ul>
            </div>

            {/* 2. PRÉ-ELABORAÇÃO */}
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
              <h3 className="text-[10px] font-black text-reque-navy uppercase mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#ec9d23]"></span> 2. PRÉ-ELABORAÇÃO
              </h3>
              <div className="space-y-3">
                <div className="bg-[#fffcf5] p-3 rounded-xl border border-orange-100 relative">
                  <span className="absolute left-3 top-3 text-[10px] font-black text-reque-orange">1.</span>
                  <div className="ml-5">
                    <p className="text-[8px] font-black text-reque-navy uppercase mb-0.5">OBRIGATÓRIO P/ CONTRATO</p>
                    <p className="text-[9px] font-bold text-slate-600">Envio integral dos <span className="text-reque-navy font-black">dados cadastrais</span> da empresa.</p>
                  </div>
                </div>
                <div className="bg-[#fffcf5] p-3 rounded-xl border border-orange-100 relative">
                  <span className="absolute left-3 top-3 text-[10px] font-black text-reque-orange">2.</span>
                  <div className="ml-5">
                    <p className="text-[8px] font-black text-reque-navy uppercase mb-0.5">OBRIGATÓRIO P/ ANÁLISE</p>
                    <p className="text-[9px] font-bold text-slate-600"><span className="text-reque-navy font-black">Descrição das atividades por cargo</span> e GHE.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. FUNCIONALIDADES DO SISTEMA SOC */}
          <section className="mb-8">
             <h3 className="text-[10px] font-black text-reque-navy uppercase mb-2 flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-[#ec9d23]"></span> 3. FUNCIONALIDADES DO SISTEMA SOC INCLUSAS NO PLANO
             </h3>
             <div className="grid grid-cols-3 gap-x-6 gap-y-1.5 p-4 bg-[#f0f2f5] rounded-2xl border border-slate-200 shadow-inner">
               {SYSTEM_FEATURES.slice(0, 12).map((f, i) => (
                 <div key={i} className="flex items-center gap-2.5 text-[8.5px] font-bold text-slate-600">
                   <CheckSquare className="w-3.5 h-3.5 text-reque-orange shrink-0" />
                   <span className="truncate">{f}</span>
                 </div>
               ))}
             </div>
          </section>

          {/* 4. INVESTIMENTO E CONDIÇÕES */}
          <section className="flex-1 flex flex-col justify-start">
            <h3 className="text-[10px] font-black text-reque-navy uppercase mb-2 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ec9d23]"></span> 4. INVESTIMENTO E CONDIÇÕES
            </h3>
            
            <div className="border border-slate-300 rounded-2xl overflow-hidden shadow-sm mb-6">
               <table className="w-full text-center border-collapse">
                 <thead>
                   <tr className="bg-[#190c59] text-white text-[8.5px] font-black uppercase tracking-widest">
                     <th className="py-2 px-4 w-[25%] border-r border-white/10">Nº VIDAS</th>
                     <th className="py-2 px-4" colSpan={2}>PLANO SELECIONADO: <span className="text-reque-orange">{plan.toUpperCase()}</span></th>
                     <th className="py-2 px-4 w-[20%] border-l border-white/10">PERIODICIDADE</th>
                   </tr>
                 </thead>
                 <tbody className="text-[10px]">
                   <tr className="bg-white border-b border-slate-200">
                     <td className="py-4 px-4 font-black text-reque-navy uppercase border-r border-slate-200 text-[11px]">{result?.rangeLabel}</td>
                     <td className="py-4 px-4 text-left font-bold text-slate-500 italic">
                        {result?.isRenewal ? 'Revisão e Manutenção Técnica' : (
                          <>
                            Elaboração PGR <br/>
                            Elaboração PCMSO
                          </>
                        )} <br/>
                        <span className="text-[8.5px] not-italic text-slate-400">({isCPF ? 'PGRTR' : 'PGR'} / PCMSO)</span>
                     </td>
                     <td className="py-4 px-4 border-l border-slate-100 bg-[#f8f9fa]">
                        {isFidelityActive ? (
                          <div className="flex flex-col items-center">
                            <span className="text-[12px] font-black text-slate-400 line-through">De {formatCurrency(result?.originalProgramFee || 0)}</span>
                            <span className="text-[14px] font-black text-reque-orange uppercase">BONIFICADO*</span>
                          </div>
                        ) : result?.isRenewal ? (
                           <div className="flex flex-col items-center">
                            <span className="text-[12px] font-black text-slate-400 line-through">De {formatCurrency(result?.originalProgramFee || 0)}</span>
                            <span className="text-[14px] font-black text-reque-orange uppercase">50% DESCONTO</span>
                          </div>
                        ) : (
                          <span className="text-[14px] font-black text-reque-navy">{formatCurrency(result?.programFee || 0)}</span>
                        )}
                     </td>
                     <td className="py-4 px-4 font-black text-slate-400 border-l border-slate-200 uppercase tracking-widest text-[8px]">ÚNICA</td>
                   </tr>
                   {discountValue > 0 && (
                     <tr className="bg-orange-50 border-b border-slate-200">
                        <td className="py-3 px-4 font-black text-reque-orange border-r border-slate-200 text-[9px] tracking-widest uppercase">CONCESSÃO</td>
                        <td className="py-3 px-4 text-left font-bold text-reque-orange italic uppercase">
                           Desconto Especial Proposta SST
                        </td>
                        <td className="py-3 px-4 border-l border-slate-100 font-black text-reque-orange">
                           -{formatCurrency(discountValue)}
                        </td>
                        <td className="py-3 px-4 font-black text-reque-orange/40 border-l border-slate-200 uppercase tracking-widest text-[8px]">ÚNICA</td>
                     </tr>
                   )}
                   <tr className="bg-[#fcfdfe]">
                     <td className="py-4 px-4 font-black text-slate-400 uppercase border-r border-slate-200 text-[10px]">REF. MENSAL</td>
                     <td className="py-4 px-4 text-left font-bold text-slate-500 italic leading-snug">
                        Revisão Bianual dos riscos, Sistema de Gestão e eSocial <br/>
                        {isFidelityActive && <span className="text-[8px] not-italic text-reque-orange font-black uppercase tracking-widest">FIDELIDADE 24 MESES</span>}
                     </td>
                     <td className="py-4 px-4 border-l border-slate-100">
                        <div className="flex flex-col items-center">
                           <span className="text-[11px] font-[900] text-reque-navy uppercase leading-none">
                              {selectedInstallments}x de
                           </span>
                           <span className="text-[18px] font-[900] text-reque-navy mt-1 leading-none">
                              {formatCurrency(installmentValue)}
                           </span>
                        </div>
                     </td>
                     <td className="py-4 px-4 font-black text-slate-400 border-l border-slate-200 uppercase tracking-widest text-[8px]">REF. MENSAL</td>
                   </tr>
                 </tbody>
               </table>
            </div>

            <div className="bg-[#f0f2f5] border border-slate-200 rounded-2xl p-4 flex justify-between items-center mb-6 relative overflow-hidden shadow-inner">
               <div className="relative z-10 flex items-center gap-4">
                 <div className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-sm"><CheckCircle2 className="w-6 h-6 text-reque-orange" /></div>
                 <div>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">VALOR TOTAL DA OFERTA</span>
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tight">INCLUI PROGRAMAS + CICLO INICIAL</p>
                 </div>
               </div>
               <div className="text-right relative z-10">
                 <p className="text-[20px] font-[900] text-reque-navy leading-none">
                   {formatCurrency(finalTotalWithInterest)}
                 </p>
                 <span className="text-[10px] font-black text-reque-orange uppercase tracking-widest">
                    {result?.billingCycle === BillingCycle.ANNUAL ? 'PLANO ANUAL ANTECIPADO' : 'PAGAMENTO RECORRENTE'}
                 </span>
               </div>
               <div className="absolute right-0 top-0 h-full w-40 bg-[#190c59]/5 skew-x-[-15deg] translate-x-12"></div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <h4 className="text-[9px] font-black text-reque-navy uppercase mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-reque-orange" /> OPÇÕES DE PARCELAMENTO (CARTÃO DE CRÉDITO)
              </h4>
              <div className="grid grid-cols-4 gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => {
                  const rate = interestRates[n] || 0;
                  const instInterest = rate > 0 ? ((baseTotal * rate) / 100) + TRANSACTION_FIXED_FEE : 0;
                  const installment = (baseTotal + instInterest) / n;
                  return (
                    <div key={n} className={`bg-[#f0f2f5]/60 border p-2.5 rounded-xl flex justify-between items-center transition-all ${selectedInstallments === n ? 'border-reque-orange ring-1 ring-reque-orange bg-orange-50' : 'border-slate-200 hover:bg-slate-100'}`}>
                      <span className="text-[9.5px] font-black text-slate-400">{n}x de</span>
                      <span className={`text-[10.5px] font-black ${selectedInstallments === n ? 'text-reque-orange' : 'text-reque-navy'}`}>{formatCurrency(installment)} {rate > 0 && '*'}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[7.5px] text-slate-400 font-bold uppercase tracking-widest mt-3.5 italic border-t border-slate-100 pt-2">
                * PARCELAS DE 4 A 12 COM ACRÉSCIMO DE JUROS BANCÁRIOS E TAXA FIXA (R$ 0,49). ISENÇÃO EM 1X A 3X.
              </p>
            </div>
          </section>
        </A4Page>

        {/* PÁGINA 2 - CLÁUSULAS TÉCNICAS */}
        <A4Page pageNumber={2} totalPages={totalPages} plan={plan.toUpperCase()}>
          <h3 className="text-[13px] font-black text-reque-navy uppercase mb-6 flex items-center gap-4 border-b-2 border-slate-100 pb-2">
            <span className="w-3 h-3 rounded-full bg-[#ec9d23]"></span> 5. CLÁUSULAS TÉCNICAS E CONDIÇÕES GERAIS
          </h3>

          <div className="bg-[#f0f2f5] border border-slate-200 rounded-2xl p-4 flex items-center gap-6 mb-4 shadow-sm">
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm shrink-0"><Clock className="w-8 h-8 text-reque-navy" /></div>
            <p className="text-[11px] font-bold text-slate-600 leading-relaxed">
              <strong className="text-reque-navy uppercase tracking-widest block mb-1 text-[10px]">A. PRAZO DE ENTREGA:</strong>
              O prazo técnico para emissão da documentação final ({isCPF ? 'PGRTR' : 'PGR'}/PCMSO) é de <span className="text-reque-navy font-black">19 dias úteis</span>, contados a partir do recebimento integral das descrições de cargo em <span className="text-reque-navy font-black">{formatDate(result?.clientDeliveryDate || '')}</span>.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2">
              <h4 className="text-[10px] font-black text-reque-navy uppercase flex items-center gap-2">
                <div className="p-1.5 bg-orange-100 rounded-full"><Plus className="w-4 h-4 text-reque-orange" /></div> VISITA TÉCNICA
              </h4>
              <p className="text-[10px] font-medium text-slate-500 leading-relaxed italic">
                Quando solicitado pela CONTRATANTE, ou nos casos em que o cargo exigir visita técnica, será cobrado o valor de <span className="text-reque-navy font-black">R$ 100,00 por hora</span>, acrescido de <span className="text-reque-navy font-black">R$ 2,50 por quilômetro rodado</span>.
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2">
              <h4 className="text-[10px] font-black text-reque-navy uppercase flex items-center gap-2">
                <div className="p-1.5 bg-orange-100 rounded-full"><Building2 className="w-4 h-4 text-reque-orange" /></div> INCLUSÃO DE CARGOS/GHE
              </h4>
              <p className="text-[10px] font-medium text-slate-500 leading-relaxed italic">
                Ao ultrapassar o número contratado, novos cargos/GHE terão custo pontual de <span className="text-reque-navy font-black">R$ 70,00 (PGR)</span> e <span className="text-reque-navy font-black">R$ 50,00 (PCMSO)</span> para atualização.
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2">
              <h4 className="text-[10px] font-black text-reque-navy uppercase flex items-center gap-2">
                <div className="p-1.5 bg-orange-100 rounded-full"><Users className="w-4 h-4 text-reque-orange" /></div> FUNCIONÁRIOS ADICIONAIS
              </h4>
              <p className="text-[10px] font-medium text-slate-500 leading-relaxed italic">
                Ao ultrapassar o limite contratado, a assinatura mensal será reajustada em <span className="text-reque-navy font-black">R$ 2,00 por funcionário adicional</span>. Contagem baseada em ativos todo dia 20.
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2">
              <h4 className="text-[10px] font-black text-reque-navy uppercase flex items-center gap-2">
                <div className="p-1.5 bg-orange-100 rounded-full"><Mail className="w-4 h-4 text-reque-orange" /></div> REMESSA DE PRONTUÁRIOS
              </h4>
              <p className="text-[10px] font-medium text-slate-500 leading-relaxed italic">
                Em agendamentos externos (fora rede própria) que exijam envio físico de documentos, será repassado o <span className="text-reque-navy font-black">custo de correios + impostos de nota</span>.
              </p>
            </div>
          </div>

          <div className="bg-[#fff9f0] border border-orange-100 rounded-2xl p-4 flex items-start gap-4 mb-6 shadow-sm">
            <AlertTriangle className="w-6 h-6 text-reque-orange shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-[9px] font-black text-reque-navy uppercase tracking-widest">CLÁUSULA DE NO SHOW CLÍNICO</h4>
              <p className="text-[10px] font-bold text-slate-600 leading-relaxed italic">
                Ausências sem aviso prévio de 24h em agendas implicarão na cobrança de uma consulta clínica base para cobertura de custos de disponibilidade técnica.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
             <div className="space-y-3">
               <h3 className="text-[11px] font-black text-reque-navy uppercase flex items-center gap-3">
                 <span className="w-2 h-2 rounded-full bg-[#ec9d23]"></span> 6. FATURAMENTO E PAGAMENTO
               </h3>
               <div className="bg-[#f0f2f5] border border-slate-300 rounded-2xl p-4 space-y-3 shadow-inner">
                 <p className="text-[9px] font-black text-reque-navy uppercase tracking-widest border-b border-slate-300 pb-1.5">MODALIDADE FINANCEIRA</p>
                 <div className="text-[10px] font-bold text-slate-600 space-y-2">
                   <p>Ciclo de Cobrança: <span className="text-reque-navy">{result?.billingCycle}</span></p>
                   <p>Meio de Pagamento Preferencial: <span className="text-reque-navy font-black">{plan === PlanType.ESSENCIAL ? 'BOLETO BANCÁRIO OU CARTÃO DE CRÉDITO' : (result?.paymentMethod || '').toUpperCase()}</span></p>
                   <div className="pt-2 mt-2 border-t border-slate-200">
                     <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">OBSERVAÇÕES FINANCEIRAS:</p>
                     <p className="text-[8.5px] italic leading-relaxed text-slate-400">Nota Fiscal emitida eletronicamente após a confirmação do pagamento inicial ou conforme ciclo mensal estabelecido.</p>
                   </div>
                 </div>
               </div>
             </div>

             <div className="space-y-3">
               <h3 className="text-[11px] font-black text-reque-navy uppercase flex items-center gap-3">
                 <span className="w-2 h-2 rounded-full bg-[#ec9d23]"></span> 7. VIGÊNCIA E RESCISÃO
               </h3>
               <div className="bg-[#f0f2f5] border border-slate-300 rounded-2xl p-4 space-y-4 shadow-inner">
                 <p className="text-[10px] font-bold text-slate-600">
                   <strong className="text-reque-navy uppercase tracking-widest block mb-1 text-[9px]">PERÍODO DE VIGÊNCIA:</strong>
                   {isFidelityActive ? '24 meses consecutivos a partir da assinatura.' : '12 meses consecutivos a partir da assinatura.'}
                 </p>
                 <div className="bg-white border border-indigo-100 rounded-xl p-3 shadow-sm italic text-[9px] text-reque-navy leading-relaxed font-bold">
                   A rescisão antecipada no modelo fidelidade aciona a cobrança proporcional do bônus de isenção técnica concedido na entrada.
                 </div>
               </div>
             </div>
          </div>
        </A4Page>

        {/* PÁGINAS DE ANEXOS (EXAMES) */}
        {examPages.map((exams, pageIdx) => (
          <A4Page key={pageIdx} pageNumber={3 + pageIdx} totalPages={totalPages} plan={plan.toUpperCase()}>
            <div className="flex flex-col items-center mb-4">
              <h3 className="text-[14px] font-[900] text-reque-navy uppercase tracking-tight">ANEXO - TABELA DE VALORES EXAMES | {selectedUnit.replace('Unidade Reque ', '').toUpperCase()}</h3>
              <div className="h-[2px] w-24 bg-reque-orange mt-1"></div>
            </div>

            <div className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-sm flex-1">
              <table className="w-full text-left text-[9px] border-collapse">
                <thead>
                  <tr className="bg-[#003366] text-white font-black uppercase text-[7.5px] border-b border-slate-200 tracking-wider">
                    <th className="py-2 px-4 w-[20%]">TIPO DE EXAME</th>
                    <th className="py-2 px-4">NOME DO EXAME</th>
                    <th className="py-2 px-4 w-[18%] text-center">VALOR QUANDO <br/> PCMSO DA REQUE SST</th>
                    <th className="py-2 px-4 w-[20%] text-center">PRAZO DE <br/> RESULTADOS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {exams.map((exam, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#f0f2f5]/40'}>
                      <td className="py-1 px-4 font-bold text-reque-navy text-[7.5px] uppercase border-r border-slate-200">{exam.category}</td>
                      <td className="py-1 px-4 font-bold text-slate-800 uppercase text-[8px]">{exam.name}</td>
                      <td className="py-1 px-4 text-center font-black text-reque-navy text-[8.5px] border-l border-slate-200">{formatCurrency(exam.price).replace('R$', '')}</td>
                      <td className="py-1 px-4 text-center text-[7.5px] font-bold text-slate-600 border-l border-slate-200">{exam.deadline}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-3 bg-[#f0f2f5] border border-slate-300 rounded-xl">
              <p className="text-[8px] font-black text-slate-500 italic uppercase leading-relaxed text-center tracking-widest">
                * VALORES EXCLUSIVOS PARA REALIZAÇÃO NA UNIDADE INDICADA. SUJEITO A ALTERAÇÃO CONFORME REDE CREDENCIADA E REAJUSTES PERIÓDICOS.
              </p>
            </div>
          </A4Page>
        ))}
      </div>
    </div>
  );
};
