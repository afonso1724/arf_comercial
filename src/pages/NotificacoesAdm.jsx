import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, Bell, CheckCircle, BadgeAlert } from 'lucide-react';
import { apiUrl } from '../config/api';

export default function NotificacoesAdm() {
  const [notificacoes, setNotificacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notificacoesLidas, setNotificacoesLidas] = useState(new Set());

  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      toast.error('Por favor faça login novamente');
      navigate('/');
      return;
    }
    fetchNotificacoes();
    const interval = setInterval(fetchNotificacoes, 5000);
    return () => clearInterval(interval);
  }, [token, navigate]);

  const fetchNotificacoes = async () => {
    try {
      const res = await fetch(apiUrl('/api/notificacoes/admin/lista'), {
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
      const res = await fetch(apiUrl(`/api/notificacoes/${notificacaoId}/lida`), {
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
      case 'validacao_admin':
        return <CheckCircle className="text-green-600" size={24} />;
      case 'pendente_admin':
      case 'pendente':
        return <BadgeAlert className="text-orange-600" size={24} />;
      default:
        return <Bell className="text-blue-600" size={24} />;
    }
  };

  const getNotificacaoCorFundo = (tipo, lida) => {
    if (lida) return 'bg-slate-50 border-slate-200';
    switch (tipo) {
      case 'validacao_admin':
        return 'bg-green-50 border-green-200';
      case 'pendente_admin':
      case 'pendente':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-8">
        <Bell size={32} className="text-blue-600" />
        <div>
          <h1 className="text-3xl font-black text-slate-900">Notificações Administrador</h1>
          <p className="text-slate-500">Acompanhe vendas pendentes, novos pedidos e validações</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
        </div>
      ) : notificacoes.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
          <Bell size={48} className="mx-auto text-slate-200 mb-4" />
          <p className="text-slate-500 font-medium mb-2">Nenhuma notificação no momento</p>
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
                          if (notif.tipo === 'validacao_admin') {
                            // mostre nome do admin que validou
                            if (notif.admin_nome) {
                              const myId = JSON.parse(atob(token.split('.')[1])).id;
                              if (notif.admin_id && notif.admin_id == myId) {
                                desc = `Você validou a venda #${notif.venda_id}`;
                              } else {
                                desc = `${notif.admin_nome} validou a venda #${notif.venda_id}`;
                              }
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
                    {notif.cliente_nome && (
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
                            {notif.venda_status}
                          </span>
                        )}
                      </div>
                    )}
                    {notif.total && (
                      <p className="text-xs text-slate-600 mt-2">
                        Total: {Number(notif.total).toLocaleString('pt-PT', { minimumFractionDigits: 2 })} Kz
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
