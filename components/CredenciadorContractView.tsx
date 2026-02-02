import React, { useState, useRef } from 'react';
import { RequeUnit } from '../types';
import { Printer, Download, Loader2, ArrowLeft } from 'lucide-react';

declare var html2pdf: any;

interface CredenciadorContractViewProps {
  onBack: () => void;
  contractData: {
    logradouro: string;
    fachada: string;
    bairro: string;
    cidadeUf: string;
    cep: string;
    responsavelLegal: string;
    cpfResponsavel: string;
    unidadeAtendimento: string;
  };
  companyName: string;
  cnpj: string;
  selectedUnits: RequeUnit[];
  unitExamsMap: Record<string, any[]>;
}

const CONTRATADA_DATA: Record<string, { cnpj: string; endereco: string }> = {
  "G MED BOURGUIGON SERVICOS CLINICOS LTDA": {
    cnpj: "34.055.801/0001-76",
    endereco: "Rua Cruz Machado, 555, Vila Rio Branco, Castro, PR CEP 84172-080"
  },
  "REQUEMED - CLINICA DE MEDICINA DO TRABALHO LTDA": {
    cnpj: "18.545.280/0001-89",
    endereco: "Rua Coronel Bittencourt, 265, Centro, Ponta Grossa, PR CEP 84.010-290"
  },
  "ZR CLINICA DE MEDICINA DO TRABALHO LTDA": {
    cnpj: "57.044.028/0001-48",
    endereco: "Rua Brigadeiro Rocha, 1756 Sala B, Centro, Guarapuava, PR CEP 85.010-210"
  }
};

const A4Page: React.FC<{ children: React.ReactNode; pageNumber: number; totalPages: number }> = ({ children, pageNumber, totalPages }) => (
  <div className="page-a4 relative flex flex-col antialiased text-black bg-white shadow-2xl print:shadow-none overflow-hidden p-[20mm]" style={{ fontFamily: 'Arial, sans-serif' }}>
    <div className="border border-black p-4 mb-8 flex justify-between items-center shrink-0">
      <div className="flex flex-col">
        <span className="text-2xl font-black tracking-tighter leading-none italic">Reque</span>
        <span className="text-[7px] font-bold uppercase tracking-widest mt-1">Saúde e Segurança do Trabalho</span>
      </div>
      <div className="text-center font-bold text-sm uppercase">CONTRATO CREDENCIAMENTO</div>
      <div className="text-[10px] font-bold uppercase tracking-widest">PÁG {pageNumber} DE {totalPages}</div>
    </div>
    <div className="flex-1 text-[10.5pt] leading-relaxed text-justify space-y-2 overflow-hidden">
      {children}
    </div>
  </div>
);

