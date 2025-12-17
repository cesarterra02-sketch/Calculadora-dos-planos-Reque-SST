
import React, { useEffect, useState, useRef } from 'react';
import { PricingResult, PlanType, FidelityModel, PaymentMethod, BillingCycle, RequeUnit, RiskLevel } from '../types';
import { PLAN_SERVICES, UNIT_EXAM_TABLES } from '../constants';
import { FileText, Printer, CheckSquare, Square, AlertTriangle, Download, Loader2 } from 'lucide-react';

// Declare html2pdf for TypeScript
declare var html2pdf: any;

interface ProposalViewProps {
  result: PricingResult;
  plan: PlanType;
  fidelity: FidelityModel;
  employees: number;
  companyName: string;
  contactName: string;
  cnpj: string;
  selectedUnit: RequeUnit;
  onBack: () => void;
}

const A4Page: React.FC<{ 
  children: React.ReactNode; 
  pageNumber: number; 
  totalPages: number; 
  planRef: string; 
  title?: string;
  isLast?: boolean;
}> = ({ 
  children, 
  pageNumber, 
  totalPages,
  planRef,
  title = "Proposta Técnica Comercial",
  isLast = false
}) => (
  <div className={`w-[210mm] min-h-[297mm] mx-auto bg-white shadow-2xl mb-8 relative flex flex-col print:shadow-none print:w-full print:mb-0 ${!isLast ? 'print:break-after-page' : ''} pdf-page`}>
    {/* Header - Repeated on every page */}
    <div className="h-24 bg-reque-navy flex items-center justify-between px-12 border-b-4 border-reque-orange print:h-24 print:bg-reque-navy print:print-color-adjust-exact pdf-header">
       <div className="flex flex-col leading-none text-white">
          <span className="font-extrabold text-3xl tracking-tight">Reque</span>
          <span className="text-[0.55rem] font-medium tracking-wide uppercase opacity-80 mt-1">
            Saúde e Segurança do Trabalho
          </span>
       </div>
       
       <div className="text-right text-white">
         <h1 className="text-sm font-bold uppercase tracking-wider">{title}</h1>
         <p className="text-[10px] opacity-80 mt-0.5 font-light">REF: {planRef}</p>
       </div>
    </div>

    {/* Content */}
    <div className="flex-1 px-12 py-10 text-slate-800 font-sans flex flex-col">
      {children}
    </div>

    {/* Footer */}
    <div className="h-12 border-t border-slate-200 mx-12 flex items-center justify-between text-[9px] text-slate-400">
       <span>Reque SST - Proposta Comercial</span>
       <span>Pg {pageNumber} de {totalPages}</span>
    </div>
  </div>
);

