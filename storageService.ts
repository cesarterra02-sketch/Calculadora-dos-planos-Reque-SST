
import { ProposalHistoryItem, User, AccessLogEntry } from './types';
import { supabase } from './supabaseClient';

/**
 * LISTA DE COLUNAS MAPEADAS PARA DEBUG
 * Utilizada para validar se o objeto de envio (payload) possui chaves que 
 * ainda não foram criadas fisicamente na tabela 'reque_proposals'.
 */
const EXPECTED_COLUMNS = [
  'id', 'type', 'initial_total', 'created_by', 'num_employees', 'external_lives_count',
  'plan', 'risk_level', 'fidelity', 'is_renewal', 'special_discount', 'selected_unit',
  'client_delivery_date', 'doc_delivery_date', 'contact_name', 'razao_social', 
  'cnpj_cliente', 'unidades_customizadas', 'contract_data', 'logradouro', 'fachada', 
  'bairro', 'cidade_uf', 'cep', 'responsavel_legal', 'cpf_responsavel', 
  'unidade_atendimento', 'company_name', 'cnpj', 'in_company_details', 
  'taxa_in_company', 'margem_atendimento_valor', 'margem_alvo_aplicada', 
  'imposto_aplicado', 'comissao_aplicada'
];

/**
 * FUNÇÃO DE DEBUG: Compara as chaves do objeto com o schema esperado.
 */
const debugDatabaseSchema = (payload: any) => {
  const keys = Object.keys(payload);
  const missingColumns = keys.filter(k => !EXPECTED_COLUMNS.includes(k));
  
  if (missingColumns.length > 0) {
    console.group("⚠️ [DEBUG SCHEMA] DIVERGÊNCIA DE PERSISTÊNCIA DETECTADA");
    console.warn("Os seguintes campos no objeto de envio não constam na lista de colunas oficiais do banco de dados:");
    missingColumns.forEach(field => {
      console.warn(`- ${field} (Ação: Criar via SQL no Supabase se for campo persistente)`);
    });
    console.log("Dica SQL: ALTER TABLE reque_proposals ADD COLUMN nome_do_campo TIPO_DADO;");
    console.groupEnd();
  }
};

const mapProposalData = (data: any): ProposalHistoryItem => {
  if (!data) return data;
  const isCred = data.type === 'credenciador';
  
  // Recupera dados do contrato priorizando o objeto JSONB contract_data, com fallback para colunas individuais
  const contractSource = data.contract_data || data;
  
  return {
    id: data.id,
    type: data.type || 'standard',
    createdAt: data.created_at || data.createdAt || data.timestamp || data.inserted_at || new Date().toISOString(),
    createdBy: data.created_by || data.createdBy || '',
    companyName: isCred ? (data.razao_social || data.company_name) : (data.company_name || data.company || data.companyName || ''),
    contactName: data.contact_name || data.contactName || data.contato || data.contact || '',
    cnpj: isCred ? (data.cnpj_cliente || data.cnpj) : (data.cnpj || ''),
    initialTotal: data.initial_total || data.initialTotal || 0,
    numEmployees: data.num_employees || 0,
    // Fix: Alterado de external_lives_count para externalLivesCount para coincidir com a interface ProposalHistoryItem
    externalLivesCount: data.external_lives_count || 0,
    plan: data.plan || '',
    riskLevel: data.risk_level || '',
    fidelity: data.fidelity || '',
    isRenewal: data.is_renewal || false,
    specialDiscount: data.special_discount || 0,
    selectedUnit: data.selected_unit || '',
    clientDeliveryDate: data.client_delivery_date,
    docDeliveryDate: data.doc_delivery_date,
    taxaInCompany: data.taxa_in_company,
    margemAtendimentoValor: data.margem_atendimento_valor,
    margemAlvoAplicada: data.margem_alvo_aplicada,
    impostoAplicado: data.imposto_aplicado,
    comissaoAplicada: data.comissao_aplicada,
    // Recuperação segura do valor psicossocial (coluna física ou objeto JSONB)
    valorAvulsoPsico: data.valor_avulso_psico || data.in_company_details?.valorAvulsoPsico,
    inCompanyDetails: isCred ? { 
      credenciadorUnits: data.unidades_customizadas || data.in_company_details?.credenciadorUnits,
      contractData: {
        logradouro: contractSource.logradouro || '',
        fachada: contractSource.fachada || '',
        bairro: contractSource.bairro || '',
        cidadeUf: contractSource.cidade_uf || contractSource.cidadeUf || '',
        cep: contractSource.cep || '',
        responsavelLegal: contractSource.responsavel_legal || contractSource.responsavelLegal || '',
        cpfResponsavel: contractSource.cpf_responsavel || contractSource.cpfResponsavel || '',
        unidadeAtendimento: contractSource.unidade_atendimento || contractSource.unidadeAtendimento || ''
      }
    } : data.in_company_details
  };
};

