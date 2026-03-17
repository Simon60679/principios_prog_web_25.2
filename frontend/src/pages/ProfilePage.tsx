import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const { user, token, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Preenche os dados atuais do usuário ao carregar a página
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const response = await fetch(`/users/${user?.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          email,
          currentPassword,
          newPassword: newPassword ? newPassword : undefined
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.message || 'Falha ao atualizar o perfil.');
      }

      const data = await response.json();
      setSuccessMsg(data.message);
      setCurrentPassword('');
      setNewPassword('');

      // Se a senha foi alterada, força um novo login
      if (newPassword) {
        alert("Sua senha foi alterada com sucesso. Por favor, faça login novamente.");
        logout();
        navigate('/login');
        return;
      }

      // Se só mudou nome/email, atualiza o LocalStorage para a Navbar refletir a mudança
      const updatedUser = { ...user, name, email };
      localStorage.setItem('@Marketplace:user', JSON.stringify(updatedUser));
      
      // Força a Navbar a ler o novo nome sem precisar deslogar
      setTimeout(() => window.location.reload(), 1500);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-8 mt-10">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">Meu Perfil</h1>

        {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 font-medium text-sm">{error}</div>}
        {successMsg && <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6 font-medium text-sm">{successMsg}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Nome Completo</label>
              <input 
                type="text" 
                required 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
              <input 
                type="email" 
                required 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6 mt-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Segurança</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Nova Senha (opcional)</label>
                <input 
                  type="password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  placeholder="Deixe em branco para não alterar"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-gray-50 focus:bg-white"
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <label className="block text-sm font-black text-blue-900 mb-2">Senha Atual (Obrigatória)</label>
                <p className="text-xs text-blue-700 mb-3">Para salvar qualquer alteração acima, confirme sua senha atual.</p>
                <input 
                  type="password" 
                  required 
                  value={currentPassword} 
                  onChange={(e) => setCurrentPassword(e.target.value)} 
                  placeholder="Digite sua senha atual"
                  className="w-full px-4 py-3 rounded-lg border border-blue-200 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button 
              type="submit" 
              disabled={loading || !currentPassword}
              className={`px-8 py-3 rounded-xl font-bold text-white transition-all shadow-sm
                ${(loading || !currentPassword) ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md'}`}
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}