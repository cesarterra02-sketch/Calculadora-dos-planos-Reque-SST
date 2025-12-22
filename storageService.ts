
import { ProposalHistoryItem, User, AccessLogEntry } from './types';
import { supabase } from './supabaseClient';

/**
 * Mapeia os dados do banco para o frontend de forma resiliente.
 */
const mapProposalData = (data: any): ProposalHistoryItem => {
  if (!data) return data;
  return {
    id: data.id,
    type: data.type || 'standard',
    createdAt: data.created_at || data.createdAt || data.timestamp || data.inserted_at || new Date().toISOString(),
    companyName: data.company_name || data.companyName || data.empresa || data.company || data.name || '',
    contactName: data.contact_name || data.contactName || data.contato || data.contact || '',
    cnpj: data.cnpj || '',
    initialTotal: data.initial_total || data.initialTotal || data.valor_total || data.total || data.value || 0,
    numEmployees: data.num_employees || data.num_employees || data.vidas || 0,
    plan: data.plan || data.plano || '',
    riskLevel: data.risk_level || data.risk_level || '',
    fidelity: data.fidelity || data.fidelidade || '',
    selectedUnit: data.selected_unit || data.unidade || '',
    clientDeliveryDate: data.client_delivery_date || data.data_entrega_cliente,
    docDeliveryDate: data.doc_delivery_date || data.data_entrega_doc,
    inCompanyDetails: data.in_company_details || data.detalhes_incompany
  };
};

/**
 * Mapeia usuário do banco (snake_case) para o tipo User (camelCase)
 */
const mapUserData = (data: any): User => {
  if (!data) return data;
  return {
    name: data.name || '',
    email: data.email || '',
    password: data.password || '',
    role: data.role || 'user',
    isApproved: data.is_approved || data.isApproved || false,
    canAccessAdmin: data.can_access_admin || data.canAccessAdmin || false,
    canAccessHistory: data.can_access_history !== undefined ? data.can_access_history : (data.canAccessHistory || true),
    canGenerateProposal: data.can_generate_proposal || data.canGenerateProposal || false
  };
};

/**
 * Prepara usuário para o banco (snake_case)
 */
const sanitizeUserForDb = (user: User) => {
  return {
    name: user.name,
    email: user.email.toLowerCase(),
    password: user.password,
    role: user.role,
    is_approved: user.isApproved,
    can_access_admin: user.canAccessAdmin,
    can_access_history: user.canAccessHistory,
    can_generate_proposal: user.canGenerateProposal
  };
};

/**
 * Prepara o objeto para persistência no banco.
 */
const sanitizeProposalForDb = (item: ProposalHistoryItem) => {
  const dbObj: any = {
    id: item.id,
    type: item.type,
    cnpj: item.cnpj,
    company_name: item.companyName, 
    contact_name: item.contactName,
    initial_total: item.initialTotal
  };

  if (item.numEmployees !== undefined) dbObj.num_employees = item.numEmployees;
  if (item.plan) dbObj.plan = item.plan;
  if (item.riskLevel) dbObj.risk_level = item.riskLevel;
  if (item.fidelity) dbObj.fidelity = item.fidelity;
  if (item.selectedUnit) dbObj.selected_unit = item.selectedUnit;
  if (item.clientDeliveryDate) dbObj.client_delivery_date = item.clientDeliveryDate;
  if (item.docDeliveryDate) dbObj.doc_delivery_date = item.docDeliveryDate;
  if (item.inCompanyDetails) dbObj.in_company_details = item.inCompanyDetails;

  return dbObj;
};

export const StorageService = {
  testConnection: async (): Promise<boolean> => {
    try {
      const { error } = await supabase.from('reque_users').select('count', { count: 'exact', head: true });
      return !error;
    } catch {
      return false;
    }
  },

  getHistory: async (): Promise<ProposalHistoryItem[]> => {
    try {
      const { data, error } = await supabase.from('reque_proposals').select('*');
      if (error) throw error;
      return (data || []).map(mapProposalData).sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error: any) {
      console.error('Erro ao buscar histórico:', error.message);
      return [];
    }
  },

  addHistoryItem: async (item: ProposalHistoryItem): Promise<ProposalHistoryItem> => {
    try {
      const dbItem = sanitizeProposalForDb(item);
      const { data, error } = await supabase.from('reque_proposals').insert([dbItem]).select().single();
      if (error) throw error;
      return mapProposalData(data);
    } catch (error: any) {
      console.error('Erro ao salvar proposta:', error.message);
      throw error;
    }
  },

  getUserForLogin: async (identifier: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase.from('reque_users').select('*').eq('email', identifier).maybeSingle(); 
      return (error || !data) ? null : mapUserData(data);
    } catch {
      return null;
    }
  },

  getUsers: async (): Promise<Omit<User, 'password'>[]> => {
    try {
      const { data, error } = await supabase.from('reque_users').select('*');
      return error ? [] : (data || []).map(mapUserData);
    } catch {
      return [];
    }
  },

  saveUsers: async (users: User[]) => {
    const dbUsers = users.map(sanitizeUserForDb);
    const { error } = await supabase.from('reque_users').upsert(dbUsers, { onConflict: 'email' });
    if (error) throw error;
  },

  updateUser: async (email: string, updates: Partial<User>) => {
    // Se updates tiver campos em camelCase, precisamos mapear para snake_case
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.password !== undefined) dbUpdates.password = updates.password;
    if (updates.role !== undefined) dbUpdates.role = updates.role;
    if (updates.isApproved !== undefined) dbUpdates.is_approved = updates.isApproved;
    if (updates.canAccessAdmin !== undefined) dbUpdates.can_access_admin = updates.canAccessAdmin;
    if (updates.canAccessHistory !== undefined) dbUpdates.can_access_history = updates.canAccessHistory;
    if (updates.canGenerateProposal !== undefined) dbUpdates.can_generate_proposal = updates.canGenerateProposal;

    const { error } = await supabase.from('reque_users').update(dbUpdates).eq('email', email);
    if (error) throw error;
  },

  deleteUser: async (email: string) => {
    const { error } = await supabase.from('reque_users').delete().eq('email', email);
    if (error) throw error;
  },

  getLogs: async (): Promise<AccessLogEntry[]> => {
    try {
      const { data, error } = await supabase.from('reque_access_logs').select('*');
      if (error) throw error;
      return (data || []).map((l: any) => ({
        id: l.id,
        timestamp: l.created_at || l.timestamp || new Date().toISOString(),
        userName: l.user_name || 'Usuário',
        userEmail: l.user_email || '',
        action: l.action,
        userAgent: l.user_agent || ''
      })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error: any) {
      return [];
    }
  },

  addLog: async (user: User | {name: string, email: string}, action: string) => {
    try {
      const dbLog = {
        id: crypto.randomUUID(),
        user_name: user.name,
        user_email: user.email,
        action: action,
        user_agent: navigator.userAgent
      };
      await supabase.from('reque_access_logs').insert([dbLog]);
    } catch (e) {}
  },

  clearLogs: async () => {
    await supabase.from('reque_access_logs').delete().not('id', 'is', null);
  }
};
