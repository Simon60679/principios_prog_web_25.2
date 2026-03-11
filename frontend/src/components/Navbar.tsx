import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/'); // Redireciona para a home após sair
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo / Nome do Site */}
          <Link to="/" className="flex-shrink-0 flex items-center gap-2">
            <span className="text-2xl font-black text-blue-600 tracking-tighter">
              MARKET<span className="text-gray-800">PLACE</span>
            </span>
          </Link>

          {/* Links de Navegação */}
          <div className="flex items-center gap-6">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-gray-500 hidden md:block">
                  Olá, <strong className="text-gray-800">{user?.name}</strong>
                </span>
                
                <Link to="/painel-vendedor" className="text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors">
                  Vender
                </Link>
                <Link to="/compras" className="text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors">
                  Pedidos
                </Link>
                <Link to="/carrinho" className="text-sm font-semibold flex items-center gap-1 text-gray-600 hover:text-blue-600 transition-colors">
                  Carrinho
                </Link>
                
                <button 
                  onClick={handleLogout}
                  className="ml-4 text-sm font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors"
                >
                  Sair
                </button>
              </>
            ) : (
              <Link 
                to="/login" 
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-sm"
              >
                Entrar
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}