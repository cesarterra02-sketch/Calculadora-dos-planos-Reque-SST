import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Shield, CheckCircle, XCircle, Trash2, UserCog, AlertTriangle } from 'lucide-react';

interface AdminViewProps {
  onBack: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ onBack }) => {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    const storedUsers = JSON.parse(localStorage.getItem('reque_users') || '[]');
    setUsers(storedUsers);
  };

  const updateUserStatus = (email: string, isApproved: boolean) => {
    const updatedUsers = users.map(user => {
      if (user.email === email) {
        return { ...user, isApproved };
      }
      return user;
    });
    localStorage.setItem('reque_users', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
  };

  const deleteUser = (email: string) => {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      const updatedUsers = users.filter(user => user.email !== email);
      localStorage.setItem('reque_users', JSON.stringify(updatedUsers));
      setUsers(updatedUsers);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-reque-navy flex items-center gap-3">
          <Shield className="w-6 h-6 text-reque-orange" />
          Controle de Acesso
        </h2>
        <button 
          onClick={onBack}
          className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Voltar
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-start gap-3 bg-blue-50 p-4 rounded-lg text-blue-800 text-sm">
             <AlertTriangle className="w-5 h-5 shrink-0" />
             <p>
               Usuários com status <strong>Pendente</strong> não conseguem acessar o sistema. 
               Aprove o cadastro para liberar o acesso às ferramentas de cálculo.
             </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-500">
              <tr>
                <th className="px-6 py-4">Usuário</th>
                <th className="px-6 py-4">Login (E-mail)</th>
                <th className="px-6 py-4">Função</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.email} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-reque-navy">
                    {user.name}
                  </td>
                  <td className="px-6 py-4">
                    {user.email}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase ${user.role === 'admin' ? 'bg-reque-navy text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {user.isApproved ? (
                      <span className="inline-flex items-center gap-1 text-green-600 font-bold text-xs bg-green-50 px-2 py-1 rounded-full">
                        <CheckCircle className="w-3 h-3" /> Aprovado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-orange-600 font-bold text-xs bg-orange-50 px-2 py-1 rounded-full">
                        <UserCog className="w-3 h-3" /> Pendente
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {user.role !== 'admin' && (
                      <div className="flex items-center justify-center gap-2">
                        {!user.isApproved ? (
                          <button 
                            onClick={() => updateUserStatus(user.email, true)}
                            className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                            title="Aprovar Acesso"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        ) : (
                          <button 
                            onClick={() => updateUserStatus(user.email, false)}
                            className="p-1.5 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
                            title="Bloquear Acesso"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        
                        <button 
                          onClick={() => deleteUser(user.email)}
                          className="p-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors ml-2"
                          title="Excluir Usuário"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
