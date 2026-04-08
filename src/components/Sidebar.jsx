import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, BarChart3, Settings, LogOut, UserCircle, Menu, X, Bell } from 'lucide-react';
import { toast } from 'sonner';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false); // Estado para Mobile
  const navigate = useNavigate();
  const location = useLocation();

  const token = localStorage.getItem('token');
  const parseJwt = (token) => {
    try {
      const base64 = token.split('.')[1];
      return JSON.parse(atob(base64));
    } catch {
      return null;
    }
  };
  const role = token ? parseJwt(token)?.role : null;

  const menuItems = [
    { icon: <UserCircle size={20} />, label: 'Perfil ADM', path: '/perfil', adminOnly: true },
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/dashboard', adminOnly: true },
    { icon: <Package size={20} />, label: 'Inventário', path: '/inventario', adminOnly: true },
    { icon: <ShoppingCart size={20} />, label: 'Vendas', path: '/vendas', adminOnly: true },
    { icon: <Bell size={20} />, label: 'Notificações', path: '/notificacoes', adminOnly: true },
    { icon: <BarChart3 size={20} />, label: 'Relatórios', path: '/relatorios', adminOnly: true },
    { icon: <Settings size={20} />, label: 'Configurações', path: '/configuracoes', adminOnly: true },
  ].filter(item => !item.adminOnly || role === 'admin');

  // --- LÓGICA DE LOGOUT ATUALIZADA ---
  const handleLogout = () => {
    // Removendo o token e dados do usuário para garantir que a sessão feche de verdade
    localStorage.removeItem('token');
    localStorage.removeItem('user_nome');
    
    toast.success('Sessão encerrada, volte em breve!');
    
    setTimeout(() => {
      navigate('/');
    }, 1000);
  };

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Botão Hamburger - Visível apenas em Mobile */}
      <button 
        onClick={toggleMenu}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900 text-white rounded-lg shadow-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay para fechar o menu ao clicar fora (Mobile) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={toggleMenu}
        ></div>
      )}

      {/* Sidebar Principal */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-64 bg-slate-900 text-slate-400 flex flex-col border-r border-slate-800
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Package size={20} className="text-white" />
            </div>
            A.R.F Comercial
          </h1>
        </div>

        <nav className="flex-1 px-4 py-2 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item, index) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={index}>
                  <button
                    onClick={() => {
                      navigate(item.path);
                      setIsOpen(false); // Fecha o menu ao clicar (Mobile)
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium cursor-pointer ${
                      isActive 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' 
                        : 'hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors group cursor-pointer"
          >
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
}