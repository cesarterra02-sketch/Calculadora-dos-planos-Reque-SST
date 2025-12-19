
import React, { useState, useRef } from 'react';
import { ProfessionalInCompany, ExamInCompany, VehicleInCompany, RequeUnit } from '../types';
import { Printer, Download, Loader2, ArrowLeft, Check, Info, FileText } from 'lucide-react';

declare var html2pdf: any;

const A4Page: React.FC<{ 
  children: React.ReactNode; 
  pageNumber: number; 
  totalPages: number; 
  isLast?: boolean;
}> = ({ children, pageNumber, totalPages, isLast = false }) => (
  <div className={`w-[210mm] min-h-[297mm] mx-auto bg-white shadow-2xl mb-8 relative flex flex-col print:shadow-none print:w-[210mm] print:h-[297mm] print:mb-0 ${!isLast ? 'print:break-after-page' : ''} pdf-page overflow-hidden font-sans antialiased text-slate-800`}>
    {/* Cabeçalho Identidade Visual */}
    <div className="bg-[#190c59] px-12 py-8 flex justify-between items-end text-white shrink-0 relative">
      <div className="flex flex-col z-10">
        <span className="text-4xl font-[900] tracking-tighter leading-none">Reque</span>
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] mt-2 text-white/90">SAÚDE E SEGURANÇA DO TRABALHO</span>
      </div>
      <div className="text-right flex flex-col z-10">
        <span className="text-[18px] font-extrabold uppercase tracking-tight leading-none mb-1">PROPOSTA ATENDIMENTO IN COMPANY</span>
        <span className="text-[11px] font-semibold text-reque-orange uppercase tracking-widest">SERVIÇO ESPECIALIZADO</span>
      </div>
      <div className="absolute top-0 right-0 w-64 h-full bg-white/5 skew-x-[-20deg] translate-x-32"></div>
    </div>
    <div className="h-[5px] bg-[#ec9d23] w-full shadow-sm"></div>

    <div className="flex-1 px-12 py-10 flex flex-col text-[11px] font-medium leading-relaxed">
      {children}
    </div>
    
    <div className="h-12 px-12 flex items-center justify-between text-[9px] text-slate-400 shrink-0 font-semibold border-t border-slate-50 bg-slate-50/30">
       <span className="uppercase tracking-widest italic opacity-60">Reque SST - Proposta In Company</span>
       <span className="font-bold bg-slate-100 px-3 py-1 rounded-full">Pg {pageNumber} de {totalPages}</span>
    </div>
  </div>
);

