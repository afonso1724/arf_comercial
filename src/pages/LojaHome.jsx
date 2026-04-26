import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, LogOut, Search, Package, ShoppingBag, Plus, X, Info, ChevronLeft, ChevronRight, Minus, Trash2, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl } from '../config/api';

export default function LojaHome() {
  const [produtos, setProdutos] = useState([]);
  const [busca, setBusca] = useState('');
  const [carrinho, setCarrinho] = useState(() => {
    // Carrega carrinho do localStorage ao inicializar
    const saved = localStorage.getItem('carrinho_cliente');
    return saved ? JSON.parse(saved) : [];
  });
  const [isCarrinhoAberto, setIsCarrinhoAberto] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [enviando, setEnviando] = useState(false); // Estado para o loading do botão
  const navigate = useNavigate();
  
  const nomeCliente = localStorage.getItem('nome_cliente') || 'Cliente';
  const idCliente = localStorage.getItem('id_cliente'); // ID salvo no login
  const token = localStorage.getItem('token');

  const slides = [
    { url: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=1200", title: "Tecnologia e Qualidade ao seu alcance.", subtitle: "Explore o nosso stock atualizado com os melhores preços de Angola." },
    { url: "https://images.unsplash.com/photo-1589939705384-5185138a04b9?q=80&w=1200", title: "As Melhores Ferramentas.", subtitle: "Tudo o que você precisa para a sua obra em um só lugar." },
    { url: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?q=80&w=1200", title: "Materiais de Construção.", subtitle: "A garantia de durabilidade para o seu projeto." }
  ];

  // Salva carrinho no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem('carrinho_cliente', JSON.stringify(carrinho));
  }, [carrinho]);

  useEffect(() => {
    if (!token) {
      navigate('/login-cliente');
      return;
    }
    fetchProdutos();

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [token, slides.length]);

  const fetchProdutos = async () => {
    try {
      const res = await fetch(apiUrl('/api/produtos'), {
        headers: { 'x-access-token': token }
      });
      const data = await res.json();
      setProdutos(data);
    } catch (err) {
      toast.error("Erro ao carregar produtos");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('nome_cliente');
    localStorage.removeItem('id_cliente');
    localStorage.removeItem('carrinho_cliente');
    toast.info("Sessão terminada");
    navigate('/login-cliente');
  };

  // LÓGICA DO CARRINHO
  const adicionarAoCarrinho = (produto, e) => {
    if (e) e.stopPropagation();
    const existe = carrinho.find(item => item.id === produto.id);
    if (existe) {
      setCarrinho(carrinho.map(item => item.id === produto.id ? { ...existe, qtd: existe.qtd + 1 } : item));
    } else {
      setCarrinho([...carrinho, { ...produto, qtd: 1 }]);
    }
    toast.success(`${produto.nome} adicionado!`);
  };

  const alterarQtd = (id, delta) => {
    setCarrinho(carrinho.map(item => 
      item.id === id ? { ...item, qtd: Math.max(1, item.qtd + delta) } : item
    ));
  };

  const removerDoCarrinho = (id) => {
    setCarrinho(carrinho.filter(item => item.id !== id));
    toast.error("Item removido");
  };

  const totalCarrinho = carrinho.reduce((sum, item) => sum + (item.preco_venda * item.qtd), 0);

  // NOVA FUNÇÃO: FINALIZAR PEDIDO NO BANCO DE DADOS
  const finalizarPedido = async () => {
    if (carrinho.length === 0) return;
    if (!idCliente) {
        toast.error("Erro de identificação do cliente. Por favor, faça login novamente.");
        return;
    }

    setEnviando(true);

    const pedidoData = {
      cliente_id: idCliente,
      total: totalCarrinho,
      itens: carrinho.map(item => ({
        produto_id: item.id,
        quantidade: item.qtd,
        preco_unitario: item.preco_venda
      }))
    };

    try {
      const res = await fetch(apiUrl('/api/vendas'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-access-token': token 
        },
        body: JSON.stringify(pedidoData)
      });

      if (res.ok) {
        toast.success("Pedido enviado! Aguarde a validação do administrador.");
        setCarrinho([]);
        setIsCarrinhoAberto(false);
      } else {
        const error = await res.json();
        toast.error(error.message || "Erro ao processar o pedido.");
      }
    } catch (err) {
      toast.error("Não foi possível conectar ao servidor.");
    } finally {
      setEnviando(false);
    }
  };

  const produtosFiltrados = produtos.filter(p => 
    p.nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 md:h-20 md:py-0 flex flex-col justify-center gap-3 md:gap-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                <ShoppingBag size={24} />
              </div>
              <span className="text-xl font-black text-slate-800 hidden md:block">A.R.F <span className="text-blue-600">Comercial</span></span>
            </div>

            <div className="flex-1 max-w-md mx-8 relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="O que procura hoje?"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-none rounded-full focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden sm:block text-right">
                <p className="text-xs text-slate-500 font-medium leading-none">Olá, bem-vindo</p>
                <p className="text-sm font-bold text-slate-800">{nomeCliente}</p>
              </div>
              
              <button onClick={() => setIsCarrinhoAberto(true)} className="relative p-2 text-slate-600 hover:text-blue-600 transition-colors cursor-pointer">
                <ShoppingCart size={24} />
                {carrinho.length > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-bounce">
                    {carrinho.length}
                  </span>
                )}
              </button>

              <button onClick={() => navigate('/meus-pedidos')} className="p-2 text-slate-400 hover:text-blue-500 transition-colors cursor-pointer" title="Meus Pedidos">
                <Package size={24} />
              </button>
              <button onClick={() => navigate('/notificacoes-cliente')} className="p-2 text-slate-400 hover:text-blue-500 transition-colors cursor-pointer" title="Notificações">
                <Bell size={24} />
              </button>
              <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 transition-colors cursor-pointer">
                <LogOut size={24} />
              </button>
            </div>
          </div>

          <div className="relative md:hidden">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text"
              placeholder="O que procura hoje?"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 rounded-full border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="relative h-[300px] md:h-[400px] rounded-[2rem] overflow-hidden mb-10 shadow-xl group">
            {slides.map((slide, index) => (
                <div key={index} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent z-10" />
                    <img src={slide.url} className="w-full h-full object-cover" alt="" />
                    <div className="absolute inset-0 z-20 flex flex-col justify-center px-8 md:px-12 text-white max-w-2xl">
                        <span className="bg-blue-600 text-[10px] font-black px-4 py-1 rounded-full w-fit mb-4 tracking-widest uppercase">Novidades</span>
                        <h2 className="text-3xl md:text-5xl font-black mb-4 leading-tight">{slide.title}</h2>
                        <p className="text-blue-100 text-lg opacity-90">{slide.subtitle}</p>
                    </div>
                </div>
            ))}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
                {slides.map((_, i) => (
                    <button key={i} onClick={() => setCurrentSlide(i)} className={`h-1.5 rounded-full transition-all ${i === currentSlide ? 'w-8 bg-blue-600' : 'w-2 bg-white/50'}`} />
                ))}
            </div>
        </div>

        <h3 className="text-2xl font-bold text-slate-800 mb-8 flex items-center gap-2">
          Nossos Produtos
          <div className="h-1 flex-1 bg-slate-200 rounded-full ml-4" />
        </h3>

        {produtosFiltrados.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {produtosFiltrados.map((item) => (
              <div 
                key={item.id} 
                onClick={() => setProdutoSelecionado(item)}
                className="bg-white rounded-[2rem] border border-slate-100 p-4 hover:shadow-2xl hover:shadow-blue-100 transition-all group flex flex-col cursor-pointer"
              >
                <div className="h-52 bg-slate-50 rounded-[1.5rem] mb-4 flex items-center justify-center group-hover:bg-blue-50 transition-colors relative overflow-hidden">
                    {item.imagem_url ? (
                      <img src={item.imagem_url} alt={item.nome} className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <Package size={64} className="text-slate-200 group-hover:scale-110 transition-transform duration-300" />
                    )}
                    <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-[10px] font-black px-3 py-1 rounded-lg border border-slate-100 text-slate-500 uppercase tracking-tighter">
                      {item.categoria || 'Geral'}
                    </span>
                </div>

                <div className="flex-1 px-2">
                  <h4 className="font-bold text-slate-800 text-lg mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">{item.nome}</h4>
                  <p className={`text-[10px] font-black uppercase tracking-widest mb-4 ${item.quantidade > 0 ? 'text-green-500' : 'text-red-400'}`}>
                    {item.quantidade > 0 ? 'Disponível' : 'Esgotado'}
                  </p>
                </div>

                <div className="flex items-center justify-between p-2 bg-slate-50 rounded-2xl">
                  <div className="pl-2">
                    <p className="text-xl font-black text-slate-900 leading-none">
                      {Number(item.preco_venda).toLocaleString('pt-AO')} <span className="text-[10px]">Kz</span>
                    </p>
                  </div>
                  <button 
                    onClick={(e) => adicionarAoCarrinho(item, e)}
                    disabled={item.quantidade <= 0}
                    className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition-all shadow-lg active:scale-90 disabled:bg-slate-300 cursor-pointer"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
              <Search size={48} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-500 font-medium">Não encontramos produtos com esse nome.</p>
          </div>
        )}
      </main>

      {isCarrinhoAberto && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsCarrinhoAberto(false)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><ShoppingCart className="text-blue-600" /> Seu Carrinho</h2>
              <button onClick={() => setIsCarrinhoAberto(false)} className="p-2 bg-white rounded-full hover:bg-red-50 hover:text-red-500 transition-all"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {carrinho.length === 0 ? (
                <div className="text-center py-20 text-slate-400">
                  <ShoppingBag size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="font-medium">O seu carrinho está vazio</p>
                </div>
              ) : (
                carrinho.map(item => (
                  <div key={item.id} className="flex gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100 group transition-all">
                    <img src={item.imagem_url} className="w-16 h-16 rounded-2xl object-cover bg-white p-1 border border-slate-200" alt="" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-800 text-sm truncate">{item.nome}</h4>
                      <p className="text-blue-600 font-black text-xs mb-3">{Number(item.preco_venda).toLocaleString()} Kz</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 bg-white px-3 py-1 rounded-xl border border-slate-200">
                          <button onClick={() => alterarQtd(item.id, -1)} className="text-slate-400 hover:text-blue-600"><Minus size={14} /></button>
                          <span className="font-black text-sm w-4 text-center">{item.qtd}</span>
                          <button onClick={() => alterarQtd(item.id, 1)} className="text-slate-400 hover:text-blue-600"><Plus size={14} /></button>
                        </div>
                        <button onClick={() => removerDoCarrinho(item.id)} className="text-slate-300 hover:text-red-500 p-2 transition-colors"><Trash2 size={18} /></button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-4">
              <div className="flex justify-between items-center px-2">
                <span className="font-bold text-slate-500">Subtotal</span>
                <span className="text-2xl font-black text-slate-900">{totalCarrinho.toLocaleString()} Kz</span>
              </div>
              <button 
                onClick={finalizarPedido} 
                disabled={carrinho.length === 0 || enviando}
                className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black shadow-xl shadow-blue-100 flex items-center justify-center gap-3 disabled:bg-slate-300 active:scale-95 transition-all uppercase text-xs tracking-widest"
              >
                {enviando ? "Processando..." : "Confirmar Pedido"}
              </button>
            </div>
          </div>
        </div>
      )}

      {produtoSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in zoom-in duration-300">
            <div className="md:w-1/2 bg-slate-50 p-8 flex items-center justify-center relative">
               {produtoSelecionado.imagem_url ? (
                  <img src={produtoSelecionado.imagem_url} alt="" className="max-h-80 w-auto object-contain drop-shadow-2xl" />
               ) : (
                  <Package size={150} className="text-slate-200" />
               )}
               <button onClick={() => setProdutoSelecionado(null)} className="absolute top-8 left-8 p-3 bg-white rounded-2xl shadow-xl hover:bg-red-50 hover:text-red-500 transition-all active:scale-90">
                 <X size={24} />
               </button>
            </div>

            <div className="md:w-1/2 p-10 md:p-14 flex flex-col bg-white">
              <div className="flex-1">
                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full uppercase tracking-widest border border-blue-100">
                  {produtoSelecionado.categoria || 'Geral'}
                </span>
                <h2 className="text-3xl font-black text-slate-900 mt-6 mb-6 leading-tight">{produtoSelecionado.nome}</h2>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 p-2 bg-blue-50 rounded-xl text-blue-600"><Info size={20} /></div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Descrição</p>
                      <p className="text-sm text-slate-600 leading-relaxed font-medium italic">{produtoSelecionado.descricao || "Sem descrição disponível."}</p>
                    </div>
                  </div>
                  <div className="py-6 border-y border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Disponibilidade</p>
                      <p className={`text-sm font-bold flex items-center gap-2 ${produtoSelecionado.quantidade <= 5 ? 'text-orange-500' : 'text-green-600'}`}>
                        <span className={`w-2 h-2 rounded-full animate-pulse ${produtoSelecionado.quantidade <= 5 ? 'bg-orange-500' : 'bg-green-600'}`} />
                        {produtoSelecionado.quantidade > 0 ? `${produtoSelecionado.quantidade} unidades` : 'Esgotado'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-10 flex items-center justify-between gap-6">
                <div>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Preço unitário</p>
                  <p className="text-3xl font-black text-slate-900">{Number(produtoSelecionado.preco_venda).toLocaleString('pt-AO')} <span className="text-sm">Kz</span></p>
                </div>
                <button onClick={() => { adicionarAoCarrinho(produtoSelecionado); setProdutoSelecionado(null); }}
                  disabled={produtoSelecionado.quantidade <= 0}
                  className="flex-1 bg-blue-600 text-white px-8 py-5 rounded-[1.5rem] font-black flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-xl active:scale-95 disabled:bg-slate-300 uppercase text-xs tracking-widest">
                  <ShoppingCart size={20} /> Adicionar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}