const mapUserData = (data: any): User => {
  if (!data) return data;
  return {
    name: data.name || '',
    email: data.email || '',
    password: data.password || '',
    role: data.role || 'user',
    isApproved: data.is_approved || false,
    canAccessAdmin: data.can_access_admin || false,
    canAccessHistory: data.can_access_history !== undefined ? data.can_access_history : true,
    canAccessInCompany: data.can_access_incompany !== undefined ? data.can_access_incompany : true,
    canAccessCalculator: data.can_access_calculator !== undefined ? data.can_access_calculator : true,
    canAccessCredenciador: data.can_access_credenciador !== undefined ? data.can_access_credenciador : false,
    canAccessVendaAvulsaPsico: data.can_access_venda_avulsa_psico !== undefined ? data.can_access_venda_avulsa_psico : false,
    canGenerateProposal: data.can_generate_proposal || false
  };
};

const sanitizeUserForDb = (user: User) => {
  return {
    name: user.name,
    email: user.email.toLowerCase(),
    password: user.password,
    role: user.role,
    is_approved: user.isApproved,
    can_access_admin: user.canAccessAdmin,
    can_access_history: user.canAccessHistory,
    can_access_incompany: user.canAccessInCompany,
    can_access_calculator: user.canAccessCalculator,
    can_access_credenciador: user.canAccessCredenciador,
    can_access_venda_avulsa_psico: user.canAccessVendaAvulsaPsico,
    can_generate_proposal: user.canGenerateProposal
  };
};

