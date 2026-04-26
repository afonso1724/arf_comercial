import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';

// Importação de componentes e páginas
import Login from './pages/Login';
import Sidebar from './components/Sidebar';
import Perfil from './pages/Perfil';
import Inventario from './pages/Inventario';
import Dashboard from './pages/Dashboard';
import RegisterCliente from './pages/RegisterCliente';
import LoginCliente from './pages/LoginCliente';
import LojaHome from './pages/LojaHome';
import AdminVendas from './pages/AdminVendas';
import MeusPedidos from './pages/MeusPedidos';
import NotificacoesAdm from './pages/NotificacoesAdm';
import NotificacoesCliente from './pages/NotificacoesCliente';
import Relatorios from './pages/Relatorios';
import Configuracoes from './pages/Configuracoes';

// Componente de Proteção de Rota
// helper to decode jwt payload
const parseJwt = (token) => {
  try {
    const base64 = token.split('.')[1];
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
};

const PrivateRoute = ({ children, requireAdmin = false }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/" />;
  if (requireAdmin) {
    const payload = parseJwt(token);
    if (!payload || payload.role !== 'admin') {
      return <Navigate to="/" />;
    }
  }
  return children;
};

const ClienteLayout = ({ children }) => (
  <div className="min-h-screen bg-slate-50">
    {children}
  </div>
);

const Layout = ({ children }) => (
  <div className="flex min-h-screen bg-slate-50">
    <Sidebar />
    <main className="flex-1 h-screen overflow-y-auto p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </main>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors closeButton />
      <Routes>
        {/* ROTA PÚBLICA */}
        <Route path="/" element={<Login />} />

        {/* ROTAS PROTEGIDAS */}
        <Route path="/dashboard" element={
          <PrivateRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </PrivateRoute>
        } />

        <Route path="/perfil" element={
          <PrivateRoute>
            <Layout>
              <Perfil />
            </Layout>
          </PrivateRoute>
        } />

        <Route path="/configuracoes" element={
          <PrivateRoute>
            <Layout>
              <Configuracoes />
            </Layout>
          </PrivateRoute>
        } />

        <Route path="/inventario" element={
          <PrivateRoute>
            <Layout>
              <Inventario />
            </Layout>
          </PrivateRoute>
        } />
        <Route path="/vendas" element={
          <PrivateRoute requireAdmin>
            <Layout>
              <AdminVendas />
            </Layout>
          </PrivateRoute>
        } />

        <Route path="/notificacoes" element={
          <PrivateRoute requireAdmin>
            <Layout>
              <NotificacoesAdm />
            </Layout>
          </PrivateRoute>
        } />
        <Route path="/relatorios" element={
          <PrivateRoute requireAdmin>
            <Layout>
              <Relatorios />
            </Layout>
          </PrivateRoute>
        } />

        <Route path="/register" element={<RegisterCliente />} />
        <Route path="/login-cliente" element={<LoginCliente />} />
        <Route path="/loja" element={
          <PrivateRoute>
            <LojaHome />
          </PrivateRoute>
        } />
        <Route path="/meus-pedidos" element={
          <PrivateRoute>
            <ClienteLayout>
              <MeusPedidos />
            </ClienteLayout>
          </PrivateRoute>
        } />

        <Route path="/notificacoes-cliente" element={
          <PrivateRoute>
            <ClienteLayout>
              <NotificacoesCliente />
            </ClienteLayout>
          </PrivateRoute>
        } />

        {/* REDIRECIONAMENTO GLOBAL */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}