export const CredenciadorContractView: React.FC<CredenciadorContractViewProps> = ({ 
  onBack, contractData, companyName, cnpj, selectedUnits, unitExamsMap 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  
  const contratadaInfo = CONTRATADA_DATA[contractData.unidadeAtendimento] || { cnpj: "___", endereco: "___" };
  const totalPages = 2 + selectedUnits.length;

  const handleDownloadPDF = async () => {
    if (!contentRef.current) return;
    setIsGenerating(true);
    const opt = { 
      margin: 0, 
      filename: `Contrato_Credenciamento_${companyName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`, 
      image: { type: 'jpeg', quality: 0.98 }, 
      html2canvas: { scale: 2.5, useCORS: true, letterRendering: true, backgroundColor: '#ffffff', width: 793 }, 
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: 'css' } 
    };
    try { 
      await html2pdf().set(opt).from(contentRef.current).save(); 
    } catch (e) { 
      console.error(e); 
    } finally { 
      setIsGenerating(false); 
    }
  };

  return (
    <div className="bg-slate-200/50 min-h-screen pb-12 print:bg-white print:p-0">
      <style>{`
        .page-a4 { width: 210mm; height: 297mm; margin: 0 auto 32px auto; background: white; page-break-after: always; }
        .page-a4:last-child { page-break-after: auto; margin-bottom: 0; }
        @media print { .no-print { display: none !important; } .page-a4 { box-shadow: none !important; margin: 0 !important; } }
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
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} EXPORTAR CONTRATO PDF
            </button>
          </div>
        </div>
      </div>

      <div ref={contentRef} className="contract-container">
        {/* PÁGINA 1: IDENTIFICAÇÃO E CLÁUSULAS INICIAIS */}
        <A4Page pageNumber={1} totalPages={totalPages}>
          <p className="text-center font-bold mb-4 text-[14pt]">CONTRATO DE PRESTAÇÃO DE SERVIÇOS PARA “EXAMES OCUPACIONAIS”</p>
          
          <p>Pelo presente Contrato Particular de Prestação de Serviços Profissionais que entre si fazem, de um lado,</p>
          
          <p className="font-bold">
            {contractData.unidadeAtendimento}, situado na {contratadaInfo.endereco} inscrita sob o CNPJ {contratadaInfo.cnpj} neste ato representada por seu diretor Daniel Ribeiro Reque, portador do CPF 035.961.249-05 daqui por diante e para os efeitos do presente, simplesmente denominada “CONTRATADA”
          </p>
          
          <p>e, de outro lado,</p>
          
          <p className="font-bold">
            {companyName}, com sede na {contractData.logradouro}, {contractData.fachada}, {contractData.bairro}, CIDADE {contractData.cidadeUf} CEP {contractData.cep}, inscrita sob o CNPJ {cnpj} aqui representada por seu responsável legal, {contractData.responsavelLegal}, portador do CPF {contractData.cpfResponsavel}, doravante simplesmente denominada como “CONTRATANTE”.
          </p>
          
          <p>Têm, entre si, certas e ajustadas as seguintes cláusulas e condições, as quais são aceitas de forma mútua e recíproca, a saber:</p>
          
          <p className="font-bold uppercase border-b border-black pb-1 mt-2">CLÁUSULA PRIMEIRA – DO OBJETO</p>
          <p>1- O presente contrato tem por objeto a prestação de serviços pela CONTRATADA compreendendo a realização de exames complementares e clínicos admissionais, periódicos, retorno ao trabalho, mudança de função e demissionais com emissão e entrega do ASO – Atestado de Saúde Ocupacional.</p>
          
          <p className="font-bold uppercase border-b border-black pb-1 mt-2">CLÁUSULA SEGUNDA – DO LOCAL DA PRESTAÇÃO DOS SERVIÇOS</p>
          <p>2- Os serviços ora avençados serão prestados pela CONTRATADA em seu endereço, situados {contratadaInfo.endereco}, obrigando-se a informar por escrito à CONTRATANTE eventual alteração de endereço com antecedência mínima de 30 (sessenta) dias.</p>
          <p>2.1- Fica acordado que a CONTRATANTE e/ou CONTRATADA poderão por mútuo acordo, definir outro local para a prestação dos serviços (se necessário) e desde que sejam respeitados a antecedência mínima de 30 (sessenta) dias.</p>
          
          <p className="font-bold uppercase border-b border-black pb-1 mt-2">CLÁUSULA TERCEIRA – DO SISTEMA DE INFORMAÇÃO</p>
          <p>3- Os atendimentos oriundos da prestação de serviços objeto deste Contrato serão feitos pela CONTRATADA através do Sistema SOC, com acesso disponibilizado pela CONTRATANTE, sendo autorizada a realização de atendimento através de prontuário físico caso solicitado pela CONTRATANTE.</p>
        </A4Page>

        {/* PÁGINA 2: FINANCEIRO E VIGÊNCIA */}
        <A4Page pageNumber={2} totalPages={totalPages}>
          <p className="font-bold uppercase border-b border-black pb-1 mt-2">CLÁUSULA QUARTA – DO PREÇO E FORMA DE PAGAMENTO</p>
          <p>4- Pelos serviços objeto deste contrato, a CONTRATANTE pagará à CONTRATADA os valores estabelecidos em anexo para cada unidade selecionada: {selectedUnits.map(u => u.replace('Unidade Reque ', '')).join(' | ')}.</p>
          <p>4.1- Os serviços realizados entre os dias 21 de cada mês e 20 do mês subsequente deverão ser pagos até o dia 10 do mês seguinte, mediante depósito bancário, com envio de relatório discriminado.</p>
          <p>4.2- A tratativa das inconsistências dos serviços prestados será auditada através do sistema SOC, pela CONTRATANTE e periodicamente, ao longo do ciclo de atendimento.</p>
          
          <p className="font-bold mt-2">PARÁGRAFO PRIMEIRO:</p>
          <p>A emissão da NFs deverá ocorrer entre o 1º e 5º dia do mês subsequente ao serviço prestado. O pagamento será efetuado através de DEPÓSITO bancário no dia 10 do mês da emissão da Nota Fiscal/Fatura.</p>

          <p className="font-bold mt-2">PARÁGRAFO SEGUNDO:</p>
          <p>A CONTRATANTE está ciente de que anualmente os valores dos exames presentes na cláusula quarta deste contrato serão corrigidos pelo IPCA acumulado do ano anterior, reajuste que incidirá sobre os exames realizados a partir do 1º de março de cada ano.</p>
          
          <p className="font-bold uppercase border-b border-black pb-1 mt-3">CLÁUSULA QUINTA - DO PRAZO DE VIGÊNCIA</p>
          <p>V- O presente Contrato vigorará pelo período de 12 meses, contados da data de sua assinatura, com renovação automática, por igual período, sucessivamente, salvo comunicação escrita em contrário, manifestado por qualquer das partes até 30 (trinta) dias antes de seu vencimento.</p>

          <p className="font-bold uppercase border-b border-black pb-1 mt-3">CLÁUSULA OITAVA – DAS DISPOSIÇÕES GERAIS</p>
          <p>8.13 Para solução de litígios advindos do presente Contrato, fica eleito o Foro da Comarca de Ponta Grossa/PR, renunciando a outros, mesmo que mais privilegiados.</p>
        </A4Page>

        {/* PÁGINAS DE ANEXOS: TABELAS DE CADA UNIDADE */}
        {selectedUnits.map((unitKey, unitIdx) => (
          <A4Page key={unitKey} pageNumber={3 + unitIdx} totalPages={totalPages}>
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold uppercase underline">ANEXO - TABELA DE VALORES EXAMES | {unitKey.replace('Unidade Reque ', '').toUpperCase()}</h3>
            </div>
            
            <div className="border border-black overflow-hidden rounded-sm">
              <table className="w-full text-[9pt] border-collapse text-left">
                <thead>
                  <tr className="bg-slate-100 border-b border-black font-bold uppercase text-[9pt]">
                    <th className="py-2 px-4 border-r border-black w-1/4">TIPO DE EXAME</th>
                    <th className="py-2 px-4 border-r border-black w-1/2">NOME DO EXAME</th>
                    <th className="py-2 text-center">VALOR (R$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(unitExamsMap[unitKey] || []).map((exam, idx) => (
                    <tr key={idx} className="border-b border-slate-100">
                      <td className="py-1 px-4 border-r border-black uppercase font-bold text-slate-600">{exam.category}</td>
                      <td className="py-1 px-4 border-r border-black uppercase">{exam.name}</td>
                      <td className="py-1 text-center font-bold">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(exam.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 p-4 bg-slate-50 border border-slate-200 italic text-[10.5pt]">
              <p>* Valores exclusivos para realização na rede própria ou credenciada da Unidade Reque SST {unitKey.replace('Unidade Reque ', '')}. Sujeito a reajustes conforme cláusula contratual.</p>
            </div>
          </A4Page>
        ))}
      </div>
    </div>
  );
};