
import React, { useState, useRef } from 'react';
import { PricingResult, PlanType, FidelityModel, PaymentMethod, BillingCycle, RequeUnit } from '../types';
import { PLAN_SERVICES, UNIT_EXAM_TABLES, SYSTEM_FEATURES, ADDITIONAL_SERVICES } from '../constants';
import { Printer, Download, Loader2, ArrowLeft, Check, Info, AlertTriangle } from 'lucide-react';

declare var html2pdf: any;

const A4Page: React.FC<{ 
  children: React.ReactNode; 
  pageNumber: number; 
  totalPages: number; 
  isLast?: boolean;
  plan: string;
}> = ({ children, pageNumber, totalPages, isLast = false, plan }) => (
  <div className={`w-[210mm] min-h-[297mm] mx-auto bg-white shadow-2xl mb-8 relative flex flex-col print:shadow-none print:w-[210mm] print:h-[297mm] print:mb-0 ${!isLast ? 'print:break-after-page' : ''} pdf-page overflow-hidden font-sans antialiased text-slate-800`}>
    {/* Cabeçalho Identidade Visual - Versão Premium */}
    <div className="bg-[#190c59] px-12 py-8 flex justify-between items-end text-white shrink-0 relative">
      <div className="flex flex-col z-10">
        <span className="text-4xl font-[900] tracking-tighter leading-none">Reque</span>
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] mt-2 text-white/90">SAÚDE E SEGURANÇA DO TRABALHO</span>
      </div>
      <div className="text-right flex flex-col z-10">
        <span className="text-[18px] font-extrabold uppercase tracking-tight leading-none mb-1">PROPOSTA TÉCNICA COMERCIAL</span>
        <span className="text-[11px] font-semibold text-reque-orange uppercase tracking-widest">REF: {plan}</span>
      </div>
      {/* Detalhe sutil de fundo */}
      <div className="absolute top-0 right-0 w-64 h-full bg-white/5 skew-x-[-20deg] translate-x-32"></div>
    </div>
    {/* Faixa Laranja Divisora */}
    <div className="h-[5px] bg-[#ec9d23] w-full shadow-sm"></div>

    <div className="flex-1 px-12 py-10 flex flex-col text-[11px] font-medium leading-relaxed">
      {children}
    </div>
    
    <div className="h-12 px-12 flex items-center justify-between text-[9px] text-slate-400 shrink-0 font-semibold border-t border-slate-50 bg-slate-50/30">
       <span className="uppercase tracking-widest italic opacity-60">Reque SST - Proposta Comercial</span>
       <span className="font-bold bg-slate-100 px-3 py-1 rounded-full">Pg {pageNumber} de {totalPages}</span>
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
  const docDateFmt = result.docDeliveryDate ? formatDate(result.docDeliveryDate) : 'prazo combinado';

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
      image: { type: 'jpeg', quality: 1.0 }, 
      html2canvas: { scale: 3, useCORS: true, letterRendering: true, backgroundColor: '#ffffff' }, 
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } 
    };
    try { 
      await html2pdf().set(opt).from(contentRef.current).save(); 
    } catch (e) {
      alert("Erro ao gerar PDF. Tente imprimir.");
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
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} {isGenerating ? 'Processando...' : 'Exportar PDF Oficial'}
          </button>
        </div>
      </div>

      <div ref={contentRef} className="print:m-0">
        {/* PAGINA 1 */}
        <A4Page pageNumber={1} totalPages={totalPages} plan={plan.toUpperCase()}>
          {/* Card Contratante */}
          <div className="bg-white border border-slate-200/60 p-7 flex justify-between items-start mb-8 rounded-xl shadow-sm relative overflow-hidden">
             <div className="absolute top-0 left-0 w-1 h-full bg-reque-orange"></div>
             <div className="space-y-1.5">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">CONTRATANTE</span>
                <h2 className="text-[16px] font-black text-[#190c59] uppercase leading-tight tracking-tight">{companyName || 'NOME DA EMPRESA LTDA'}</h2>
                <div className="text-[11px] text-slate-600 font-semibold space-y-0.5">
                   <div className="flex gap-1.5"><span className="text-slate-400">A/C:</span> {contactName || 'Responsável não definido'}</div>
                   <div className="flex gap-1.5"><span className="text-slate-400">CNPJ:</span> {cnpj || '00.000.000/0000-00'}</div>
                </div>
             </div>
             <div className="text-right space-y-1">
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">DATA DE EMISSÃO</div>
                <div className="text-[16px] font-black text-[#190c59]">{currentDate}</div>
                <div className="text-[10px] text-slate-500 font-bold bg-slate-100 px-3 py-1 rounded-full inline-block mt-1">Validade: {validadeDate}</div>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-x-12 mb-10">
            {/* 1. ESCOPO */}
            <section>
              <h3 className="text-[13px] font-black text-[#190c59] uppercase mb-4 tracking-tight flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-reque-orange"></span>
                1. ESCOPO DE SERVIÇOS
              </h3>
              <p className="text-slate-500 mb-4 font-bold text-[10px]">Serviços inclusos no plano <span className="text-[#190c59] underline decoration-reque-orange decoration-2 underline-offset-4">{plan}:</span></p>
              <ul className="space-y-2.5 text-slate-600 font-bold text-[10.5px]">
                {PLAN_SERVICES[plan].slice(0, 5).map((s, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-reque-orange/40 shrink-0"></div> 
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* 2. PRÉ-ELABORAÇÃO */}
            <section>
              <h3 className="text-[13px] font-black text-[#190c59] uppercase mb-4 tracking-tight flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-reque-orange"></span>
                2. PRÉ-ELABORAÇÃO
              </h3>
              <ol className="text-slate-600 space-y-3.5 font-bold text-[10px] leading-snug">
                <li className="flex gap-3">
                   <span className="bg-[#190c59] text-white w-5 h-5 rounded-full flex items-center justify-center text-[9px] shrink-0">1</span> 
                   <span>Envio obrigatório dos dados cadastrais de todos os funcionários (modelo Reque SST).</span>
                </li>
                <li className="flex gap-3">
                   <span className="bg-[#190c59] text-white w-5 h-5 rounded-full flex items-center justify-center text-[9px] shrink-0">2</span> 
                   <span>Envio da descrição detalhada das atividades de cada cargo.</span>
                </li>
                <li className="flex gap-3">
                   <span className="bg-[#190c59] text-white w-5 h-5 rounded-full flex items-center justify-center text-[9px] shrink-0">3</span> 
                   <span>Para PCMSO avulso, envio obrigatório do PGR vigente.</span>
                </li>
              </ol>
            </section>
          </div>

          {/* 3. FUNCIONALIDADES */}
          <section className="mb-10 border-t border-slate-100 pt-8">
            <h3 className="text-[13px] font-black text-[#190c59] uppercase mb-6 tracking-tight flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-reque-orange"></span>
              3. FUNCIONALIDADES DO SISTEMA DE GESTÃO
            </h3>
            <div className="grid grid-cols-2 gap-x-12 gap-y-3">
               {SYSTEM_FEATURES.map((feat, idx) => (
                 <div key={idx} className="flex items-center gap-3 text-[10px] text-slate-600 font-bold">
                    <div className="w-4 h-4 border-[1.5px] border-reque-navy rounded flex items-center justify-center bg-slate-50">
                       <Check className="w-3 h-3 text-[#190c59] stroke-[4]" />
                    </div>
                    {feat}
                 </div>
               ))}
            </div>
          </section>

          {/* 4. INVESTIMENTO */}
          <section className="mb-8">
            <h3 className="text-[13px] font-black text-[#190c59] uppercase mb-5 tracking-tight flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-reque-orange"></span>
              4. INVESTIMENTO E CONDIÇÕES COMERCIAIS
            </h3>
            <div className="border border-slate-200 overflow-hidden rounded-xl shadow-sm bg-white">
               <table className="w-full text-[10px] text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 text-[#190c59] font-black uppercase text-[9px] tracking-wider border-b border-slate-200">
                       <th className="py-3 px-6 border-r border-slate-200 w-1/4 text-center">Nº Vidas</th>
                       <th className="py-3 px-6 text-center" colSpan={3}>Plano Selecionado</th>
                    </tr>
                    <tr className="bg-white border-b border-slate-200">
                       <td className="py-4 px-6 border-r border-slate-200 text-center font-black text-[#190c59] text-[13px]">{result.rangeLabel}</td>
                       <td className="py-4 px-6 text-center font-black text-reque-blue text-[13px]" colSpan={3}>{plan.toUpperCase()}</td>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                     <tr className="bg-white">
                        <td className="p-4 px-6 font-black text-[#190c59] uppercase tracking-tighter bg-slate-50/50 border-r border-slate-200">Programas e Laudos</td>
                        <td className="p-4 px-6 text-slate-500 font-semibold italic text-[9.5px] leading-relaxed">Elaboração de PGR<br/>Elaboração de PCMSO</td>
                        <td className="p-4 px-6 text-center bg-slate-50/20">
                           <div className="flex flex-col items-center">
                              <span className="text-[8.5px] text-slate-300 line-through font-bold">R$ {result.originalProgramFee.toFixed(2)}</span>
                              <span className="text-green-600 font-black text-[13px] tracking-tighter">ISENTO*</span>
                           </div>
                        </td>
                        <td className="p-4 px-6 text-center text-slate-400 font-bold uppercase text-[8px] italic">Serviços pontuais</td>
                     </tr>
                     <tr className="bg-white">
                        <td className="p-4 px-6 font-black text-[#190c59] uppercase tracking-tighter bg-slate-50/50 border-r border-slate-200">ASSINATURA</td>
                        <td className="p-4 px-6 text-slate-500 font-semibold italic text-[9.5px] leading-relaxed">Gestão SST, Eventos eSocial, Risco<br/><span className="text-reque-orange font-black text-[8px] uppercase">{fidelity}</span></td>
                        <td className="p-4 px-6 text-center font-black text-[#190c59] text-[16px]">{formatCurrency(result.monthlyValue)}</td>
                        <td className="p-4 px-6 text-center text-slate-400 font-bold uppercase text-[8px] italic">Ref. Mensal</td>
                     </tr>
                     <tr className="bg-white">
                        <td className="p-4 px-6 font-black text-[#190c59] uppercase tracking-tighter bg-slate-50/50 border-r border-slate-200">Exames Ocupacionais</td>
                        <td className="p-4 px-6 text-slate-500 font-semibold italic text-[9.5px]">Por demanda (Clínico, Audiometria, etc)</td>
                        <td className="p-4 px-6 text-center font-bold text-slate-500 text-[10px] italic">Tabela Anexa (Pg. 3)</td>
                        <td className="p-4 px-6 text-center text-slate-400 font-bold uppercase text-[8px] italic">Por demanda</td>
                     </tr>
                  </tbody>
               </table>
            </div>
            
            <div className="mt-6 flex flex-col items-end">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">VALOR TOTAL INICIAL (A PAGAR NO ACEITE)</span>
               <div className="text-4xl font-black text-[#190c59] tracking-tighter">{formatCurrency(result.initialPaymentAmount)}</div>
               <p className="text-[9px] text-slate-400 font-bold italic mt-1">Ref. {result.billingCycle === BillingCycle.ANNUAL ? '12 meses de assinatura antecipada' : 'Primeira mensalidade + Elaboração'}</p>
            </div>
          </section>

          {/* 5. PRAZOS - Utilizando datas dinâmicas */}
          <section className="mt-4 border-t border-slate-100 pt-8">
            <h3 className="text-[13px] font-black text-[#190c59] uppercase mb-4 tracking-tight flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-reque-orange"></span>
              5. PRAZOS E CONSIDERAÇÕES IMPORTANTES
            </h3>
            <div className="space-y-3.5 text-slate-600 font-semibold text-[9.5px] leading-[1.6]">
              <div className="bg-slate-50/80 p-4 rounded-xl border-l-[3.5px] border-reque-navy">
                <p><strong>a. Prazo de elaboração:</strong> Considerando a entrega das descrições de atividade detalhada dos cargos pelo cliente (Modelo 1) em <strong>{clientDateFmt}</strong> e o prazo combinado para entrega dos documentos (PGR/PCMSO) em <strong>{docDateFmt}</strong>, o prazo de elaboração será de <strong>{result.businessDays} dias úteis.</strong></p>
              </div>
              <p><strong>b.</strong> Para exames admissionais os dados cadastrais dos novos colaboradores deverão ser inseridos pelo responsável da contratante diretamente no sistema de gestão de SST da Reque SST. Após assinatura do contrato, o responsável receberá os dados de acesso do sistema;</p>
              <p><strong>c.</strong> Nossos programas e ASOs são emitidos de forma digital, e ficam disponíveis e organizados em nosso sistema;</p>
              <p><strong>d.</strong> Será cobrado "No Show" no valor de uma consulta clínica, no caso de não comparecimento no dia do agendamento, inclui-se também no atendimento in company;</p>
              <p><strong>e.</strong> Casos de funcionários desligados sem realização do exame demissional devem ser informados ao setor de atendimento da Reque SST por Whatsapp ou e-mail para evitar cobranças de vidas ativas (quando aplicável).</p>
            </div>
          </section>
        </A4Page>

        {/* PAGINAS 2 E 3 OMITIDAS PARA CONCISÃO, SEM MUDANÇAS */}
        <A4Page pageNumber={2} totalPages={totalPages} plan={plan.toUpperCase()}>
          <div className="space-y-10">
            {/* 6. FATURAMENTO */}
            <section>
              <h3 className="text-[13px] font-black text-[#190c59] uppercase mb-5 tracking-tight border-b border-slate-100 pb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-reque-orange"></span>
                6. FATURAMENTO E FORMA DE PAGAMENTO
              </h3>
              <div className="space-y-4">
                 <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-reque-orange/40"></div>
                    <p className="font-black text-[#190c59] uppercase text-xs mb-2">a) Plano {plan}</p>
                    <div className="space-y-1 text-slate-600 font-bold text-[10.5px]">
                      <p>Cobrança exclusivamente via <strong className="text-reque-navy font-black">Cartão de Crédito</strong>.</p>
                      <p>Cobrança Anual Antecipada (Total de 2 cobranças anuais no prazo de 24 meses).</p>
                    </div>
                 </div>
                 <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-reque-navy/20"></div>
                    <p className="font-black text-[#190c59] uppercase text-xs mb-2">b) Exames Complementares</p>
                    <p className="text-slate-600 font-bold text-[10.5px] leading-relaxed">Os exames serão cobrados por demanda e baseado nos valores apresentados na tabela anexa. Faturamento via Boleto Bancário (vencimento dia 10).</p>
                 </div>
              </div>
            </section>
            <section>
              <h3 className="text-[13px] font-black text-[#190c59] uppercase mb-5 tracking-tight border-b border-slate-100 pb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-reque-orange"></span>
                7. REAJUSTE DE VALORES
              </h3>
              <p className="text-slate-600 font-bold text-[10.5px] leading-relaxed px-5">Reajuste anual (cada 12 meses) com base na variação acumulada do IPCA (IBGE).</p>
            </section>
            <section>
              <h3 className="text-[13px] font-black text-[#190c59] uppercase mb-5 tracking-tight border-b border-slate-100 pb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-reque-orange"></span>
                8. VIGÊNCIA E RESCISÃO CONTRATUAL
              </h3>
              <div className="bg-[#fffcf7] border-l-[4px] border-[#ec9d23] p-7 text-slate-700 shadow-sm rounded-r-2xl border border-slate-200/60">
                 <p className="font-bold text-[11px] mb-4"><strong>Vigência:</strong> O contrato terá vigência de 12 (doze) meses a partir da data de assinatura.</p>
                 <div className="bg-white p-4 rounded-xl border border-slate-200/40">
                    <p className="font-black uppercase text-[#190c59] text-[10.5px] mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-reque-orange" />
                      CANCELAMENTO ANTECIPADO (CLÁUSULA DE FIDELIDADE):
                    </p>
                    <p className="text-[10.5px] font-semibold leading-relaxed text-slate-600">A modalidade {plan} Fidelidade exige fidelidade mínima de 24 (vinte e quatro) meses. <strong className="text-reque-navy">Em caso de cancelamento antecipado (rescisão antes do prazo contratual), será cobrado o valor integral do desconto concedido (isenção dos programas), conforme previsto na proposta comercial aceita.</strong></p>
                 </div>
              </div>
            </section>
            <section>
              <h3 className="text-[13px] font-black text-[#190c59] uppercase mb-5 tracking-tight border-b border-slate-100 pb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-reque-orange"></span>
                9. SERVIÇOS ADICIONAIS
              </h3>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-4">Valores sob demanda:</p>
              <ul className="space-y-3 text-slate-600 font-bold text-[10.5px] px-5">
                {ADDITIONAL_SERVICES.map((serv, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <span className="text-reque-orange font-black">•</span>
                    <span>{serv.item}: <strong className="text-reque-navy">{formatCurrency(serv.value)}</strong></span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </A4Page>
        <A4Page pageNumber={3} totalPages={totalPages} isLast={true} plan={plan.toUpperCase()}>
           <div className="text-center mb-10 pt-4">
              <div className="inline-flex items-center gap-4 mb-2">
                 <div className="h-[2px] w-8 bg-reque-orange opacity-40"></div>
                 <h2 className="text-[18px] font-black text-[#190c59] uppercase tracking-[0.15em] leading-none">TABELA DE EXAMES - {selectedUnit.replace('Unidade Reque ', '').toUpperCase()}</h2>
                 <div className="h-[2px] w-8 bg-reque-orange opacity-40"></div>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Valores referenciais para a unidade selecionada.</p>
           </div>
           <div className="border border-slate-200 overflow-hidden rounded-2xl shadow-lg bg-white">
              <table className="w-full text-[10.5px] text-left border-collapse">
                 <thead>
                    <tr className="bg-[#190c59] text-white font-black uppercase text-[9.5px] tracking-widest">
                       <th className="py-5 px-7 border-r border-[#ffffff10]">TIPO DE EXAME</th>
                       <th className="py-5 px-7 border-r border-[#ffffff10]">NOME DO EXAME</th>
                       <th className="py-5 px-7 border-r border-[#ffffff10] text-center">VALOR (R$)</th>
                       <th className="py-5 px-7 text-center">PRAZO</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {UNIT_EXAM_TABLES[selectedUnit].map((exam, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-[#fcfdfe] hover:bg-slate-50'}>
                         <td className="py-4 px-7 font-black text-[#190c59] text-[9px] uppercase tracking-tight">{exam.category}</td>
                         <td className="py-4 px-7 font-bold text-slate-700">{exam.name}</td>
                         <td className="py-4 px-7 text-center font-black text-[#190c59] text-[12px]">{formatCurrency(exam.price)}</td>
                         <td className="py-4 px-7 text-center text-slate-400 font-bold uppercase text-[8.5px] italic tracking-tight">{exam.deadline}</td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
           <div className="mt-12 p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-300 flex items-start gap-4">
              <Info className="w-6 h-6 text-reque-orange shrink-0 mt-1" />
              <p className="text-[10px] text-slate-500 font-bold italic leading-relaxed">
                * Esta tabela é parte integrante da Proposta Técnica Comercial e seus valores podem sofrer alterações sem aviso prévio.
              </p>
           </div>
        </A4Page>
      </div>
    </div>
  );
};
