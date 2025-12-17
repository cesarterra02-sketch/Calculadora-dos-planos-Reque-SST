
import React, { useState, useRef } from 'react';
import { PricingResult, PlanType, FidelityModel, PaymentMethod, BillingCycle, RequeUnit } from '../types';
import { PLAN_SERVICES, UNIT_EXAM_TABLES, SYSTEM_FEATURES, ADDITIONAL_SERVICES } from '../constants';
import { Printer, Download, Loader2, ArrowLeft, CheckSquare } from 'lucide-react';

declare var html2pdf: any;

const A4Page: React.FC<{ 
  children: React.ReactNode; 
  pageNumber: number; 
  totalPages: number; 
  isLast?: boolean;
  plan: string;
}> = ({ children, pageNumber, totalPages, isLast = false, plan }) => (
  <div className={`w-[210mm] min-h-[297mm] mx-auto bg-white shadow-2xl mb-8 relative flex flex-col print:shadow-none print:w-[210mm] print:h-[297mm] print:mb-0 ${!isLast ? 'print:break-after-page' : ''} pdf-page overflow-hidden font-sans`}>
    {/* Cabeçalho Identidade Visual - Fiel ao Screenshot */}
    <div className="bg-[#190c59] px-10 py-6 flex justify-between items-center text-white shrink-0">
      <div className="flex flex-col">
        <span className="text-3xl font-extrabold tracking-tight leading-none">Reque</span>
        <span className="text-[9px] font-medium uppercase tracking-[0.1em] mt-1 opacity-90">SAÚDE E SEGURANÇA DO TRABALHO</span>
      </div>
      <div className="text-right flex flex-col">
        <span className="text-[13px] font-bold uppercase tracking-widest leading-tight">PROPOSTA TÉCNICA COMERCIAL</span>
        <span className="text-[10px] font-light opacity-70 uppercase mt-0.5 tracking-wider">REF: {plan}</span>
      </div>
    </div>
    {/* Faixa Laranja abaixo do azul */}
    <div className="h-[5px] bg-[#ec9d23] w-full"></div>

    <div className="flex-1 px-10 py-8 text-[#444] flex flex-col text-[11px] font-medium leading-[1.6]">
      {children}
    </div>
    
    <div className="h-10 px-10 flex items-center justify-between text-[9px] text-slate-400 shrink-0 font-medium border-t border-slate-50">
       <span className="opacity-70">Reque SST - Proposta Comercial</span>
       <span>Pg {pageNumber} de {totalPages}</span>
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
      html2canvas: { scale: 3, useCORS: true, letterRendering: true }, 
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
    <div className="bg-slate-100 min-h-screen pb-10 print:bg-white print:p-0">
      <div className="max-w-[210mm] mx-auto py-6 flex justify-between no-print px-4">
        <button onClick={onBack} className="px-5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold uppercase flex items-center gap-2 hover:bg-slate-50 transition-all text-slate-600">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <div className="flex gap-3">
          <button onClick={() => window.print()} className="px-5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-slate-50 text-slate-600"><Printer className="w-4 h-4" /> Imprimir</button>
          <button onClick={handleDownloadPDF} disabled={isGenerating} className="px-8 py-2.5 bg-[#190c59] text-white rounded-lg font-bold flex items-center gap-2 text-xs uppercase shadow-lg transition-all disabled:opacity-50">
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} {isGenerating ? 'Gerando...' : 'Baixar PDF'}
          </button>
        </div>
      </div>

      <div ref={contentRef} className="print:m-0">
        {/* PAGINA 1 */}
        <A4Page pageNumber={1} totalPages={totalPages} plan={plan.toUpperCase()}>
          {/* Box de Contratante - Fiel ao Screenshot */}
          <div className="bg-[#f8f9fb] border border-slate-100 p-5 flex justify-between items-start mb-8 rounded-sm">
             <div className="space-y-1">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">CONTRATANTE</span>
                <h2 className="text-[13px] font-extrabold text-[#190c59] uppercase">{companyName || 'NOME DA EMPRESA LTDA'}</h2>
                <div className="text-[10px] text-slate-500">
                   <div>A/C: {contactName || 'Não informado'}</div>
                   <div>CNPJ: {cnpj || '00.000.000/0000-00'}</div>
                </div>
             </div>
             <div className="text-right">
                <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">DATA DE EMISSÃO</div>
                <div className="text-[12px] font-extrabold text-[#190c59]">{currentDate}</div>
                <div className="text-[9px] text-slate-500 mt-1">Validade: {validadeDate}</div>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-x-10">
            {/* 1. ESCOPO */}
            <section>
              <h3 className="text-[12px] font-extrabold text-[#190c59] uppercase mb-3 tracking-tight">1. ESCOPO DE SERVIÇOS</h3>
              <p className="text-slate-500 mb-2">Serviços inclusos no plano <span className="font-bold">{plan}:</span></p>
              <ul className="space-y-1 text-slate-600">
                {PLAN_SERVICES[plan].slice(0, 6).map((s, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-[#ec9d23] text-[14px]">•</span> {s}
                  </li>
                ))}
              </ul>
            </section>

            {/* 2. PRÉ-ELABORAÇÃO */}
            <section>
              <h3 className="text-[12px] font-extrabold text-[#190c59] uppercase mb-3 tracking-tight">2. PRÉ-ELABORAÇÃO</h3>
              <ol className="text-slate-600 space-y-2">
                <li className="flex gap-2">1. <span className="flex-1">Envio obrigatório dos dados cadastrais de todos os funcionários (modelo Reque SST).</span></li>
                <li className="flex gap-2">2. <span className="flex-1">Envio da descrição detalhada das atividades de cada cargo.</span></li>
                <li className="flex gap-2">3. <span className="flex-1">Para PCMSO avulso, envio obrigatório do PGR vigente.</span></li>
              </ol>
            </section>
          </div>

          {/* 3. FUNCIONALIDADES */}
          <section className="mt-8">
            <h3 className="text-[12px] font-extrabold text-[#190c59] uppercase mb-4 tracking-tight">3. FUNCIONALIDADES DO SISTEMA DE GESTÃO</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 border-t border-slate-100 pt-4">
               {SYSTEM_FEATURES.map((feat, idx) => (
                 <div key={idx} className="flex items-center gap-2 text-[9px] text-slate-600 font-medium">
                    <CheckSquare className="w-3 h-3 text-[#190c59]" /> {feat}
                 </div>
               ))}
            </div>
          </section>

          {/* 4. INVESTIMENTO */}
          <section className="mt-8">
            <h3 className="text-[12px] font-extrabold text-[#190c59] uppercase mb-4 tracking-tight">4. INVESTIMENTO E CONDIÇÕES COMERCIAIS</h3>
            <div className="border border-slate-200 overflow-hidden rounded-sm">
               <table className="w-full text-[10px] text-center border-collapse">
                  <thead>
                    <tr className="bg-[#dee4ed] text-[#190c59] font-bold">
                       <th className="py-2 border border-slate-200">Nº Vidas</th>
                       <th className="py-2 border border-slate-200">Plano Selecionado</th>
                    </tr>
                    <tr>
                       <td className="py-2 border border-slate-200 font-bold">{result.rangeLabel}</td>
                       <td className="py-2 border border-slate-200 font-extrabold text-[#190c59]">{plan.toUpperCase()}</td>
                    </tr>
                  </thead>
                  <tbody>
                     <tr>
                        <td className="p-3 border border-slate-200 text-left font-bold bg-[#fcfcfc]">Programas e Laudos</td>
                        <td className="p-0 border border-slate-200" colSpan={1}>
                          <div className="flex w-full h-full divide-x divide-slate-200">
                             <div className="flex-1 p-2 text-left text-slate-400 italic">Elaboração de PGR<br/>Elaboração de PCMSO</div>
                             <div className="w-24 p-2 flex flex-col justify-center items-center">
                                <span className="text-[8px] text-slate-300 line-through">R$ {result.originalProgramFee.toFixed(2)}</span>
                                <span className="text-green-500 font-extrabold text-[11px]">ISENTO*</span>
                             </div>
                             <div className="w-24 p-2 flex items-center justify-center text-slate-400">Serviços pontuais</div>
                          </div>
                        </td>
                     </tr>
                     <tr>
                        <td className="p-3 border border-slate-200 text-left font-bold bg-[#fcfcfc]">ASSINATURA</td>
                        <td className="p-0 border border-slate-200">
                           <div className="flex w-full h-full divide-x divide-slate-200">
                             <div className="flex-1 p-2 text-left text-slate-400 italic">Gestão SST, Eventos eSocial, Risco<br/><span className="text-[8px]">Plano com Fidelidade (Anual Antecipado)</span></div>
                             <div className="w-24 p-2 flex items-center justify-center font-extrabold text-[#190c59] text-[13px]">{formatCurrency(result.monthlyValue)}</div>
                             <div className="w-24 p-2 flex items-center justify-center text-slate-400">Ref. Mensal</div>
                           </div>
                        </td>
                     </tr>
                     <tr>
                        <td className="p-3 border border-slate-200 text-left font-bold bg-[#fcfcfc]">Exames Ocupacionais</td>
                        <td className="p-0 border border-slate-200">
                           <div className="flex w-full h-full divide-x divide-slate-200">
                             <div className="flex-1 p-2 text-left text-slate-400 italic">Por demanda (Clínico, Audiometria, etc)</div>
                             <div className="w-24 p-2 flex items-center justify-center text-slate-400 italic">Tabela Anexa (Pg. 3)</div>
                             <div className="w-24 p-2 flex items-center justify-center text-slate-400">Por demanda</div>
                           </div>
                        </td>
                     </tr>
                  </tbody>
               </table>
            </div>
            
            <div className="mt-4 flex flex-col items-end">
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">VALOR TOTAL INICIAL (A PAGAR NO ACEITE)</span>
               <div className="text-3xl font-extrabold text-[#190c59] tracking-tighter mt-1">{formatCurrency(result.initialPaymentAmount)}</div>
               <p className="text-[8px] text-slate-400 italic">Ref. 12 meses de assinatura antecipada</p>
            </div>
          </section>

          {/* 5. PRAZOS - Detalhados conforme pedido */}
          <section className="mt-8">
             <h3 className="text-[12px] font-extrabold text-[#190c59] uppercase mb-4 tracking-tight">5. PRAZOS E CONSIDERAÇÕES IMPORTANTES</h3>
             <div className="space-y-2.5 text-[9.5px] leading-relaxed">
                <div className="bg-[#eff5ff] border-l-[3px] border-[#190c59] p-3 text-slate-700">
                   <strong>a. Prazo de elaboração:</strong> Considerando a entrega das descrições de atividade detalhada dos cargos pelo cliente (Modelo 1) em <strong>{currentDate}</strong> e o prazo combinado para entrega dos documentos (PGR/PCMSO) em <strong>10/01/2026</strong>, o prazo de elaboração será de <strong>19 dias úteis.</strong>
                </div>
                <p><strong>b.</strong> Para exames admissionais os dados cadastrais dos novos colaboradores deverão ser inseridos pelo responsável da contratante diretamente no sistema de gestão de SST da Reque SST. Após assinatura do contrato, o responsável receberá os dados de acesso do sistema;</p>
                <p><strong>c.</strong> Nossos programas e ASOs são emitidos de forma digital, e ficam disponíveis e organizados em nosso sistema;</p>
                <p><strong>d.</strong> Será cobrado "No Show" no valor de uma consulta clínica, no caso de não comparecimento no dia do agendamento, inclui-se também no atendimento in company;</p>
                <p><strong>e.</strong> Casos de funcionários desligados sem realização do exame demissional devem ser informados ao setor de atendimento da Reque SST por Whatsapp ou e-mail para evitar cobranças de vidas ativas (quando aplicável);</p>
                <p><strong>h.</strong> Caso a CONTRATANTE solicite versão impressa, o custo da impressão será cobrado à parte;</p>
                <p><strong>i.</strong> No caso da contratação de LTCAT ou Laudo de Insalubridade e/ou Periculosidade, havendo necessidade de avaliação quantitativa de algum risco, o prazo de entrega dos laudos será de até 30 (trinta) dias corridos contados da data de realização das avaliações.</p>
             </div>
          </section>
        </A4Page>

        {/* PAGINA 2 */}
        <A4Page pageNumber={2} totalPages={totalPages} plan={plan.toUpperCase()}>
          <div className="space-y-8">
            <section>
              <h3 className="text-[12px] font-extrabold text-[#190c59] uppercase mb-4 tracking-tight">6. FATURAMENTO E FORMA DE PAGAMENTO</h3>
              <div className="space-y-4">
                 <div>
                    <p className="font-bold text-[#190c59]">a) Plano {plan}</p>
                    <p className="text-slate-500 mt-1">Cobrança exclusivamente via <strong>Cartão de Crédito</strong>.</p>
                    <p className="text-slate-500">Cobrança Anual Antecipada (Total de 2 cobranças anuais no prazo de 24 meses).</p>
                 </div>
                 <div>
                    <p className="font-bold text-[#190c59]">b) Exames Complementares</p>
                    <p className="text-slate-500 mt-1">Os exames serão cobrados por demanda e baseado nos valores apresentados na tabela anexa. Faturamento via Boleto Bancário (vencimento dia 10).</p>
                 </div>
              </div>
            </section>

            <section>
              <h3 className="text-[12px] font-extrabold text-[#190c59] uppercase mb-4 tracking-tight">7. REAJUSTE DE VALORES</h3>
              <p className="text-slate-500">Reajuste anual (cada 12 meses) com base na variação acumulada do IPCA (IBGE).</p>
            </section>

            <section>
              <h3 className="text-[12px] font-extrabold text-[#190c59] uppercase mb-4 tracking-tight">8. VIGÊNCIA E RESCISÃO CONTRATUAL</h3>
              <div className="bg-[#fff9f0] border-l-[3px] border-[#ec9d23] p-4 text-slate-700">
                 <p><strong>Vigência:</strong> O contrato terá vigência de 12 (doze) meses a partir da data de assinatura.</p>
                 <p className="mt-3 font-bold uppercase text-[#190c59]">CANCELAMENTO ANTECIPADO (CLÁUSULA DE FIDELIDADE):</p>
                 <p className="mt-1">A modalidade SST Express Fidelidade exige fidelidade mínima de 24 (vinte e quatro) meses. <strong>Em caso de cancelamento antecipado (rescisão antes do prazo contratual), será cobrado o valor integral do desconto concedido (isenção dos programas), conforme previsto na proposta comercial aceita.</strong></p>
              </div>
            </section>

            <section>
              <h3 className="text-[12px] font-extrabold text-[#190c59] uppercase mb-4 tracking-tight">9. SERVIÇOS ADICIONAIS</h3>
              <div className="space-y-1.5 text-slate-500">
                <p>Valores sob demanda:</p>
                <p>• Emissão de PPP (Extemporâneo): R$ 250,00</p>
                <p>• Visita Técnica: R$ 100,00/h + deslocamento (Obrigatória para Risco {'>'} 1)</p>
              </div>
            </section>
          </div>
        </A4Page>

        {/* PAGINA 3 - EXAMES */}
        <A4Page pageNumber={3} totalPages={totalPages} isLast={true} plan={plan.toUpperCase()}>
           <div className="text-center mb-8">
              <h2 className="text-[15px] font-extrabold text-[#190c59] uppercase tracking-[0.2em] border-b-2 border-[#ec9d23] inline-block pb-1">ANEXO - TABELA DE VALORES</h2>
              <p className="text-[10px] text-slate-400 mt-3 font-bold uppercase tracking-widest">{selectedUnit.replace('Unidade Reque ', '')}</p>
              <p className="text-[9px] text-slate-300 italic">Valores referenciais para a unidade selecionada.</p>
           </div>

           <div className="border border-slate-200 overflow-hidden rounded-sm">
              <table className="w-full text-[10px] text-left border-collapse">
                 <thead>
                    <tr className="bg-[#190c59] text-white font-bold uppercase text-[9px]">
                       <th className="py-2.5 px-4 border border-[#190c59]">TIPO DE EXAME</th>
                       <th className="py-2.5 px-4 border border-[#190c59]">NOME DO EXAME</th>
                       <th className="py-2.5 px-4 border border-[#190c59] text-center">VALOR (R$)</th>
                       <th className="py-2.5 px-4 border border-[#190c59] text-center">PRAZO</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {UNIT_EXAM_TABLES[selectedUnit].map((exam, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}>
                         <td className="py-2 px-4 font-bold text-[#190c59]">{exam.category}</td>
                         <td className="py-2 px-4">{exam.name}</td>
                         <td className="py-2 px-4 text-center font-extrabold text-[#1a067c]">{formatCurrency(exam.price)}</td>
                         <td className="py-2 px-4 text-center text-slate-400 italic text-[9px]">{exam.deadline}</td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </A4Page>
      </div>
    </div>
  );
};
