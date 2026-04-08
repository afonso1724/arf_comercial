import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, User, Lock, LogOut, Save, X, Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl } from '../config/api';

export default function Configuracoes() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // Perfil
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ nome: '', email: '' });

  // Password
  const [editingPassword, setEditingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ atual: '', nova: '', confirmar: '' });
  const [showPasswords, setShowPasswords] = useState({ atual: false, nova: false, confirmar: false });
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = () => {
    fetch(apiUrl('/api/perfil'), {
      headers: { 'x-access-token': token }
    })
      .then(res => {
        if (!res.ok) throw new Error('Erro ao carregar perfil');
        return res.json();
      })
      .then(data => {
        setAdmin(data);
        setProfileForm({ nome: data.nome, email: data.email });
        setLoading(false);
      })
      .catch(err => {
        toast.error(err.message);
        setLoading(false);
      });
  };

  const handleSaveProfile = async () => {
    if (!profileForm.nome || !profileForm.email) {
      toast.error('Preencha todos os campos');
      return;
    }

    try {
      const res = await fetch(apiUrl('/api/perfil/update'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token
        },
        body: JSON.stringify({ nome: profileForm.nome, email: profileForm.email })
      });

      if (!res.ok) throw new Error('Erro ao atualizar perfil');
      
      const data = await res.json();
      setAdmin(data);
      setEditingProfile(false);
      toast.success('Perfil atualizado com sucesso!');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSavePassword = async () => {
    if (!passwordForm.atual || !passwordForm.nova || !passwordForm.confirmar) {
      toast.error('Preencha todos os campos');
      return;
    }

    if (passwordForm.nova !== passwordForm.confirmar) {
      toast.error('As passwords não coincidem');
      return;
    }

    if (passwordForm.nova.length < 6) {
      toast.error('A nova password deve ter pelo menos 6 caracteres');
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch(apiUrl('/api/perfil/password'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token
        },
        body: JSON.stringify({ senhaAtual: passwordForm.atual, senhaNova: passwordForm.nova })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erro ao alterar password');
      }
      
      setEditingPassword(false);
      setPasswordForm({ atual: '', nova: '', confirmar: '' });
      toast.success('Password alterada com sucesso!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    toast.success('Sessão encerrada');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="space-y-2 mb-8">
        <div className="flex items-center gap-3">
          <Settings size={28} className="text-blue-600" />
          <h1 className="text-3xl font-black text-slate-900">Configurações</h1>
        </div>
        <p className="text-slate-500">Gerencie o seu perfil e preferências</p>
      </div>

      {/* Secção: Perfil */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <User size={20} className="text-blue-600" />
          <h2 className="text-lg font-bold text-slate-900">Perfil do Utilizador</h2>
        </div>

        {!editingProfile ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Nome</label>
                <p className="text-slate-900 font-medium mt-1">{admin?.nome}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Email</label>
                <p className="text-slate-900 font-medium mt-1">{admin?.email}</p>
              </div>
            </div>
            <button
              onClick={() => setEditingProfile(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Editar Perfil
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Nome</label>
              <input
                type="text"
                value={profileForm.nome}
                onChange={(e) => setProfileForm({ ...profileForm, nome: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSaveProfile}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <Save size={16} /> Guardar
              </button>
              <button
                onClick={() => {
                  setEditingProfile(false);
                  setProfileForm({ nome: admin.nome, email: admin.email });
                }}
                className="flex items-center gap-2 px-4 py-2 bg-slate-300 text-slate-900 rounded-lg hover:bg-slate-400 transition-colors font-medium"
              >
                <X size={16} /> Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Secção: Alterar Password */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Lock size={20} className="text-orange-600" />
          <h2 className="text-lg font-bold text-slate-900">Segurança</h2>
        </div>

        {!editingPassword ? (
          <button
            onClick={() => setEditingPassword(true)}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
          >
            Alterar Password
          </button>
        ) : (
          <div className="space-y-4">
            {/* Password Atual */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Password Atual</label>
              <div className="relative">
                <input
                  type={showPasswords.atual ? 'text' : 'password'}
                  value={passwordForm.atual}
                  onChange={(e) => setPasswordForm({ ...passwordForm, atual: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none pr-10"
                  placeholder="Digite sua password atual"
                />
                <button
                  onClick={() => setShowPasswords({ ...showPasswords, atual: !showPasswords.atual })}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700"
                >
                  {showPasswords.atual ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Nova Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Nova Password</label>
              <div className="relative">
                <input
                  type={showPasswords.nova ? 'text' : 'password'}
                  value={passwordForm.nova}
                  onChange={(e) => setPasswordForm({ ...passwordForm, nova: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none pr-10"
                  placeholder="Digite sua nova password"
                />
                <button
                  onClick={() => setShowPasswords({ ...showPasswords, nova: !showPasswords.nova })}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700"
                >
                  {showPasswords.nova ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">Mínimo 6 caracteres</p>
            </div>

            {/* Confirmar Nova Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Confirmar Nova Password</label>
              <div className="relative">
                <input
                  type={showPasswords.confirmar ? 'text' : 'password'}
                  value={passwordForm.confirmar}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmar: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none pr-10"
                  placeholder="Confirme a nova password"
                />
                <button
                  onClick={() => setShowPasswords({ ...showPasswords, confirmar: !showPasswords.confirmar })}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700"
                >
                  {showPasswords.confirmar ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-3">
              <button
                onClick={handleSavePassword}
                disabled={savingPassword}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
              >
                {savingPassword ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                {savingPassword ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                onClick={() => {
                  setEditingPassword(false);
                  setPasswordForm({ atual: '', nova: '', confirmar: '' });
                  setShowPasswords({ atual: false, nova: false, confirmar: false });
                }}
                className="flex items-center gap-2 px-4 py-2 bg-slate-300 text-slate-900 rounded-lg hover:bg-slate-400 transition-colors font-medium"
              >
                <X size={16} /> Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Secção: Logout */}
      <div className="bg-white border border-red-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <LogOut size={20} className="text-red-600" />
          <h2 className="text-lg font-bold text-slate-900">Sessão</h2>
        </div>
        <p className="text-slate-600 mb-4">Encerre sua sessão e faça logout do sistema.</p>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
        >
          <LogOut size={16} /> Sair da Conta
        </button>
      </div>
    </div>
  );
}
