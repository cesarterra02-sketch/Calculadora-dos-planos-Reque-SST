
import React, { useState, useEffect } from 'react';
import { User, AccessLogEntry } from '../types';
import { Shield, CheckCircle, XCircle, Trash2, Key, List, UserCog, History, Monitor, Calendar, Search, AlertTriangle } from 'lucide-react';

interface AdminViewProps {
  onBack: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ onBack }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<AccessLogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'logs'>('users');
  const [editingPassword, setEditingPassword] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const storedUsers = JSON.parse(localStorage.getItem('reque_users') || '[]');
    const storedLogs = JSON.parse(localStorage.getItem('reque_access_logs') || '[]');
    setUsers(storedUsers);
    setLogs(storedLogs);
  };

  const updateUserStatus = (email: string, isApproved: boolean) => {
    const updatedUsers = users.map(user => user.email === email ? { ...user, isApproved } : user);
    saveUsers(updatedUsers);
  };

  const saveUsers = (updatedUsers: User[]) => {
    localStorage.setItem('reque_users', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
  };

  const deleteUser = (email: string) => {
    if (confirm('Excluir este usuário permanentemente?')) {
      const updatedUsers = users.filter(user => user.email !== email);
      saveUsers(updatedUsers);
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 4) {
      alert('Senha muito curta.');
      return;
    }
    const updatedUsers = users.map(user => 
      user.email === editingPassword ? { ...user, password: newPassword } : user
    );
    saveUsers(updatedUsers);
    
    // Add a log for password change
    const user = users.find(u => u.email === editingPassword);
    if (user) {
      const logsToUpdate: AccessLogEntry[] = JSON.parse(localStorage.getItem('reque_access_logs') || '[]');
      logsToUpdate.unshift({
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        userName: `Admin Editou ${user.name}`,
        userEmail: user.email,
        userAgent: 'Internal System Change',
        action: 'PASSWORD_CHANGE'
      });
      localStorage.setItem('reque_access_logs', JSON.stringify(logsToUpdate.slice(0, 200)));
      setLogs(logsToUpdate.slice(0, 200));
    }

    setEditingPassword(null);
    setNewPassword('');
    alert('Senha atualizada com sucesso!');
  };

  const clearLogs = () => {
    if (confirm('Limpar todo o histórico de logs?')) {
      localStorage.setItem('reque_access_logs', JSON.stringify([]));
      setLogs([]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-reque-navy flex items-center gap-3">
            <Shield className="w-7 h-7 text-reque-orange" />
            Controle de Acesso & Segurança
          </h2>
          <p className="text-slate-500 text-sm">Gerencie usuários, senhas e audite o acesso ao sistema.</p>
        </div>
        <button onClick={onBack} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
          Voltar para Calculadora
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('users')}
          className={`px-6 py-3 text-sm font-bold uppercase tracking-wider flex items-center gap-2 transition-all border-b-2 ${activeTab === 'users' ? 'border-reque-navy text-reque-navy bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <UserCog className="w-4 h-4" /> Gestão de Usuários
        </button>
        <button 
          onClick={() => setActiveTab('logs')}
          className={`px-6 py-3 text-sm font-bold uppercase tracking-wider flex items-center gap-2 transition-all border-b-2 ${activeTab === 'logs' ? 'border-reque-navy text-reque-navy bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <History className="w-4 h-4" /> Log de Acesso
        </button>
      </div>

      {activeTab === 'users' ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-500">
              <tr>
                <th className="px-6 py-4">Nome / E-mail</th>
                <th className="px-6 py-4">Nível</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.email} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-reque-navy">{user.name}</div>
                    <div className="text-xs text-slate-400">{user.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${user.role === 'admin' ? 'bg-reque-navy text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {user.isApproved ? (
                      <span className="text-green-600 font-bold text-xs bg-green-50 px-2 py-1 rounded-full">Ativo</span>
                    ) : (
                      <span className="text-orange-600 font-bold text-xs bg-orange-50 px-2 py-1 rounded-full">Pendente</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      {user.role !== 'admin' && (
                        <>
                          <button onClick={() => updateUserStatus(user.email, !user.isApproved)} className={`p-2 rounded transition-colors ${user.isApproved ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`} title={user.isApproved ? 'Bloquear' : 'Aprovar'}>
                            {user.isApproved ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                          </button>
                          <button onClick={() => setEditingPassword(user.email)} className="p-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors" title="Trocar Senha">
                            <Key className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteUser(user.email)} className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors" title="Excluir">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {user.role === 'admin' && <span className="text-[10px] text-slate-300 font-bold">RESTRITO</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
             <h3 className="text-sm font-bold text-slate-600 uppercase">Últimos 200 registros de acesso</h3>
             <button onClick={clearLogs} className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 transition-all flex items-center gap-1.5">
               <Trash2 className="w-3.5 h-3.5" /> Limpar Histórico
             </button>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="overflow-x-auto">
               <table className="w-full text-left text-sm text-slate-600">
                 <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-500">
                    <tr>
                      <th className="px-6 py-4">Data/Hora</th>
                      <th className="px-6 py-4">Usuário</th>
                      <th className="px-6 py-4">Ação</th>
                      <th className="px-6 py-4">Dispositivo / Agente</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {logs.length === 0 ? (
                     <tr><td colSpan={4} className="p-10 text-center text-slate-400">Nenhum log registrado.</td></tr>
                   ) : logs.map(log => (
                     <tr key={log.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-slate-700">
                             <Calendar className="w-3.5 h-3.5 text-reque-orange" />
                             <span className="font-bold">{new Date(log.timestamp).toLocaleDateString('pt-BR')}</span>
                             <span className="text-xs text-slate-400">{new Date(log.timestamp).toLocaleTimeString('pt-BR')}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-reque-navy">{log.userName}</div>
                          <div className="text-[10px] text-slate-400">{log.userEmail}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-black tracking-widest ${log.action === 'LOGIN' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-2 text-[10px] text-slate-400 italic max-w-xs truncate">
                             <Monitor className="w-3.5 h-3.5 shrink-0" />
                             {log.userAgent}
                           </div>
                        </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        </div>
      )}

      {/* Modal Edição Senha */}
      {editingPassword && (
        <div className="fixed inset-0 z-[100] bg-reque-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-reque-orange/20 rounded-lg">
                  <Key className="w-5 h-5 text-reque-orange" />
                </div>
                <div>
                   <h3 className="font-bold text-reque-navy">Alterar Senha</h3>
                   <p className="text-xs text-slate-400">Usuário: {editingPassword}</p>
                </div>
              </div>
              <form onSubmit={handleChangePassword} className="space-y-4">
                 <div>
                   <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Nova Senha</label>
                   <input 
                     type="password" 
                     autoFocus
                     required
                     value={newPassword}
                     onChange={e => setNewPassword(e.target.value)}
                     className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:border-reque-blue text-sm"
                     placeholder="No mínimo 4 dígitos"
                   />
                 </div>
                 <div className="flex gap-2 pt-2">
                    <button type="button" onClick={() => setEditingPassword(null)} className="flex-1 py-2.5 text-sm font-bold text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200 transition-all">Cancelar</button>
                    <button type="submit" className="flex-1 py-2.5 text-sm font-bold text-white bg-reque-navy rounded-lg hover:bg-reque-blue shadow-lg transition-all">Salvar</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};
