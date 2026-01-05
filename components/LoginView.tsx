
import React, { useState } from 'react';
import { User as UserIcon, Lock, ArrowRight, Loader2, ShieldCheck, UserCircle, AlertCircle } from 'lucide-react';
import { User } from '../types';
import { StorageService } from '../storageService';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const identifier = email.trim().toLowerCase();
      
      if (isRegistering) {
        if (password !== confirmPassword) {
          setError('As senhas não coincidem.');
          setIsLoading(false);
          return;
        }
        
        let existingUser = null;
        try {
          existingUser = await StorageService.getUserForLogin(identifier);
        } catch (e) {}
        
        if (existingUser) {
          setError('Este usuário já está cadastrado no sistema.');
          setIsLoading(false);
          return;
        }

        const isMasterAdmin = identifier === 'cesguitar' || identifier === 'danielreque';
        
        const newUser: User = { 
          name: name.trim() || (isMasterAdmin ? (identifier === 'cesguitar' ? 'CESAR TERRA' : 'DANIEL REQUE') : ''), 
          email: identifier, 
          password, 
          role: isMasterAdmin ? 'admin' : 'user', 
          isApproved: isMasterAdmin,
          canAccessAdmin: isMasterAdmin,
          canAccessHistory: isMasterAdmin, 
          canAccessInCompany: isMasterAdmin,
          canAccessCalculator: isMasterAdmin,
          canGenerateProposal: isMasterAdmin 
        };
        
        await StorageService.saveUsers([newUser]);
        
        if (isMasterAdmin) {
          setSuccessMsg(`Bem-vindo, ${newUser.name}! Seu acesso de Administrador Master foi configurado com sucesso.`);
        } else {
          setSuccessMsg('Cadastro solicitado com sucesso! Por segurança, seu acesso deve ser aprovado por um administrador antes do login.');
        }
        
        setIsRegistering(false);
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      } else {
        const user = await StorageService.getUserForLogin(identifier);
        
        if (user && user.password === password) {
          const isMasterAdmin = identifier === 'cesguitar' || identifier === 'danielreque';
          
          if (user.isApproved || isMasterAdmin) {
            // Log de acesso estritamente básico (Segurança Estável)
            await StorageService.addLog(user, 'LOGIN');
            onLogin(user);
          } else {
            setError('Seu cadastro está pendente de aprovação pela administração.');
          }
        } else {
          setError('Usuário ou senha incorretos.');
        }
      }
    } catch (err: any) {
      console.error('Erro na operação de login:', err);
      setError(`Erro no Sistema: ${err.message || String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fc] font-sans items-center justify-center p-6">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-[#190c59] tracking-tight leading-none">Reque</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">SST Pricing Expert (Cloud Security)</p>
        </div>

        <h2 className="text-xl font-bold text-slate-800 mb-6">
          {isRegistering ? 'Solicitar Cadastro' : 'Acesse o Painel Reque'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-[11px] text-red-600 flex gap-2 items-start animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> 
            <div className="flex-1 break-words">{error}</div>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-600 flex gap-2 items-center animate-in fade-in slide-in-from-top-1">
            <ShieldCheck className="w-4 h-4 shrink-0" /> {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 uppercase">Nome Completo</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  required 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg outline-none focus:border-reque-navy text-sm font-bold uppercase" 
                  placeholder="SEU NOME" 
                />
              </div>
            </div>
          )}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-500 uppercase">Usuário / ID</label>
            <div className="relative">
              <UserCircle className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                required 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg outline-none focus:border-reque-navy text-sm font-bold" 
                placeholder="Ex: danielreque" 
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-500 uppercase">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input 
                type="password" 
                required 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg outline-none focus:border-reque-navy text-sm" 
                placeholder="••••••••" 
              />
            </div>
          </div>
          {isRegistering && (
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 uppercase">Confirmar Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input 
                  type="password" 
                  required 
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg outline-none focus:border-reque-navy text-sm" 
                  placeholder="Repita a senha" 
                />
              </div>
            </div>
          )}
          <button 
            type="submit" 
            disabled={isLoading} 
            className="w-full py-3 bg-[#190c59] text-white rounded-lg font-bold shadow-lg hover:bg-reque-blue transition-all flex justify-center items-center gap-2 mt-4 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : (
              <>
                {isRegistering ? 'Criar Acesso' : 'Entrar no Sistema'} 
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-6">
           <div className="text-center">
             <button 
              onClick={() => { setIsRegistering(!isRegistering); setError(null); setSuccessMsg(null); }} 
              className="text-xs font-bold text-reque-navy hover:underline uppercase tracking-widest"
            >
               {isRegistering ? 'Já tenho conta, fazer login' : 'Não tem conta? Solicitar Cadastro'}
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};
