
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { PricingResult, PlanType, FidelityModel, BillingCycle, RequeUnit } from '../types';
import { PLAN_SERVICES, UNIT_EXAM_TABLES, SYSTEM_FEATURES, ADDITIONAL_SERVICES } from '../constants';
import { StorageService } from '../storageService';
import { Printer, Download, Loader2, ArrowLeft, AlertTriangle, Clock, CheckSquare, FileWarning, ClipboardList, CreditCard, Mail, Truck, PlusCircle, Users, Briefcase, Info, ShieldCheck, Sparkles, RefreshCcw } from 'lucide-react';

declare var html2pdf: any;

const A4Page: React.FC<{ 
  children: React.ReactNode; 
  pageNumber: number; 
  totalPages: number; 
  plan: string;
}> = ({ children, pageNumber, totalPages, plan }) => (
  <div className="page-a4 relative flex flex-col font-sans antialiased text-slate-800 bg-white shadow-2xl print:shadow-none overflow-hidden">
    {/* Cabeçalho Identidade Visual */}
    <div className="bg-[#190c59] w-full px-[12mm] py-4 flex justify-between items-end text-white shrink-0 relative overflow-hidden">
      <div className="flex flex-col z-10">
        <span className="text-2xl font-[900] tracking-tighter leading-none">Reque</span>
        <span className="text-[9px] font-bold uppercase tracking-[0.2em] mt-1 text-white/90 whitespace-nowrap">Saúde e Segurança do Trabalho</span>
      </div>
      <div className="text-right flex flex-col z-10">
        <span className="text-[12px] font-extrabold uppercase tracking-tight leading-none mb-1">PROPOSTA TÉCNICA COMERCIAL</span>
        <span className="text-[8px] font-semibold text-white/50 uppercase tracking-widest">REF: {plan}</span>
      </div>
      <div className="absolute top-0 right-0 w-[500px] h-full bg-white/5 skew-x-[-20deg] translate-x-40 pointer-events-none"></div>
    </div>
    <div className="h-[3px] bg-[#ec9d23] w-full shadow-sm shrink-0"></div>

    {/* Área de Conteúdo */}
    <div className="page-content">
      {children}
    </div>
    
    {/* Rodapé */}
    <div className="h-9 px-[12mm] flex items-center justify-between text-[8px] text-slate-600 shrink-0 font-bold border-t border-slate-200 bg-slate-100/50 uppercase tracking-widest italic mt-auto">
       <span>Reque SST - Consultoria em Saúde e Segurança do Trabalho</span>
       <span className="font-bold opacity-90 bg-slate-200 px-3 py-0.5 rounded-full uppercase tracking-tighter not-italic text-slate-800">Página {pageNumber} de {totalPages}</span>
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
}> = ({ result, plan, fidelity, employees, companyName, contactName, cnpj, selectedUnit, onBack }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [interestRates, setInterestRates] = useState<Record<number, number>>({});
  const contentRef = useRef<HTMLDivElement>(null);
  
  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '___/___/_____';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const isCPF = useMemo(() => {
    return cnpj.replace(/\D/g, '').length === 11;
  }, [cnpj]);

  useEffect(() => {
    const loadRates = async () => {
      try {
        const settings = await StorageService.getPaymentSettings();
        const ratesMap: Record<number, number> = {};
        for (let i = 1; i <= 12; i++) ratesMap[i] = 0;
        
        if (Array.isArray(settings) && settings.length > 0) {
          settings.forEach((s: any) => {
            ratesMap[s.installment_number] = Number(s.interest_rate) || 0;
          });
        }
        
        for (let i = 1; i <= 3; i++) ratesMap[i] = 0;
        
        setInterestRates(ratesMap);
      } catch (error) {
        console.error("Erro ao carregar taxas para proposta:", error);
      }
    };
    loadRates();
  }, []);

  const clientDateFmt = formatDate(result.clientDeliveryDate);
  const currentDate = new Date().toLocaleDateString('pt-BR');
  const validadeDate = "10 dias";

  const EXAMS_PER_PAGE = 30; 
  const allExams = UNIT_EXAM_TABLES[selectedUnit] || [];
  const examPages = useMemo(() => {
    const pages = [];
    for (let i = 0; i < allExams.length; i += EXAMS_PER_PAGE) {
      pages.push(allExams.slice(i, i + EXAMS_PER_PAGE));
    }
    return pages;
  }, [allExams, EXAMS_PER_PAGE]);

  const totalPages = 2 + examPages.length;

  const showInstallments = plan === PlanType.EXPRESS || plan === PlanType.ESSENCIAL;

  const handleDownloadPDF = async () => {
    if (!contentRef.current) return;
    setIsGenerating(true);
    
    const filename = `Proposta_Reque_${companyName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    
    const opt = { 
      margin: 0, 
      filename, 
      image: { type: 'jpeg', quality: 0.98 }, 
      html2canvas: { 
        scale: 2.5, 
        useCORS: true, 
        letterRendering: true, 
        backgroundColor: '#ffffff',
        width: 793, 
      }, 
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
      
      const originalAlign = contentRef.current.style.alignItems;
      const originalPadding = contentRef.current.style.padding;
      
      contentRef.current.style.alignItems = 'flex-start';
      contentRef.current.style.padding = '0';
      
      await html2pdf().set(opt).from(contentRef.current).save(); 
      
      contentRef.current.style.alignItems = originalAlign;
      contentRef.current.style.padding = originalPadding;
      pages.forEach((p: any) => {
        p.style.setProperty('margin', '0 auto 32px auto', 'important');
        p.style.setProperty('box-shadow', '0 25px 50px -12px rgb(0 0 0 / 0.25)', 'important');
        p.style.setProperty('height', '297mm', 'important');
      });
    } catch (e) {
      console.error(e);
      alert("Erro ao gerar PDF.");
    } finally { 
      setIsGenerating(false); 
    }
  };

  const planItemsForPdf = useMemo(() => {
    const originalItems = PLAN_SERVICES[plan];
    if (isCPF) {
      return originalItems.map(item => 
        item === 'Elaboração de PGR' ? 'Elaboração de PGRTR' : item
      );
    }
    return originalItems;
  }, [plan, isCPF]);

  return (
    <div className="bg-slate-300/50 min-h-screen pb-12 print:bg-white print:p-0">
      <style>{`
        .page-a4 {
          width: 210mm;
          height: 297mm;
          margin: 0 auto 32px auto;
          padding: 0;
          overflow: hidden;
          background: white;
          box-sizing: border-box;
          position: relative;
          page-break-after: always;
        }

        .page-a4:last-child {
          page-break-after: auto;
          margin-bottom: 0;
        }

        .page-content {
          width: 100%;
          padding: 6mm 10mm;
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow: hidden;
          box-sizing: border-box;
        }

        @media print {
          @page { size: A4; margin: 0; }
          body { margin: 0; padding: 0 !important; background: none !important; -webkit-print-color-adjust: exact !important; }
          .no-print { display: none !important; }
          .page-a4 { box-shadow: none !important; margin: 0 !important; width: 210mm !important; height: 297mm !important; border: none !important; }
        }
        
        .break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }
        .strikethrough-line { position: absolute; top: 52%; left: 0; width: 100%; height: 1.5px; background-color: #475569; transform: translateY(-50%); z-index: 10; }
        table { width: 100% !important; border-collapse: collapse !important; }
      `}</style>

      <div className="w-full bg-white/95 backdrop-blur-md border-b border-slate-300 sticky top-0 z-50 no-print px-4 py-3 mb-8 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <button onClick={onBack} className="px-5 py-2 bg-white border border-slate-300 rounded-xl text-[11px] font-bold uppercase flex items-center gap-2 hover:bg-slate-100 transition-all text-reque-navy shadow-sm">
            <ArrowLeft className="w-4 h-4" /> Voltar ao Painel
          </button>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="px-5 py-2 bg-white border border-slate-300 rounded-xl text-[11px] font-bold flex items-center gap-2 hover:bg-slate-100 text-slate-700 shadow-sm">
              <Printer className="w-4 h-4" /> Imprimir
            </button>
            <button onClick={handleDownloadPDF} disabled={isGenerating} className="px-7 py-2 bg-[#190c59] text-white rounded-xl font-bold flex items-center gap-2 text-[11px] uppercase shadow-lg hover:bg-reque-blue transition-all disabled:opacity-50">
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} {isGenerating ? 'Processando...' : 'Exportar PDF'}
            </button>
          </div>
        </div>
      </div>

      <div className="proposal-container overflow-x-auto lg:overflow-x-visible px-4">
        <div ref={contentRef} className="print:m-0 w-fit mx-auto flex flex-col items-center transition-all bg-transparent">
          
          {/* PÁGINA 1: COMPOSIÇÃO E INVESTIMENTO */}
          <A4Page pageNumber={1} totalPages={totalPages} plan={plan.toUpperCase()}>
            <div className="bg-slate-100 border border-slate-300 p-4 flex flex-row justify-between items-start mb-3 rounded-xl relative break-inside-avoid w-full shadow-sm">
               <div className="absolute top-0 left-0 w-2 h-full bg-[#ec9d23]"></div>
               <div className="flex-1 min-w-0 pr-8 space-y-1">
                  <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">DADOS DO CLIENTE</span>
                  <h2 className="text-[14px] font-black text-[#190c59] uppercase leading-tight tracking-tight break-words">
                    {companyName || 'NOME DA EMPRESA CONTRATANTE'}
                  </h2>
                  <div className="text-[10px] text-slate-700 font-bold space-y-0.5 mt-1">
                     <div className="flex gap-2 items-start">
                        <span className="text-slate-500 uppercase text-[7.5px] font-black whitespace-nowrap pt-0.5">CONTATO:</span> 
                        <span className="break-words leading-tight">{contactName}</span>
                     </div>
                     <div className="flex gap-2 items-center">
                        <span className="text-slate-500 uppercase text-[7.5px] font-black whitespace-nowrap">{isCPF ? 'CPF:' : 'CNPJ:'}</span> 
                        <span className="font-bold">{cnpj || 'Não informado'}</span>
                     </div>
                  </div>
               </div>
               <div className="text-right shrink-0 border-l border-slate-300 pl-6 ml-4 min-w-[130px]">
                  <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest">EMISSÃO</div>
                  <div className="text-[14px] font-black text-[#190c59] whitespace-nowrap leading-none mt-1">{currentDate}</div>
                  <div className="text-[9px] text-slate-600 font-bold mt-1 bg-white px-3 py-0.5 rounded inline-block border border-slate-200 shadow-sm whitespace-nowrap">Validade: {validadeDate}</div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-x-6 mb-3 w-full">
              <section className="bg-slate-100/50 p-3 rounded-2xl border border-slate-200 break-inside-avoid shadow-sm h-full">
                <h3 className="text-[9px] font-black text-[#190c59] uppercase mb-2 tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#ec9d23]"></span> 1. ESCOPO DE SERVIÇOS
                </h3>
                <ul className="space-y-1 text-slate-700 font-bold text-[9px]">
                  {planItemsForPdf.slice(0, 10).map((s, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="text-[#ec9d23] font-black text-md leading-none">•</span> {s}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="bg-slate-100/50 p-3 rounded-2xl border border-slate-200 break-inside-avoid shadow-sm h-full">
                <h3 className="text-[9px] font-black text-[#190c59] uppercase mb-2 tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#ec9d23]"></span> 2. PRÉ-ELABORAÇÃO
                </h3>
                <ol className="text-slate-700 space-y-2 font-bold text-[9px] leading-relaxed">
                  <li className="flex gap-2.5 items-start bg-orange-100/40 p-2 rounded-xl border-l-4 border-reque-orange shadow-sm">
                    <span className="text-[#ec9d23] font-black mt-0.5">1.</span> 
                    <p>
                      <strong className="text-[#190c59] uppercase text-[7.5px] block mb-0.5 tracking-widest">Obrigatório p/ Contrato</strong>
                      Envio integral dos <span className="text-reque-navy font-black">dados cadastrais</span> da empresa.
                    </p>
                  </li>
                  <li className="flex gap-2.5 items-start bg-orange-100/40 p-2 rounded-xl border-l-4 border-reque-orange shadow-sm">
                    <span className="text-[#ec9d23] font-black mt-0.5">2.</span> 
                    <p>
                      <strong className="text-[#190c59] uppercase text-[7.5px] block mb-0.5 tracking-widest">Obrigatório p/ Análise</strong>
                      <span className="text-reque-navy font-black">Descrição das atividades por cargo</span> e GHE.
                    </p>
                  </li>
                </ol>
              </section>
            </div>

            <section className="mb-3 break-inside-avoid w-full">
              <h3 className="text-[9px] font-black text-[#190c59] uppercase mb-2 tracking-widest flex items-center gap-2 border-b-2 border-slate-200 pb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ec9d23]"></span> 3. FUNCIONALIDADES DO SISTEMA SOC
              </h3>
              <div className="grid grid-cols-3 gap-x-5 gap-y-1.5 p-3 bg-slate-100/60 rounded-2xl border border-slate-200 shadow-inner">
                 {SYSTEM_FEATURES.slice(0, 12).map((feat, idx) => (
                   <div key={idx} className="flex items-center gap-2 text-[9px] text-slate-700 font-bold">
                      <CheckSquare className="w-3.5 h-3.5 text-[#ec9d23] shrink-0" />
                      <span className="truncate">{feat}</span>
                   </div>
                 ))}
              </div>
            </section>

            <section className="break-inside-avoid w-full flex-1 flex flex-col justify-start">
              <h3 className="text-[11px] font-black text-[#190c59] uppercase mb-2.5 tracking-widest flex items-center gap-2 border-b-2 border-slate-200 pb-1">
                <span className="w-2 h-2 rounded-full bg-[#ec9d23]"></span> 4. INVESTIMENTO E CONDIÇÕES
              </h3>
              
              <div className="border border-slate-300 overflow-hidden rounded-2xl shadow-md bg-white w-full mb-3">
                 <table className="w-full text-[10.5px] text-left border-collapse table-fixed">
                    <thead>
                      <tr className="bg-[#190c59] text-white font-black uppercase text-[8px] border-b border-slate-300 tracking-[0.2em]">
                         <th className="py-2.5 px-6 border-r border-white/10 w-[22%] text-center">Nº Vidas</th>
                         <th className="py-2.5 px-6 text-center" colSpan={3}>Plano Selecionado: <span className="text-[#ec9d23] font-black">{plan.toUpperCase()}</span></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300">
                       <tr className="bg-slate-50/50">
                          <td className="p-3 px-6 font-black text-[#190c59] uppercase border-r border-slate-300 text-center text-[11px] leading-none">{result.rangeLabel}</td>
                          <td className="p-3 px-6 text-slate-600 font-bold italic leading-snug text-[10px]">{result.isRenewal ? `Revisão e Manutenção Técnica (${isCPF ? 'PGRTR' : 'PGR'} / PCMSO)` : `Programas e Laudos (${isCPF ? 'PGRTR' : 'PGR'} / PCMSO)`}</td>
                          <td className="p-3 px-6 text-center w-[25%] border-r border-slate-300">
                             <div className="flex flex-col items-center">
                               {result.programFeeDiscounted ? (
                                  <div className="flex flex-col items-center">
                                    <span className="text-[14px] font-[900] text-[#190c59]">{formatCurrency(result.programFee)}</span>
                                    <span className="text-[8px] font-black text-slate-400 line-through">De {formatCurrency(result.originalProgramFee)}</span>
                                  </div>
                               ) : (
                                  <span className="text-[14px] font-[900] text-[#190c59]">{formatCurrency(result.programFee)}</span>
                               )}
                             </div>
                          </td>
                          <td className="p-3 px-6 text-center w-[25%] bg-[#ec9d23]/5">
                             <div className="flex flex-col items-center">
                                <span className="text-[14px] font-[900] text-[#190c59]">{formatCurrency(result.monthlyValue)}</span>
                                <span className="text-[7px] font-black text-[#ec9d23] uppercase tracking-widest mt-0.5">Assinatura SST</span>
                             </div>
                          </td>
                       </tr>
                    </tbody>
                 </table>
              </div>
              
              <div className="grid grid-cols-2 gap-x-5 mb-3">
                 <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-col justify-center shadow-inner">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                       <CreditCard className="w-3.5 h-3.5 text-reque-navy opacity-50" /> FORMA DE PAGAMENTO
                    </span>
                    <div className="text-[11px] font-[900] text-reque-navy uppercase flex items-center gap-2">
                       {result.paymentMethod}
                       <span className="text-[8px] font-black bg-white px-2 py-0.5 rounded-full border border-slate-200 shadow-sm text-slate-500">{result.billingCycle}</span>
                    </div>
                 </div>
                 <div className="bg-[#190c59] rounded-2xl p-3 flex flex-col justify-center shadow-lg relative overflow-hidden">
                    <div className="relative z-10 flex justify-between items-center">
                       <div>
                         <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em] mb-1 block">VALOR INVESTIMENTO INICIAL</span>
                         <div className="text-[15px] font-[900] text-[#ec9d23] tracking-tighter leading-none">{formatCurrency(result.initialPaymentAmount)}</div>
                       </div>
                       <Sparkles className="w-6 h-6 text-white/10" />
                    </div>
                    <div className="absolute top-0 right-0 w-24 h-full bg-white/5 skew-x-[-20deg] translate-x-12"></div>
                 </div>
              </div>

              <div className="bg-orange-50/80 border border-orange-100 rounded-2xl p-3.5 shadow-sm">
                 <h4 className="text-[9px] font-black text-reque-orange uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Info className="w-3.5 h-3.5" /> Informações Complementares
                 </h4>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <p className="text-[8.5px] text-slate-700 font-bold flex gap-2">
                         <span className="text-reque-orange font-black">•</span>
                         Vigência contratual de 12 ou 24 meses conforme modelo de fidelidade selecionado.
                       </p>
                       <p className="text-[8.5px] text-slate-700 font-bold flex gap-2">
                         <span className="text-reque-orange font-black">•</span>
                         Início dos serviços técnicos condicionado ao aceite desta proposta e assinatura do contrato.
                       </p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[8.5px] text-slate-700 font-bold flex gap-2">
                         <span className="text-reque-orange font-black">•</span>
                         Valores para exames ocupacionais conforme tabela anexa de unidades próprias Reque.
                       </p>
                    </div>
                 </div>
              </div>
            </section>
          </A4Page>

          {/* PÁGINA 2: TABELA DE EXAMES */}
          {examPages.map((exams, pageIdx) => (
            <A4Page key={pageIdx} pageNumber={2 + pageIdx} totalPages={totalPages} plan={plan.toUpperCase()}>
              <h3 className="text-[11px] font-black text-[#190c59] uppercase mb-4 tracking-widest flex items-center gap-3 border-b-2 border-slate-200 pb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ec9d23]"></span> ANEXO: TABELA DE EXAMES - {selectedUnit.toUpperCase()}
              </h3>
              
              <div className="flex-1 overflow-hidden border border-slate-300 rounded-2xl bg-white shadow-sm">
                <table className="w-full text-left text-[9px] border-collapse">
                  <thead>
                    <tr className="bg-[#190c59] text-white font-black uppercase text-[7px] border-b border-slate-300 tracking-wider">
                      <th className="py-2.5 px-6 border-r border-white/10 w-[15%]">Categoria</th>
                      <th className="py-2.5 px-6 border-r border-white/10">Procedimento / Exame</th>
                      <th className="py-2.5 px-6 border-r border-white/10 w-[15%] text-right">Valor (R$)</th>
                      <th className="py-2.5 px-6 w-[20%] text-center">Prazo Médio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {exams.map((exam, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                        <td className="py-1.5 px-6 font-bold text-slate-400 text-[7px] uppercase tracking-tighter border-r border-slate-200">{exam.category}</td>
                        <td className="py-1.5 px-6 font-bold text-reque-navy uppercase tracking-tighter border-r border-slate-200">{exam.name}</td>
                        <td className="py-1.5 px-6 text-right font-black text-reque-navy border-r border-slate-200">{formatCurrency(exam.price)}</td>
                        <td className="py-1.5 px-6 text-center text-[7.5px] font-bold text-slate-500 italic lowercase">{exam.deadline}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {pageIdx === examPages.length - 1 && (
                <div className="mt-4 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-start gap-4">
                   <div className="p-2.5 bg-white rounded-xl border border-indigo-200 shadow-sm"><Info className="w-5 h-5 text-reque-blue" /></div>
                   <div className="flex-1">
                      <h4 className="text-[10px] font-black text-reque-navy uppercase tracking-widest mb-1.5">Notas sobre Exames</h4>
                      <div className="grid grid-cols-2 gap-x-8 text-[8px] text-slate-500 font-bold leading-relaxed uppercase">
                         <p>• Valores exclusivos para atendimento nas unidades físicas Reque.</p>
                         <p>• Prazos sujeitos a alteração em casos de exames complementares de alta complexidade.</p>
                         <p>• Faturamento de exames conforme produtividade mensal realizada.</p>
                         <p>• Inclusão de exames fora da grade contratual será orçada via solicitação.</p>
                      </div>
                   </div>
                </div>
              )}
            </A4Page>
          ))}
        </div>
      </div>
    </div>
  );
};
