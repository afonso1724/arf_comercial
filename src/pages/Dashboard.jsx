import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../components/StatCard';
import { Package, TrendingUp, AlertTriangle, Wallet, Loader2, ChevronRight } from 'lucide-react';

// gráficos
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function Dashboard() {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historico, setHistorico] = useState([]);
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDados();
    fetchHistorico();
  }, [token]);

  const fetchHistorico = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/relatorios/historico', {
        headers: { 'x-access-token': token }
      });
      if (!res.ok) throw new Error('Erro ao carregar histórico');
      const data = await res.json();
      setHistorico(data);
    } catch (err) {
      console.error('Histórico:', err);
    }
  };

  const fetchDados = async () => {
    try {
      // Usamos a rota de produtos que já sabemos que funciona
      const res = await fetch('http://localhost:3001/api/produtos', {
        headers: { 'x-access-token': token }
      });
      const data = await res.json();
      
      if (Array.isArray(data)) {
        setProdutos(data);
      }
    } catch (err) {
      console.error("Erro ao carregar dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex h-96 items-center justify-center">
      <Loader2 className="animate-spin text-blue-600" size={40} />
    </div>
  );

  // --- CÁLCULO DAS ESTATÍSTICAS EM TEMPO REAL ---
  const totalModelos = produtos.length;
  const totalUnidades = produtos.reduce((acc, p) => acc + Number(p.quantidade || 0), 0);
  const estoqueBaixo = produtos.filter(p => p.quantidade <= 5);
  const valorTotalEstoque = produtos.reduce((acc, p) => acc + (Number(p.preco_venda || 0) * Number(p.quantidade || 0)), 0);

  const cards = [
    { title: 'Modelos de Produtos', value: totalModelos, icon: Package, color: 'bg-blue-500' },
    { title: 'Total de Unidades', value: totalUnidades, icon: TrendingUp, color: 'bg-green-500' },
    { title: 'Produtos em Alerta', value: `${estoqueBaixo.length} itens`, icon: AlertTriangle, color: 'bg-amber-500' },
    { title: 'Valor Total (Venda)', value: `Kz ${valorTotalEstoque.toLocaleString('pt-AO')}`, icon: Wallet, color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Painel de Controlo</h1>
        <p className="text-slate-500">Gestão em tempo real - A.R.F Comercial</p>
      </div>

      {/* Cartões Superiores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => <StatCard key={index} {...card} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Espaço do Gráfico */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 h-80">
          {historico.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 border-dashed">
              <TrendingUp size={48} className="mb-4 opacity-10" />
              <p className="font-medium text-slate-400">Carregando gráfico...</p>
            </div>
          ) : (
            <Line
              data={{
                labels: historico.map(h => h.mes),
                datasets: [
                  {
                    label: 'Total de Vendas (Kz)',
                    data: historico.map(h => h.total),
                    borderColor: 'rgba(59, 130, 246, 1)',
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    fill: true,
                    tension: 0.4,
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false },
                  title: { display: true, text: 'Últimos 6 meses de vendas' },
                },
                scales: {
                  y: {
                    ticks: {
                      callback: (value) => `Kz ${value.toLocaleString('pt-PT')}`,
                    },
                  },
                },
              }}
            />
          )}
        </div>

        {/* Card de Stock Crítico */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-80">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-tight">
              <AlertTriangle className="text-amber-500" size={18} />
              Stock Crítico
            </h3>
            <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-1 rounded-full font-black uppercase">
              Urgente
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar">
            {estoqueBaixo.length > 0 ? (
              estoqueBaixo.slice(0, 5).map((prod, i) => ( // Mostra os 5 mais críticos
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 transition-all hover:bg-slate-100">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-700 truncate">{prod.nome}</p>
                    <p className="text-[11px] text-slate-500 font-medium">{prod.quantidade} unidades restantes</p>
                  </div>
                  <div className={`ml-3 w-2.5 h-2.5 rounded-full shrink-0 ${prod.quantidade === 0 ? 'bg-red-500' : 'bg-amber-500 animate-pulse'}`} />
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
                <p className="text-sm font-medium">Tudo em ordem!</p>
                <p className="text-xs">Nenhum item abaixo do limite.</p>
              </div>
            )}
          </div>

          <button 
            onClick={() => navigate('/inventario')} 
            className="mt-4 w-full py-3 text-xs font-bold text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all flex items-center justify-center gap-1 cursor-pointer"
          >
            Ver Inventário Completo <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}