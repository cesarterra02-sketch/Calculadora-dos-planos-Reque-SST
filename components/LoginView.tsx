
import React, { useState, useEffect } from 'react';
import { User as UserIcon, Lock, ArrowRight, Loader2, ShieldCheck, Mail, AlertCircle } from 'lucide-react';
import { User, AccessLogEntry } from '../types';

interface LoginViewProps {
  onLogin: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const users: User[] = JSON.parse(localStorage.getItem('reque_users') || '[]');
    const adminExists = users.some(u => u.email === 'cesguitar');
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
      const cleanUsers = users.filter(u => u.email !== 'cesguitar');
      cleanUsers.unshift(defaultAdmin);
      localStorage.setItem('reque_users', JSON.stringify(cleanUsers));
    }
  }, []);

  const createAccessLog = (user: User) => {
    const logs: AccessLogEntry[] = JSON.parse(localStorage.getItem('reque_access_logs') || '[]');
    logs.unshift({
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      userName: user.name,
      userEmail: user.email,
      userAgent: navigator.userAgent,
      action: 'LOGIN'
    });
    localStorage.setItem('reque_access_logs', JSON.stringify(logs.slice(0, 200)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    setTimeout(() => {
      const users: User[] = JSON.parse(localStorage.getItem('reque_users') || '[]');
      if (isRegistering) {
        if (password !== confirmPassword) {
          setError('As senhas não coincidem.');
          setIsLoading(false);
          return;
        }
        if (password.length < 4) {
          setError('A senha deve ter no mínimo 4 caracteres.');
          setIsLoading(false);
          return;
        }
        if (users.find(u => u.email === email)) {
          setError('Usuário já cadastrado.');
          setIsLoading(false);
          return;
        }
        users.push({ 
          name, 
          email, 
          password, 
          role: 'user', 
          isApproved: false,
          canAccessAdmin: false,
          canAccessHistory: true,
          canGenerateProposal: false 
        });
        localStorage.setItem('reque_users', JSON.stringify(users));
        setSuccessMsg('Cadastro solicitado! Aguarde a aprovação.');
        setIsRegistering(false);
        setPassword('');
        setConfirmPassword('');
      } else {
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
          if (user.isApproved) {
            createAccessLog(user);
            onLogin(user);
          } else {
            setError('Cadastro aguardando aprovação.');
          }
        } else {
          setError('Credenciais inválidas.');
        }
      }
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen flex bg-[#f8f9fc] font-sans items-center justify-center p-6">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-[#190c59] tracking-tight leading-none">Reque</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">SST Pricing Expert 2025</p>
        </div>

        <h2 className="text-xl font-bold text-slate-800 mb-6">{isRegistering ? 'Solicitar Cadastro' : 'Acesse sua conta'}</h2>

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex gap-2 items-center"><AlertCircle className="w-4 h-4 shrink-0" /> {error}</div>}
        {successMsg && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600 flex gap-2 items-center"><ShieldCheck className="w-4 h-4 shrink-0" /> {successMsg}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 uppercase">Nome Completo</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg outline-none focus:border-[#190c59] text-sm" placeholder="Seu nome" />
              </div>
            </div>
          )}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-500 uppercase">Usuário (E-mail)</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input type="text" required value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg outline-none focus:border-[#190c59] text-sm" placeholder="usuario@reque.com.br" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-500 uppercase">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg outline-none focus:border-[#190c59] text-sm" placeholder="••••••••" />
            </div>
          </div>
          {isRegistering && (
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 uppercase">Confirmar Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg outline-none focus:border-[#190c59] text-sm" placeholder="Repita a senha" />
              </div>
            </div>
          )}
          <button type="submit" disabled={isLoading} className="w-full py-3 bg-[#190c59] text-white rounded-lg font-bold shadow-lg hover:bg-[#1a067c] transition-all flex justify-center items-center gap-2 mt-4">
            {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : <>{isRegistering ? 'Solicitar Acesso' : 'Entrar no Sistema'} <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
           <button onClick={() => {setIsRegistering(!isRegistering); setError(null); setSuccessMsg(null);}} className="text-sm font-bold text-[#190c59] hover:underline">
             {isRegistering ? 'Voltar para o Login' : 'Não tem conta? Solicitar Cadastro'}
           </button>
        </div>
      </div>
    </div>
  );
};
