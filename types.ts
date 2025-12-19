
export enum PlanType {
  EXPRESS = 'SST Express',
  ESSENCIAL = 'SST Essencial',
  PRO = 'SST Pró',
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
  monthlyValue: number;
  billingCycle: BillingCycle;
  paymentMethod: PaymentMethod;
  programFee: number;
  originalProgramFee: number;
  programFeeDiscounted: boolean;
  riskLevel: RiskLevel;
  clientDeliveryDate: string;
  docDeliveryDate: string;
  businessDays: number;
  contractTotalCurrentCycle: number;
  initialPaymentAmount: number;
  isCustomQuote: boolean;
  commercialSummary: string;
}

export interface ProposalHistoryItem {
  id: string;
  type: 'standard' | 'incompany';
  createdAt: string;
  companyName: string;
  contactName: string;
  cnpj: string;
  selectedUnit?: RequeUnit;
  plan?: PlanType;
  numEmployees?: number;
  riskLevel?: RiskLevel;
  monthlyValue?: number;
  initialTotal: number;
  fidelity?: FidelityModel;
  clientDeliveryDate?: string;
  docDeliveryDate?: string;
  // Dados específicos In Company para restauração
  inCompanyDetails?: {
    profs: ProfessionalInCompany[];
    vehicles: VehicleInCompany[];
    exams: ExamInCompany[];
    executionDays: number;
    isEarlyDeparture: boolean;
    mealsPerDay: number;
    taxaInCompany: number;
    receitaExames: number;
  };
}

export interface AccessLogEntry {
  id: string;
  timestamp: string;
  userName: string;
  userEmail: string;
  userAgent: string;
  action: 'LOGIN' | 'LOGOUT' | 'PASSWORD_CHANGE';
}

export interface User {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  isApproved: boolean;
  canAccessAdmin: boolean;
  canAccessHistory: boolean;
  canGenerateProposal: boolean;
}

export type ViewType = 'calculator' | 'history' | 'admin' | 'incompany';

export type PricingTable = Record<string, number>;
export type ProgramFeeTable = Record<string, number>;

export interface ExamItem {
  category: string;
  name: string;
  price: number;
  deadline: string;
}

// Tipos para In Company
export interface ProfessionalInCompany {
  id: string;
  type: string;
  quantity: number;
  executionHours: number;
  travelHours: number;
  hourlyRate: number;
}

export interface ExamInCompany {
  id: string;
  name: string;
  quantity: number;
  clientPrice: number;
  costPrice: number;
}

export interface VehicleInCompany {
  id: string;
  type: string;
  distance: number;
  pedagios: number;
  isDoctorOwnCar: boolean;
}