export const ProposalView: React.FC<ProposalViewProps> = ({ 
  result, 
  plan, 
  fidelity, 
  employees,
  companyName,
  contactName,
  cnpj,
  selectedUnit,
  onBack 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '...';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const currentDate = new Date().toLocaleDateString('pt-BR');
  
  const selectedExams = UNIT_EXAM_TABLES[selectedUnit] || [];

  // --- Dynamic Title for PDF Filename ---
  useEffect(() => {
    const originalTitle = document.title;
    const cleanCompany = companyName ? companyName.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_') : 'Cliente';
    document.title = `Proposta_Reque_${cleanCompany}`;
    
    return () => {
      document.title = originalTitle;
    };
  }, [companyName]);

  const handleDownloadPDF = async () => {
    if (!contentRef.current) return;
    setIsGenerating(true);

    const cleanCompany = companyName ? companyName.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_') : 'Cliente';
    const filename = `Proposta_Reque_${cleanCompany}.pdf`;

    // Add a class to handle specific styles during generation (remove shadows, etc)
    contentRef.current.classList.add('generating-pdf');

    const opt = {
      margin: 0,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      // Small delay to allow DOM to update class
      await new Promise(resolve => setTimeout(resolve, 100));
      await html2pdf().set(opt).from(contentRef.current).save();
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Erro ao gerar PDF. Tente usar a opção de Imprimir (Ctrl+P).');
    } finally {
      if (contentRef.current) {
        contentRef.current.classList.remove('generating-pdf');
      }
      setIsGenerating(false);
    }
  };

  // --- CONTENT HELPERS ---

  const renderChecklist = () => {
    const items = [
      "Agendamento On-line dos exames",
      "Relatório de exames realizados por funcionário",
      "Relação de riscos e exames por cargo",
      "Gestão de EPI",
      "Relatório de funcionários ativos",
      "Geração de registros e mensageria do eSocial",
      "Cadastro de novos funcionários",
      "Gestão de Treinamentos",
      "Emissão de PPP",
      "Relatório de exames realizados",
      "Informação dos exames agendados por e-mail e sms",
      "Controle e emissão de Ordens de Serviço",
      "Gestão de convocação de exames periódicos",
      "Registro e controle estatístico de ocorrências"
    ];

    return (
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-3">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-start gap-2 text-[10px] text-slate-700 leading-tight">
            <CheckSquare className="w-3 h-3 text-reque-blue shrink-0 mt-0.5" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-slate-100 min-h-screen pb-10 font-sans print:bg-white print:pb-0 printable-area">
      {/* Styles for PDF Generation */}
      <style>{`
        /* CSS for window.print() */
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            background-color: white;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden;
          }
          .printable-area, .printable-area * {
            visibility: visible;
          }
          .printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm;
            min-height: 100vh;
            margin: 0 auto;
            background-color: white;
            z-index: 9999;
          }
          .no-print {
            display: none !important;
          }
          .print\\:bg-reque-navy {
            background-color: #190c59 !important;
          }
        }

        /* Styles specifically for html2pdf generation */
        .generating-pdf .pdf-page {
          box-shadow: none !important;
          margin-bottom: 0 !important;
        }
        .generating-pdf .pdf-header {
           background-color: #190c59 !important;
           -webkit-print-color-adjust: exact; 
        }
      `}</style>

      {/* Toolbar (Hidden in Print) */}
      <div className="max-w-[210mm] mx-auto py-6 flex justify-between items-center no-print">
        <button 
          onClick={onBack}
          disabled={isGenerating}
          className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded shadow-sm hover:bg-slate-50 transition-colors text-xs uppercase tracking-wide disabled:opacity-50"
        >
          &larr; Voltar
        </button>
        <div className="flex gap-3">
          <button 
            onClick={() => window.print()}
            disabled={isGenerating}
            className="px-4 py-2 bg-white border border-slate-300 text-reque-navy font-bold rounded shadow-sm hover:bg-slate-50 transition-colors flex items-center gap-2 text-xs uppercase tracking-wide disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </button>
          <button 
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            className="px-6 py-2 bg-reque-navy text-white font-bold rounded shadow-md hover:bg-reque-blue transition-colors flex items-center gap-2 text-xs uppercase tracking-wide disabled:cursor-not-allowed min-w-[140px] justify-center"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Baixar PDF
              </>
            )}
          </button>
        </div>
      </div>

      {/* WRAPPER FOR HTML2PDF CAPTURE */}
      <div ref={contentRef}>
        
        {/* --- PAGE 1: SCOPE, PRE-REQS, CHECKLIST, PRICING & PRAZOS --- */}
        <A4Page pageNumber={1} totalPages={3} planRef={plan.toUpperCase()}>
          
          {/* Client Info Block */}
          <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded grid grid-cols-2 gap-6">
            <div>
              <span className="block text-[9px] font-bold uppercase text-slate-400">Contratante</span>
              <span className="block text-sm font-bold text-reque-navy">
                {companyName || 'EMPRESA CLIENTE'}
              </span>
               <span className="block text-[10px] text-slate-700 font-medium mt-0.5">
                 A/C: {contactName || 'Responsável'}
               </span>
              <span className="block text-[10px] text-slate-600 mt-0.5">
                CNPJ: {cnpj || '00.000.000/0001-00'}
              </span>
            </div>
            <div className="text-right">
               <span className="block text-[9px] font-bold uppercase text-slate-400">Data de Emissão</span>
               <span className="block text-sm font-bold text-reque-navy">{currentDate}</span>
               <span className="block text-[10px] text-slate-600 mt-0.5">Validade: 10 dias</span>
            </div>
          </div>

          {/* 2-Column Grid for Scope & Pre-reqs */}
          <div className="grid grid-cols-2 gap-8 mb-6">
            {/* 1. ESCOPO */}
            <section>
              <h3 className="text-sm font-bold text-reque-navy uppercase border-b-2 border-reque-orange/30 pb-1 mb-3">
                1. Escopo de Serviços
              </h3>
              <p className="text-[10px] text-slate-600 mb-2">
                Serviços inclusos no plano <strong>{plan}</strong>:
              </p>
              <ul className="space-y-1.5">
                {PLAN_SERVICES[plan].map((service, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-[10px] text-slate-700 leading-tight">
                    <div className="mt-1 w-1 h-1 bg-reque-orange rounded-full shrink-0"></div>
                    {service}
                  </li>
                ))}
              </ul>
            </section>

            {/* 2. FASE PRÉ-ELABORAÇÃO */}
            <section>
              <h3 className="text-sm font-bold text-reque-navy uppercase border-b-2 border-reque-orange/30 pb-1 mb-3">
                2. Pré-Elaboração
              </h3>
              <ol className="list-decimal list-inside space-y-1.5 text-[10px] text-slate-700 text-justify leading-tight">
                <li>
                  Envio obrigatório dos dados cadastrais de todos os funcionários (modelo Reque SST).
                </li>
                <li>
                  Envio da descrição detalhada das atividades de cada cargo.
                </li>
                <li>
                  Para PCMSO avulso, envio obrigatório do PGR vigente.
                </li>
              </ol>
            </section>
          </div>

          {/* 3. FUNCIONALIDADES */}
          <section className="mb-6">
             <h3 className="text-sm font-bold text-reque-navy uppercase border-b-2 border-reque-orange/30 pb-1 mb-2">
              3. Funcionalidades do Sistema de Gestão
            </h3>
            {renderChecklist()}
          </section>

          {/* 4. SERVIÇOS E VALORES */}
          <section className="mb-8">
             <h3 className="text-sm font-bold text-reque-navy uppercase border-b-2 border-reque-orange/30 pb-1 mb-3">
              4. Investimento e Condições Comerciais
            </h3>

            <div className="border border-slate-800">
              {/* Table Header */}
              <div className="grid grid-cols-12 bg-slate-200 text-[10px] font-bold text-center border-b border-slate-800 divide-x divide-slate-800">
                 <div className="col-span-2 py-2">Nº Vidas</div>
                 <div className="col-span-10 py-2">Plano Selecionado</div>
              </div>
              <div className="grid grid-cols-12 bg-white text-[10px] text-center border-b border-slate-800 divide-x divide-slate-800">
                 <div className="col-span-2 py-2 font-bold">{result.rangeLabel}</div>
                 <div className="col-span-10 py-2 font-bold text-reque-blue uppercase">{plan}</div>
              </div>

              {/* Main Pricing Table Body */}
              <div className="text-[10px]">
                {/* Row 1: Programs */}
                <div className="grid grid-cols-12 border-b border-slate-300">
                   <div className="col-span-3 p-3 font-bold border-r border-slate-300 flex items-center">Programas e Laudos</div>
                   <div className="col-span-5 p-3 border-r border-slate-300">
                      Elaboração de PGR<br/>Elaboração de PCMSO
                   </div>
                   <div className="col-span-2 p-3 border-r border-slate-300 text-center flex items-center justify-center font-bold">
                      {result.isCustomQuote ? (
                         <span className="text-reque-orange font-bold">SOB CONSULTA</span>
                      ) : result.programFeeDiscounted ? (
                        <div className="flex flex-col items-center justify-center leading-none">
                          <span className="text-[9px] text-slate-400 line-through">
                             {formatCurrency(result.originalProgramFee)}
                          </span>
                          <span className="text-green-600 font-extrabold text-[10px]">
                             ISENTO*
                          </span>
                        </div>
                      ) : (
                        formatCurrency(result.programFee)
                      )}
                   </div>
                   <div className="col-span-2 p-3 text-center flex items-center justify-center text-slate-500">
                      Serviços pontuais
                   </div>
                </div>

                {/* Row 2: Subscription */}
                <div className="grid grid-cols-12 border-b border-slate-300 bg-reque-blue/5">
                   <div className="col-span-3 p-3 font-bold border-r border-slate-300 flex items-center uppercase">Assinatura</div>
                   <div className="col-span-5 p-3 border-r border-slate-300">
                      Gestão SST, Eventos eSocial, Risco<br/>
                      <span className="text-[9px] italic text-slate-500">
                        {fidelity === FidelityModel.WITH_FIDELITY ? 'Plano com Fidelidade (Anual Antecipado)' : 'Plano sem Fidelidade'}
                      </span>
                   </div>
                   <div className="col-span-2 p-3 border-r border-slate-300 text-center flex items-center justify-center font-bold text-lg text-reque-navy">
                      {result.isCustomQuote ? (
                         <span className="text-sm">SOB CONSULTA</span>
                      ) : (
                         formatCurrency(result.monthlyValue)
                      )}
                   </div>
                   <div className="col-span-2 p-3 text-center flex items-center justify-center text-slate-500 leading-tight">
                      Ref. Mensal
                   </div>
                </div>

                {/* Row 3: Exams */}
                <div className="grid grid-cols-12">
                   <div className="col-span-3 p-3 font-bold border-r border-slate-300 flex items-center">Exames Ocupacionais</div>
                   <div className="col-span-5 p-3 border-r border-slate-300">
                      Por demanda (Clínico, Audiometria, etc)
                   </div>
                   <div className="col-span-2 p-3 border-r border-slate-300 text-center flex items-center justify-center italic">
                      Tabela Anexa (Pg. 3)
                   </div>
                   <div className="col-span-2 p-3 text-center flex items-center justify-center text-slate-500">
                      Por demanda
                   </div>
                </div>
              </div>
            </div>

            <div className="mt-4 text-right">
               <p className="text-[10px] font-bold uppercase text-slate-500">Valor Total Inicial (A pagar no aceite)</p>
               <p className="text-xl font-extrabold text-reque-navy border-t-2 border-reque-orange inline-block pt-1 mt-1">
                 {result.isCustomQuote ? 'SOB CONSULTA' : formatCurrency(result.initialPaymentAmount)}
               </p>
               <p className="text-[9px] text-slate-400 italic mt-1">
                 {fidelity === FidelityModel.WITH_FIDELITY ? 'Ref. 12 meses de assinatura antecipada' : 'Ref. Programas + 1ª Mensalidade'}
               </p>
            </div>
          </section>

          {/* 5. PRAZOS E CONSIDERAÇÕES (Moved up and updated) */}
          <section>
             <h3 className="text-sm font-bold text-reque-navy uppercase border-b-2 border-reque-orange/30 pb-1 mb-3">
              5. Prazos e Considerações Importantes
            </h3>
            <div className="space-y-2.5 text-[10px] text-slate-700 text-justify leading-relaxed">
              <p className="p-3 bg-indigo-50 border-l-2 border-indigo-500 rounded-r font-medium">
                 <strong>a. Prazo de elaboração:</strong> Considerando a entrega das descrições de atividade detalhada dos cargos pelo cliente (Modelo 1) em <strong>{formatDate(result.clientDeliveryDate)}</strong> e o prazo combinado para entrega dos documentos (PGR/PCMSO) em <strong>{formatDate(result.docDeliveryDate)}</strong>, o prazo de elaboração será de <strong>{result.businessDays} dias úteis</strong>.
              </p>
              <p>
                <strong>b.</strong> Para exames admissionais os dados cadastrais dos novos colaboradores deverão ser inseridos pelo responsável da contratante diretamente no sistema de gestão de SST da Reque SST. Após assinatura do contrato, o responsável receberá os dados de acesso do sistema.;
              </p>
              <p>
                <strong>c.</strong> Nossos programas e ASOs são emitidos de forma digital, e ficam disponíveis e organizados em nosso sistema;
              </p>
              <p>
                <strong>d.</strong> Será cobrado “No Show” no valor de uma consulta clínica, no caso de não comparecimento no dia do agendamento, inclui-se também no atendimento in company;
              </p>
              <p>
                <strong>e.</strong> Casos de funcionários desligados sem realização do exame demissional devem ser informados ao setor de atendimento da Reque SST por Whatsapp ou e-mail para evitar cobranças de vidas ativas (quando aplicável).
              </p>
              <p>
                <strong>h.</strong> Caso a CONTRATANTE solicite versão impressa, o custo da impressão será cobrado à parte.
              </p>
              <p>
                <strong>i.</strong> No caso da contratação de LTCAT ou Laudo de Insalubridade e/ou Periculosidade, havendo necessidade de avaliação quantitativa de algum risco, o prazo de entrega dos laudos será de até 30 (trinta) dias corridos contados da data de realização das avaliações.
              </p>
            </div>
          </section>

        </A4Page>

        {/* --- PAGE 2: EXTRA SERVICES, BILLING, READJUSTMENT --- */}
        <A4Page pageNumber={2} totalPages={3} planRef={plan.toUpperCase()}>
          
          {/* 6. FATURAMENTO */}
          <section className="mb-8">
             <h3 className="text-sm font-bold text-reque-navy uppercase border-b-2 border-reque-orange/30 pb-1 mb-3">
              6. Faturamento e Forma de Pagamento
            </h3>
            <div className="text-[10px] text-slate-700 text-justify space-y-3">
              <p><strong>a) Plano SST Express</strong></p>
              <p className="pl-3 border-l-2 border-slate-300 py-1">
                 Cobrança exclusivamente via <strong>Cartão de Crédito</strong>.
                 <br/>
                 {fidelity === FidelityModel.WITH_FIDELITY 
                   ? 'Cobrança Anual Antecipada (Total de 2 cobranças anuais no prazo de 24 meses).' 
                   : 'Pagamento à vista (Programas + 1ª Assinatura), seguido de cobrança mensal recorrente.'}
              </p>
              
              <p><strong>b) Exames Complementares</strong></p>
              <p className="pl-3 border-l-2 border-slate-300 py-1">
                Os exames serão cobrados por demanda e baseado nos valores apresentados na tabela anexa. 
                Faturamento via Boleto Bancário (vencimento dia 10).
              </p>
            </div>
          </section>

          {/* 7. REAJUSTE */}
          <section className="mb-8">
             <h3 className="text-sm font-bold text-reque-navy uppercase border-b-2 border-reque-orange/30 pb-1 mb-3">
              7. Reajuste de Valores
            </h3>
            <p className="text-[10px] text-slate-700 text-justify leading-relaxed">
              Reajuste anual (cada 12 meses) com base na variação acumulada do IPCA (IBGE).
            </p>
          </section>

           {/* 8. VIGÊNCIA E RESCISÃO (UPDATED TEXT) */}
          <section className="mb-8">
             <h3 className="text-sm font-bold text-reque-navy uppercase border-b-2 border-reque-orange/30 pb-1 mb-3">
              8. Vigência e Rescisão Contratual
            </h3>
            <div className="text-[10px] text-slate-700 text-justify space-y-3 border-l-2 border-reque-orange pl-4 bg-reque-orange/5 py-3 pr-3 rounded-r-md">
               <p>
                 <strong>Vigência:</strong> O contrato terá vigência de 12 (doze) meses a partir da data de assinatura.
               </p>
               
               {fidelity === FidelityModel.WITH_FIDELITY ? (
                 <div className="mt-2">
                   <p className="font-bold text-reque-navy mb-1">CANCELAMENTO ANTECIPADO (CLÁUSULA DE FIDELIDADE):</p>
                   <p className="leading-relaxed">
                     A modalidade {plan} Fidelidade exige fidelidade mínima de 24 (vinte e quatro) meses.
                     <strong> Em caso de cancelamento antecipado (rescisão antes do prazo contratual), será cobrado o valor integral do desconto concedido (isenção dos programas), conforme previsto na proposta comercial aceita.</strong>
                   </p>
                 </div>
               ) : (
                 <div className="mt-2">
                   <p className="font-bold text-reque-navy mb-1">CANCELAMENTO SEM FIDELIDADE:</p>
                   <p className="leading-relaxed">
                     Para contratos sem fidelidade, não há multa sobre mensalidades futuras, devendo ser quitados apenas os serviços já prestados.
                   </p>
                 </div>
               )}
            </div>
          </section>

          {/* 9. SERVIÇOS ADICIONAIS (Brief) */}
          <section>
             <h3 className="text-sm font-bold text-reque-navy uppercase border-b-2 border-reque-orange/30 pb-1 mb-3">
              9. Serviços Adicionais
            </h3>
            <p className="text-[10px] text-slate-600 mb-2">Valores sob demanda:</p>
            <ul className="list-disc list-inside text-[10px] text-slate-700 space-y-1">
               <li>Emissão de PPP (Extemporâneo): R$ 250,00</li>
               <li>Visita Técnica: R$ 100,00/h + deslocamento (Obrigatória para Risco > 1)</li>
            </ul>
          </section>

        </A4Page>

        {/* --- PAGE 3: ANEXO - TABELA DE EXAMES --- */}
        <A4Page 
          pageNumber={3} 
          totalPages={3} 
          planRef={plan.toUpperCase()} 
          title="ANEXO - TABELA DE VALORES"
          isLast={true}
        >
          
          <div className="text-center mb-8">
             <h2 className="text-lg font-bold text-reque-navy uppercase border-b-4 border-reque-orange inline-block pb-1">
               Tabela de Exames - {selectedUnit.replace('Unidade Reque ', '')}
             </h2>
             <p className="text-[10px] text-slate-500 mt-2">
               Valores referenciais para a unidade selecionada.
             </p>
          </div>

          <div className="border border-slate-800 rounded-sm overflow-hidden">
             {/* Table Header */}
             <div className="grid grid-cols-12 bg-reque-navy text-white text-[10px] font-bold text-center border-b border-slate-800 divide-x divide-slate-700">
                <div className="col-span-3 py-3">TIPO DE EXAME</div>
                <div className="col-span-5 py-3">NOME DO EXAME</div>
                <div className="col-span-2 py-3">VALOR (R$)</div>
                <div className="col-span-2 py-3">PRAZO</div>
             </div>

             {/* Table Body */}
             <div className="divide-y divide-slate-200">
               {selectedExams.map((exam, index) => (
                 <div key={index} className={`grid grid-cols-12 text-[10px] border-b border-slate-200 divide-x divide-slate-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                    <div className="col-span-3 py-2 px-2 font-bold text-slate-700 flex items-center justify-center text-center">
                      {exam.category}
                    </div>
                    <div className="col-span-5 py-2 px-3 text-slate-800 flex items-center">
                      {exam.name}
                    </div>
                    <div className="col-span-2 py-2 px-2 text-center font-bold text-reque-blue flex items-center justify-center">
                      {formatCurrency(exam.price)}
                    </div>
                    <div className="col-span-2 py-2 px-2 text-center text-slate-500 flex items-center justify-center italic leading-tight">
                      {exam.deadline}
                    </div>
                 </div>
               ))}
             </div>
          </div>
        </A4Page>
      </div>
    </div>
  );
};
