
import React, { useState, useEffect } from 'react';
import { User, AccessLogEntry } from '../types';
import { StorageService } from '../storageService';
import { 
  Shield, 
  Key, 
  History, 
  Monitor, 
  Calendar, 
  UserCog, 
  Check, 
  Loader2, 
  Trash2, 
  Lock, 
  Unlock, 
  FileText, 
  Clock, 
  Truck,
  ShieldCheck,
  UserCheck,
  Calculator
} from 'lucide-react';

interface AdminViewProps {
  onBack: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ onBack }) => {
  const [users, setUsers] = useState<Omit<User, 'password'>[]>([]);
  const [logs, setLogs] = useState<AccessLogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'logs'>('users');
  const [editingPassword, setEditingPassword] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [u, l] = await Promise.all([
      StorageService.getUsers(),
      StorageService.getLogs()
    ]);
    setUsers(u as Omit<User, 'password'>[]);
    setLogs(l);
    setIsLoading(false);
  };

  const deleteUser = async (email: string) => {
    if (confirm('Excluir este usuário permanentemente do Supabase?')) {
      setUsers(prev => prev.filter(u => u.email !== email));
      await StorageService.deleteUser(email);
    }
  };

  const togglePermission = async (email: string, field: keyof User) => {
    const user = users.find(u => u.email === email);
    if (!user) return;

    const newValue = !user[field];
    
    // Atualização Otimista
    setUsers(prev => prev.map(u => u.email === email ? { ...u, [field]: newValue } : u));
    
    try {
      await StorageService.updateUser(email, { [field]: newValue });
    } catch (error) {
      alert('Erro ao atualizar permissão no Supabase.');
      // Reverte se falhar
      setUsers(prev => prev.map(u => u.email === email ? { ...u, [field]: !newValue } : u));
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 4) {
      alert('Senha muito curta.');
      return;
    }
    
    await StorageService.updateUser(editingPassword!, { password: newPassword });
    
    const user = users.find(u => u.email === editingPassword);
    if (user) {
      await StorageService.addLog(user, 'PASSWORD_CHANGE');
      const newLogs = await StorageService.getLogs();
      setLogs(newLogs);
    }

    setEditingPassword(null);
    setNewPassword('');
    alert('Senha atualizada com sucesso no Supabase!');
  };

  const handleClearLogs = async () => {
    if (confirm('Limpar todo o histórico de logs no Supabase?')) {
      await StorageService.clearLogs();
      setLogs([]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-reque-navy flex items-center gap-3">
            <Shield className="w-7 h-7 text-reque-orange" />
            Controle de Acesso & Segurança Cloud
          </h2>
          <p className="text-slate-500 text-sm font-medium">Gestão granular de usuários e auditoria.</p>
        </div>
        <button onClick={onBack} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
          Voltar para Home
        </button>
      </div>

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
          <History className="w-4 h-4" /> Log de Auditoria
        </button>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 bg-white rounded-xl border border-slate-200">
          <Loader2 className="w-8 h-8 animate-spin mb-4" />
          <p className="text-[10px] font-black uppercase tracking-widest">Sincronizando segurança...</p>
        </div>
      ) : activeTab === 'users' ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[9px] uppercase font-black text-slate-500 tracking-wider">
              <tr>
                <th className="px-6 py-4 w-1/4">Usuário</th>
                <th className="px-4 py-4 text-center">Status</th>
                <th className="px-4 py-4 text-center">Admin</th>
                <th className="px-4 py-4 text-center">Planos</th>
                <th className="px-4 py-4 text-center">In Company</th>
                <th className="px-4 py-4 text-center">Histórico</th>
                <th className="px-4 py-4 text-center">Propostas</th>
                <th className="px-6 py-4 text-center">Gestão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.email} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-reque-navy flex items-center gap-2">
                      {user.name}
                      {user.role === 'admin' && <span className="bg-reque-navy text-white text-[8px] px-1.5 py-0.5 rounded uppercase">Master</span>}
                    </div>
                    <div className="text-[10px] text-slate-400">{user.email}</div>
                  </td>
                  
                  {/* Toggles de Permissão */}
                  <td className="px-4 py-4 text-center">
                    <button 
                        onClick={() => togglePermission(user.email, 'isApproved')}
                        className={`p-2 rounded-lg transition-all ${user.isApproved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                        title={user.isApproved ? 'Acesso Liberado' : 'Acesso Bloqueado'}
                    >
                        {user.isApproved ? <ShieldCheck className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    </button>
                  </td>

                  <td className="px-4 py-4 text-center">
                    <button 
                        onClick={() => togglePermission(user.email, 'canAccessAdmin')}
                        className={`p-2 rounded-lg transition-all ${user.canAccessAdmin ? 'bg-reque-navy text-white' : 'bg-slate-100 text-slate-300'}`}
                        title="Acesso Admin"
                    >
                        <UserCheck className="w-4 h-4" />
                    </button>
                  </td>

                  <td className="px-4 py-4 text-center">
                    <button 
                        onClick={() => togglePermission(user.email, 'canAccessCalculator')}
                        className={`p-2 rounded-lg transition-all ${user.canAccessCalculator ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-300'}`}
                        title="Acesso Calculadora Planos"
                    >
                        <Calculator className="w-4 h-4" />
                    </button>
                  </td>

                  <td className="px-4 py-4 text-center">
                    <button 
                        onClick={() => togglePermission(user.email, 'canAccessInCompany')}
                        className={`p-2 rounded-lg transition-all ${user.canAccessInCompany ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-300'}`}
                        title="Acesso In Company"
                    >
                        <Truck className="w-4 h-4" />
                    </button>
                  </td>

                  <td className="px-4 py-4 text-center">
                    <button 
                        onClick={() => togglePermission(user.email, 'canAccessHistory')}
                        className={`p-2 rounded-lg transition-all ${user.canAccessHistory ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-300'}`}
                        title="Acesso Histórico"
                    >
                        <Clock className="w-4 h-4" />
                    </button>
                  </td>

                  <td className="px-4 py-4 text-center">
                    <button 
                        onClick={() => togglePermission(user.email, 'canGenerateProposal')}
                        className={`p-2 rounded-lg transition-all ${user.canGenerateProposal ? 'bg-reque-navy text-reque-orange' : 'bg-slate-100 text-slate-300'}`}
                        title="Gerar Propostas"
                    >
                        <FileText className="w-4 h-4" />
                    </button>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      {user.role !== 'admin' ? (
                        <>
                          <button onClick={() => setEditingPassword(user.email)} className="p-2 bg-slate-100 text-slate-400 hover:text-reque-navy rounded transition-all" title="Trocar Senha">
                            <Key className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteUser(user.email)} className="p-2 bg-slate-100 text-slate-400 hover:text-red-500 rounded transition-all" title="Excluir">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <div className="text-[9px] font-black text-slate-300 italic tracking-widest">MASTER</div>
                      )}
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
             <h3 className="text-sm font-bold text-slate-600 uppercase">Audit Log (Sincronizado)</h3>
             <button onClick={handleClearLogs} className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 transition-all flex items-center gap-1.5">
               <Trash2 className="w-3.5 h-3.5" /> Limpar Logs Cloud
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
                      <th className="px-6 py-4">Agente</th>
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

      {editingPassword && (
        <div className="fixed inset-0 z-[100] bg-reque-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-reque-orange/20 rounded-lg">
                  <Key className="w-5 h-5 text-reque-orange" />
                </div>
                <div>
                   <h3 className="font-bold text-reque-navy">Segurança de Acesso</h3>
                   <p className="text-xs text-slate-400">Alterar senha de: {editingPassword}</p>
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
                     placeholder="Mínimo 4 caracteres"
                   />
                 </div>
                 <div className="flex gap-2 pt-2">
                    <button type="button" onClick={() => setEditingPassword(null)} className="flex-1 py-2.5 text-sm font-bold text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200 transition-all">Cancelar</button>
                    <button type="submit" className="flex-1 py-2.5 text-sm font-bold text-white bg-reque-navy rounded-lg hover:bg-reque-blue shadow-lg transition-all">Salvar Senha</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};
