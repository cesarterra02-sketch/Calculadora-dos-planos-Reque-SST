
import React, { useState, useRef } from 'react';
import { ProfessionalInCompany, ExamInCompany, VehicleInCompany, RequeUnit } from '../types';
import { Printer, Download, Loader2, ArrowLeft, Check, Info, FileText, AlertTriangle, ShieldCheck, Truck } from 'lucide-react';

declare var html2pdf: any;

const A4Page: React.FC<{ 
  children: React.ReactNode; 
  pageNumber: number; 
  totalPages: number; 
  isLast?: boolean;
  refCode: string;
}> = ({ children, pageNumber, totalPages, isLast = false, refCode }) => (
  <div className={`page-a4 ${!isLast ? 'page-break' : ''} pdf-page relative flex flex-col font-sans antialiased text-slate-800 bg-white shadow-2xl print:shadow-none print:m-0 overflow-hidden`}>
    {/* Cabeçalho Identidade Visual */}
    <div className="bg-[#190c59] px-[15mm] py-6 flex justify-between items-end text-white shrink-0 relative">
      <div className="flex flex-col z-10">
        <span className="text-3xl font-[900] tracking-tighter leading-none">Reque</span>
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] mt-2 text-white/90 whitespace-nowrap">Saúde e Segurança do Trabalho</span>
      </div>
      <div className="text-right flex flex-col z-10">
        <span className="text-[14px] font-extrabold uppercase tracking-tight leading-none mb-1">PROPOSTA TÉCNICA COMERCIAL</span>
        <span className="text-[9px] font-semibold text-white/50 uppercase tracking-widest">REF: {refCode}</span>
      </div>
      <div className="absolute top-0 right-0 w-64 h-full bg-white/5 skew-x-[-20deg] translate-x-32"></div>
    </div>
    <div className="h-[4px] bg-[#ec9d23] w-full shadow-sm shrink-0"></div>

    {/* Área de Conteúdo */}
    <div className="page-content">
      {children}
    </div>
    
    {/* Rodapé */}
    <div className="h-10 px-[15mm] flex items-center justify-between text-[7.5px] text-slate-600 shrink-0 font-bold border-t border-slate-200 bg-slate-100/50 uppercase tracking-widest italic mt-auto">
       <span>Reque SST - Consultoria em Saúde e Segurança do Trabalho</span>
       <span className="font-bold opacity-90 bg-slate-200 px-3 py-1 rounded-full uppercase tracking-tighter not-italic text-slate-800">Página {pageNumber} de {totalPages}</span>
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
  const validadeDate = "15 dias";
  const totalPages = 2;

  const handleDownloadPDF = async () => {
    if (!contentRef.current) return;
    setIsGenerating(true);
    const filename = `Proposta_InCompany_Reque_${companyName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    
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
      alert("Houve um erro técnico ao gerar o PDF.");
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
          break-inside: avoid !important;
          page-break-inside: avoid !important;
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
      `}</style>

      {/* Barra de Ações Fixa */}
      <div className="w-full bg-white/95 backdrop-blur-md border-b border-slate-300 sticky top-0 z-50 no-print px-4 py-3 mb-8 shadow-sm">
        <div className="max-w-[210mm] mx-auto flex flex-wrap justify-between items-center gap-4">
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
          
          {/* PÁGINA 1 */}
          <A4Page pageNumber={1} totalPages={totalPages} refCode="IN COMPANY">
            <div className="bg-slate-100 border border-slate-300 p-6 flex flex-row justify-between items-start mb-4 rounded-lg relative break-inside-avoid w-full shadow-sm">
               <div className="absolute top-0 left-0 w-1.5 h-full bg-[#ec9d23]"></div>
               <div className="flex-1 min-w-0 pr-6 space-y-1.5">
                  <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">CONTRATANTE</span>
                  <h2 className="text-[14px] font-black text-[#190c59] uppercase leading-tight tracking-tight break-words">
                    {companyName || 'NOME DA EMPRESA'}
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
                  <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest">EMISSÃO</div>
                  <div className="text-[14px] font-black text-[#190c59] whitespace-nowrap leading-none mt-1">{currentDate}</div>
                  <div className="text-[9px] text-slate-600 font-bold mt-2 bg-white px-3 py-1 rounded inline-block border border-slate-200 shadow-sm whitespace-nowrap">Validade: {validadeDate}</div>
               </div>
            </div>

            <p className="mb-4 text-slate-700 font-bold text-[9px] leading-relaxed">
              A Reque SST apresenta a proposta de <strong className="text-[#190c59] uppercase tracking-tighter text-[9.5px]">Operacionalização de Exames In Company</strong>. 
              Garantindo eficiência produtiva e conformidade técnica diretamente no ambiente laboral através de nossa unidade móvel e equipe especializada.
            </p>

            <section className="mb-4 break-inside-avoid">
              <h3 className="text-[10px] font-black text-[#190c59] uppercase mb-2.5 tracking-widest flex items-center gap-2 border-b-2 border-slate-100 pb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ec9d23]"></span>
                1. EQUIPE TÉCNICA E DISPONIBILIDADE
              </h3>
              <div className="border border-slate-300 overflow-hidden rounded-lg bg-white shadow-sm">
                <table className="w-full text-left text-[8.5px]">
                  <thead>
                    <tr className="bg-slate-200 font-black text-[#190c59] border-b border-slate-300 uppercase text-[7px] tracking-wider">
                      <th className="py-2 px-4">Profissional Especializado</th>
                      <th className="py-2 px-4 text-center w-20">Qtde</th>
                      <th className="py-2 px-4 text-center w-32">Disponibilidade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {profs.slice(0, 5).map((p, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-100'}>
                        <td className="py-2 px-4 font-bold text-slate-800">{p.type}</td>
                        <td className="py-2 px-4 text-center font-bold text-slate-800">{p.quantity}</td>
                        <td className="py-2 px-4 text-center font-bold text-slate-800">{p.executionHours + p.travelHours}h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mb-4 break-inside-avoid">
              <h3 className="text-[10px] font-black text-[#190c59] uppercase mb-2.5 tracking-widest flex items-center gap-2 border-b-2 border-slate-100 pb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ec9d23]"></span>
                2. CRONOGRAMA DE EXAMES PREVISTO
              </h3>
              <div className="border border-slate-300 overflow-hidden rounded-lg bg-white shadow-sm">
                <table className="w-full text-left text-[8.5px]">
                  <thead>
                    <tr className="bg-slate-200 font-black text-[#190c59] border-b border-slate-300 uppercase text-[7px] tracking-wider">
                      <th className="py-2 px-4">Identificação do Exame</th>
                      <th className="py-2 px-4 text-center w-32">Volume Previsto</th>
                      <th className="py-2 px-4 text-right w-32">Referência</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {exams.slice(0, 8).map((e, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-100'}>
                        <td className="py-2 px-4 font-bold text-slate-800 truncate">{e.name}</td>
                        <td className="py-2 px-4 text-center font-bold text-slate-800">{e.quantity}</td>
                        <td className="py-2 px-4 text-right font-black text-slate-500 italic uppercase text-[6.5px]">Por Demanda</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mb-6 break-inside-avoid">
              <h3 className="text-[10px] font-black text-[#190c59] uppercase mb-2.5 tracking-widest flex items-center gap-2 border-b-2 border-slate-100 pb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ec9d23]"></span>
                3. INVESTIMENTO DA OPERAÇÃO
              </h3>
              <div className="border border-slate-300 overflow-hidden rounded-lg shadow-sm mb-6">
                 <table className="w-full text-[8.5px] text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-200 text-[#190c59] font-black uppercase text-[7px] border-b border-slate-300 tracking-wider">
                         <th className="py-2 px-4 border-r border-slate-300 w-1/3">Composição de Serviços</th>
                         <th className="py-2 px-4">Detalhamento Operacional</th>
                         <th className="py-2 px-4 text-right w-32">Total (R$)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300">
                       <tr className="bg-white">
                          <td className="p-2.5 px-4 font-black text-[#190c59] uppercase bg-slate-100/30 border-r border-slate-300">Logística In Company</td>
                          <td className="p-2.5 px-4 text-slate-600 font-bold italic text-[8.5px]">Unidade Móvel, Equipe Técnica e Deslocamento</td>
                          <td className="p-2.5 px-4 text-right font-black text-[#190c59] text-[10.5px]">{formatCurrency(taxaInCompany)}</td>
                       </tr>
                       <tr className="bg-slate-100">
                          <td className="p-2.5 px-4 font-black text-[#190c59] uppercase bg-slate-100/30 border-r border-slate-300">Exames Ocupacionais</td>
                          <td className="p-2.5 px-4 text-slate-600 font-bold italic text-[8.5px]">Estimativa baseada no volume previsto</td>
                          <td className="p-2.5 px-4 text-right font-black text-[#190c59] text-[10.5px]">{formatCurrency(receitaExames)}</td>
                       </tr>
                    </tbody>
                    <tfoot>
                      <tr className="bg-[#190c59] text-white">
                         <td colSpan={2} className="p-3.5 px-4 font-black uppercase text-[9px] tracking-widest text-right border-r border-white/10">Valor Total Estimado da Operação</td>
                         <td className="p-3.5 px-4 text-right font-black text-[13px]">{formatCurrency(finalValue)}</td>
                      </tr>
                    </tfoot>
                 </table>
              </div>

              {/* QUADRO DE NO SHOW - COM ALTO DESTAQUE E PREVENÇÃO DE QUEBRA */}
              <div className="bg-orange-100/30 border-l-4 border-[#ec9d23] p-4 text-slate-800 shadow-sm rounded-r-lg border border-orange-200 break-inside-avoid">
                <h4 className="font-black uppercase text-[#190c59] text-[9.5px] mb-1.5 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#ec9d23]" />
                  CLÁUSULA DE DISPONIBILIDADE E MANUTENÇÃO DOS VALORES CONTRATADOS
                </h4>
                <p className="text-[8.5px] font-bold leading-relaxed text-slate-700 italic">
                  A reserva de agenda, recursos técnicos, profissionais e estrutura clínica é realizada com base no quantitativo de colaboradores informado no momento da contratação. Os valores constantes nesta proposta permanecerão inalterados, independentemente da ausência total ou parcial de colaboradores para a realização dos exames ocupacionais nas datas agendadas, não sendo aplicável qualquer abatimento, desconto ou compensação financeira em razão de faltas, remarcações ou não comparecimento dos funcionários.
                </p>
              </div>
            </section>
          </A4Page>

          {/* PAGINA 2 */}
          <A4Page pageNumber={2} totalPages={totalPages} isLast={true} refCode="IN COMPANY">
            <section className="mb-6 break-inside-avoid">
              <h3 className="text-[11px] font-black text-[#190c59] uppercase mb-4 tracking-tight flex items-center gap-2 border-b-2 border-slate-200 pb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ec9d23]"></span>
                4. FATURAMENTO E PAGAMENTO
              </h3>
              <div className="space-y-3">
                 <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 shadow-sm">
                    <p className="font-black text-[#190c59] uppercase text-[9px] mb-2 flex items-center gap-2">
                      <Check className="w-3 h-3 text-[#ec9d23]" /> EXAMES E OPERACIONAL
                    </p>
                    <p className="text-slate-800 font-bold text-[9px] leading-relaxed ml-5">
                      Os valores referentes aos exames ocupacionais serão faturados mensalmente via Boleto Bancário, com vencimento para o dia 10 do mês subsequente à prestação dos serviços, sendo a emissão da cobrança realizada pela empresa REQUEMED CLÍNICA DE MEDICINA DO TRABALHO LTDA, inscrita no CNPJ nº 18.545.280/0001-89.
                    </p>
                 </div>
                 <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 shadow-sm">
                    <p className="font-black text-[#190c59] uppercase text-[9px] mb-2 flex items-center gap-2">
                      <Check className="w-3 h-3 text-[#ec9d23]" /> TAXA DE DESLOCAMENTO
                    </p>
                    <p className="text-slate-800 font-bold text-[9px] leading-relaxed ml-5">
                      A taxa fixa de logística e deslocamento (In Company) poderá ser processada de forma independente conforme negociação prévia para viabilização imediata da unidade móvel.
                    </p>
                 </div>
                 <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 shadow-sm">
                    <p className="font-black text-[#190c59] uppercase text-[9px] mb-2 flex items-center gap-2">
                      <Check className="w-3 h-3 text-[#ec9d23]" /> HORAS TÉCNICAS ADICIONAIS – ATENDIMENTO IN COMPANY
                    </p>
                    <p className="text-slate-800 font-bold text-[9px] leading-relaxed ml-5 italic">
                      As atividades de atendimento in company serão realizadas conforme a quantidade de horas previamente acordada entre as partes. Caso, por motivo imputável à contratante, haja necessidade de extrapolação desse período (tais como indisponibilidade de colaboradores, atrasos, reorganização de agenda interna, interrupções operacionais ou qualquer outro fator que impacte o tempo originalmente previsto), as horas excedentes serão consideradas horas técnicas adicionais e serão cobradas à parte, conforme valores vigentes praticados pela contratada.
                    </p>
                 </div>
                 <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 shadow-sm">
                    <p className="font-black text-[#190c59] uppercase text-[9px] mb-2 flex items-center gap-2">
                      <Check className="w-3 h-3 text-[#ec9d23]" />  FATURAMENTO DA TAXA IN COMPANY
                    </p>
                    <p className="text-slate-800 font-bold text-[9px] leading-relaxed ml-5">
                      Os valores referentes à taxa de atendimento in company serão faturados via Boleto Bancário pela empresa M R & CIA LTDA – ME, inscrita no CNPJ nº 47.606.577/0001-05, observando-se as condições comerciais estabelecidas na presente proposta/contrato.
                    </p>
                 </div>
                 <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 shadow-sm">
                    <p className="font-black text-[#190c59] uppercase text-[9px] mb-2 flex items-center gap-2">
                      <Check className="w-3 h-3 text-[#ec9d23]" /> EXAMES ADICIONAIS E AJUSTE DE QUANTITATIVO
                    </p>
                    <p className="text-slate-800 font-bold text-[9px] leading-relaxed ml-5">
                      Na hipótese de inclusão de exames pontuais não previstos originalmente na proposta, ou de acréscimo no quantitativo de colaboradores que ultrapasse a quantidade previamente estabelecida, tais exames adicionais serão cobrados separadamente, integrando o ciclo regular de faturamento, conforme a tabela padrão de exames da Reque vigente à época da realização, sendo lançados juntamente com os demais exames executados no período, sem necessidade de aditivo contratual prévio.
                    </p>
                 </div>
              </div>
            </section>

            <section className="mb-8 break-inside-avoid">
              <h3 className="text-[11px] font-black text-[#190c59] uppercase mb-4 tracking-tight flex items-center gap-2 border-b-2 border-slate-200 pb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ec9d23]"></span>
                5. CONSIDERAÇÕES TÉCNICAS DA OPERAÇÃO
              </h3>
              <div className="bg-slate-100 border border-slate-200 rounded-xl p-5 space-y-3 shadow-sm">
                <div className="flex gap-3 items-start">
                  <span className="text-[#ec9d23] font-black mt-0.5">•</span>
                  <p className="text-slate-700 font-bold text-[9px] leading-relaxed">É necessária a disponibilização de ponto de energia elétrica em 220V, em perfeitas condições de funcionamento, bem como área de estacionamento adequada, plana e nivelada, com espaço suficiente para a instalação e operação segura da unidade móvel, garantindo a viabilidade técnica e operacional dos atendimentos.</p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="text-[#ec9d23] font-black mt-0.5">•</span>
                  <p className="text-slate-700 font-bold text-[9px] leading-relaxed">A contratante deve garantir a liberação dos funcionários nos horários agendados para evitar ociosidade técnica da equipe Reque SST.</p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="text-[#ec9d23] font-black mt-0.5">•</span>
                  <p className="text-slate-700 font-bold text-[9px] leading-relaxed">O Atestado de Saúde Ocupacional (ASO) será disponibilizado por meio do sistema de gestão digital (SOC) após a conclusão e análise dos exames laboratoriais e complementares, bem como após a avaliação médica ocupacional, não sendo disponibilizados os resultados individuais dos exames.</p>
                </div>
              </div>
            </section>

            <div className="mt-auto py-10 flex flex-col items-center opacity-40 grayscale scale-75">
                <span className="text-5xl font-[900] tracking-tighter leading-none text-[#190c59]">Reque</span>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] mt-3 text-[#190c59]">SAÚDE E SEGURANÇA DO TRABALHO</p>
            </div>
          </A4Page>
        </div>
      </div>
    </div>
  );
};
