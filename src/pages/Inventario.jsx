import { useEffect, useState } from 'react';
import { Package, Plus, Trash2, Search, AlertCircle, X, Save, Image as ImageIcon, Edit3 } from 'lucide-react';
import { toast } from 'sonner';

export default function Inventario() {
  const [produtos, setProdutos] = useState([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editandoId, setEditandoId] = useState(null); 
  
  const [novoProduto, setNovoProduto] = useState({
    nome: '', categoria: '', quantidade: '', preco_custo: '', preco_venda: '', descricao: '', foto: null
  });

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchProdutos();
  }, []);

  const fetchProdutos = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/produtos', {
        headers: { 'x-access-token': token }
      });
      const data = await res.json();
      setProdutos(data);
    } catch (err) {
      toast.error("Erro ao carregar inventário");
    } finally {
      setLoading(false);
    }
  };

  const abrirEdicao = (produto) => {
    setEditandoId(produto.id);
    setNovoProduto({
      nome: produto.nome,
      categoria: produto.categoria,
      quantidade: produto.quantidade,
      preco_custo: produto.preco_custo,
      preco_venda: produto.preco_venda,
      descricao: produto.descricao || '',
      foto: null 
    });
    setShowModal(true);
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('nome', novoProduto.nome);
    formData.append('categoria', novoProduto.categoria);
    formData.append('quantidade', novoProduto.quantidade);
    formData.append('preco_custo', novoProduto.preco_custo);
    formData.append('preco_venda', novoProduto.preco_venda);
    formData.append('descricao', novoProduto.descricao);
    if (novoProduto.foto) formData.append('imagem', novoProduto.foto);

    const url = editandoId ? `http://localhost:3001/api/produtos/${editandoId}` : 'http://localhost:3001/api/produtos';
    const metodo = editandoId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method: metodo,
        headers: { 'x-access-token': token },
        body: formData
      });
      if (res.ok) {
        toast.success(editandoId ? "Produto atualizado!" : "Produto cadastrado!");
        fecharModal();
        fetchProdutos();
      } else {
        toast.error("Erro ao processar pedido");
      }
    } catch (err) {
      toast.error("Erro ao conectar com o servidor");
    }
  };

  const fecharModal = () => {
    setShowModal(false);
    setEditandoId(null);
    setNovoProduto({ nome: '', categoria: '', quantidade: '', preco_custo: '', preco_venda: '', descricao: '', foto: null });
  };

  const deleteProduto = async (id) => {
    if (!window.confirm("Tem certeza que deseja eliminar este produto?")) return;
    const res = await fetch(`http://localhost:3001/api/produtos/${id}`, {
      method: 'DELETE',
      headers: { 'x-access-token': token }
    });
    if (res.ok) {
      setProdutos(produtos.filter(p => p.id !== id));
      toast.success("Produto removido");
    }
  };

  const produtosFiltrados = produtos.filter(p => 
    p.nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventário</h1>
          <p className="text-slate-500">Gestão de stock da A.R.F Comercial</p>
        </div>
        <button 
          onClick={() => { setEditandoId(null); setShowModal(true); }}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg cursor-pointer"
        >
          <Plus size={20} /> Novo Produto
        </button>
      </div>

      {/* BUSCA */}
      <div className="bg-white p-4 border border-slate-200 rounded-2xl flex items-center gap-3 shadow-sm">
        <Search className="text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="Pesquisar produto..."
          className="flex-1 outline-none text-slate-600 bg-transparent"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {/* TABELA COM STATUS E QTD SEMPRE VISÍVEIS */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-black">
            <tr>
              <th className="px-6 py-4 tracking-widest">Produto</th>
              <th className="px-6 py-4 tracking-widest">Categoria</th>
              <th className="px-6 py-4 tracking-widest">Qtd</th>
              <th className="px-6 py-4 tracking-widest">Venda (Kz)</th>
              <th className="px-6 py-4 tracking-widest">Status</th>
              <th className="px-6 py-4 tracking-widest text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {produtosFiltrados.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-200 shrink-0">
                      {item.imagem_url ? (
                        <img src={item.imagem_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Package size={20} className="text-slate-400" />
                      )}
                    </div>
                    <span className="font-semibold text-slate-700 truncate max-w-[180px]">{item.nome}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-500 text-sm">{item.categoria}</td>
                <td className="px-6 py-4 font-bold text-slate-700">{item.quantidade}</td>
                <td className="px-6 py-4 font-mono text-blue-600 font-bold text-sm whitespace-nowrap">
                   {Number(item.preco_venda).toLocaleString('pt-AO')} Kz
                </td>
                <td className="px-6 py-4">
                  {item.quantidade <= 5 ? (
                    <span className="flex items-center gap-1 text-red-500 text-[10px] uppercase font-black bg-red-50 px-2 py-1 rounded-lg w-fit whitespace-nowrap">
                      <AlertCircle size={12} /> Stock Baixo
                    </span>
                  ) : (
                    <span className="text-green-600 text-[10px] uppercase font-black bg-green-50 px-2 py-1 rounded-lg w-fit whitespace-nowrap">Em Stock</span>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => abrirEdicao(item)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"><Edit3 size={18} /></button>
                    <button onClick={() => deleteProduto(item.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"><Trash2 size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL CORRIGIDO (SEM DISTORÇÃO) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl rounded-[2rem] shadow-2xl flex flex-col max-h-[95vh] overflow-hidden animate-in zoom-in duration-200">
            {/* Header Fixo */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <h3 className="text-xl font-bold text-slate-800">
                {editandoId ? "Editar Produto" : "Novo Produto"}
              </h3>
              <button onClick={fecharModal} className="p-2 hover:bg-white rounded-full text-slate-400">
                <X size={20} />
              </button>
            </div>

            {/* Form com scroll interno se necessário */}
            <form onSubmit={handleSalvar} className="p-6 md:p-8 overflow-y-auto space-y-4 flex-1">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-wider">Nome do Produto</label>
                  <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    value={novoProduto.nome} onChange={e => setNovoProduto({...novoProduto, nome: e.target.value})} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-wider">Categoria</label>
                    <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none text-sm"
                      value={novoProduto.categoria} onChange={e => setNovoProduto({...novoProduto, categoria: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-wider">Qtd Stock</label>
                    <input type="number" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none text-sm"
                      value={novoProduto.quantidade} onChange={e => setNovoProduto({...novoProduto, quantidade: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-wider">Custo (Kz)</label>
                    <input type="number" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none text-sm"
                      value={novoProduto.preco_custo} onChange={e => setNovoProduto({...novoProduto, preco_custo: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-wider">Venda (Kz)</label>
                    <input type="number" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none text-sm"
                      value={novoProduto.preco_venda} onChange={e => setNovoProduto({...novoProduto, preco_venda: e.target.value})} />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-wider">Descrição</label>
                  <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none resize-none text-sm" rows="2"
                    value={novoProduto.descricao} onChange={e => setNovoProduto({...novoProduto, descricao: e.target.value})} />
                </div>

                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 bg-slate-50">
                  <input type="file" accept="image/*" className="hidden" id="upload-edit" onChange={e => setNovoProduto({...novoProduto, foto: e.target.files[0]})} />
                  <label htmlFor="upload-edit" className="cursor-pointer flex flex-col items-center gap-1 text-slate-400 hover:text-blue-500">
                    <ImageIcon size={24} />
                    <span className="text-[10px] font-bold uppercase truncate max-w-full">
                      {novoProduto.foto ? novoProduto.foto.name : (editandoId ? "Alterar Foto" : "Adicionar Foto")}
                    </span>
                  </label>
                </div>
              </div>

              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all sticky bottom-0">
                <Save size={18} /> {editandoId ? "Salvar Alterações" : "Cadastrar Produto"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}