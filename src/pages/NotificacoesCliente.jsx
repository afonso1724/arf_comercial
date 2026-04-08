import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, Bell, CheckCircle, BadgeAlert, ArrowLeft } from 'lucide-react';

export default function NotificacoesCliente() {
  const [notificacoes, setNotificacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notificacoesLidas, setNotificacoesLidas] = useState(new Set());

  const token = localStorage.getItem('token');
  const clienteId = localStorage.getItem('id_cliente');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token || !clienteId) {
      toast.error('Por favor faça login novamente');
      navigate('/login-cliente');
      return;
    }
    fetchNotificacoes();
    const interval = setInterval(fetchNotificacoes, 5000);
    return () => clearInterval(interval);
  }, [token, clienteId, navigate]);

  const fetchNotificacoes = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/notificacoes/cliente/${clienteId}`, {
        headers: { 'x-access-token': token }
      });
      if (!res.ok) throw new Error('Erro ao buscar notificações');
      const data = await res.json();
      setNotificacoes(data);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const marcarComoLida = async (notificacaoId) => {
    try {
      const res = await fetch(`http://localhost:3001/api/notificacoes/${notificacaoId}/lida`, {
        method: 'PUT',
        headers: { 'x-access-token': token }
      });
      if (res.ok) {
        setNotificacoesLidas(prev => new Set([...prev, notificacaoId]));
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  const getNotificacaoIcon = (tipo) => {
    switch (tipo) {
      case 'validacao_cliente':
        return <CheckCircle className="text-green-600" size={24} />;
      case 'pendente_cliente':
        return <BadgeAlert className="text-orange-600" size={24} />;
      default:
        return <Bell className="text-blue-600" size={24} />;
    }
  };

  const getNotificacaoCorFundo = (tipo, lida) => {
    if (lida) return 'bg-slate-50 border-slate-200';
    switch (tipo) {
      case 'validacao_cliente':
        return 'bg-green-50 border-green-200';
      case 'pendente_cliente':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500 px-4 py-6">
      {/* header with back button */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/loja')}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          title="Voltar à loja"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-3">
          <Bell size={28} className="text-blue-600" />
          <h1 className="text-2xl font-black text-slate-900">Notificações</h1>
        </div>
        <div className="w-8" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
        </div>
      ) : notificacoes.length === 0 ? (
        <div className="text-center py-20">
          <Bell size={48} className="mx-auto text-slate-200 mb-4" />
          <p className="text-lg font-medium text-slate-500">Sem notificações</p>
          <p className="text-sm text-slate-400">Você está atualizado</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notificacoes.map(notif => {
            const lida = notificacoesLidas.has(notif.id) || notif.lida;
            return (
              <div
                key={notif.id}
                onClick={() => !lida && marcarComoLida(notif.id)}
                className={`p-4 rounded-xl border transition-colors cursor-pointer ${
                  getNotificacaoCorFundo(notif.tipo, lida)
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex-shrink-0">
                    {getNotificacaoIcon(notif.tipo)}
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold ${lida ? 'text-slate-600' : 'text-slate-900'}`}>{notif.descricao}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(notif.criada_em).toLocaleString('pt-PT', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                    {notif.data_venda && (
                      <p className="text-xs text-slate-400 mt-1">
                        Data da venda: {new Date(notif.data_venda).toLocaleString('pt-PT', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
