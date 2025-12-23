
import React, { useState, useRef } from 'react';
import { PricingResult, PlanType, FidelityModel, BillingCycle, RequeUnit } from '../types';
import { PLAN_SERVICES, UNIT_EXAM_TABLES, SYSTEM_FEATURES, ADDITIONAL_SERVICES } from '../constants';
import { Printer, Download, Loader2, ArrowLeft, AlertTriangle, Clock, CheckSquare } from 'lucide-react';

declare var html2pdf: any;

const A4Page: React.FC<{ 
  children: React.ReactNode; 
  pageNumber: number; 
  totalPages: number; 
  isLast?: boolean;
  plan: string;
}> = ({ children, pageNumber, totalPages, isLast = false, plan }) => (
  <div className={`page-a4 ${!isLast ? 'page-break' : ''} pdf-page relative flex flex-col font-sans antialiased text-slate-800 bg-white shadow-2xl print:shadow-none print:m-0 overflow-hidden`}>
    {/* Cabeçalho Identidade Visual */}
    <div className="bg-[#190c59] px-[15mm] py-6 flex justify-between items-end text-white shrink-0 relative">
      <div className="flex flex-col z-10">
        <span className="text-3xl font-[900] tracking-tighter leading-none">Reque</span>
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] mt-2 text-white/90 whitespace-nowrap">Saúde e Segurança do Trabalho</span>
      </div>
      <div className="text-right flex flex-col z-10">
        <span className="text-[14px] font-extrabold uppercase tracking-tight leading-none mb-1">PROPOSTA TÉCNICA COMERCIAL</span>
        <span className="text-[9px] font-semibold text-white/50 uppercase tracking-widest">REF: {plan}</span>
      </div>
      <div className="absolute top-0 right-0 w-64 h-full bg-white/5 skew-x-[-20deg] translate-x-32"></div>
    </div>
    <div className="h-[4px] bg-[#ec9d23] w-full shadow-sm shrink-0"></div>

    {/* Área de Conteúdo */}
    <div className="page-content">
      {children}
    </div>
    
    {/* Rodapé - Tons Escurecidos */}
    <div className="h-10 px-[15mm] flex items-center justify-between text-[7.5px] text-slate-600 shrink-0 font-bold border-t border-slate-200 bg-slate-100/50 uppercase tracking-widest italic mt-auto">
       <span>Reque SST - Consultoria em Saúde e Segurança do Trabalho</span>
       <span className="font-bold opacity-90 bg-slate-200 px-3 py-1 rounded-full uppercase tracking-tighter not-italic text-slate-800">Página {pageNumber} de {totalPages}</span>
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
  const contentRef = useRef<HTMLDivElement>(null);
  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '___/___/_____';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const clientDateFmt = formatDate(result.clientDeliveryDate);
  const currentDate = new Date().toLocaleDateString('pt-BR');
  const validadeDate = "10 dias";
  const totalPages = 3;

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
        width: 794,
        windowWidth: 794,
        scrollX: 0,
        scrollY: 0,
        x: 0
      }, 
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'], after: '.page-break' }
    };

    try { 
      const pages = contentRef.current.querySelectorAll('.page-a4');
      pages.forEach((p: any) => {
        p.style.setProperty('margin', '0', 'important');
        p.style.setProperty('box-shadow', 'none', 'important');
      });
      
      const originalAlign = contentRef.current.style.alignItems;
      const originalPadding = contentRef.current.style.padding;
      
      contentRef.current.style.alignItems = 'flex-start';
      contentRef.current.style.padding = '0';
      
      await html2pdf().set(opt).from(contentRef.current).save(); 
      
      contentRef.current.style.alignItems = originalAlign;
      contentRef.current.style.padding = originalPadding;
      pages.forEach((p: any) => {
        p.style.setProperty('margin', '0 auto', 'important');
        p.style.setProperty('box-shadow', '0 25px 50px -12px rgb(0 0 0 / 0.25)', 'important');
      });
    } catch (e) {
      console.error(e);
      alert("Houve um erro técnico ao gerar o PDF. Tente usar a função 'Imprimir' do navegador.");
    } finally { 
      setIsGenerating(false); 
    }
  };

  return (
    <div className="bg-slate-300/50 min-h-screen pb-12 print:bg-white print:p-0">
      <style>{`
        .page-a4 {
          width: 210mm;
          height: 296mm;
          margin: 0 auto !important;
          padding: 0;
          overflow: hidden;
          background: white;
          box-sizing: border-box;
          position: relative;
        }

        .page-content {
          width: 100%;
          padding: 15mm;
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow: hidden;
        }

        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            background: none !important;
            -webkit-print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          .page-a4 {
            box-shadow: none !important;
            margin: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            page-break-after: always;
          }
        }
        
        .page-break {
          page-break-after: always;
        }
        
        .break-inside-avoid {
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .proposal-container {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        table {
          width: 100%;
          table-layout: fixed;
          border-collapse: collapse;
        }
        
        .investment-table td, .investment-table th {
          word-wrap: break-word;
          overflow-wrap: break-word;
        }

        /* Efeito de Risco Robusto para PDF */
        .strikethrough-line {
          position: absolute;
          top: 52%;
          left: 0;
          width: 100%;
          height: 1.5px;
          background-color: #475569; /* slate-600 */
          transform: translateY(-50%);
          z-index: 10;
        }
      `}</style>

      {/* Barra de Ações Fixa */}
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

      <div className="proposal-container overflow-x-auto lg:overflow-x-visible">
        <div ref={contentRef} className="print:m-0 w-full flex flex-col items-center transition-all">
          
          {/* PÁGINA 1: APRESENTAÇÃO E INVESTIMENTO */}
          <A4Page pageNumber={1} totalPages={totalPages} plan={plan.toUpperCase()}>
            {/* Quadro Dados do Cliente */}
            <div className="bg-slate-100 border border-slate-300 p-6 flex flex-row justify-between items-start mb-6 rounded-lg relative break-inside-avoid w-full shadow-sm">
               <div className="absolute top-0 left-0 w-1.5 h-full bg-[#ec9d23]"></div>
               <div className="flex-1 min-w-0 pr-6 space-y-1.5">
                  <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">DADOS DO CLIENTE</span>
                  <h2 className="text-[14px] font-black text-[#190c59] uppercase leading-tight tracking-tight break-words">
                    {companyName || 'NOME DA EMPRESA CONTRATANTE'}
                  </h2>
                  <div className="text-[9.5px] text-slate-700 font-bold space-y-1">
                     <div className="flex gap-2 items-start">
                        <span className="text-slate-500 uppercase text-[7px] font-black whitespace-nowrap pt-0.5">CONTATO:</span> 
                        <span className="break-words leading-tight">{contactName}</span>
                     </div>
                     <div className="flex gap-2 items-center">
                        <span className="text-slate-500 uppercase text-[7px] font-black whitespace-nowrap">CNPJ:</span> 
                        <span className="font-bold">{cnpj || 'Não informado'}</span>
                     </div>
                  </div>
               </div>
               <div className="text-right shrink-0 border-l border-slate-300 pl-6 ml-2 min-w-[140px]">
                  <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest">EMISSÃO DA PROPOSTA</div>
                  <div className="text-[14px] font-black text-[#190c59] whitespace-nowrap leading-none mt-1">{currentDate}</div>
                  <div className="text-[9px] text-slate-600 font-bold mt-2 bg-white px-3 py-1 rounded inline-block border border-slate-200 shadow-sm whitespace-nowrap">Validade: {validadeDate}</div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-x-8 mb-6 w-full">
              <section className="bg-slate-100/50 p-4 rounded-xl border border-slate-200 break-inside-avoid">
                <h3 className="text-[11px] font-black text-[#190c59] uppercase mb-4 tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ec9d23]"></span> 1. ESCOPO DE SERVIÇOS
                </h3>
                <p className="text-slate-500 mb-2 font-bold text-[8px] uppercase tracking-wider">Módulos de gestão inclusos:</p>
                <ul className="space-y-1.5 text-slate-700 font-bold text-[8.5px]">
                  {PLAN_SERVICES[plan].slice(0, 10).map((s, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="text-[#ec9d23] font-black text-md leading-none">•</span> {s}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="bg-slate-100/50 p-4 rounded-xl border border-slate-200 break-inside-avoid">
                <h3 className="text-[11px] font-black text-[#190c59] uppercase mb-4 tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ec9d23]"></span> 2. PRÉ-ELABORAÇÃO
                </h3>
                <ol className="text-slate-700 space-y-3 font-bold text-[8.5px] leading-relaxed">
                  <li className="flex gap-2 items-start"><span className="text-[#ec9d23] font-black">1.</span> Envio obrigatório de dados cadastrais conforme layout Reque SST.</li>
                  <li className="flex gap-2 items-start"><span className="text-[#ec9d23] font-black">2.</span> Descrição detalhada de atividades por cargo para análise de riscos ambientais.</li>
                  <li className="flex gap-2 items-start"><span className="text-[#ec9d23] font-black">3.</span> Para contratos parciais, envio obrigatório de documentos base PGR/LTCAT vigentes.</li>
                </ol>
              </section>
            </div>

            <section className="mb-4 break-inside-avoid w-full">
              <h3 className="text-[11px] font-black text-[#190c59] uppercase mb-4 tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ec9d23]"></span> 3. INVESTIMENTO E CONDIÇÕES COMERCIAIS
              </h3>
              <div className="border border-slate-300 overflow-hidden rounded-lg shadow-sm bg-white w-full">
                 <table className="investment-table text-[9px] text-left">
                    <thead>
                      <tr className="bg-slate-200 text-[#190c59] font-black uppercase text-[7px] border-b border-slate-300 tracking-wider">
                         <th className="py-2.5 px-4 border-r border-slate-300 w-1/4 text-center">Nº Vidas</th>
                         <th className="py-2.5 px-4 text-center" colSpan={3}>Plano Selecionado</th>
                      </tr>
                      <tr className="bg-white border-b border-slate-300">
                         <td className="py-3 px-4 border-r border-slate-300 text-center font-black text-[#190c59] text-[11px]">{result.rangeLabel}</td>
                         <td className="py-3 px-4 text-center font-black text-[#190c59] text-[11px]" colSpan={3}>{plan.toUpperCase()}</td>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300">
                       <tr className="bg-slate-100">
                          <td className="p-3 px-4 font-black text-[#190c59] uppercase border-r border-slate-300 w-1/4">Programas e Laudos</td>
                          <td className="p-3 px-4 text-slate-600 font-bold italic text-[8.5px] leading-snug">Elaboração técnica inicial de PGR e PCMSO.</td>
                          <td className="p-3 px-4 text-center w-1/4 border-r border-slate-300">
                             <div className="flex flex-col items-center justify-center min-h-[50px] w-full">
                                {result.programFeeDiscounted ? (
                                  <div className="flex flex-col items-center">
                                    <div className="relative inline-block">
                                      <span className="text-slate-600 font-bold text-[13px] leading-tight">
                                        {formatCurrency(result.originalProgramFee)}
                                      </span>
                                      <div className="strikethrough-line"></div>
                                    </div>
                                    <span className="bg-[#e9ecef] text-[#ec9d23] px-3 py-1 rounded-md text-[10px] font-black mt-2 shadow-sm italic border border-slate-200 leading-none tracking-tighter uppercase">
                                      ISENTO*
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-[13px] font-black text-[#190c59]">{formatCurrency(result.programFee)}</span>
                                )}
                             </div>
                          </td>
                          <td className="p-3 px-4 text-center text-slate-500 font-black italic text-[8px] uppercase tracking-tighter">Taxa Única</td>
                       </tr>
                       <tr className="bg-white">
                          <td className="p-3 px-4 font-black text-[#190c59] uppercase border-r border-slate-300 w-1/4">Assinatura Mensal</td>
                          <td className="p-3 px-4 text-slate-600 font-bold italic text-[8.5px] leading-snug">Gestão, Mensageria eSocial e Sistema.<br/><span className="text-[7px] font-black text-[#ec9d23] uppercase">{fidelity === FidelityModel.WITH_FIDELITY ? 'Plano com Fidelidade 24m' : 'Plano Mensal Livre'}</span></td>
                          <td className="p-3 px-4 text-center font-black text-[#190c59] text-[15px] tracking-tighter w-1/4 border-r border-slate-300 leading-none">{formatCurrency(result.monthlyValue)}</td>
                          <td className="p-3 px-4 text-center text-slate-500 font-black italic text-[8px] uppercase tracking-tighter">Ref. Mensal</td>
                       </tr>
                       <tr className="bg-slate-100">
                          <td className="p-3 px-4 font-black text-[#190c59] uppercase border-r border-slate-300 w-1/4">Exames Clínicos</td>
                          <td className="p-3 px-4 text-slate-600 font-bold italic text-[8.5px] leading-snug">Atendimento por demanda (Tabela Anexa).</td>
                          <td className="p-3 px-4 text-center font-bold text-slate-500 w-1/4 uppercase tracking-widest text-[8px] border-r border-slate-300 italic">Vide Anexo</td>
                          <td className="p-3 px-4 text-center text-slate-500 font-black italic text-[8px] uppercase tracking-tighter">Por Demanda</td>
                       </tr>
                    </tbody>
                 </table>
              </div>
              
              <div className="mt-4 flex flex-col items-end w-full">
                 <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">VALOR DE ENTRADA (ACEITE DO CONTRATO)</span>
                 <div className="text-2xl font-black text-[#190c59] tracking-tighter leading-none">{formatCurrency(result.initialPaymentAmount)}</div>
                 <p className="text-[8px] text-slate-500 font-black italic opacity-90 mt-1 uppercase tracking-tighter">Ref. {result.billingCycle === BillingCycle.ANNUAL ? 'Pagamento Anual Antecipado' : 'Primeira Mensalidade'}</p>
              </div>
            </section>
          </A4Page>

          {/* PÁGINA 2: CLÁUSULAS E CONDIÇÕES */}
          <A4Page pageNumber={2} totalPages={totalPages} plan={plan.toUpperCase()}>
            <section className="mb-6 break-inside-avoid w-full">
              <h3 className="text-[12px] font-black text-[#190c59] uppercase mb-5 tracking-tight flex items-center gap-2 border-b-2 border-slate-200 pb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ec9d23]"></span> 4. FUNCIONALIDADES DO SISTEMA DE GESTÃO (SOC)
              </h3>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 p-5 bg-slate-100/60 rounded-xl border border-slate-200 mb-6">
                 {SYSTEM_FEATURES.slice(0, 12).map((feat, idx) => (
                   <div key={idx} className="flex items-center gap-2 text-[8.5px] text-slate-700 font-bold">
                      <CheckSquare className="w-3 h-3 text-[#ec9d23] shrink-0" />
                      <span className="truncate">{feat}</span>
                   </div>
                 ))}
              </div>

              <h3 className="text-[12px] font-black text-[#190c59] uppercase mb-5 tracking-tight flex items-center gap-2 border-b-2 border-slate-200 pb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ec9d23]"></span> 5. CLÁUSULAS E CONSIDERAÇÕES TÉCNICAS
              </h3>
              <div className="bg-slate-100 border border-slate-200 rounded-xl p-6 space-y-5">
                <div className="flex gap-4 items-start">
                  <Clock className="w-5 h-5 text-reque-navy shrink-0 mt-0.5" />
                  <p className="text-slate-800 font-bold text-[9.5px] leading-relaxed">
                    <strong className="text-[#190c59]">a. Prazo de Entrega:</strong> O prazo técnico para emissão da documentação final (PGR/PCMSO) é de <strong className="text-[#190c59]">19 dias úteis</strong>, contados a partir do recebimento integral das descrições de cargo em <strong className="bg-[#ec9d23]/20 px-1.5 rounded text-slate-900 font-black">{clientDateFmt}</strong>.
                  </p>
                </div>

                <div className="bg-orange-100/30 border-l-4 border-[#ec9d23] p-4 text-slate-800 shadow-sm rounded-r-lg border border-orange-200 break-inside-avoid w-full">
                  <h4 className="font-black uppercase text-[#190c59] text-[9px] mb-1.5 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#ec9d23]" />
                    b. CLÁUSULA DE DISPONIBILIDADE E NO SHOW:
                  </h4>
                  <p className="text-[8.5px] font-bold leading-relaxed text-slate-700 italic">
                    Visando a viabilidade operacional das agendas clínicas e de perícia técnica, ausências sem aviso prévio de 24h implicarão na cobrança do valor de uma consulta clínica base para cobertura de custos de disponibilidade técnica.
                  </p>
                </div>

                <p className="text-slate-700 font-bold text-[9px] leading-relaxed ml-9">
                  <strong className="text-[#190c59]">c. Gestão Digital:</strong> A Reque SST opera com prontuário e assinatura digital (biometria ou certificado). Documentos físicos estão sujeitos a taxas de impressão e postagem conforme tabela de serviços adicionais.
                </p>

                <p className="text-slate-700 font-bold text-[9px] leading-relaxed ml-9">
                  <strong className="text-[#190c59]">d. Avaliações Quantitativas:</strong> Laudos de Insalubridade e LTCAT que exijam coletas de campo (ruído, poeira, calor) possuem prazo estendido de 30 dias para análise laboratorial.
                </p>
              </div>
            </section>

            <div className="grid grid-cols-2 gap-8 mb-6 w-full">
              <section className="bg-slate-100 p-5 rounded-xl border border-slate-200 break-inside-avoid shadow-sm">
                <h3 className="text-[11px] font-black text-[#190c59] uppercase mb-4 tracking-tight flex items-center gap-2 border-b-2 border-slate-200 pb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ec9d23]"></span> 6. FATURAMENTO
                </h3>
                <div className="space-y-4">
                   <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                      <p className="font-black text-[#190c59] uppercase text-[8px] mb-2">MODALIDADE DE PAGAMENTO</p>
                      <p className="text-slate-700 font-bold text-[8.5px] leading-relaxed">
                        Ciclo: {result.billingCycle}.<br/>Meio: <strong className="text-[#1a067c] font-black">{result.paymentMethod}</strong>.
                      </p>
                   </div>
                </div>
              </section>

              <section className="bg-slate-100 p-5 rounded-xl border border-slate-200 break-inside-avoid shadow-sm">
                <h3 className="text-[11px] font-black text-[#190c59] uppercase mb-4 tracking-tight flex items-center gap-2 border-b-2 border-slate-200 pb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ec9d23]"></span> 7. CONTRATO E RESCISÃO
                </h3>
                <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-4 shadow-sm">
                   <p className="text-slate-800 font-bold text-[8.5px] leading-relaxed">
                     <strong className="text-[#190c59]">Vigência:</strong> {fidelity === FidelityModel.WITH_FIDELITY ? 'Mínimo de 24 meses.' : 'Indeterminado.'}
                   </p>
                   
                   {fidelity === FidelityModel.WITH_FIDELITY ? (
                     <div className="bg-slate-100 p-3 border border-orange-200 rounded-lg">
                        <p className="text-[8px] font-black text-[#ec9d23] uppercase mb-1 tracking-tighter">CLÁUSULA DE FIDELIDADE:</p>
                        <p className="text-[8px] font-bold leading-relaxed text-slate-700 italic">Rescisão antecipada aciona a cobrança integral do bônus de isenção concedido na elaboração do PGR/PCMSO.</p>
                     </div>
                   ) : (
                     <div className="bg-green-50 p-3 border border-green-200 rounded-lg">
                        <p className="text-[8px] font-black text-green-700 uppercase mb-1 tracking-tighter">MENSALIDADE LIVRE:</p>
                        <p className="text-[8px] font-bold leading-relaxed text-slate-700 italic">Distrato sem multas mediante aviso prévio de 30 dias.</p>
                     </div>
                   )}
                </div>
              </section>
            </div>
          </A4Page>

          {/* PÁGINA 3: ANEXO DE EXAMES */}
          <A4Page pageNumber={3} totalPages={totalPages} isLast={true} plan={plan.toUpperCase()}>
             <section className="p-6 bg-slate-100 border border-slate-200 rounded-xl break-inside-avoid w-full shadow-sm mb-6">
                <h3 className="text-[11px] font-black text-[#190c59] uppercase mb-5 tracking-tight flex items-center gap-2 border-b-2 border-slate-200 pb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ec9d23]"></span> 8. SERVIÇOS ADICIONAIS SOB DEMANDA
                </h3>
                <div className="grid grid-cols-2 gap-x-12 gap-y-3 px-4">
                  <div className="flex items-center justify-between border-b border-slate-300 pb-1">
                    <span className="text-slate-700 font-bold text-[9px]">Emissão de PPP (Avulso)</span>
                    <strong className="text-[#190c59] text-[9px]">R$ 250,00</strong>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-300 pb-1">
                    <span className="text-slate-700 font-bold text-[9px]">Visita Técnica de Campo</span>
                    <strong className="text-[#190c59] text-[9px]">R$ 100,00/h</strong>
                  </div>
                  {ADDITIONAL_SERVICES.slice(0, 4).map((serv, idx) => (
                    <div key={idx} className="flex items-center justify-between border-b border-slate-300 pb-1">
                      <span className="text-slate-700 font-bold text-[9px] truncate max-w-[140px]">{serv.item}</span>
                      <strong className="text-[#190c59] text-[9px]">{formatCurrency(serv.value)}</strong>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-2.5 bg-white rounded border border-slate-200 text-slate-700 text-[8px] font-black uppercase text-center shadow-sm italic">
                  * Visita Técnica obrigatória para auditoria de riscos em empresas de Grau de Risco 3 e 4.
                </div>
              </section>

             <div className="text-center mb-6 pt-6 break-inside-avoid w-full">
                <h2 className="text-[16px] font-black text-[#190c59] uppercase tracking-[0.1em] leading-none mb-3">ANEXO - TABELA DE VALORES EXAMES</h2>
                <div className="h-1 w-20 bg-[#ec9d23] mx-auto mb-4 rounded-full"></div>
                <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.2em]">{selectedUnit.replace('Unidade Reque ', '')}</p>
             </div>
             
             <div className="border border-slate-300 overflow-hidden rounded-xl shadow-sm bg-white flex-1 flex flex-col w-full">
                <table className="w-full text-[9px] text-left border-collapse table-fixed">
                   <thead>
                      <tr className="bg-slate-200 text-[#190c59] font-black uppercase text-[7px] tracking-widest border-b border-slate-300">
                         <th className="py-4 px-6 border-r border-slate-300 w-[20%]">CATEGORIA</th>
                         <th className="py-4 px-6 border-r border-slate-300 w-[45%]">EXAME OCUPACIONAL</th>
                         <th className="py-4 px-6 text-center border-r border-slate-300 w-[15%]">VALOR</th>
                         <th className="py-4 px-6 text-center w-[20%]">PRAZO</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-200 overflow-hidden">
                      {UNIT_EXAM_TABLES[selectedUnit].slice(0, 30).map((exam, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-100'}>
                           <td className="py-2.5 px-6 font-black text-[#ec9d23] text-[7px] uppercase tracking-tighter border-r border-slate-200">{exam.category}</td>
                           <td className="py-2.5 px-6 font-bold text-slate-800 border-r border-slate-200 leading-tight truncate">{exam.name}</td>
                           <td className="py-2.5 px-6 text-center font-black text-[#190c59] text-[9.5px] border-r border-slate-200">{formatCurrency(exam.price)}</td>
                           <td className="py-2.5 px-6 text-center text-slate-600 font-black uppercase text-[7px] italic leading-tight">{exam.deadline}</td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>

             <div className="mt-8 p-6 border border-slate-200 bg-slate-100 rounded-xl break-inside-avoid w-full shadow-sm">
                <p className="text-[8px] text-slate-600 font-black leading-relaxed italic uppercase tracking-tighter text-center">
                  * Valores exclusivos para realização na unidade própria indicada. Atendimentos via rede credenciada podem sofrer variações conforme negociação local. Prazos contados em dias úteis a partir da realização.
                </p>
             </div>

             <div className="mt-auto py-8 flex flex-col items-center opacity-40 grayscale scale-75 w-full">
                <span className="text-6xl font-[900] tracking-tighter leading-none text-[#190c59]">Reque</span>
                <p className="text-[9px] font-black uppercase tracking-[0.4em] mt-3 text-[#190c59]">SAÚDE E SEGURANÇA DO TRABALHO</p>
             </div>
          </A4Page>
        </div>
      </div>
    </div>
  );
};
