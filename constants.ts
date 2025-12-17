
import { EmployeeRange, PlanType, PricingTable, ProgramFeeTable, RequeUnit, ExamItem } from './types';

// 1. Employee Ranges (Based on PDF Page 3)
export const EMPLOYEE_RANGES: EmployeeRange[] = [
  { id: 'R1', min: 1, max: 5, label: '01 a 05 Vidas' },
  { id: 'R2', min: 6, max: 10, label: '06 a 10 Vidas' },
  { id: 'R3', min: 11, max: 15, label: '11 a 15 Vidas' },
  { id: 'R4', min: 16, max: 20, label: '16 a 20 Vidas' },
  { id: 'R5', min: 21, max: 9999, label: 'Acima de 20 Vidas (SST Pró)' },
];

// 2. Base Values (Monthly) - Based on PDF Page 3
export const BASE_PRICING_TABLE: PricingTable = {
  [PlanType.EXPRESS]: {
    'R1': 55.00,
    'R2': 75.00,
    'R3': 100.00,
    'R4': 125.00,
    'R5': 0, // Should not happen logic-wise, but for safety
  },
  [PlanType.PRO]: {
    'R1': 0,
    'R2': 0,
    'R3': 0,
    'R4': 0,
    'R5': 0, // Custom Pricing
  },
};

// 3. Program Creation Fees (PGR/PCMSO)
// Values kept from previous logic as PDF implies existence but not specific values, 
// keeping standard market rates for simulation.
export const PROGRAM_FEES_TABLE: ProgramFeeTable = {
  'R1': 350.00,
  'R2': 400.00,
  'R3': 450.00,
  'R4': 500.00,
  'R5': 0, // Custom
};

// 4. Services per Plan
export const PLAN_SERVICES: Record<PlanType, string[]> = {
  [PlanType.EXPRESS]: [
    'Sistema de Gestão de SST',
    'Revisão bianual dos riscos',
    'Revisão periódica dos exames',
    'e-Social SST - Evento (S-2220 | S-2240)',
    'Cobrança Exclusiva Cartão de Crédito'
  ],
  [PlanType.PRO]: [
    'Gestão completa de SST',
    'Consultoria Técnica Dedicada',
    'Personalização de Procedimentos',
    'Faturamento via Boleto permitido',
    'Atendimento a riscos complexos'
  ]
};

