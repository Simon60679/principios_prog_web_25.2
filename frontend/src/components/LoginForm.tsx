import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom'; // <-- Importe o useNavigate
import { AuthContext } from '../contexts/AuthContext';

export default function LoginForm() {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate(); // <-- Inicialize o hook

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await login(email, password);
      alert('Login realizado com sucesso!');
      
      // Manda o usuário para a página inicial logo após o sucesso
      navigate('/'); 
      
    } catch (err: any) {
      setError(err.message || 'Falha ao fazer login. Verifique suas credenciais.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-gray-800 text-center">Entrar</h2>
      
      {error && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">{error}</p>}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-3"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-3"
        />
      </div>
      
      <button type="submit" className="bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-bold mt-2">
        Entrar
      </button>
    </form>
  );
}