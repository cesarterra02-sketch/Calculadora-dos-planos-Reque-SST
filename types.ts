
export enum PlanType {
  EXPRESS = 'SST Express', // 1 to 20 lives
  PRO = 'SST Pró',         // > 20 lives
}

export enum FidelityModel {
  WITH_FIDELITY = 'Com Fidelidade (24 meses)',
  NO_FIDELITY = 'Sem Fidelidade (Padrão)',
}

export enum PaymentMethod {
  CREDIT_CARD = 'Cartão de Crédito',
  BOLETO = 'Boleto Bancário',
}

export enum BillingCycle {
  MONTHLY = 'Mensal Recorrente',
  ANNUAL = 'Anual Antecipado (12 meses)',
}

export enum RiskLevel {
  RISK_1 = 'Risco 1 (Baixo)',
  RISK_2 = 'Risco 2 (Médio)',
  RISK_3 = 'Risco 3 (Alto)',
  RISK_4 = 'Risco 4 (Máximo)',
}

export enum RequeUnit {
  PONTA_GROSSA = 'Unidade Reque Ponta Grossa',
  CASTRO = 'Unidade Reque Castro',
  GUARAPUAVA = 'Unidade Reque Guarapuava',
  IVAI = 'Unidade Reque Ivaí',
  IPIRANGA = 'Unidade Reque Ipiranga',
}

export interface EmployeeRange {
  id: string;
  min: number;
  max: number;
  label: string;
}

export interface PricingResult {
  rangeLabel: string;
  monthlyValue: number;       // The reference monthly value
  billingCycle: BillingCycle;
  paymentMethod: PaymentMethod;
  programFee: number;         // Setup fee (PGR/PCMSO) - Current value (0 if discounted)
  originalProgramFee: number; // The base fee before discount (for display purposes)
  programFeeDiscounted: boolean;
  riskLevel: RiskLevel;       
  
  // Dates & Deadlines
  clientDeliveryDate: string; // Date client delivers "Modelo 1"
  docDeliveryDate: string;    // Date Reque delivers PGR/PCMSO
  businessDays: number;       // Calculated working days
  
  // Financials
  contractTotalCurrentCycle: number; // What the client pays now (e.g. 12 months or 1 month)
  initialPaymentAmount: number;      // Total to pay immediately (Cycle + Fee)
  
  isCustomQuote: boolean;
  commercialSummary: string;
}

export interface ProposalHistoryItem {
  id: string;
  createdAt: string;
  companyName: string;
  contactName: string;
  cnpj: string; 
  selectedUnit: RequeUnit; 
  plan: PlanType;
  numEmployees: number;
  riskLevel: RiskLevel; 
  monthlyValue: number;
  initialTotal: number;
  fidelity: FidelityModel;
  clientDeliveryDate?: string;
  docDeliveryDate?: string;
}

export interface User {
  name: string;
  email: string; // Used as login username
  password: string;
  role: 'admin' | 'user';
  isApproved: boolean;
}

export type ViewType = 'calculator' | 'history' | 'admin';

// Mimics the "Table Reference" structure
export type PricingTable = Record<PlanType, Record<string, number>>; 
export type ProgramFeeTable = Record<string, number>; // RangeID -> Fee

// Exam Table Structure
export interface ExamItem {
  category: string;
  name: string;
  price: number;
  deadline: string;
}
