
import React, { useState, useRef } from 'react';
import { PricingResult, PlanType, FidelityModel, PaymentMethod, BillingCycle, RequeUnit } from '../types';
import { PLAN_SERVICES, UNIT_EXAM_TABLES } from '../constants';
import { Printer, CheckSquare, Download, Loader2, ArrowLeft } from 'lucide-react';

declare var html2pdf: any;

const A4Page: React.FC<{ 
  children: React.ReactNode; 
  pageNumber: number; 
  totalPages: number; 
  planName: string; 
  title?: string;
  isLast?: boolean;
}> = ({ children, pageNumber, totalPages, planName, title = "Proposta Técnica Comercial", isLast = false }) => (
  <div className={`w-[210mm] min-h-[297mm] mx-auto bg-white shadow-2xl mb-8 relative flex flex-col print:shadow-none print:w-[210mm] print:h-[297mm] print:mb-0 ${!isLast ? 'print:break-after-page' : ''} pdf-page overflow-hidden`}>
    <div className="h-20 bg-reque-navy flex items-center justify-between px-10 border-b-4 border-reque-orange shrink-0">
       <div className="flex flex-col text-white">
          <span className="font-extrabold text-3xl tracking-tight leading-none">Reque</span>
          <span className="text-[0.6rem] uppercase tracking-widest mt-1 opacity-70">Saúde e Segurança do Trabalho</span>
       </div>
       <div className="text-right text-white">
         <h1 className="text-xs font-black uppercase tracking-widest">{title}</h1>
         <p className="text-[9px] opacity-60 font-bold mt-1 uppercase">Plano: {planName}</p>
       </div>
    </div>
    <div className="flex-1 px-10 py-8 text-slate-800 flex flex-col">{children}</div>
    <div className="h-10 border-t border-slate-100 mx-10 flex items-center justify-between text-[8px] text-slate-400 shrink-0">
       <span>Reque SST - Documento Oficial de Precificação 2025</span>
       <span>Página {pageNumber} de {totalPages}</span>
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
}> = ({ result, plan, fidelity, companyName, contactName, cnpj, selectedUnit, onBack }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const currentDate = new Date().toLocaleDateString('pt-BR');
  const selectedExams = UNIT_EXAM_TABLES[selectedUnit] || [];

  const handleDownloadPDF = async () => {
    if (!contentRef.current) return;
    setIsGenerating(true);
    const filename = `Proposta_Reque_${companyName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    const opt = { 
      margin: 0, 
      filename, 
      image: { type: 'jpeg', quality: 0.98 }, 
      html2canvas: { scale: 2, useCORS: true }, 
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } 
    };
    try { 
      await html2pdf().set(opt).from(contentRef.current).save(); 
    } catch (e) {
      alert("Houve um erro ao gerar o PDF. Use a função Imprimir como alternativa.");
    } finally { 
      setIsGenerating(false); 
    }
  };

  return (
    <div className="bg-slate-100 min-h-screen pb-10 print:bg-white print:p-0">
      <div className="max-w-[210mm] mx-auto py-6 flex justify-between no-print px-4">
        <button onClick={onBack} className="px-5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold uppercase flex items-center gap-2 hover:bg-slate-50 transition-all">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <div className="flex gap-3">
          <button onClick={() => window.print()} className="px-5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-slate-50"><Printer className="w-4 h-4" /> Imprimir</button>
          <button onClick={handleDownloadPDF} disabled={isGenerating} className="px-8 py-2.5 bg-reque-navy text-white rounded-lg font-bold flex items-center gap-2 text-xs uppercase shadow-lg hover:bg-reque-blue disabled:opacity-50">
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} {isGenerating ? 'Gerando...' : 'Baixar PDF'}
          </button>
        </div>
      </div>

      <div ref={contentRef} className="print:m-0">
        <A4Page pageNumber={1} totalPages={2} planName={plan}>
          <div className="mb-6 p-4 bg-slate-50 border-l-4 border-reque-navy rounded-r-lg grid grid-cols-2 gap-4">
            <div>
              <span className="block text-[8px] font-black uppercase text-slate-400 tracking-widest">Contratante</span>
              <span className="block text-sm font-extrabold text-reque-navy mt-0.5">{companyName}</span>
              <span className="block text-[10px] text-slate-500 font-bold mt-1">CNPJ: {cnpj}</span>
              <span className="block text-[10px] text-slate-500 font-medium italic mt-0.5">A/C: {contactName}</span>
            </div>
            <div className="text-right">
               <span className="block text-[8px] font-black uppercase text-slate-400 tracking-widest">Emissão</span>
               <span className="block text-sm font-extrabold text-reque-navy mt-0.5">{currentDate}</span>
               <span className="block text-[9px] text-slate-500 mt-2 font-bold">Unidade de Atendimento:</span>
               <span className="block text-[9px] text-slate-600 italic">{selectedUnit}</span>
            </div>
          </div>

          <section className="mb-8">
            <h3 className="text-xs font-black text-reque-navy uppercase border-b-2 border-reque-orange/30 pb-1 mb-3 tracking-widest">1. Escopo de Atendimento - {plan}</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              {PLAN_SERVICES[plan].map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-[10px] text-slate-700 leading-tight">
                  <CheckSquare className="w-3 h-3 text-reque-blue shrink-0 mt-0.5" /> 
                  <span className="font-medium">{s}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-8">
             <h3 className="text-xs font-black text-reque-navy uppercase border-b-2 border-reque-orange/30 pb-1 mb-3 tracking-widest">2. Condições Comerciais</h3>
             <div className="border border-slate-800 rounded-sm overflow-hidden">
                <div className="grid grid-cols-12 bg-slate-200 text-[9px] font-black border-b border-slate-800 divide-x divide-slate-800">
                   <div className="col-span-8 p-2">ITEM DO PLANO</div>
                   <div className="col-span-4 p-2 text-center">INVESTIMENTO</div>
                </div>
                <div className="grid grid-cols-12 text-[10px] border-b border-slate-200 divide-x divide-slate-200">
                   <div className="col-span-8 p-3 bg-white">
                      <span className="font-bold text-reque-navy">Assinatura SST</span><br/>
                      <span className="text-[8px] text-slate-500 italic">Ciclo de faturamento: {result.billingCycle} | Ref: {result.rangeLabel}</span>
                   </div>
                   <div className="col-span-4 p-3 text-center font-black text-reque-navy self-center bg-white">{formatCurrency(result.monthlyValue)} <span className="text-[8px] font-normal">/mês</span></div>
                </div>
                <div className="grid grid-cols-12 text-[10px] divide-x divide-slate-200">
                   <div className="col-span-8 p-3 bg-slate-50">
                      <span className="font-bold text-reque-navy">Elaboração de PGR e PCMSO (Setup Inicial)</span><br/>
                      <span className="text-[8px] text-slate-500 italic">{fidelity === FidelityModel.WITH_FIDELITY ? 'Bonificado mediante cláusula de fidelidade' : 'Pagamento único no aceite da proposta'}</span>
                   </div>
                   <div className="col-span-4 p-3 text-center font-black self-center bg-slate-50">
                      {result.programFeeDiscounted ? (
                        <div className="flex flex-col">
                           <span className="text-green-600 font-black">ISENTO*</span>
                           <span className="text-[8px] text-slate-400 line-through">De {formatCurrency(result.originalProgramFee)}</span>
                        </div>
                      ) : formatCurrency(result.programFee)}
                   </div>
                </div>
             </div>
             <div className="mt-4 flex justify-end">
                <div className="bg-reque-blue p-4 text-white rounded-lg shadow-md min-w-[200px] text-right">
                   <span className="block text-[8px] font-bold uppercase opacity-80 mb-1">Pagamento Inicial Total:</span>
                   <span className="text-2xl font-black">{formatCurrency(result.initialPaymentAmount)}</span>
                   <span className="block text-[8px] opacity-60 mt-1 italic">Vencimento: Conforme aceite / Meio: {result.paymentMethod}</span>
                </div>
             </div>
          </section>

          <section className="text-[9px] text-slate-600 space-y-3 mt-auto">
            <h3 className="text-xs font-black text-reque-navy uppercase border-b-2 border-reque-orange/30 pb-1 mb-1 tracking-widest">3. Cláusulas de Fidelidade e Rescisão</h3>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 italic leading-relaxed text-justify">
               <p><strong>Vigência:</strong> O contrato tem vigência de 12 (doze) meses, renováveis automaticamente por igual período.</p>
               {fidelity === FidelityModel.WITH_FIDELITY ? (
                 <p className="mt-2"><strong>Cláusula de Fidelidade (24 meses):</strong> O CONTRATANTE optou pela modalidade com fidelidade, recebendo isenção total na taxa de elaboração dos programas técnicos (PGR/PCMSO). <strong>Em caso de rescisão antecipada antes de completar 24 meses de contrato, o valor integral do desconto concedido (R$ {result.originalProgramFee.toFixed(2)}) será cobrado imediatamente a título de multa compensatória.</strong></p>
               ) : (
                 <p className="mt-2"><strong>Cancelamento:</strong> Sem multa para rescisões futuras, desde que os serviços já prestados e as taxas de setup iniciais tenham sido integralmente liquidados.</p>
               )}
            </div>
          </section>
        </A4Page>

        <A4Page pageNumber={2} totalPages={2} planName={plan} title="ANEXO - TABELA DE VALORES EXAMES" isLast={true}>
           <div className="mb-6">
             <h2 className="text-sm font-black text-reque-navy uppercase border-b-4 border-reque-orange inline-block pb-1 tracking-widest">Tabela de Exames - Unidade Selecionada</h2>
             <p className="text-[9px] text-slate-500 mt-2 font-medium">Os valores abaixo referem-se aos exames complementares realizados por demanda, não inclusos no valor da assinatura mensal.</p>
           </div>
           
           <div className="border border-slate-800 rounded-sm overflow-hidden mb-10">
              <div className="grid grid-cols-12 bg-reque-navy text-white text-[9px] font-black text-center divide-x divide-slate-700">
                 <div className="col-span-3 py-2">CATEGORIA</div>
                 <div className="col-span-6 py-2">DESCRIÇÃO DO EXAME</div>
                 <div className="col-span-3 py-2">VALOR (R$)</div>
              </div>
              <div className="divide-y divide-slate-200">
                 {selectedExams.map((e, i) => (
                   <div key={i} className={`grid grid-cols-12 text-[10px] items-center divide-x divide-slate-200 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                      <div className="col-span-3 p-2 font-bold text-slate-500 uppercase text-[8px]">{e.category}</div>
                      <div className="col-span-6 p-2 font-medium text-slate-800">{e.name}</div>
                      <div className="col-span-3 p-2 text-center font-black text-reque-blue">{formatCurrency(e.price)}</div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="mt-auto border-t-2 border-slate-100 pt-10 grid grid-cols-2 gap-10">
              <div className="flex flex-col items-center">
                 <div className="w-full border-t border-slate-400 mb-2"></div>
                 <span className="text-[10px] font-bold text-slate-700 uppercase">{companyName}</span>
                 <span className="text-[8px] text-slate-400">Contratante</span>
              </div>
              <div className="flex flex-col items-center">
                 <div className="w-full border-t border-slate-400 mb-2"></div>
                 <span className="text-[10px] font-bold text-reque-navy uppercase tracking-widest">REQUE SST</span>
                 <span className="text-[8px] text-slate-400">Contratada</span>
              </div>
           </div>
        </A4Page>
      </div>
    </div>
  );
};
