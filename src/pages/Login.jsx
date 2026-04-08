import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User } from 'lucide-react';
import { toast } from 'sonner'; 

import loginImg from '../assets/fundo_login1.jpg'; 

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Campos vazios', { description: 'Preencha tudo para entrar.' });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }) // Agora enviamos password conforme o backend espera
      });

      const data = await response.json();

      if (response.ok) {
        // SALVAR DADOS NO NAVEGADOR
        localStorage.setItem('token', data.token);
        localStorage.setItem('user_nome', data.nome);

        toast.success(`Acesso autorizado!`, {
          description: `Bem-vindo, ${data.nome}.`,
        });

        // REDIRECIONAR PARA O PERFIL (como pediste)
        setTimeout(() => {
          navigate('/perfil');
        }, 1200);
      } else {
        toast.error('Falha no login', {
          description: data.message || 'E-mail ou senha incorretos.',
        });
      }
    } catch (err) {
      toast.error('Erro de conexão', {
        description: 'Não foi possível contactar o servidor.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex">
      {/* LADO ESQUERDO: Painel com Imagem */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 items-center justify-center p-12 relative overflow-hidden">
        <img 
          src={loginImg} 
          alt="Login Background" 
          className="absolute inset-0 w-full h-full object-cover opacity-60" 
        />
        <div className="relative z-10 text-center">
            <h1 className="text-5xl font-bold text-white mb-4">A.R.F Comercial</h1>
            <p className="text-slate-200 text-lg">Gestão inteligente.
            Simplifique o seu estoque conosco, seja bem-vindo ao futuro da gestão de inventário.
            </p>
        </div>
        <div className="absolute top-0 -left-20 w-80 h-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-0 -right-20 w-80 h-80 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      </div>

      {/* LADO DIREITO: Formulário */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
             <h1 className="text-3xl font-bold text-slate-900">A.R.F Comercial</h1>
          </div>
          
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-slate-800">Login</h2>
            <p className="text-slate-500">Insira as suas credenciais para gerir o sistema.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">E-mail</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User size={18} />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  placeholder="exemplo@gmail.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-3 px-4 rounded-xl shadow-lg shadow-blue-200 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? 'A verificar...' : 'Entrar no Sistema'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}