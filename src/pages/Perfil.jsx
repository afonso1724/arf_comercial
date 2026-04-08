import { useEffect, useState } from 'react';
import { Mail, Phone, Calendar, User, Camera, Loader2, MapPin, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl } from '../config/api';

export default function Perfil() {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  // Pegar o token uma vez para usar em todas as funções
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = () => {
    fetch(apiUrl('/api/perfil'), {
      headers: { 'x-access-token': token } // Enviando o token para o backend
    })
      .then(res => {
        if (res.status === 401) throw new Error("Sessão expirada");
        return res.json();
      })
      .then(data => {
        setAdmin(data);
        setFormData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  const handleFotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const dataForUpload = new FormData();
    dataForUpload.append('foto', file);

    try {
      const response = await fetch(apiUrl('/api/perfil/foto'), {
        method: 'POST',
        headers: { 'x-access-token': token }, // Token aqui também!
        body: dataForUpload,
      });

      const result = await response.json();

      if (response.ok) {
        setAdmin({ ...admin, foto_url: result.foto_url });
        setFormData({ ...formData, foto_url: result.foto_url });
        toast.success('Foto atualizada com sucesso!');
      } else {
        toast.error('Erro ao atualizar foto.');
      }
    } catch (err) {
      toast.error('Erro de conexão com o servidor.');
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch(apiUrl('/api/perfil'), {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-access-token': token // Token essencial aqui!
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Sucesso!', { description: 'Perfil atualizado com sucesso!' });
        setAdmin(formData);
        setIsEditing(false);
      }
    } catch (err) {
      toast.error('Erro ao salvar as alterações.');
    }
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="h-40 bg-gradient-to-r from-slate-200 to-slate-100"></div>
        
        <div className="px-8 pb-8">
          <div className="relative -mt-16 mb-6 flex flex-col md:flex-row md:items-end gap-6">
            
            <div className="relative">
              <img 
                src={admin?.foto_url || "https://github.com/shadcn.png"} 
                className="w-32 h-32 rounded-3xl border-4 border-white shadow-xl object-cover bg-white" 
                alt="Avatar"
              />
              
              <input 
                type="file" 
                id="foto-upload" 
                hidden 
                accept="image/*" 
                onChange={handleFotoChange} 
              />
              
              <label 
                htmlFor="foto-upload"
                className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-xl border-2 border-white hover:bg-blue-700 transition-all cursor-pointer shadow-lg"
              >
                <Camera size={18} />
              </label>
            </div>
            
            <div className="flex-1">
              {isEditing ? (
                <input 
                  className="text-3xl font-bold text-slate-900 border-b-2 border-blue-500 outline-none w-full bg-transparent"
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                />
              ) : (
                <h1 className="text-3xl font-bold text-slate-900">{admin?.nome}</h1>
              )}
              <p className="text-slate-500 flex items-center gap-1 mt-1"><MapPin size={16} /> Angola, Luanda</p>
            </div>

            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button onClick={handleSave} className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-green-700 transition-all cursor-pointer">
                    <Check size={18} /> Salvar
                  </button>
                  <button onClick={() => setIsEditing(false)} className="flex items-center gap-2 bg-slate-100 text-slate-600 px-5 py-2.5 rounded-xl font-semibold hover:bg-slate-200 transition-all cursor-pointer">
                    <X size={18} /> Cancelar
                  </button>
                </>
              ) : (
                <button onClick={() => setIsEditing(true)} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-slate-800 transition-all cursor-pointer">
                  Editar Perfil
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-slate-100 pt-8">
            <EditableInfo 
              isEditing={isEditing} label="E-mail" icon={<Mail size={20}/>}
              value={formData.email} onChange={(v) => setFormData({...formData, email: v})} 
            />
            <EditableInfo 
              isEditing={isEditing} label="Telefone" icon={<Phone size={20}/>}
              value={formData.telefone} onChange={(v) => setFormData({...formData, telefone: v})} 
            />
            <EditableInfo 
              isEditing={isEditing} label="Nascimento" icon={<Calendar size={20}/>}
              type="date"
              value={formData.data_nasc ? formData.data_nasc.split('T')[0] : ''} 
              onChange={(v) => setFormData({...formData, data_nasc: v})} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function EditableInfo({ label, value, icon, isEditing, onChange, type = "text" }) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50/50 border border-transparent hover:border-slate-100 transition-all">
      <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400">{icon}</div>
      <div className="flex-1">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        {isEditing ? (
          <input 
            type={type}
            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        ) : (
          <p className="text-slate-700 font-semibold">{type === 'date' && value ? new Date(value).toLocaleDateString('pt-PT') : value || "---"}</p>
        )}
      </div>
    </div>
  );
}