export const InCompanyProposalView: React.FC<{
  companyName: string;
  cnpj: string;
  contactName: string;
  profs: ProfessionalInCompany[];
  exams: ExamInCompany[];
  finalValue: number;
  receitaExames: number;
  taxaInCompany: number;
  onBack: () => void;
}> = ({ companyName, cnpj, contactName, profs, exams, finalValue, receitaExames, taxaInCompany, onBack }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  
  const currentDate = new Date().toLocaleDateString('pt-BR');
  const validadeDate = "30 dias";
  const totalPages = 2;

  const handleDownloadPDF = async () => {
    if (!contentRef.current) return;
    setIsGenerating(true);
    const filename = `Proposta_InCompany_Reque_${companyName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    const opt = { 
      margin: 0, 
      filename, 
      image: { type: 'jpeg', quality: 1.0 }, 
      html2canvas: { scale: 3, useCORS: true, letterRendering: true, backgroundColor: '#ffffff' }, 
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } 
    };
    try { 
      await html2pdf().set(opt).from(contentRef.current).save(); 
    } catch (e) {
      alert("Erro ao gerar PDF.");
    } finally { 
      setIsGenerating(false); 
    }
  };

  return (
    <div className="bg-slate-200/50 min-h-screen pb-12 print:bg-white print:p-0">
      <div className="max-w-[210mm] mx-auto py-6 flex justify-between no-print px-4">
        <button onClick={onBack} className="px-5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold uppercase flex items-center gap-2 hover:bg-slate-50 transition-all text-reque-navy shadow-sm">
          <ArrowLeft className="w-4 h-4" /> Voltar ao Painel
        </button>
        <div className="flex gap-3">
          <button onClick={() => window.print()} className="px-5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-50 text-slate-600 shadow-sm"><Printer className="w-4 h-4" /> Imprimir</button>
          <button onClick={handleDownloadPDF} disabled={isGenerating} className="px-8 py-2.5 bg-[#190c59] text-white rounded-xl font-bold flex items-center gap-2 text-xs uppercase shadow-xl hover:bg-reque-blue transition-all disabled:opacity-50">
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} {isGenerating ? 'Processando...' : 'Exportar PDF In Company'}
          </button>
        </div>
      </div>

      <div ref={contentRef} className="print:m-0">
        {/* PAGINA 1 */}
        <A4Page pageNumber={1} totalPages={totalPages}>
          <div className="bg-white border border-slate-200/60 p-7 flex justify-between items-start mb-8 rounded-xl shadow-sm relative overflow-hidden">
             <div className="absolute top-0 left-0 w-1 h-full bg-reque-orange"></div>
             <div className="space-y-1.5">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">CONTRATANTE</span>
                <h2 className="text-[16px] font-black text-[#190c59] uppercase leading-tight tracking-tight">{companyName || 'NOME DA EMPRESA'}</h2>
                <div className="text-[11px] text-slate-600 font-semibold space-y-0.5">
                   <div className="flex gap-1.5"><span className="text-slate-400">A/C:</span> {contactName}</div>
                   <div className="flex gap-1.5"><span className="text-slate-400">CNPJ:</span> {cnpj}</div>
                </div>
             </div>
             <div className="text-right space-y-1">
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">EMISSÃO</div>
                <div className="text-[16px] font-black text-[#190c59]">{currentDate}</div>
                <div className="text-[10px] text-slate-500 font-bold bg-slate-100 px-3 py-1 rounded-full inline-block mt-1">Validade: {validadeDate}</div>
             </div>
          </div>

          <p className="mb-8 text-slate-600 font-semibold">
            Apresentamos, por meio deste documento, a proposta para a realização do atendimento <strong className="text-reque-navy">In Company</strong>. 
            O atendimento será realizado nas dependências da empresa contratante, visando agilidade e redução de absenteísmo.
          </p>

          <section className="mb-10">
            <h3 className="text-[13px] font-black text-[#190c59] uppercase mb-5 tracking-tight flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-reque-orange"></span>
              1. EQUIPE TÉCNICA
            </h3>
            <div className="border border-slate-200 overflow-hidden rounded-xl bg-white">
              <table className="w-full text-left text-[10.5px]">
                <thead>
                  <tr className="bg-slate-50 font-black text-[#190c59] border-b border-slate-200">
                    <th className="py-3 px-6">Profissional</th>
                    <th className="py-3 px-6 text-center">Qtde</th>
                    <th className="py-3 px-6 text-center">Horas Trabalhadas (Total)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {profs.map((p, idx) => (
                    <tr key={idx}>
                      <td className="py-3 px-6 font-bold text-slate-700">{p.type}</td>
                      <td className="py-3 px-6 text-center font-bold text-slate-700">{p.quantity}</td>
                      <td className="py-3 px-6 text-center font-bold text-slate-700">{p.executionHours + p.travelHours}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-10">
            <h3 className="text-[13px] font-black text-[#190c59] uppercase mb-5 tracking-tight flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-reque-orange"></span>
              2. EXAMES PREVISTOS
            </h3>
            <div className="border border-slate-200 overflow-hidden rounded-xl bg-white">
              <table className="w-full text-left text-[10.5px]">
                <thead>
                  <tr className="bg-slate-50 font-black text-[#190c59] border-b border-slate-200">
                    <th className="py-3 px-6">Exames</th>
                    <th className="py-3 px-6 text-center">Qtd</th>
                    <th className="py-3 px-6 text-right">Valor Unit. (R$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {exams.map((e, idx) => (
                    <tr key={idx}>
                      <td className="py-3 px-6 font-bold text-slate-700">{e.name}</td>
                      <td className="py-3 px-6 text-center font-bold text-slate-700">{e.quantity}</td>
                      <td className="py-3 px-6 text-right font-bold text-slate-700">{formatCurrency(e.clientPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </A4Page>

        {/* PAGINA 2 */}
        <A4Page pageNumber={2} totalPages={totalPages} isLast={true}>
          <section className="mb-10">
            <h3 className="text-[13px] font-black text-[#190c59] uppercase mb-5 tracking-tight flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-reque-orange"></span>
              3. VALORES TOTAIS
            </h3>
            <div className="border border-slate-200 overflow-hidden rounded-xl bg-white">
              <table className="w-full text-left text-[10.5px]">
                <thead>
                  <tr className="bg-[#190c59] text-white font-black border-b border-slate-200">
                    <th className="py-4 px-6">Serviços</th>
                    <th className="py-4 px-6 text-center">Quantidade de Exames</th>
                    <th className="py-4 px-6 text-right">Valor Total (R$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-4 px-6 font-bold text-slate-700">EXAMES</td>
                    <td className="py-4 px-6 text-center font-bold text-slate-700">{exams.reduce((acc, e) => acc + e.quantity, 0)}</td>
                    <td className="py-4 px-6 text-right font-bold text-slate-700">{formatCurrency(receitaExames)}</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-bold text-slate-700 uppercase">Taxa de Atendimento In Company</td>
                    <td className="py-4 px-6 text-center font-bold text-slate-700">1</td>
                    <td className="py-4 px-6 text-right font-bold text-slate-700">{formatCurrency(taxaInCompany)}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-black text-[#190c59]">
                    <td colSpan={2} className="py-5 px-6 uppercase text-[12px]">Total Geral do Atendimento</td>
                    <td className="py-5 px-6 text-right text-[16px]">{formatCurrency(finalValue)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          <div className="grid grid-cols-2 gap-10 mb-10">
            <section>
              <h4 className="font-black text-reque-navy uppercase text-[10px] mb-3 tracking-widest">4. PAGAMENTO</h4>
              <p className="text-slate-600 font-bold leading-relaxed">
                O valor total estipulado no item 3 deverá ser pago à vista, por meio de PIX, até o dia 5 do mês subsequente à execução.
              </p>
            </section>
            <section>
              <h4 className="font-black text-reque-navy uppercase text-[10px] mb-3 tracking-widest">5. OBSERVAÇÃO</h4>
              <p className="text-slate-600 font-bold leading-relaxed">
                Os exames serão faturados pela empresa <strong className="text-reque-navy">REQUE SST</strong> e a taxa do atendimento in company pela empresa <strong className="text-reque-navy">MR&CIA</strong>.
              </p>
            </section>
          </div>

          <div className="mt-auto pt-20 grid grid-cols-2 gap-20">
            <div className="text-center">
              <div className="h-px bg-slate-300 w-full mb-2"></div>
              <p className="font-black text-reque-navy uppercase text-[10px]">REQUE – CLÍNICA DE MEDICINA DO TRABALHO</p>
              <p className="text-[9px] text-slate-400 font-bold">CONTRATADA</p>
            </div>
            <div className="text-center">
              <div className="h-px bg-slate-300 w-full mb-2"></div>
              <p className="font-black text-reque-navy uppercase text-[10px]">{companyName || '__________________________________'}</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">CONTRATANTE</p>
              <div className="mt-4 text-left space-y-1">
                 <p className="text-[9px] font-bold text-slate-500 uppercase">Nome: __________________________</p>
                 <p className="text-[9px] font-bold text-slate-500 uppercase">CPF: ___________________________</p>
              </div>
            </div>
          </div>
        </A4Page>
      </div>
    </div>
  );
};
