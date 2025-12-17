import React, { useState, useEffect } from 'react';
import { User as UserIcon, Lock, ArrowRight, Loader2, ShieldCheck, UserPlus, Mail, AlertCircle, AlertTriangle } from 'lucide-react';
import { User } from '../types';

interface LoginViewProps {
  onLogin: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Initialize Default Admin on Mount
  useEffect(() => {
    const users: User[] = JSON.parse(localStorage.getItem('reque_users') || '[]');
    
    // Check if the specific admin 'cesguitar' exists
    const adminExists = users.some(u => u.email === 'cesguitar');
    
    if (!adminExists) {
      const defaultAdmin: User = {
        name: 'Administrador Mestre',
        email: 'cesguitar',
        password: 'brasil#02',
        role: 'admin',
        isApproved: true
      };
      
      // If it's a fresh install or missing admin, add/prepend it
      // Filter out any other potential duplicates if the key existed but not the user
      const cleanUsers = users.filter(u => u.email !== 'cesguitar');
      cleanUsers.unshift(defaultAdmin);
      
      localStorage.setItem('reque_users', JSON.stringify(cleanUsers));
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    setTimeout(() => {
      const users: User[] = JSON.parse(localStorage.getItem('reque_users') || '[]');

      if (isRegistering) {
        // REGISTRATION LOGIC
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

        const userExists = users.find((u) => u.email === email);
        if (userExists) {
          setError('Este usuário/e-mail já está cadastrado.');
          setIsLoading(false);
          return;
        }

        // New users are NOT approved by default and have 'user' role
        const newUser: User = { 
          name, 
          email, 
          password,
          role: 'user',
          isApproved: false
        };

        users.push(newUser);
        localStorage.setItem('reque_users', JSON.stringify(users));
        
        setSuccessMsg('Cadastro realizado! Aguarde a aprovação do administrador para acessar.');
        setIsRegistering(false);
        setPassword('');
        setConfirmPassword('');
        // Keep email field filled
      } else {
        // LOGIN LOGIC
        const validUser = users.find((u) => u.email === email && u.password === password);
        
        if (validUser) {
          if (validUser.isApproved) {
            onLogin(validUser);
          } else {
            setError('Seu cadastro ainda está pendente de aprovação pelo administrador.');
          }
        } else {
          setError('Credenciais inválidas. Verifique usuário e senha.');
        }
      }
      setIsLoading(false);
    }, 1000);
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError(null);
    setSuccessMsg(null);
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans">
      {/* Left Side - Brand Visual (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-reque-navy relative overflow-hidden flex-col justify-between p-12 text-white">
        {/* Background Patterns */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-reque-orange blur-3xl"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-reque-blue blur-3xl"></div>
        </div>

        <div className="relative z-10">
          <div className="flex flex-col leading-none mb-6">
            <span className="font-extrabold text-5xl tracking-tight">Reque</span>
            <span className="text-sm font-medium tracking-wide uppercase mt-2 opacity-80">
              Saúde e Segurança do Trabalho
            </span>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl font-bold mb-4 leading-tight">
            {isRegistering ? 'Solicitar Acesso' : 'Precificação Inteligente e Gestão de Propostas'}
          </h2>
          <p className="text-white/70 leading-relaxed mb-8">
            {isRegistering 
              ? 'Crie sua conta. Seu acesso passará por uma análise de aprovação do administrador antes da liberação.'
              : 'Acesse o simulador oficial para gerar orçamentos precisos, calcular assinaturas e gerenciar o histórico de propostas comerciais de acordo com o Book Empresarial.'}
          </p>
          
          <div className="flex items-center gap-4 text-xs font-semibold uppercase tracking-wider opacity-60">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Acesso Controlado
            </div>
            <div className="w-1 h-1 bg-white rounded-full"></div>
            <div>Uso Interno</div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-white/40">
          © {new Date().getFullYear()} Reque SST. Todos os direitos reservados.
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md bg-white p-8 sm:p-12 rounded-2xl shadow-xl border border-slate-100 relative">
          
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <h1 className="text-3xl font-extrabold text-reque-navy">Reque</h1>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Saúde e Segurança do Trabalho</p>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-reque-navy">
              {isRegistering ? 'Solicitar Cadastro' : 'Bem-vindo de volta'}
            </h2>
            <p className="text-slate-500 text-sm mt-2">
              {isRegistering 
                ? 'Preencha os dados abaixo para solicitar acesso.' 
                : 'Insira suas credenciais para acessar o sistema.'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-sm text-red-600">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2 text-sm text-green-600">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Name Field - Only for Register */}
            {isRegistering && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-sm font-bold text-slate-700">Nome Completo</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required={isRegistering}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-reque-blue/20 focus:border-reque-blue transition-colors text-sm text-slate-800 placeholder-slate-400 outline-none"
                    placeholder="Seu Nome"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-700">Usuário</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-reque-blue/20 focus:border-reque-blue transition-colors text-sm text-slate-800 placeholder-slate-400 outline-none"
                  placeholder="usuario.reque"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-700">Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-reque-blue/20 focus:border-reque-blue transition-colors text-sm text-slate-800 placeholder-slate-400 outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Confirm Password - Only for Register */}
            {isRegistering && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-sm font-bold text-slate-700">Confirmar Senha</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <ShieldCheck className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required={isRegistering}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-reque-blue/20 focus:border-reque-blue transition-colors text-sm text-slate-800 placeholder-slate-400 outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            {!isRegistering && (
              <div className="text-right">
                <a href="#" className="text-xs font-semibold text-reque-blue hover:text-reque-orange transition-colors">
                  Esqueceu a senha?
                </a>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-lg shadow-lg text-sm font-bold text-white bg-reque-navy hover:bg-reque-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-reque-navy disabled:opacity-70 disabled:cursor-not-allowed transition-all mt-6"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Processando...
                </>
              ) : (
                <>
                  {isRegistering ? 'Solicitar Acesso' : 'Entrar no Sistema'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
             <p className="text-sm text-slate-500 mb-3">
               {isRegistering ? 'Já possui uma conta?' : 'Ainda não tem acesso?'}
             </p>
             <button 
               onClick={toggleMode}
               className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-reque-blue bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors w-full"
             >
               {isRegistering ? (
                 <>Voltar para Login</>
               ) : (
                 <>
                   <UserPlus className="w-4 h-4" />
                   Solicitar Cadastro
                 </>
               )}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
