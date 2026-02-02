
import React, { useState, useRef } from 'react';
import { RequeUnit } from '../types';
import { Printer, Download, Loader2, ArrowLeft, CheckCircle2, ShieldCheck, Mail, MapPin } from 'lucide-react';

declare var html2pdf: any;

const A4Page: React.FC<{ 
  children: React.ReactNode; 
  pageNumber: number; 
  totalPages: number; 
}> = ({ children, pageNumber, totalPages }) => (
  <div className="page-a4 relative flex flex-col font-sans antialiased text-slate-800 bg-white shadow-2xl print:shadow-none overflow-hidden">
    {/* Page Header Identidade Visual */}
    <div className="bg-[#190c59] w-full px-[12mm] py-6 flex justify-between items-end text-white shrink-0 relative overflow-hidden">
      <div className="flex flex-col z-10">
        <span className="text-3xl font-[900] tracking-tighter leading-none">Reque</span>
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] mt-2 text-white/90 whitespace-nowrap">SAÚDE E SEGURANÇA DO TRABALHO</span>
      </div>
      <div className="text-right flex flex-col z-10">
        <span className="text-[13px] font-extrabold uppercase tracking-tight leading-none mb-1">PROPOSTA TÉCNICA COMERCIAL</span>
        <span className="text-[9px] font-semibold text-white/50 uppercase tracking-widest italic">REF: CREDENCIAMENTO REDE SST</span>
      </div>
      <div className="absolute top-0 right-0 w-[500px] h-full bg-white/5 skew-x-[-20deg] translate-x-40 pointer-events-none"></div>
    </div>
    <div className="h-[4px] bg-[#ec9d23] w-full shrink-0"></div>

    {/* Conteúdo */}
    <div className="page-content flex flex-col flex-1 px-[15mm] py-8">
      {children}
    </div>
    
    {/* Rodapé */}
    <div className="h-10 px-[15mm] flex items-center justify-between text-[7.5px] text-slate-600 shrink-0 font-bold border-t border-slate-200 bg-white uppercase tracking-widest italic mt-auto">
       <span>REQUE SST - CONSULTORIA EM SAÚDE E SEGURANÇA DO TRABALHO</span>
       <span className="font-bold bg-slate-100 px-3 py-1 rounded-full not-italic text-slate-800">PÁGINA {pageNumber} DE {totalPages}</span>
    </div>
  </div>
);

