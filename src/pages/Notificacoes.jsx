import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, Bell, CheckCircle, AlertCircle, BadgeAlert, X } from 'lucide-react';

export default function Notificacoes() {
  const [notificacoes, setNotificacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notificacoesLidas, setNotificacoesLidas] = useState(new Set());

  const token = localStorage.getItem('token');
  const clienteId = localStorage.getItem('id_cliente');
  const isAdmin = localStorage.getItem('user_nome'); // Admin tem user_nome
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      toast.error('Por favor faça login novamente');
      navigate(isAdmin ? '/login' : '/login-cliente');
      return;
    }
    fetchNotificacoes();
    const interval = setInterval(fetchNotificacoes, 5000); // Atualizar a cada 5s
    return () => clearInterval(interval);
  }, [clienteId, token, navigate, isAdmin]);

  const fetchNotificacoes = async () => {
    try {
      const endpoint = isAdmin
        ? 'http://localhost:3001/api/notificacoes/admin/lista'
        : `http://localhost:3001/api/notificacoes/cliente/${clienteId}`;
      
      const res = await fetch(endpoint, {
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
      case 'validacao':
        return <CheckCircle className="text-green-600" size={24} />;
      case 'alerta':
        return <AlertCircle className="text-yellow-600" size={24} />;
      case 'pendente':
        return <BadgeAlert className="text-orange-600" size={24} />;
      default:
        return <Bell className="text-blue-600" size={24} />;
    }
  };

  const getNotificacaoCorFundo = (tipo, lida) => {
    if (lida) return 'bg-slate-50 border-slate-200';
    
    switch (tipo) {
      case 'validacao':
        return 'bg-green-50 border-green-200';
      case 'alerta':
        return 'bg-yellow-50 border-yellow-200';
      case 'pendente':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-8">
        <Bell size={32} className="text-blue-600" />
        <div>
          <h1 className="text-3xl font-black text-slate-900">Notificações</h1>
          <p className="text-slate-500">
            {isAdmin 
              ? 'Acompanhe as atividades de vendas e ações administrativas' 
              : 'Acompanhe o status das suas compras e atualizações'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
        </div>
      ) : notificacoes.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
          <Bell size={48} className="mx-auto text-slate-200 mb-4" />
          <p className="text-slate-500 font-medium mb-2">Você está em dia</p>
          <p className="text-slate-400 text-sm">Nenhuma notificação no momento</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notificacoes.map(notif => {
            const lida = notificacoesLidas.has(notif.id) || notif.lida;
            
            return (
              <div
                key={notif.id}
                onClick={() => !lida && marcarComoLida(notif.id)}
                className={`p-4 md:p-5 rounded-xl border-2 transition-all cursor-pointer group hover:shadow-lg ${
                  getNotificacaoCorFundo(notif.tipo, lida)
                } ${!lida ? 'hover:shadow-md' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificacaoIcon(notif.tipo)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <p className={`font-bold ${lida ? 'text-slate-600' : 'text-slate-900'}`}>
                        {(() => {
                          let desc = notif.descricao || '';
                          if (isAdmin && notif.tipo === 'validacao_admin') {
                            // display "você" for the admin who performed the action
                            let meuId = null;
                            try {
                              meuId = JSON.parse(atob(token.split('.')[1])).id;
                            } catch {}
                            if (notif.admin_id && meuId && notif.admin_id == meuId) {
                              desc = `Você validou a venda #${notif.venda_id}`;
                            } else if (notif.admin_nome) {
                              desc = `Adm ${notif.admin_nome} validou a venda #${notif.venda_id}`;
                            }
                          }
                          return desc;
                        })()}
                      </p>
                      {!lida && (
                        <span className="inline-block w-2.5 h-2.5 bg-blue-600 rounded-full flex-shrink-0 mt-1.5" />
                      )}
                    </div>

                    <p className="text-xs text-slate-500 mb-2">
                      {new Date(notif.criada_em).toLocaleString('pt-PT', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>

                    {/* Link rápido para cliente ver o pedido */}
                    {!isAdmin && notif.tipo === 'validacao_cliente' && (
                      <button
                        onClick={() => navigate('/meus-pedidos')}
                        className="text-xs text-blue-600 underline"
                      >
                        Ver pedido
                      </button>
                    )}

                    {/* Data da venda (cliente) */}
                    {!isAdmin && notif.data_venda && (
                      <p className="text-xs text-slate-400 mt-1">
                        Data da venda: {new Date(notif.data_venda).toLocaleString('pt-PT', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    )}

                    {/* Informações adicionais para admin */}
                    {isAdmin && notif.cliente_nome && (
                      <div className="flex flex-wrap gap-3 mt-3 text-xs">
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md font-medium">
                          Cliente: {notif.cliente_nome}
                        </span>
                        {notif.venda_status && (
                          <span className={`px-2 py-1 rounded-md font-medium ${
                            notif.venda_status === 'validado' || notif.venda_status === 'validada'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            Status: {notif.venda_status}
                          </span>
                        )}
                        {notif.total && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md font-bold">
                            Total: {Number(notif.total).toLocaleString('pt-PT', { minimumFractionDigits: 2 })} Kz
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {!lida && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        marcarComoLida(notif.id);
                      }}
                      className="flex-shrink-0 p-1.5 hover:bg-white rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Marcar como lida"
                    >
                      <X size={18} className="text-slate-400" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
