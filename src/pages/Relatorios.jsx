import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, FileText, TrendingUp, Package } from 'lucide-react';
import { apiUrl } from '../config/api';

export default function Relatorios() {
  const [tipo, setTipo] = useState('mensal');
  const [data, setData] = useState(new Date().toISOString().substring(0, 10));
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const token = localStorage.getItem('token');

  const fetchReport = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/relatorios?tipo=${tipo}&data=${data}`), {
        headers: { 'x-access-token': token }
      });
      if (!res.ok) throw new Error('Falha ao obter relatório');
      const json = await res.json();
      setReport(json);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [tipo, data]);

  const downloadPdf = async () => {
    setGeneratingPdf(true);
    try {
      const res = await fetch(apiUrl(`/api/relatorios/pdf?tipo=${tipo}&data=${data}`), {
        headers: { 'x-access-token': token }
      });
      if (!res.ok) throw new Error('Não foi possível gerar PDF');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio_${tipo}_${new Date().toISOString().substring(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('PDF baixado com sucesso!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const formatarPeriodo = () => {
    if (!report) return '';
    const start = new Date(report.start);
    const end = new Date(new Date(report.end).getTime() - 1);
    return `${start.toLocaleDateString('pt-PT')} - ${end.toLocaleDateString('pt-PT')}`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 animate-in fade-in duration-500">
      {/* Cabeçalho */}
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-black text-slate-900">Relatórios</h1>
        <p className="text-slate-500">Acompanhe vendas, entradas e produtos mais vendidos</p>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Tipo de Relatório</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            >
              <option value="diario">Diário</option>
              <option value="semanal">Semanal</option>
              <option value="mensal">Mensal</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Data</label>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          <button
            onClick={downloadPdf}
            disabled={generatingPdf || !report}
            className="flex items-center justify-center gap-2 px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-md"
          >
            {generatingPdf ? (
              <>
                <Loader2 className="animate-spin h-4 w-4" />
                Gerando...
              </>
            ) : (
              <>
                <FileText size={16} />
                Gerar PDF
              </>
            )}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
        </div>
      ) : report ? (
        <div className="space-y-6">
          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Total de Vendas */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 uppercase tracking-wider mb-1">Total de Vendas</p>
                  <p className="text-3xl font-black text-blue-900">
                    {Number(report.total_vendas).toLocaleString('pt-PT')} Kz
                  </p>
                  <p className="text-xs text-blue-600 mt-2">{formatarPeriodo()}</p>
                </div>
                <TrendingUp size={40} className="text-blue-300" />
              </div>
            </div>

            {/* Total de Entradas */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 uppercase tracking-wider mb-1">Total de Entradas</p>
                  <p className="text-3xl font-black text-green-900">{report.total_entradas}</p>
                  <p className="text-xs text-green-600 mt-2">Produtos criados</p>
                </div>
                <Package size={40} className="text-green-300" />
              </div>
            </div>
          </div>

          {/* Produtos Mais Vendidos */}
          {report.produtos_mais_vendidos && report.produtos_mais_vendidos.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                <TrendingUp size={20} className="text-blue-600" /> Produtos Mais Vendidos
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-200 bg-slate-50">
                      <th className="text-left px-4 py-3 font-bold text-slate-700">Produto</th>
                      <th className="text-left px-4 py-3 font-bold text-slate-700">Categoria</th>
                      <th className="text-center px-4 py-3 font-bold text-slate-700">Quantidade</th>
                      <th className="text-right px-4 py-3 font-bold text-slate-700">Valor Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.produtos_mais_vendidos.map((p, i) => (
                      <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900">{p.nome}</td>
                        <td className="px-4 py-3 text-slate-600 text-sm">
                          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                            {p.categoria}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-semibold text-slate-900">{p.total_quant}</td>
                        <td className="px-4 py-3 text-right font-bold text-green-600">
                          {Number(p.total_valor).toLocaleString('pt-PT')} Kz
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Produtos Criados */}
          {report.produtos_criados && report.produtos_criados.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                <Package size={20} className="text-green-600" /> Produtos Adicionados ao Estoque
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-200 bg-slate-50">
                      <th className="text-left px-4 py-3 font-bold text-slate-700">Produto</th>
                      <th className="text-left px-4 py-3 font-bold text-slate-700">Categoria</th>
                      <th className="text-center px-4 py-3 font-bold text-slate-700">Qtd Inicial</th>
                      <th className="text-right px-4 py-3 font-bold text-slate-700">Preço Venda</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.produtos_criados.map((p, i) => (
                      <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900">{p.nome}</td>
                        <td className="px-4 py-3 text-slate-600 text-sm">
                          <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
                            {p.categoria}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-slate-900">{p.quantidade}</td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-900">
                          {Number(p.preco_venda).toLocaleString('pt-PT')} Kz
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {!loading && !report && (
        <div className="text-center py-12">
          <Package size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">Selecione um período para gerar o relatório</p>
        </div>
      )}
    </div>
  );
}
