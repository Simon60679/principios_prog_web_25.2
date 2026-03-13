import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    // Adicionamos o await para garantir que o token seja limpo e invalidado no backend
    // ANTES de jogar o usuário de volta para a página inicial
    await logout();
    navigate('/'); 
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo / Nome do Site */}
          <Link to="/" className="flex-shrink-0 flex items-center gap-2 group">
            <div className="bg-blue-600 text-white p-2 rounded-lg group-hover:bg-blue-700 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <span className="text-2xl font-black text-gray-800 tracking-tighter">
              MARKET<span className="text-blue-600">PLACE</span>
            </span>
          </Link>

          {/* Links de Navegação */}
          <div className="flex items-center gap-4 sm:gap-6">
            
            {/* O Carrinho fica visível para todos */}
            <Link to="/carrinho" className="text-sm font-semibold flex items-center gap-1 text-gray-600 hover:text-blue-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="hidden sm:inline">Carrinho</span>
            </Link>

            {/* Renderização Condicional: Logado vs Visitante */}
            {isAuthenticated ? (
              <div className="flex items-center gap-3 sm:gap-4 border-l border-gray-200 pl-4">
                <span className="text-sm text-gray-500 hidden md:block">
                  Olá, <strong className="text-gray-800">{user?.name?.split(' ')[0]}</strong>
                </span>
                
                <Link to="/painel-vendedor" className="text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors">
                  Vender
                </Link>
                
                <Link to="/compras" className="text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors">
                  Pedidos
                </Link>
                
                <button 
                  onClick={handleLogout}
                  className="ml-2 text-sm font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors"
                >
                  Sair
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
                <Link 
                  to="/login" 
                  className="text-sm font-bold text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Entrar
                </Link>
                <Link 
                  to="/register" 
                  className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Cadastrar
                </Link>
              </div>
            )}
          </div>
          
        </div>
      </div>
    </nav>
  );
}