const sanitizeProposalForDb = (item: ProposalHistoryItem) => {
  const isCred = item.type === 'credenciador';
  
  // 1. Modularização: Dados básicos comuns
  const dbData: any = {
    type: item.type,
    initial_total: Number(item.initialTotal) || 0,
    created_by: item.createdBy,
    num_employees: item.numEmployees,
    external_lives_count: item.externalLivesCount,
    plan: item.plan,
    risk_level: item.riskLevel,
    fidelity: item.fidelity,
    is_renewal: Boolean(item.isRenewal),
    special_discount: Number(item.specialDiscount) || 0,
    selected_unit: item.selectedUnit,
    client_delivery_date: item.clientDeliveryDate,
    doc_delivery_date: item.docDeliveryDate,
    contact_name: item.contactName,
  };

  if (isCred) {
    // 1. Modularização: Dados básicos do Credenciador
    dbData.razao_social = item.companyName;
    dbData.cnpj_cliente = item.cnpj;
    dbData.unidades_customizadas = item.inCompanyDetails?.credenciadorUnits;
    
    // 2. Estrutura de Saída: Agrupamento de campos dentro de contract_data (JSONB)
    const cd = item.inCompanyDetails?.contractData;
    if (cd) {
      dbData.contract_data = {
        logradouro: cd.logradouro,
        fachada: cd.fachada,
        bairro: cd.bairro,
        cidade_uf: cd.cidadeUf, // Mapeamento obrigatório do input CIDADE-UF
        cep: cd.cep,
        responsavel_legal: cd.responsavelLegal,
        cpf_responsavel: cd.cpfResponsavel,
        unidade_atendimento: cd.unidadeAtendimento
      };
      
      // Sincronização redundante para colunas individuais (caso existam no schema flat)
      dbData.logradouro = cd.logradouro;
      dbData.fachada = cd.fachada;
      dbData.bairro = cd.bairro;
      dbData.cidade_uf = cd.cidadeUf; 
      dbData.cep = cd.cep;
      dbData.responsavel_legal = cd.responsavelLegal;
      dbData.cpf_responsavel = cd.cpfResponsavel;
      dbData.unidade_atendimento = cd.unidadeAtendimento;
    }
  } else if (item.type === 'venda_avulsa_psico') {
    dbData.company_name = item.companyName;
    dbData.cnpj = item.cnpj;
    // FIX CIRÚRGICO: Armazena o valor psicossocial no JSONB in_company_details 
    // para evitar erro de 'column not found' caso a coluna física não exista.
    dbData.in_company_details = {
      valorAvulsoPsico: item.valorAvulsoPsico
    };
  } else {
    dbData.company_name = item.companyName;
    dbData.cnpj = item.cnpj;
    dbData.in_company_details = item.inCompanyDetails;
    dbData.taxa_in_company = item.taxaInCompany;
    dbData.margem_atendimento_valor = item.margemAtendimentoValor;
    dbData.margem_alvo_aplicada = item.margemAlvoAplicada;
    dbData.imposto_aplicado = item.impostoAplicado;
    // Fix: Corrected property name from 'comissaoApplied' to 'comissaoAplicada' to match interface
    dbData.comissao_aplicada = item.comissaoAplicada;
  }

  // 3. Segurança de ID: Não envia id se for um novo registro (permite UUID automático do Supabase)
  if (item.id) {
    dbData.id = item.id;
  }
  
  return dbData;
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

  getHistory: async (identifier?: string, isAdmin: boolean = false): Promise<ProposalHistoryItem[]> => {
    try {
      let query = supabase.from('reque_proposals').select('*');
      if (!isAdmin && identifier) {
        query = query.eq('created_by', identifier);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(mapProposalData).sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error: any) {
      console.error('Erro ao buscar histórico:', error?.message || error);
      return [];
    }
  },

  addHistoryItem: async (item: ProposalHistoryItem): Promise<ProposalHistoryItem> => {
    try {
      const dbItem = sanitizeProposalForDb(item);
      
      // EXECUÇÃO DO DEBUG ANTES DA PERSISTÊNCIA
      debugDatabaseSchema(dbItem);

      const { data, error } = await supabase
        .from('reque_proposals')
        .upsert([dbItem], { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        console.error('ERRO DE SCHEMA/DB SUPABASE:', error);
        throw error;
      }
      return mapProposalData(data);
    } catch (error: any) {
      console.error("LOG DETALHADO - ERRO STORAGE SERVICE:", error);
      throw new Error(error?.message || 'Erro ao salvar proposta no banco de dados');
    }
  },

  deleteProposal: async (id: string): Promise<void> => {
    try {
      const { error } = await supabase.from('reque_proposals').delete().eq('id', id);
      if (error) throw error;
    } catch (error: any) {
      throw new Error(error?.message || 'Erro ao deletar proposta');
    }
  },

  getUserForLogin: async (identifier: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase.from('reque_users').select('*').eq('email', identifier).maybeSingle(); 
      if (error) throw error;
      return !data ? null : mapUserData(data);
    } catch (error: any) {
      throw new Error(error?.message || 'Erro no login');
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
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.password !== undefined) dbUpdates.password = updates.password;
    if (updates.role !== undefined) dbUpdates.role = updates.role;
    if (updates.isApproved !== undefined) dbUpdates.is_approved = updates.isApproved;
    if (updates.canAccessAdmin !== undefined) dbUpdates.can_access_admin = updates.canAccessAdmin;
    if (updates.canAccessHistory !== undefined) dbUpdates.can_access_history = updates.canAccessHistory;
    if (updates.canAccessInCompany !== undefined) dbUpdates.can_access_incompany = updates.canAccessInCompany;
    if (updates.canAccessCalculator !== undefined) dbUpdates.can_access_calculator = updates.canAccessCalculator;
    if (updates.canAccessCredenciador !== undefined) dbUpdates.can_access_credenciador = updates.canAccessCredenciador;
    if (updates.canAccessVendaAvulsaPsico !== undefined) dbUpdates.can_access_venda_avulsa_psico = updates.canAccessVendaAvulsaPsico;
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
      console.error('Erro ao buscar logs:', error?.message || error);
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
    } catch (err) {
      console.error("Erro crítico ao registrar log no banco:", err);
    }
  },

  clearLogs: async () => {
    await supabase.from('reque_access_logs').delete().not('id', 'is', null);
  },

  getPaymentSettings: async (): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('reque_payment_settings')
        .select('*');
      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Erro ao buscar configurações de pagamento:', error);
      return [];
    }
  },

  updatePaymentSettings: async (settings: { installment_number: number; interest_rate: number }[]): Promise<void> => {
    try {
      const { error } = await supabase.from('reque_payment_settings').upsert(settings, { onConflict: 'installment_number' });
      if (error) throw error;
    } catch (error: any) {
      throw new Error(error?.message || 'Erro ao atualizar configurações de pagamento');
    }
  }
};