export const CredenciadorProposalView: React.FC<{
  onBack: () => void;
  companyName: string;
  contactName: string;
  cnpj: string;
  selectedUnits: RequeUnit[];
  unitExamsMap: Record<string, any[]>;
}> = ({ onBack, companyName, contactName, cnpj, selectedUnits, unitExamsMap }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  
  const totalPages = 1 + selectedUnits.length;
  const currentDate = new Date().toLocaleDateString('pt-BR');

  const handleDownloadPDF = async () => {
    if (!contentRef.current) return;
    setIsGenerating(true);
    const opt = { 
      margin: 0, 
      filename: `Proposta_Credenciamento_Reque_${companyName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`, 
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
    } catch (e) { 
      console.error(e); 
    } finally { 
      setIsGenerating(false); 
    }
  };

  return (
    <div className="bg-slate-200/50 min-h-screen pb-12 print:bg-white print:p-0">
      <style>{`
        .page-a4 { width: 210mm; height: 297mm; margin: 0 auto 32px auto; background: white; page-break-after: always; position: relative; }
        .page-a4:last-child { page-break-after: auto; margin-bottom: 0; }
        @media print { .no-print { display: none !important; } .page-a4 { box-shadow: none !important; margin: 0 !important; height: 297mm !important; } }
      `}</style>

      <div className="w-full bg-white/95 backdrop-blur-md border-b border-slate-300 sticky top-0 z-50 no-print px-4 py-3 mb-8 shadow-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <button onClick={onBack} className="px-5 py-2 bg-white border border-slate-300 rounded-xl text-[11px] font-bold uppercase flex items-center gap-2 hover:bg-slate-100 transition-all text-reque-navy shadow-sm">
            <ArrowLeft className="w-4 h-4" /> VOLTAR
          </button>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="px-5 py-2 bg-white border border-slate-300 rounded-xl text-[11px] font-bold flex items-center gap-2 hover:bg-slate-100 text-slate-700 shadow-sm">
              <Printer className="w-4 h-4" /> IMPRIMIR
            </button>
            <button onClick={handleDownloadPDF} disabled={isGenerating} className="px-7 py-2 bg-[#190c59] text-white rounded-xl font-bold flex items-center gap-2 text-[11px] uppercase shadow-lg hover:bg-reque-blue transition-all disabled:opacity-50">
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} EXPORTAR PROPOSTA PDF
            </button>
          </div>
        </div>
      </div>

      <div ref={contentRef} className="proposal-container">
        {/* PÁGINA 1: APRESENTAÇÃO */}
        <A4Page pageNumber={1} totalPages={totalPages}>
          {/* Header Dados do Cliente */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex justify-between items-start mb-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#ec9d23]"></div>
            <div className="space-y-2 flex-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">CREDENCIADO / PARCEIRO</span>
              <h2 className="text-[16px] font-[900] text-reque-navy uppercase leading-tight tracking-tight">{companyName}</h2>
              <div className="text-[10px] font-bold text-slate-600 mt-2 space-y-1">
                <p className="flex gap-2">
                  <span className="text-slate-400 uppercase text-[8px] font-black whitespace-nowrap pt-0.5">A/C:</span>
                  <span className="text-reque-navy">{contactName}</span>
                </p>
                <p className="flex gap-2">
                  <span className="text-slate-400 uppercase text-[8px] font-black whitespace-nowrap pt-0.5">CNPJ:</span>
                  <span className="text-reque-navy">{cnpj}</span>
                </p>
              </div>
            </div>
            <div className="text-right border-l border-slate-200 pl-8 space-y-1 min-w-[140px]">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">DATA DE EMISSÃO</span>
              <p className="text-[15px] font-[900] text-reque-navy leading-none mb-2">{currentDate}</p>
              <div className="bg-white border border-slate-200 rounded px-4 py-1.5 text-[9px] font-black text-slate-500 inline-block shadow-sm">VALIDADE: 10 DIAS</div>
            </div>
          </div>

          <div className="space-y-6">
            <section className="space-y-4">
              <h3 className="text-[14px] font-black text-reque-navy uppercase flex items-center gap-3 border-b-2 border-slate-100 pb-2">
                <ShieldCheck className="w-5 h-5 text-reque-orange" /> APRESENTAÇÃO TÉCNICA
              </h3>
              <p className="text-[11.5pt] leading-relaxed text-slate-700 text-justify">
                A <strong>REQUE SST</strong>, referência em soluções estratégicas de Saúde e Segurança do Trabalho, apresenta esta proposta técnica voltada à estruturação e parceria técnica para a prestação de serviços de exames ocupacionais em nossa rede.
              </p>
              <p className="text-[11.5pt] leading-relaxed text-slate-700 text-justify">
                Esta proposta objetiva consolidar uma aliança de atendimento de excelência, assegurando conformidade legal absoluta perante as NRs e o eSocial, mantendo a agilidade operacional necessária para o fluxo de contratações e manutenções de nossos clientes corporativos. As tabelas de valores anexas foram dimensionadas para garantir a sustentabilidade do parceiro credenciado em equilíbrio com a competitividade de mercado.
              </p>
            </section>

            <section className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
               <h4 className="text-[10px] font-black text-reque-navy uppercase tracking-widest mb-4 flex items-center gap-2">
                 <CheckCircle2 className="w-4 h-4 text-reque-orange" /> PILARES DO CREDENCIAMENTO REQUE
               </h4>
               <div className="grid grid-cols-2 gap-4">
                  <div className="flex gap-3 items-start">
                    <div className="mt-1 p-1 bg-white border border-slate-200 rounded shadow-sm"><Mail className="w-3 h-3 text-reque-navy" /></div>
                    <div>
                      <p className="text-[9px] font-black text-reque-navy uppercase">Agendamento Digital</p>
                      <p className="text-[10px] text-slate-500 font-medium italic">Gestão centralizada via Sistema SOC.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="mt-1 p-1 bg-white border border-slate-200 rounded shadow-sm"><MapPin className="w-3 h-3 text-reque-navy" /></div>
                    <div>
                      <p className="text-[9px] font-black text-reque-navy uppercase">Capilaridade Regional</p>
                      <p className="text-[10px] text-slate-500 font-medium italic">Atendimento local com suporte técnico Reque.</p>
                    </div>
                  </div>
               </div>
            </section>

            <div className="mt-8 p-6 bg-[#190c59]/5 border border-indigo-100 rounded-2xl italic text-[11pt] text-reque-navy font-medium leading-relaxed">
              "Nosso compromisso é elevar o padrão de atendimento ocupacional através de uma rede credenciada forte, técnica e preparada para os desafios normativos da atualidade."
            </div>
          </div>
        </A4Page>

        {/* PÁGINAS DE ANEXOS: TABELAS DE CADA UNIDADE */}
        {selectedUnits.map((unitKey, unitIdx) => (
          <A4Page key={unitKey} pageNumber={2 + unitIdx} totalPages={totalPages}>
            <div className="flex flex-col items-center mb-6">
              <h3 className="text-[15px] font-[900] text-reque-navy uppercase tracking-tight text-center">
                ANEXO - TABELA DE VALORES EXAMES | <span className="text-reque-orange">{unitKey.replace('Unidade Reque ', '').toUpperCase()}</span>
              </h3>
              <div className="h-[3px] w-24 bg-[#ec9d23] mt-2 rounded-full shadow-sm"></div>
            </div>

            <div className="border border-slate-300 rounded-2xl overflow-hidden bg-white shadow-sm flex-1 flex flex-col">
              <table className="w-full text-left text-[9px] border-collapse table-fixed">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-[#190c59] text-white font-[900] uppercase text-[7.5px] border-b border-slate-200 tracking-wider">
                    <th className="py-2.5 px-5 w-[20%] border-r border-white/10">TIPO DE EXAME</th>
                    <th className="py-2.5 px-5">NOME DO EXAME</th>
                    <th className="py-2.5 px-5 w-[18%] text-center border-l border-white/10">VALOR ACORDADO <br/>(CREDENCIADO)</th>
                    <th className="py-2.5 px-5 w-[18%] text-center border-l border-white/10">PRAZO DE <br/>ENTREGA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(unitExamsMap[unitKey] || []).map((exam, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="py-1.5 px-5 font-black text-slate-400 text-[7px] uppercase border-r border-slate-100 truncate">{exam.category}</td>
                      <td className="py-1.5 px-5 font-bold text-reque-navy text-[8.5px] uppercase truncate">{exam.name}</td>
                      <td className="py-1.5 px-5 text-center font-black text-reque-navy text-[10px] border-l border-slate-100">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(exam.price)}
                      </td>
                      <td className="py-1.5 px-5 text-center text-[7.5px] font-bold text-slate-500 border-l border-slate-100 uppercase italic">{exam.deadline}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <p className="text-[8.5px] font-black text-slate-500 italic uppercase leading-relaxed text-center tracking-widest">
                * VALORES EXCLUSIVOS PARA REALIZAÇÃO NA UNIDADE INDICADA. SUJEITO A REAJUSTES CONFORME CLÁUSULA CONTRATUAL E REVISÃO DE REDE CREDENCIADA.
              </p>
            </div>
          </A4Page>
        ))}
      </div>
    </div>
  );
};
