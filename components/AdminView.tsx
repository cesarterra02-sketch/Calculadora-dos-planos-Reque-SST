
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
  Loader2, 
  Trash2, 
  Lock, 
  FileText, 
  Clock, 
  Truck,
  ShieldCheck,
  UserCheck,
  Calculator,
  User as UserIcon
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
    setUsers(prev => prev.map(u => u.email === email ? { ...u, [field]: newValue } : u));
    
    try {
      await StorageService.updateUser(email, { [field]: newValue });
    } catch (error) {
      alert('Erro ao atualizar permissão no Supabase.');
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
          <p className="text-slate-500 text-sm font-medium">Gestão granular de usuários e auditoria de acessos.</p>
        </div>
        <button onClick={onBack} className="px-5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:border-slate-400 transition-all shadow-sm">
          Voltar para Home
        </button>
      </div>

      <div className="flex border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('users')}
          className={`px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-all border-b-2 ${activeTab === 'users' ? 'border-reque-orange text-reque-navy bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <UserCog className="w-4 h-4" /> Gestão de Usuários
        </button>
        <button 
          onClick={() => setActiveTab('logs')}
          className={`px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-all border-b-2 ${activeTab === 'logs' ? 'border-reque-orange text-reque-navy bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <History className="w-4 h-4" /> Log de Auditoria
        </button>
      </div>

      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center text-slate-400 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <Loader2 className="w-10 h-10 animate-spin mb-4 text-reque-orange" />
          <p className="text-[10px] font-black uppercase tracking-widest">Sincronizando segurança...</p>
        </div>
      ) : activeTab === 'users' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[9px] uppercase font-black text-slate-500 tracking-[0.2em]">
              <tr>
                <th className="px-6 py-5 w-1/4">Perfil do Usuário</th>
                <th className="px-4 py-5 text-center">Status</th>
                <th className="px-4 py-5 text-center">Admin</th>
                <th className="px-4 py-5 text-center">Planos</th>
                <th className="px-4 py-5 text-center">In Company</th>
                <th className="px-4 py-5 text-center">Histórico</th>
                <th className="px-4 py-5 text-center">Propostas</th>
                <th className="px-6 py-5 text-center">Gestão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.email} className="hover:bg-slate-50/50 transition-all group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs border shrink-0 transition-all ${user.role === 'admin' ? 'bg-[#190c59] text-white border-[#190c59] shadow-lg shadow-reque-navy/20' : 'bg-white text-reque-navy border-slate-200 group-hover:border-reque-orange/30 shadow-sm'}`}>
                        {user.name?.charAt(0) || <UserIcon className="w-4 h-4" />}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="font-black text-reque-navy flex items-center gap-2 truncate text-xs uppercase tracking-tight">
                          {user.name}
                          {user.role === 'admin' && (
                            <span className="bg-[#ec9d23] text-[#190c59] text-[7px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-tighter shadow-sm">
                              MASTER
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold truncate tracking-tight">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-4 py-4 text-center">
                    <button onClick={() => togglePermission(user.email, 'isApproved')} className={`p-2.5 rounded-xl transition-all border ${user.isApproved ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                      {user.isApproved ? <ShieldCheck className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    </button>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button onClick={() => togglePermission(user.email, 'canAccessAdmin')} className={`p-2.5 rounded-xl transition-all border ${user.canAccessAdmin ? 'bg-[#190c59] text-white border-[#190c59] shadow-sm' : 'bg-slate-50 text-slate-300 border-slate-100'}`}>
                      <UserCheck className="w-4 h-4" />
                    </button>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button onClick={() => togglePermission(user.email, 'canAccessCalculator')} className={`p-2.5 rounded-xl transition-all border ${user.canAccessCalculator ? 'bg-indigo-50 text-indigo-700 border-indigo-100 shadow-sm' : 'bg-slate-50 text-slate-300 border-slate-100'}`}>
                      <Calculator className="w-4 h-4" />
                    </button>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button onClick={() => togglePermission(user.email, 'canAccessInCompany')} className={`p-2.5 rounded-xl transition-all border ${user.canAccessInCompany ? 'bg-orange-50 text-orange-700 border-orange-100 shadow-sm' : 'bg-slate-50 text-slate-300 border-slate-100'}`}>
                      <Truck className="w-4 h-4" />
                    </button>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button onClick={() => togglePermission(user.email, 'canAccessHistory')} className={`p-2.5 rounded-xl transition-all border ${user.canAccessHistory ? 'bg-blue-50 text-blue-700 border-blue-100 shadow-sm' : 'bg-slate-50 text-slate-300 border-slate-100'}`}>
                      <Clock className="w-4 h-4" />
                    </button>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button onClick={() => togglePermission(user.email, 'canGenerateProposal')} className={`p-2.5 rounded-xl transition-all border ${user.canGenerateProposal ? 'bg-[#190c59] text-[#ec9d23] border-[#190c59] shadow-sm' : 'bg-slate-50 text-slate-300 border-slate-100'}`}>
                      <FileText className="w-4 h-4" />
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                      {user.role !== 'admin' ? (
                        <>
                          <button onClick={() => setEditingPassword(user.email)} className="p-2.5 bg-slate-100 text-slate-500 hover:text-reque-navy hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition-all"><Key className="w-4 h-4" /></button>
                          <button onClick={() => deleteUser(user.email)} className="p-2.5 bg-slate-100 text-slate-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                        </>
                      ) : (
                        <div className="text-[8px] font-black text-slate-300 italic tracking-[0.2em] bg-slate-50 px-3 py-1 rounded border border-slate-100 uppercase">Master Admin</div>
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
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
             <div>
               <h3 className="text-[10px] font-black text-reque-navy uppercase tracking-widest">Log de Auditoria Cloud</h3>
               <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Histórico de ações críticas sincronizadas</p>
             </div>
             <button onClick={handleClearLogs} className="text-[10px] font-black text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl border border-red-100 transition-all flex items-center gap-2 uppercase tracking-widest">
               <Trash2 className="w-3.5 h-3.5" /> Limpar Logs Cloud
             </button>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="overflow-x-auto">
               <table className="w-full text-left text-sm text-slate-600">
                 <thead className="bg-slate-50 border-b border-slate-200 text-[9px] uppercase font-black text-slate-500 tracking-[0.2em]">
                    <tr>
                      <th className="px-6 py-5">Data/Hora</th>
                      <th className="px-6 py-5">Usuário Ativo</th>
                      <th className="px-6 py-5 text-center">Ação</th>
                      <th className="px-6 py-5">Status Local</th>
                      <th className="px-6 py-5">Agente de Acesso</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {logs.length === 0 ? (
                     <tr><td colSpan={5} className="p-16 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">Nenhum log registrado no Supabase.</td></tr>
                   ) : logs.map(log => (
                     <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-slate-700">
                             <Calendar className="w-3.5 h-3.5 text-reque-orange" />
                             <span className="font-bold text-xs">{new Date(log.timestamp).toLocaleDateString('pt-BR')}</span>
                             <span className="text-[10px] text-slate-400 font-bold">{new Date(log.timestamp).toLocaleTimeString('pt-BR')}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-black text-reque-navy uppercase text-xs">{log.userName}</div>
                          <div className="text-[9px] text-slate-400 font-bold">{log.userEmail}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded-md text-[9px] font-black tracking-widest border uppercase shadow-sm ${log.action === 'LOGIN' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-slate-300 font-black italic uppercase text-[9px]">
                            Acesso Web Standard
                          </div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-2 text-[9px] text-slate-400 font-bold italic max-w-xs truncate bg-slate-50 p-2 rounded-lg border border-slate-100">
                             <Monitor className="w-3 h-3 shrink-0" />
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
        <div className="fixed inset-0 z-[100] bg-reque-navy/70 backdrop-blur-md flex items-center justify-center p-4">
           <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm border border-white/20">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-reque-orange/10 rounded-2xl border border-reque-orange/20 shadow-sm"><Key className="w-6 h-6 text-reque-orange" /></div>
                <div>
                   <h3 className="font-black text-reque-navy uppercase tracking-tight text-lg leading-none">Redefinição</h3>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 truncate max-w-[200px]">{editingPassword}</p>
                </div>
              </div>
              <form onSubmit={handleChangePassword} className="space-y-6">
                 <div>
                   <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest ml-1">Senha Nova Cloud</label>
                   <input type="password" autoFocus required value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" placeholder="Min. 4 caracteres" />
                 </div>
                 <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setEditingPassword(null)} className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all">Cancelar</button>
                    <button type="submit" className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-white bg-[#190c59] rounded-xl hover:bg-reque-blue shadow-xl transition-all">Alterar Agora</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};
