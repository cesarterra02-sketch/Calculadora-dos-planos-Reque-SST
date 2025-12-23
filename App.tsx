
import React, { useState, useEffect } from 'react';
import { PricingCalculator } from './components/PricingCalculator';
import { InCompanyCalculator } from './components/InCompanyCalculator';
import { HistoryView } from './components/HistoryView';
import { LoginView } from './components/LoginView';
import { AdminView } from './components/AdminView';
import { ProposalHistoryItem, ViewType, User } from './types';
import { StorageService } from './storageService';
import { 
  Calculator, 
  LogOut, 
  ChevronRight, 
  Clock, 
  UserCheck, 
  PanelLeftClose, 
  PanelLeftOpen, 
  Truck, 
  Loader2, 
  Wifi, 
  WifiOff, 
  ShieldAlert 
} from 'lucide-center'; // Mantido conforme original

// Importações do Lucide corrigidas internamente pelo ambiente
import * as LucideIcons from 'lucide-react';
const { 
  Calculator: Calc, 
  LogOut: Exit, 
  ChevronRight: Arrow, 
  Clock: History, 
  UserCheck: UCheck, 
  PanelLeftClose: PClose, 
  PanelLeftOpen: POpen, 
  Truck: Van, 
  Loader2: Spin, 
  Wifi: NetOn, 
  WifiOff: NetOff, 
  ShieldAlert: Warn 
} = LucideIcons;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('calculator');
  const [history, setHistory] = useState<ProposalHistoryItem[]>([]);
  const [editingItem, setEditingItem] = useState<ProposalHistoryItem | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDbConnected, setIsDbConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const checkDb = async () => {
      const connected = await StorageService.testConnection();
      setIsDbConnected(connected);
    };
    checkDb();
  }, []);

  useEffect(() => {
    const loadHistory = async () => {
      if (isAuthenticated && currentUser) {
        setIsLoading(true);
        try {
          // Agora passamos o NOME para o filtro caso não seja admin, para manter consistência com o que é salvo
          const identifier = currentUser.role === 'admin' ? currentUser.email : currentUser.name;
          const data = await StorageService.getHistory(identifier, currentUser.role === 'admin');
          setHistory(data);
        } catch (error) {
          console.error("Erro ao carregar histórico:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    loadHistory();
  }, [isAuthenticated, currentUser]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    
    if (user.role === 'admin' || user.canAccessCalculator) {
      setCurrentView('calculator');
    } else if (user.canAccessInCompany) {
      setCurrentView('incompany');
    } else if (user.canAccessHistory) {
      setCurrentView('history');
    } else if (user.canAccessAdmin) {
      setCurrentView('admin');
    }
  };

  const handleLogout = async () => {
    if (currentUser) {
      try {
        await StorageService.addLog(currentUser, 'LOGOUT');
      } catch (e) {}
    }
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentView('calculator');
    setEditingItem(null);
    setHistory([]);
  };

  const handleSaveHistory = async (item: ProposalHistoryItem) => {
    try {
      // Alterado para salvar o NOME do usuário no createdBy para exibição no histórico
      const itemWithCreator = { ...item, createdBy: currentUser?.name || currentUser?.email };
      const savedItem = await StorageService.addHistoryItem(itemWithCreator);
      setHistory(prev => [savedItem, ...prev]);
      return savedItem;
    } catch (error: any) {
      const errorMsg = error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
      console.error("Erro ao salvar proposta:", errorMsg);
      alert(`Erro ao salvar: ${errorMsg}`);
      throw error;
    }
  };

  const handleDeleteHistory = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const handleEditHistory = (item: ProposalHistoryItem) => {
    setEditingItem(item);
    setCurrentView(item.type === 'incompany' ? 'incompany' : 'calculator');
  };

  if (!isAuthenticated) {
    return <LoginView onLogin={handleLogin} />;
  }

  const navItems = [
    {
      id: 'calculator',
      label: 'CALCULADORA PLANOS SST',
      icon: <Calc className="w-5 h-5" />,
      allowed: currentUser?.role === 'admin' || currentUser?.canAccessCalculator
    },
    {
      id: 'incompany',
      label: 'CALCULADORA IN COMPANY',
      icon: <Van className="w-5 h-5" />,
      allowed: currentUser?.role === 'admin' || currentUser?.canAccessInCompany
    },
    {
      id: 'history',
      label: 'HISTORICO DA PROPOSTA',
      icon: <History className="w-5 h-5" />,
      allowed: currentUser?.role === 'admin' || currentUser?.canAccessHistory
    },
    {
      id: 'admin',
      label: 'CONTROLE DE ACESSO',
      icon: <UCheck className="w-5 h-5" />,
      allowed: currentUser?.role === 'admin' || currentUser?.canAccessAdmin
    }
  ];

  const allowedItems = navItems.filter(i => i.allowed);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full py-20 text-slate-400">
          <Spin className="w-10 h-10 animate-spin mb-4" />
          <p className="font-bold uppercase tracking-widest text-xs">Sincronizando com Supabase Cloud...</p>
        </div>
      );
    }

    if (allowedItems.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full py-20 text-slate-400 max-w-lg mx-auto text-center">
          <Warn className="w-16 h-16 text-reque-orange mb-6" />
          <h3 className="text-xl font-black text-reque-navy uppercase tracking-tight mb-2">Sem Acesso Liberado</h3>
          <p className="text-sm font-medium leading-relaxed">
            Sua conta está aprovada, mas nenhum módulo específico do sistema foi liberado para você. 
            Entre em contato com o administrador para habilitar as ferramentas necessárias.
          </p>
          <button 
            onClick={handleLogout}
            className="mt-8 px-8 py-3 bg-reque-navy text-white font-bold rounded-xl uppercase text-xs tracking-widest hover:bg-reque-blue transition-all"
          >
            Sair do Sistema
          </button>
        </div>
      );
    }

    const canAccessCurrent = navItems.find(i => i.id === currentView)?.allowed;
    if (!canAccessCurrent) {
      setCurrentView(allowedItems[0].id as ViewType);
      return null;
    }

    switch(currentView) {
      case 'history':
        return (
          <HistoryView 
            history={history} 
            onEdit={handleEditHistory} 
            onDelete={handleDeleteHistory}
            isAdmin={currentUser?.role === 'admin'}
            onBack={() => setCurrentView(allowedItems[0].id as ViewType)} 
          />
        );
      case 'admin':
        return <AdminView onBack={() => setCurrentView(allowedItems[0].id as ViewType)} />;
      case 'incompany':
        return <InCompanyCalculator currentUser={currentUser} onSaveHistory={handleSaveHistory} initialData={editingItem?.type === 'incompany' ? editingItem : null} />;
      case 'calculator':
      default:
        return (
          <div className="animate-in fade-in duration-500">
            <div className="mb-8 border-l-4 border-reque-orange pl-5">
              <h2 className="text-3xl font-black text-reque-navy tracking-tight">Nova Precificação SST</h2>
              <p className="text-slate-500 mt-1 font-medium">
                Configure os parâmetros para geração da proposta técnico-comercial.
              </p>
            </div>

            <PricingCalculator 
              onSaveHistory={handleSaveHistory} 
              initialData={editingItem?.type === 'standard' ? editingItem : null}
              canGenerateProposal={currentUser?.canGenerateProposal || currentUser?.role === 'admin'}
            />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] flex font-sans">
      <aside 
        className={`hidden lg:flex flex-col bg-reque-navy border-r border-white/10 shrink-0 sticky top-0 h-screen z-40 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'w-20' : 'w-72'
        }`}
      >
        <div className="p-8 flex items-center justify-between overflow-hidden">
          {!isSidebarCollapsed && (
            <div className="flex flex-col leading-none animate-in fade-in duration-300">
              <span className="font-black text-3xl tracking-tighter text-white">Reque</span>
              <span className="text-[10px] font-bold tracking-widest text-reque-orange uppercase mt-1 whitespace-nowrap">
                ESTRATÉGIA EM SST
              </span>
            </div>
          )}
          {isSidebarCollapsed && (
            <span className="font-black text-2xl tracking-tighter text-white mx-auto">R.</span>
          )}
        </div>

        <div className="px-4 mb-4">
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="w-full flex items-center justify-center py-2 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-lg transition-all"
          >
            {isSidebarCollapsed ? <POpen className="w-5 h-5" /> : <PClose className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {allowedItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setEditingItem(null);
                setCurrentView(item.id as ViewType);
              }}
              className={`w-full flex items-center px-4 py-3.5 rounded-xl transition-all group overflow-hidden ${
                currentView === item.id 
                  ? 'bg-reque-orange text-reque-navy shadow-lg shadow-reque-orange/20' 
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className={`flex items-center gap-3 ${isSidebarCollapsed ? 'mx-auto' : ''}`}>
                <span className={`${currentView === item.id ? 'text-reque-navy' : 'text-reque-orange'} transition-colors shrink-0`}>
                  {item.icon}
                </span>
                {!isSidebarCollapsed && (
                  <span className="text-[11px] font-black uppercase tracking-wider whitespace-nowrap animate-in fade-in slide-in-from-left-2">
                    {item.label}
                  </span>
                )}
              </div>
              {!isSidebarCollapsed && (
                <Arrow className={`ml-auto w-4 h-4 transition-transform ${currentView === item.id ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'}`} />
              )}
            </button>
          ))}
        </nav>

        <div className="p-6 mt-auto">
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10 overflow-hidden">
            <div className={`flex items-center gap-3 ${isSidebarCollapsed ? 'justify-center' : 'mb-4'}`}>
              <div className="w-10 h-10 rounded-full bg-reque-orange flex items-center justify-center font-black text-reque-navy uppercase shrink-0">
                {currentUser?.name?.charAt(0) || 'U'}
              </div>
              {!isSidebarCollapsed && (
                <div className="flex flex-col overflow-hidden animate-in fade-in duration-300">
                  <span className="text-white text-xs font-black truncate uppercase">{currentUser?.name}</span>
                  <span className="text-white/40 text-[9px] font-bold uppercase tracking-widest">{currentUser?.role === 'admin' ? 'Master Admin' : 'Operador'}</span>
                </div>
              )}
            </div>
            {!isSidebarCollapsed && (
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white/10 text-white/70 hover:bg-red-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest animate-in slide-in-from-bottom-2"
              >
                <Exit className="w-3.5 h-3.5" /> Sair do Sistema
              </button>
            )}
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="hidden lg:flex h-20 items-center justify-between px-10 bg-white border-b border-slate-200">
          <div className="flex items-center gap-6">
            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border transition-colors ${isDbConnected ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className={`w-2 h-2 rounded-full ${isDbConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${isDbConnected ? 'text-green-600' : 'text-red-600'}`}>
                {isDbConnected ? 'Database: Supabase Online' : 'Database: Offline/Error'}
              </span>
              {isDbConnected ? <NetOn className="w-3 h-3 text-green-500" /> : <NetOff className="w-3 h-3 text-red-500" />}
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Painel Atual</p>
                <p className="text-sm font-black text-reque-navy uppercase">
                  {currentView === 'calculator' ? 'Precificação' : currentView === 'incompany' ? 'In Company' : currentView === 'history' ? 'Histórico' : 'Administração'}
                </p>
             </div>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-10 lg:pt-8 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;
