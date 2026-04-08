import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Package, FileText, Download, Clock, CheckCircle } from 'lucide-react';
import { apiUrl } from '../config/api';

export default function MeusPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gerandoFatura, setGerandoFatura] = useState(null);

  const token = localStorage.getItem('token');
  const clienteId = localStorage.getItem('id_cliente');
  const navigate = useNavigate();

  useEffect(() => {
    if (!clienteId || !token) {
      toast.error('Por favor faça login novamente');
      navigate('/login-cliente');
      return;
    }
    fetchPedidos();
  }, [clienteId, token, navigate]);

  const fetchPedidos = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/vendas/cliente/${clienteId}`), {
        headers: { 'x-access-token': token }
      });
      if (!res.ok) throw new Error('Erro ao buscar pedidos');
      const data = await res.json();
      setPedidos(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadFatura = async (vendaId) => {
    setGerandoFatura(vendaId);
    try {
      const res = await fetch(apiUrl(`/api/notificacoes/${vendaId}/fatura/download`), {
        headers: { 'x-access-token': token }
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Erro ao baixar fatura');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fatura_${vendaId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Fatura baixada com sucesso');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGerandoFatura(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500 px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/loja')}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          title="Voltar à loja"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-3">
          <Package size={28} className="text-blue-600" />
          <h1 className="text-2xl font-black text-slate-900">Meus Pedidos</h1>
        </div>
        <div className="w-8" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
        </div>
      ) : pedidos.length === 0 ? (
        <div className="text-center py-20">
          <Package size={48} className="mx-auto text-slate-200 mb-4" />
          <p className="text-lg font-medium text-slate-500">Nenhum pedido encontrado</p>
          <p className="text-sm text-slate-400">Faça algo hoje mesmo!</p>
          <button
            onClick={() => navigate('/loja')}
            className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-bold shadow-sm"
          >
            Voltar à Loja
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {pedidos.map(v => {
            const isPendente = v.status === 'pendente';
            const isValidado = v.status === 'validado' || v.status === 'validada';
            
            return (
              <div key={v.id} className="bg-white border-2 border-slate-100 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
                {/* Header do Pedido */}
                <div className={`px-6 py-4 ${isValidado ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100' : 'bg-gradient-to-r from-yellow-50 to-amber-50 border-b border-yellow-100'}`}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div>
                        {isPendente ? (
                          <Clock size={24} className="text-yellow-600" />
                        ) : (
                          <CheckCircle size={24} className="text-green-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 font-semibold">Pedido ID</p>
                        <span className="font-mono font-black text-xl text-slate-900">#{v.id}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-4 py-2 rounded-full font-bold text-sm ${
                        isPendente 
                          ? 'bg-yellow-100 text-yellow-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {isPendente ? '⏳ Pendente' : '✅ Validado'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Conteúdo do Pedido */}
                <div className="p-6">
                  {/* Grid de informações */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pb-6 border-b border-slate-100">
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <p className="text-xs text-slate-600 font-bold uppercase tracking-wider mb-1">Data do Pedido</p>
                      <p className="font-black text-slate-900 text-sm">
                        {new Date(v.data_venda).toLocaleDateString('pt-PT', { 
                          day: '2-digit', 
                          month: '2-digit', 
                          year: 'numeric' 
                        })}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <p className="text-xs text-slate-600 font-bold uppercase tracking-wider mb-1">Hora</p>
                      <p className="font-mono font-bold text-slate-900 text-sm">
                        {new Date(v.data_venda).toLocaleTimeString('pt-PT', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <p className="text-xs text-slate-600 font-bold uppercase tracking-wider mb-1">Quantidade</p>
                      <p className="font-black text-slate-900 text-sm">{v.itens.length} item(ns)</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
                      <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">Total</p>
                      <p className="font-black text-blue-700 text-lg">
                        {Number(v.total).toLocaleString('pt-PT', { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        })} Kz
                      </p>
                    </div>
                  </div>

                  {/* Itens do Pedido */}
                  <div className="mb-6">
                    <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-lg">
                      <Package size={20} className="text-blue-600" /> Itens da Compra
                    </h4>
                    <div className="space-y-2">
                      {v.itens.map((i, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-blue-50 transition-colors border border-slate-100 hover:border-blue-200">
                          <div className="flex-1">
                            <p className="font-bold text-slate-900 text-sm">{i.produto}</p>
                            <p className="text-xs text-slate-600 mt-1">
                              <span className="font-semibold">{i.quantidade}x</span>
                              {' '}×{' '}
                              <span className="font-mono text-blue-600">{Number(i.preco_unitario || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2 })} Kz</span>
                            </p>
                          </div>
                          <div className="text-right pl-4 border-l border-slate-200">
                            <p className="font-black text-slate-900 text-sm">
                              {(Number(i.preco_unitario || 0) * i.quantidade).toLocaleString('pt-PT', { minimumFractionDigits: 2 })} Kz
                            </p>
                            <p className="text-xs text-slate-500 mt-1">Subtotal</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ações */}
                  {isValidado && (
                    <div className="pt-4 border-t border-slate-100">
                      <button
                        onClick={() => handleDownloadFatura(v.id)}
                        disabled={gerandoFatura === v.id}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-bold shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {gerandoFatura === v.id ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            Gerando...
                          </>
                        ) : (
                          <>
                            <Download size={18} />
                            Obter Fatura (PDF)
                          </>
                        )}
                      </button>
                    </div>
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