import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginCliente() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

const handleLogin = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
      const res = await fetch('http://localhost:3001/api/cliente/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    });

    const data = await res.json(); // token, id e nome retornados pela API

    if (res.ok) {
      // guardar token genérico para uso tanto no admin quanto no cliente
      localStorage.setItem('token', data.token);
      localStorage.setItem('nome_cliente', data.nome);
      localStorage.setItem('id_cliente', data.id);
      toast.success(`Bem-vindo, ${data.nome}!`);
      navigate('/loja');
    } else {
      toast.error(data.error || "Erro no login");
    }
  } catch (err) {
    toast.error("Erro de conexão");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 border border-slate-100">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-blue-600 mb-2">A.R.F Comercial</h1>
          <p className="text-slate-500 font-medium">Acesse sua conta de cliente</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Seu E-mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="email" required placeholder="exemplo@gmail.com"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all"
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Sua Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="password" required placeholder="••••••••"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all"
                onChange={e => setSenha(e.target.value)}
              />
            </div>
          </div>

          <button 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            {loading ? <Loader2 className="animate-spin" /> : <>Entrar na Loja <ArrowRight size={20} /></>}
          </button>
        </form>

        <p className="mt-8 text-center text-slate-600">
          Novo por aqui? <Link to="/register" className="text-blue-600 font-bold hover:underline">Crie sua conta</Link>
        </p>
      </div>
    </div>
  );
}