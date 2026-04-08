import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Phone, MapPin, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function RegisterCliente() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    telefone: '',
    morada: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('http://localhost:3001/api/cliente/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Conta criada com sucesso! Faça login para continuar.");
        navigate('/login-cliente'); // Redireciona para o login do cliente
      } else {
        toast.error(data.error || "Erro ao criar conta.");
      }
    } catch (err) {
      toast.error("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-[2rem] shadow-xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Lado Esquerdo: Boas-vindas */}
        <div className="md:w-5/12 bg-blue-600 p-12 text-white flex flex-col justify-center">
          <h2 className="text-3xl font-bold mb-6">Bem-vindo à A.R.F Comercial</h2>
          <p className="text-blue-100 mb-8">
            Crie a sua conta para aceder aos nossos produtos exclusivos e gerir as suas compras com facilidade.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">✓</div>
              <span>Acompanhe as suas encomendas</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">✓</div>
              <span>Histórico de compras</span>
            </div>
          </div>
        </div>

        {/* Lado Direito: Formulário */}
        <div className="md:w-7/12 p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Criar Conta</h1>
            <p className="text-slate-500">Preencha os dados abaixo</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-3 text-slate-400" size={20} />
              <input 
                type="text" required placeholder="Nome Completo"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                onChange={e => setFormData({...formData, nome: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-slate-400" size={20} />
                <input 
                  type="email" required placeholder="Email"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-3 text-slate-400" size={20} />
                <input 
                  type="text" placeholder="Telefone"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  onChange={e => setFormData({...formData, telefone: e.target.value})}
                />
              </div>
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-400" size={20} />
              <input 
                type="password" required placeholder="Senha"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                onChange={e => setFormData({...formData, senha: e.target.value})}
              />
            </div>

            <div className="relative">
              <MapPin className="absolute left-3 top-3 text-slate-400" size={20} />
              <textarea 
                placeholder="Morada completa para entrega" rows="2"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                onChange={e => setFormData({...formData, morada: e.target.value})}
              />
            </div>

            <button 
              disabled={loading}
              type="submit"
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 group"
            >
              {loading ? <Loader2 className="animate-spin" /> : (
                <> Criar Minha Conta <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /> </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-slate-600 text-sm">
            Já tem uma conta? <Link to="/login-cliente" className="text-blue-600 font-bold hover:underline">Fazer Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}