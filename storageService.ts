
import { ProposalHistoryItem, User, AccessLogEntry } from './types';

const KEYS = {
  HISTORY: 'reque_proposal_history',
  USERS: 'reque_users',
  LOGS: 'reque_access_logs'
};

export const StorageService = {
  // --- HISTÓRICO DE PROPOSTAS ---
  getHistory: (): ProposalHistoryItem[] => {
    const data = localStorage.getItem(KEYS.HISTORY);
    return data ? JSON.parse(data) : [];
  },

  saveHistory: (history: ProposalHistoryItem[]) => {
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(history));
  },

  addHistoryItem: (item: ProposalHistoryItem) => {
    const history = StorageService.getHistory();
    const newHistory = [item, ...history];
    StorageService.saveHistory(newHistory);
    return newHistory;
  },

  // --- USUÁRIOS ---
  getUsers: (): User[] => {
    const data = localStorage.getItem(KEYS.USERS);
    const users = data ? JSON.parse(data) : [];
    
    // Garantir que o admin padrão exista
    const adminExists = users.some((u: User) => u.email === 'cesguitar');
    if (!adminExists) {
      const defaultAdmin: User = {
        name: 'Administrador Mestre',
        email: 'cesguitar',
        password: 'brasil#02',
        role: 'admin',
        isApproved: true,
        canAccessAdmin: true,
        canAccessHistory: true,
        canGenerateProposal: true
      };
      users.unshift(defaultAdmin);
      StorageService.saveUsers(users);
    }
    return users;
  },

  saveUsers: (users: User[]) => {
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  },

  // --- LOGS DE ACESSO ---
  getLogs: (): AccessLogEntry[] => {
    const data = localStorage.getItem(KEYS.LOGS);
    return data ? JSON.parse(data) : [];
  },

  addLog: (user: User, action: AccessLogEntry['action']) => {
    const logs = StorageService.getLogs();
    const newLog: AccessLogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      userName: user.name,
      userEmail: user.email,
      userAgent: navigator.userAgent,
      action
    };
    const updatedLogs = [newLog, ...logs].slice(0, 500); // Manter últimos 500
    localStorage.setItem(KEYS.LOGS, JSON.stringify(updatedLogs));
    return updatedLogs;
  },

  clearLogs: () => {
    localStorage.setItem(KEYS.LOGS, JSON.stringify([]));
  }
};
