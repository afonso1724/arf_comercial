import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, FileText, PlayCircle } from 'lucide-react';

export default function AdminVendas() {
  const [vendas, setVendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(null); // id da venda que está sendo validada
  const [gerandoFatura, setGerandoFatura] = useState(null); // id da fatura sendo gerada

  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  // helper to decode JWT and read payload
  const parseJwt = (token) => {
    try {
      const base64 = token.split('.')[1];
      return JSON.parse(atob(base64));
    } catch {
      return null;
    }
  };

  useEffect(() => {
    // basic client‑side guard: only admins should stay on this page
    if (!token) {
      toast.error('Por favor faça login como administrador.');
      navigate('/');
      return;
    }
    const payload = parseJwt(token);
    if (!payload || payload.role !== 'admin') {
      toast.error('Acesso negado. Página reservada a administradores.');
      navigate('/');
      return;
    }

    fetchVendas();
  }, [token, navigate]);

  const fetchVendas = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/vendas', {
        headers: { 'x-access-token': token }
      });
      // debugging helpers
      console.log('fetchVendas status', res.status);
      const text = await res.text();
      console.log('fetchVendas raw body', text);
      let data;
      try { data = JSON.parse(text); } catch(e) { data = null; }
      if (!res.ok) {
        const msg = data?.message || data?.error || text || 'Não foi possível carregar as vendas';
        throw new Error(msg);
      }
      setVendas(data);
    } catch (err) {
      toast.error(err.message);
      if (err.message.match(/acesso negado|token/i)) {
        // redirect to login when auth fails
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleValidar = async (id) => {
    if (!window.confirm('Deseja realmente validar esta venda?')) return;
    setValidating(id);
    try {
      const res = await fetch(`http://localhost:3001/api/vendas/${id}/validar`, {
        method: 'PUT',
        headers: { 'x-access-token': token }
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        fetchVendas();
      } else {
        toast.error(data.message || 'Erro ao validar');
      }
    } catch (err) {
      toast.error('Falha de comunicação');
    } finally {
      setValidating(null);
    }
  };

  const handleGerarFatura = async (id) => {
    setGerandoFatura(id);
    try {
      const res = await fetch(`http://localhost:3001/api/notificacoes/${id}/gerar-fatura`, {
        method: 'POST',
        headers: { 'x-access-token': token }
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Fatura gerada com sucesso');
        fetchVendas();
      } else {
        toast.error(data.message || 'Erro ao gerar fatura');
      }
    } catch (err) {
      toast.error('Falha de comunicação');
    } finally {
      setGerandoFatura(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-slate-900">Gestão de Vendas</h1>
        <p className="text-slate-500 mt-1">Valide vendas e gere faturas</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
              <tr className="text-slate-600 uppercase text-xs font-black tracking-wider">
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Itens</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-10 text-center">
                    <Loader2 className="animate-spin mx-auto h-6 w-6 text-blue-600" />
                  </td>
                </tr>
              ) : vendas.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-10 text-center text-slate-500">Nenhuma venda encontrada.</td>
                </tr>
              ) : (
                vendas.map(v => {
                  const isPendente = v.status === 'pendente';
                  const isValidado = v.status === 'validado' || v.status === 'validada';
                  
                  return (
                    <tr key={v.id} className="hover:bg-blue-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-slate-900">#{v.id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-800">{v.cliente}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(v.data_venda).toLocaleString('pt-PT', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-block px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-semibold">
                          {v.itens?.length || 0} item(ns)
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-blue-600">
                          {Number(v.total).toLocaleString('pt-PT', { minimumFractionDigits: 2 })} Kz
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                          isPendente
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {isPendente ? '⏳ Pendente' : '✅ Validada'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 justify-center">
                          {isPendente ? (
                            <button
                              disabled={validating === v.id}
                              onClick={() => handleValidar(v.id)}
                              className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {validating === v.id ? (
                                <>
                                  <Loader2 className="animate-spin h-4 w-4" />
                                  Validando...
                                </>
                              ) : (
                                <>
                                  <PlayCircle size={16} />
                                  Validar
                                </>
                              )}
                            </button>
                          ) : (
                            <button
                              disabled={gerandoFatura === v.id}
                              onClick={() => handleGerarFatura(v.id)}
                              className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {gerandoFatura === v.id ? (
                                <>
                                  <Loader2 className="animate-spin h-4 w-4" />
                                  Gerando...
                                </>
                              ) : (
                                <>
                                  <FileText size={16} />
                                  Gerar Fatura
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
