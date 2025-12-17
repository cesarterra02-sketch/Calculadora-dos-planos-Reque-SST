import React, { useState } from 'react';
import { PricingCalculator } from './components/PricingCalculator';
import { HistoryView } from './components/HistoryView';
import { LoginView } from './components/LoginView';
import { AdminView } from './components/AdminView';
import { ProposalHistoryItem, ViewType, User } from './types';
import { History, LayoutDashboard, LogOut, Shield } from 'lucide-react';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('calculator');
  const [history, setHistory] = useState<ProposalHistoryItem[]>([]);
  const [editingItem, setEditingItem] = useState<ProposalHistoryItem | null>(null);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    setCurrentView('calculator');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentView('calculator');
    setEditingItem(null);
  };

  const handleSaveHistory = (item: ProposalHistoryItem) => {
    setHistory(prev => [item, ...prev]);
    alert('Simulação salva no histórico!');
  };

  const handleEditHistory = (item: ProposalHistoryItem) => {
    setEditingItem(item);
    setCurrentView('calculator');
  };

  // Render Login View if not authenticated
  if (!isAuthenticated) {
    return <LoginView onLogin={handleLogin} />;
  }

  // Determine what main content to render
  const renderContent = () => {
    switch(currentView) {
      case 'history':
        return (
          <HistoryView 
            history={history} 
            onEdit={handleEditHistory} 
            onBack={() => setCurrentView('calculator')} 
          />
        );
      case 'admin':
        return <AdminView onBack={() => setCurrentView('calculator')} />;
      case 'calculator':
      default:
        return (
          <>
            <div className="mb-8 border-l-4 border-reque-orange pl-4">
              <h2 className="text-2xl font-bold text-reque-dark">Nova Precificação</h2>
              <p className="text-slate-500 mt-1">
                Preencha os dados abaixo para calcular a assinatura conforme as diretrizes da Reque.
              </p>
            </div>

            <PricingCalculator 
              onSaveHistory={handleSaveHistory} 
              initialData={editingItem}
            />
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-reque-navy border-b border-reque-blue shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Logo */}
            <div 
              className="flex flex-col leading-none cursor-pointer" 
              onClick={() => setCurrentView('calculator')}
            >
              <span className="font-extrabold text-2xl tracking-tight text-white">Reque</span>
              <span className="text-[0.65rem] font-medium tracking-wide text-white uppercase">
                Saúde e Segurança do Trabalho
              </span>
            </div>
            
            <div className="hidden md:flex h-8 w-px bg-white/20 mx-2"></div>
            
            <div className="hidden md:block">
               <p className="text-white/60 text-xs font-medium">Sistema de Precificação</p>
               <p className="text-reque-orange text-xs font-bold">V41.10</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Navigation */}
            <nav className="flex items-center gap-2 mr-4">
              <button 
                onClick={() => setCurrentView('calculator')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${currentView === 'calculator' ? 'bg-reque-orange text-reque-navy' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
              >
                Calculadora
              </button>
              
              <button 
                onClick={() => setCurrentView('history')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${currentView === 'history' ? 'bg-reque-orange text-reque-navy' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
              >
                <History className="w-3.5 h-3.5" />
                Histórico
                {history.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-white text-reque-navy rounded-full text-[9px] font-extrabold">
                    {history.length}
                  </span>
                )}
              </button>

              {/* Admin Menu Item - Only Visible to Admins */}
              {currentUser?.role === 'admin' && (
                <button 
                  onClick={() => setCurrentView('admin')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${currentView === 'admin' ? 'bg-reque-orange text-reque-navy' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  Controle de Acesso
                </button>
              )}
            </nav>

            <div className="flex items-center gap-4 border-l border-white/10 pl-4">
              <div className="text-right hidden sm:block">
                <span className="text-white/60 text-xs block">
                  {currentUser?.role === 'admin' ? 'Administrador' : 'Operador'}
                </span>
                <span className="text-white text-sm font-semibold truncate max-w-[150px]">
                  {currentUser?.name || 'Usuário'}
                </span>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-center text-xs text-slate-400">
            &copy; {new Date().getFullYear()} Reque Saúde e Segurança do Trabalho.
          </p>
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-reque-navy"></div>
             <div className="w-2 h-2 rounded-full bg-reque-blue"></div>
             <div className="w-2 h-2 rounded-full bg-reque-orange"></div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
