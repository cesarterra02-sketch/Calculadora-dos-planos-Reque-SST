
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
    <div className="flex-1 text-[10.5pt] leading-relaxed text-justify space-y-2 overflow-hidden h-auto min-h-0">
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
  const totalPages = 5 + selectedUnits.length;

  const today = new Date();
  const day = today.getDate();
  const month = today.toLocaleString('pt-BR', { month: 'long' });
  const year = today.getFullYear();
  const dateLine = `Ponta Grossa, PR, ${day} de ${month.charAt(0).toUpperCase() + month.slice(1)} de ${year}.`;

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
            {contractData.unidadeAtendimento}, situado na {contratadaInfo.endereco} inscrita sob o CNPJ {contratadaInfo.cnpj} neste ato representada por seu diretor Daniel Ribeiro Reque, portador do CPF 035.961.249-05 daqui por diante e para os efeitos do presente, simplymente denominada “CONTRATADA”
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

        {/* PÁGINA 2: FINANCEIRO */}
        <A4Page pageNumber={2} totalPages={totalPages}>
          <p className="font-bold uppercase border-b border-black pb-1 mt-2">CLÁUSULA QUARTA – DO PREÇO E FORMA DE PAGAMENTO</p>
          <p>4- Pelos serviços objeto deste contrato, a CONTRATANTE pagará à CONTRATADA os valores estabelecidos em anexo para cada unidade selecionada: {selectedUnits.map(u => u.replace('Unidade Reque ', '')).join(' | ')}.</p>
          <p>4.1- Os serviços realizados entre os dias 21 de cada mês e 20 do mês subsequente deverão ser pagos até o dia 10 do mês seguinte, mediante depósito bancário, com envio de relatório discriminado.</p>
          <p>4.2- A tratativa das inconsistências dos serviços prestados será auditada através do sistema SOC, pela CONTRATANTE e periodicamente, ao longo do ciclo de atendimento.</p>
          <p>4.3- O não comparecimento de colaborador aos atendimentos agendados, sem aviso prévio mínimo de 24 (vinte e quatro) horas, implicará na cobrança do valor correspondente a uma consulta clínica ocupacional base, a título de cobertura de custos de disponibilidade técnica, profissional e estrutural. A cobrança será aplicada por colaborador ausente e incluída no ciclo regular de faturamento, conforme tabela vigente da CONTRATADA.</p>
          <p>4.4- No documento de cobrança deverão ser claramente discriminados os serviços executados e os preços a eles correspondentes;</p>
          
          <p className="font-bold mt-2">PARÁGRAFO PRIMEIRO:</p>
          <p>A emissão da NFs deverá ocorrer entre o 1º e 5º dia do mês subsequente ao serviço prestado. O pagamento será efetuado através de DEPÓSITO bancário no dia 10 do mês da emissão da Nota Fiscal/Fatura.</p>

          <p className="font-bold mt-2">PARÁGRAFO SEGUNDO:</p>
          <p>A CONTRATANTE está ciente de que anualmente os valores dos exames presentes na cláusula quarta deste contrato serão corrigidos pelo IPCA acumulado do ano anterior, reajuste que incidirá sobre os exames realizados a partir do 1º de março de cada ano.</p>

          <p className="font-bold mt-2">PARÁGRAFO TERCEIRO</p>
          <p>Havendo necessidade de ajuste ao mercado, ou situações excepcionais, a CONTRATADA enviará à CONTRATANTE proposta de ajuste de valores para negociação que, caso reste frutífera, será lavrada a termo por meio de aditivo contratual, mantendo firmes e valiosas as demais cláusulas.</p>

          <p className="font-bold mt-2">PARÁGRAFO QUARTO</p>
          <p>O pagamento de valores divergentes do estabelecido na Cláusula Quarta não implica aceitação tácita desses valores, prevalecendo sempre a tabela vigente, salvo hipóteses excepcionais, devidamente comprovadas e aceitas pela CONTRATANTE.</p>
        </A4Page>

        {/* PÁGINA 3: VIGÊNCIA, SIGILO E OBRIGAÇÕES */}
        <A4Page pageNumber={3} totalPages={totalPages}>
          <p className="font-bold uppercase border-b border-black pb-1 mt-2">CLÁUSULA QUINTA - DO PRAZO DE VIGÊNCIA</p>
          <p>V- O presente Contrato vigorará pelo período de 12 meses, contados da data de sua assinatura, com renovação automática, por igual período, sucessivamente, salvo comunicação escrita em contrário, , manifestado por qualquer das partes até 30 (trinta) dias antes de seu vencimento.</p>

          <p className="font-bold uppercase border-b border-black pb-1 mt-4">CLÁUSULA SEXTA - SIGILO DE CONFIDENCIALIDADE</p>
          <p>VI: A CONTRATADA compromete-se a manter a confidencialidade sobre toda e qualquer informação, relativa ao prontuário dos pacientes, dados técnicos, pessoais ou não, banco de dados, metodologias, bem como custos dos exames, prazos de pagamento das notas, situações de inadimplemento entre outros. Em razão de sua relação de prestação de serviço ou de qualquer outra natureza sobre todo o conteúdo do presente instrumento, regendo-se pela ética profissional e boa-fé;</p>
          <p>A CONTRATADA obriga-se a cumprir e respeitar integralmente a Lei Geral de Proteção de Dados e, caso realize qualquer ato que constitua tratamento de dados pessoais, nos termos da aludida lei, que sejam de titularidade de sócios, empregados, colaboradores, ou qualquer outra pessoa vinculada ou relacionada à CONTRATANTE e/ou às suas associadas, obriga-se a: (I) obter eventuais consentimentos necessários; (II) manter os mais criteriosos recursos para segurança e privacidade desses dados; (III) não revelá-los ou compartilhá-los de qualquer forma, nem utilizá-los fora das finalidades previstas, exceto em caso de expresso e inequívoco consentimento do titular; (IV) não permitir que terceiros os acesse ou violem; (V) comunicar prontamente à CONTRATANTE sobre qualquer violação; (VI) respeitar todos os termos da lei de proteção geral de dados.</p>
          <p>Em caso de descumprimento das obrigações de confidencialidade ou da LGPD, a parte infratora será responsável por todas as perdas e danos diretos e indiretos.</p>

          <p className="font-bold uppercase border-b border-black pb-1 mt-4">CLÁUSULA SÉTIMA - DAS OBRIGAÇÕES DA CONTRATANTE</p>
          <p>VII- A CONTRATANTE obriga-se a:</p>
          <p>7.1 A CONTRATANTE se obriga a fornecer as informações necessárias, prestando esclarecimentos de forma a permitir o bom andamento dos serviços;</p>
          <p>7.2 A fornecer à CONTRATADA os acessos necessários ao sistema para que possa inserir as informação via web;</p>
          <p>7.3 A CONTRATANTE se obriga a efetuar o pagamento à CONTRATADA, nos termos deste contrato;</p>
        </A4Page>

        {/* PÁGINA 4: DISPOSIÇÕES GERAIS PARTE 1 */}
        <A4Page pageNumber={4} totalPages={totalPages}>
          <p className="font-bold uppercase border-b border-black pb-1 mt-2">CLÁUSULA OITAVA – DAS DISPOSIÇÕES GERAIS</p>
          <p>VIII- O presente contrato dispõe das seguintes disposições gerais para as partes:</p>
          <p>8.1 Todos os serviços que não estiverem previstos expressamente neste contrato serão obrigatoriamente objeto de aditamento contratual;</p>
          <p>8.2 Qualquer alteração ao presente contrato só será válida se feita por instrumento escrito assinado pelos representantes autorizados de ambas as partes;</p>
          <p>8.3 Qualquer tolerância das partes, não será considerada precedente ou novação, permanecendo as cláusulas deste contrato em pleno vigor e efeito na forma aqui prevista;</p>
          <p>8.4 Todos os avisos, comunicações ou notificações a serem efetuados no âmbito deste instrumento far-se-ão por escrito, por meio de notificação judicial ou extrajudicial, correspondência física ou eletrônica, com aviso de recebimento da parte contrária;</p>
          <p>8.5 O presente instrumento, seus anexos, aditamentos e Propostas Comerciais constituem-se os únicos documentos reguladores das relações contratuais, revogando-se expressamente todo e qualquer contrato anteriormente existente entre as partes que trate do mesmo objeto aqui especificado;</p>
          <p>8.6 A contratação dos serviços descritos neste instrumento não isenta as responsabilidades da CONTRATANTE perante a lei;</p>
          <p>8.7 A nulidade ou invalidade de qualquer das cláusulas deste instrumento não prejudicará a validade e a eficácia das demais cláusulas. Na hipótese de uma determinada cláusula ser considerada inválida ou ineficaz, o juiz ou as partes, conforme o caso, deverão substituir a disposição por outra, que sendo lícito e eficaz, permita às partes alcançar na maior extensão possível, o resultado prático visado;</p>
          <p>8.8 A CONTRATADA não autorizará o encaminhamento de qualquer cliente para atendimentos ou exames não abrangidos pelos serviços prestados no presente instrumento, salvo aprovação prévia por parte da CONTRATANTE;</p>
          <p>8.9 Os serviços serão prestados in dias e horários definidos pela CONTRATADA, mediante prévio agendamento.</p>
          <p>8.10 A CONTRATADA compromete-se, sempre que solicitada, a fornecer à CONTRATANTE todas as informações necessárias, bem como a preencher por completo as guias de atendimentos ocupacionais dos empregados dos clientes da CONTRATANTE, conforme a modalidade do contrato firmado com aqueles, devendo todos os documentos utilizados virem, obrigatoriamente, assinados digitalmente ou com o carimbo identificador do profissional por eles responsável.</p>
        </A4Page>

        {/* PÁGINA 5: DISPOSIÇÕES GERAIS PARTE 2 E CONCLUSÃO */}
        <A4Page pageNumber={5} totalPages={totalPages}>
          <p>8.11 Este instrumento não configura vínculo empregatício de qualquer natureza entre a CONTRATANTE e os empregados da CONTRATADA e com os demais prestadores de serviço por esta última. Arregimentados para a viabilização da execução do presente contrato, tampouco faz gerar, responsabilidade solidária ou subsidiária da CONTRATANTE nesse aspecto, ficando tais ônus exclusivamente sob a responsabilidade da CONTRATADA.</p>
          <p>8.12 O não cumprimento de qualquer cláusula do presente Contrato implicará em falta grave, o que possibilitará sua rescisão imediata, independentemente de qualquer notificação ou interpelação extrajudicial ou judicial, sem prejuízo da aplicação da multa e demais penalidades.</p>
          <p>8.13 Para solução de litígios advindos do presente Contrato, fica eleito o Foro da Comarca de Ponta Grossa/PR, renunciando a outros, mesmo que mais privilegiados.</p>

          <p className="mt-8">E, por estarem assim, justos e acordados, assinam o presente Contrato em duas (2) vias em seu anverso, de igual teor e forma, perante duas (2) testemunhas identificadas.</p>

          <p className="mt-8 font-bold">{dateLine}</p>
        </A4Page>

        {/* PÁGINAS DE ANEXOS: TABELAS DE CADA UNIDADE */}
        {selectedUnits.map((unitKey, unitIdx) => (
          <A4Page key={unitKey} pageNumber={6 + unitIdx} totalPages={totalPages}>
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold uppercase underline leading-tight">ANEXO - TABELA DE VALORES EXAMES | {unitKey.replace('Unidade Reque ', '').toUpperCase()}</h3>
            </div>
            
            <div className="border border-black overflow-hidden rounded-sm h-auto">
              <table className="w-full text-xs border-collapse text-left">
                <thead>
                  <tr className="bg-slate-100 border-b border-black font-bold uppercase text-xs h-auto">
                    <th className="py-1 px-4 border-r border-black w-1/4 leading-tight">TIPO DE EXAME</th>
                    <th className="py-1 px-4 border-r border-black w-1/2 leading-tight">NOME DO EXAME</th>
                    <th className="py-1 text-center leading-tight">VALOR (R$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(unitExamsMap[unitKey] || []).map((exam, idx) => (
                    <tr key={idx} className="border-b border-slate-100 h-auto">
                      <td className="py-0.5 px-4 border-r border-black uppercase font-bold text-slate-600 leading-tight">{exam.category}</td>
                      <td className="py-0.5 px-4 border-r border-black uppercase leading-tight">{exam.name}</td>
                      <td className="py-0.5 text-center font-bold leading-tight">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(exam.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 p-4 bg-slate-50 border border-slate-200 italic text-[10.5pt] h-auto">
              <p>* Valores exclusivos para realização na rede própria ou credenciada da Unidade Reque SST {unitKey.replace('Unidade Reque ', '')}. Sujeito a reajustes conforme cláusula contratual.</p>
            </div>
          </A4Page>
        ))}
      </div>
    </div>
  );
};
