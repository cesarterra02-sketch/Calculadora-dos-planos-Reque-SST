
import { EmployeeRange, PlanType, PricingTable, ProgramFeeTable, RequeUnit, ExamItem } from './types';

export const EMPLOYEE_RANGES: EmployeeRange[] = [
  { id: 'R1', min: 1, max: 5, label: '01 a 05 Vidas' },
  { id: 'R2', min: 6, max: 10, label: '06 a 10 Vidas' },
  { id: 'R3', min: 11, max: 15, label: '11 a 15 Vidas' },
  { id: 'R4', min: 16, max: 20, label: '16 a 20 Vidas' },
  { id: 'R5', min: 21, max: 25, label: '21 a 25 Vidas' },
  { id: 'R6', min: 26, max: 30, label: '26 a 30 Vidas' },
  { id: 'R7', min: 31, max: 35, label: '31 a 35 Vidas' },
  { id: 'R8', min: 36, max: 40, label: '36 a 40 Vidas' },
  { id: 'R9', min: 41, max: 45, label: '41 a 45 Vidas' },
  { id: 'R10', min: 46, max: 50, label: '46 a 50 Vidas' },
  { id: 'R11', min: 51, max: 55, label: '51 a 55 Vidas' },
  { id: 'R12', min: 56, max: 60, label: '56 a 60 Vidas' },
  { id: 'R13', min: 61, max: 65, label: '61 a 65 Vidas' },
  { id: 'R14', min: 66, max: 70, label: '66 a 70 Vidas' },
  { id: 'R15', min: 71, max: 75, label: '71 a 75 Vidas' },
  { id: 'R16', min: 76, max: 80, label: '76 a 80 Vidas' },
  { id: 'R17', min: 81, max: 85, label: '81 a 85 Vidas' },
  { id: 'R18', min: 86, max: 90, label: '86 a 90 Vidas' },
  { id: 'R19', min: 91, max: 95, label: '91 a 95 Vidas' },
  { id: 'R20', min: 96, max: 100, label: '96 a 100 Vidas' },
  { id: 'R21', min: 101, max: 110, label: '101 a 110 Vidas' },
  { id: 'R22', min: 111, max: 120, label: '111 a 120 Vidas' },
  { id: 'R23', min: 121, max: 130, label: '121 a 130 Vidas' },
  { id: 'R24', min: 131, max: 140, label: '131 a 140 Vidas' },
  { id: 'R25', min: 141, max: 150, label: '141 a 150 Vidas' },
  { id: 'R26', min: 151, max: 160, label: '151 a 160 Vidas' },
  { id: 'R27', min: 161, max: 170, label: '161 a 170 Vidas' },
  { id: 'R28', min: 171, max: 180, label: '171 a 180 Vidas' },
  { id: 'R29', min: 181, max: 190, label: '181 a 190 Vidas' },
  { id: 'R30', min: 191, max: 200, label: '191 a 200 Vidas' },
];

// Valores para Express e Essencial (são idênticos conforme o Book)
export const MONTHLY_VALUES_EXPRESS: PricingTable = {
  R1: 55, R2: 75, R3: 100, R4: 125, R5: 145, R6: 160, R7: 175, R8: 190, R9: 205, R10: 220,
  R11: 235, R12: 250, R13: 265, R14: 275, R15: 285, R16: 295, R17: 310, R18: 320, R19: 335, R20: 345,
  R21: 370, R22: 395, R23: 420, R24: 445, R25: 470, R26: 495, R27: 520, R28: 545, R29: 570, R30: 595,
};

// Valores para o plano Pró (tem reduções pontuais a partir da R12)
export const MONTHLY_VALUES_PRO: PricingTable = {
  R5: 145, R6: 160, R7: 175, R8: 190, R9: 205, R10: 220, R11: 235, R12: 245, R13: 260, R14: 270,
  R15: 285, R16: 295, R17: 310, R18: 320, R19: 335, R20: 345, R21: 370, R22: 395, R23: 420, R24: 445,
  R25: 470, R26: 495, R27: 520, R28: 545, R29: 570, R30: 595,
};

// Tabela de Programas (PGR + PCMSO)
export const PROGRAM_FEES_TABLE: ProgramFeeTable = {
  R1: 350, R2: 400, R3: 450, R4: 500, R5: 550, R6: 600, R7: 650, R8: 700, R9: 750, R10: 800,
  R11: 850, R12: 900, R13: 950, R14: 1000, R15: 1050, R16: 1100, R17: 1150, R18: 1200, R19: 1250, R20: 1300,
  R21: 1380, R22: 1460, R23: 1540, R24: 1620, R25: 1700, R26: 1780, R27: 1860, R28: 1940, R29: 2020, R30: 2100,
};

export const PLAN_SERVICES: Record<PlanType, string[]> = {
  [PlanType.EXPRESS]: [
    'Exclusivo para Grau de Risco 1',
    'Agendamento Online de Exames',
    'Mensageria eSocial inclusa',
    'PGR e PCMSO via antecipação',
    'Acesso ao Sistema de Gestão'
  ],
  [PlanType.ESSENCIAL]: [
    'Destinado a Riscos 2, 3 e 4',
    'Até 20 funcionários',
    'Visita Técnica Prévia Obrigatória',
    'Mapeamento de Riscos eSocial',
    'Gestão completa de exames'
  ],
  [PlanType.PRO]: [
    'Destinado a Riscos 2, 3 e 4',
    'Mais de 20 funcionários',
    'Visita Técnica para Levantamento',
    'Suporte Técnico Dedicado',
    'Faturamento Mensal via Boleto'
  ]
};

export const UNIT_EXAM_TABLES: Record<RequeUnit, ExamItem[]> = {
  [RequeUnit.PONTA_GROSSA]: [
    { category: 'Médico', name: 'EXAME CLÍNICO OCUPACIONAL', price: 36.69, deadline: 'Variável' },
    { category: 'Complementar', name: 'AUDIOMETRIA', price: 27.42, deadline: 'Na hora' },
    { category: 'Complementar', name: 'ACUIDADE VISUAL', price: 9.57, deadline: 'Na hora' },
    { category: 'Complementar', name: 'ELETROCARDIOGRAMA', price: 38.32, deadline: 'Mesmo dia' },
    { category: 'Laboratorial', name: 'HEMOGRAMA COMPLETO', price: 14.23, deadline: 'Mesmo dia' },
  ],
  [RequeUnit.CASTRO]: [
    { category: 'Médico', name: 'EXAME CLÍNICO OCUPACIONAL', price: 46.13, deadline: 'Variável' },
    { category: 'Complementar', name: 'AUDIOMETRIA', price: 31.44, deadline: 'Na hora' },
  ],
  [RequeUnit.GUARAPUAVA]: [
    { category: 'Médico', name: 'EXAME CLÍNICO OCUPACIONAL', price: 40.00, deadline: 'Variável' },
  ],
  [RequeUnit.IVAI]: [
    { category: 'Médico', name: 'EXAME CLÍNICO OCUPACIONAL', price: 50.00, deadline: 'Variável' },
  ],
  [RequeUnit.IPIRANGA]: [
    { category: 'Médico', name: 'EXAME CLÍNICO OCUPACIONAL', price: 55.00, deadline: 'Variável' },
  ],
};