// 5. Exam Tables per Unit (Extracted from PDF - Kept same)
export const UNIT_EXAM_TABLES: Record<RequeUnit, ExamItem[]> = {
  [RequeUnit.PONTA_GROSSA]: [
    { category: 'Exame Médico', name: 'EXAME CLÍNICO OCUPACIONAL', price: 36.69, deadline: 'a depender dos demais exames' },
    { category: 'Complementares', name: 'ACUIDADE VISUAL', price: 9.57, deadline: 'na hora' },
    { category: 'Complementares', name: 'AUDIOMETRIA', price: 27.42, deadline: 'na hora' },
    { category: 'Complementares', name: 'ELETROCARDIOGRAMA', price: 38.32, deadline: 'mesmo dia' },
    { category: 'Complementares', name: 'ELETROENCEFALOGRAMA', price: 83.01, deadline: 'mesmo dia' },
    { category: 'Complementares', name: 'ESPIROMETRIA SEM LAUDO', price: 25.55, deadline: 'na hora' },
    { category: 'Complementares', name: 'AV. PSICOSSOCIAL', price: 76.28, deadline: 'na hora' },
    { category: 'Complementares', name: 'AV. PSICOTÉCNICA', price: 114.93, deadline: 'na hora' },
    { category: 'Imagem', name: 'RX TORÁX PA - PADRÃO OIT', price: 157.81, deadline: 'mesmo dia' },
    { category: 'Imagem', name: 'RX TORÁX PA', price: 52.46, deadline: 'mesmo dia' },
    { category: 'Toxicológico', name: 'TOXICOLÓGICO CNH/CLT', price: 94.35, deadline: 'negativo 3 dias' },
    { category: 'Laboratorial', name: 'HEMOGRAMA COMPLETO', price: 14.23, deadline: 'mesmo dia' },
    { category: 'Laboratorial', name: 'GLICEMIA', price: 6.61, deadline: 'mesmo dia' },
    { category: 'Laboratorial', name: 'GAMA GT', price: 9.55, deadline: 'mesmo dia' },
  ],
  [RequeUnit.CASTRO]: [
    { category: 'Exame Médico', name: 'EXAME CLÍNICO OCUPACIONAL', price: 46.13, deadline: 'a depender dos demais exames' },
    { category: 'Complementares', name: 'ACUIDADE VISUAL', price: 18.21, deadline: 'na hora' },
    { category: 'Complementares', name: 'AUDIOMETRIA', price: 31.44, deadline: 'na hora' },
    { category: 'Complementares', name: 'ELETROCARDIOGRAMA', price: 54.63, deadline: 'mesmo dia' },
    { category: 'Complementares', name: 'ELETROENCEFALOGRAMA', price: 115.32, deadline: 'mesmo dia' },
    { category: 'Complementares', name: 'ESPIROMETRIA SEM LAUDO', price: 35.20, deadline: 'na hora' },
    { category: 'Complementares', name: 'AV. PSICOSSOCIAL', price: 54.63, deadline: 'na hora' },
    { category: 'Imagem', name: 'RX TORÁX PA - PADRÃO OIT', price: 157.81, deadline: '2 dias úteis' },
    { category: 'Toxicológico', name: 'TOXICOLÓGICO CLT/CNH', price: 136.28, deadline: 'negativo 3 dias' },
    { category: 'Laboratorial', name: 'HEMOGRAMA COMPLETO', price: 14.49, deadline: 'mesmo dia' },
    { category: 'Laboratorial', name: 'GLICEMIA', price: 6.51, deadline: 'mesmo dia' },
  ],
  [RequeUnit.GUARAPUAVA]: [
    { category: 'Exame Médico', name: 'EXAME CLÍNICO OCUPACIONAL', price: 40.00, deadline: 'a depender dos demais exames' },
    { category: 'Complementares', name: 'ACUIDADE VISUAL', price: 15.00, deadline: 'na hora' },
    { category: 'Complementares', name: 'AUDIOMETRIA OCUPACIONAL', price: 26.00, deadline: 'na hora' },
    { category: 'Complementares', name: 'ELETROCARDIOGRAMA', price: 50.00, deadline: 'mesmo dia' },
    { category: 'Complementares', name: 'ELETROENCEFALOGRAMA', price: 90.00, deadline: 'mesmo dia' },
    { category: 'Complementares', name: 'ESPIROMETRIA COM LAUDO', price: 25.00, deadline: 'na hora' },
    { category: 'Imagem', name: 'RX TORÁX PA - PADRÃO OIT', price: 60.00, deadline: 'mesmo dia' },
    { category: 'Laboratorial', name: 'HEMOGRAMA COMPLETO', price: 9.34, deadline: 'mesmo dia' },
    { category: 'Laboratorial', name: 'GLICEMIA', price: 5.22, deadline: 'mesmo dia' },
  ],
  [RequeUnit.IVAI]: [
    { category: 'Exame Médico', name: 'EXAME CLÍNICO OCUPACIONAL', price: 50.00, deadline: 'a depender dos demais exames' },
    { category: 'Complementares', name: 'ACUIDADE VISUAL', price: 15.00, deadline: 'na hora' },
    { category: 'Complementares', name: 'AUDIOMETRIA', price: 50.00, deadline: 'na hora' },
    { category: 'Complementares', name: 'ELETROCARDIOGRAMA', price: 45.00, deadline: 'mesmo dia' },
    { category: 'Complementares', name: 'ELETROENCEFALOGRAMA', price: 75.00, deadline: 'mesmo dia' },
    { category: 'Complementares', name: 'ESPIROMETRIA COM LAUDO', price: 30.00, deadline: 'na hora' },
    { category: 'Complementares', name: 'AV. PSICOSSOCIAL', price: 65.00, deadline: 'na hora' },
    { category: 'Laboratorial', name: 'GLICEMIA', price: 25.00, deadline: 'mesmo dia' },
    { category: 'Laboratorial', name: 'VHS', price: 50.00, deadline: 'mesmo dia' },
  ],
  [RequeUnit.IPIRANGA]: [
    { category: 'Exame Médico', name: 'EXAME CLÍNICO OCUPACIONAL', price: 55.00, deadline: 'a depender dos demais exames' },
    { category: 'Complementares', name: 'ACUIDADE VISUAL', price: 15.00, deadline: 'na hora' },
    { category: 'Complementares', name: 'AUDIOMETRIA', price: 50.00, deadline: 'na hora' },
    { category: 'Complementares', name: 'ELETROCARDIOGRAMA', price: 45.00, deadline: 'mesmo dia' },
    { category: 'Complementares', name: 'ELETROENCEFALOGRAMA', price: 75.00, deadline: 'mesmo dia' },
    { category: 'Complementares', name: 'ESPIROMETRIA COM LAUDO', price: 30.00, deadline: 'na hora' },
    { category: 'Complementares', name: 'AV. PSICOSSOCIAL', price: 65.00, deadline: 'na hora' },
    { category: 'Laboratorial', name: 'GLICEMIA', price: 20.00, deadline: 'mesmo dia' },
    { category: 'Laboratorial', name: 'GAMA GT', price: 15.00, deadline: 'mesmo dia' },
  ],
};
