import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

// Tipagem baseada no seu modelo de Produto
interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl?: string;
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Contexto de Autenticação e Navegação
  const { token, user, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  // Carrega os produtos ao montar a página
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async (query = '') => {
    setLoading(true);
    try {
      const endpoint = query ? `/products/search?q=${query}` : '/products';
      const response = await fetch(endpoint);
      
      if (!response.ok) throw new Error('Falha ao buscar produtos');
      
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Erro na requisição, a carregar dados de fallback:", error);
      // Dados de exemplo caso a API não esteja a correr no momento
      setProducts([
        { id: 1, name: "Teorias da Administração - Reinaldo O. da Silva", description: "Livro académico, edição revisada.", price: 120.00, stock: 5 },
        { id: 2, name: "Farol Original VW Gol G6", description: "Peça automotiva de reposição em perfeito estado.", price: 350.00, stock: 2 },
        { id: 3, name: "Kit Flor de Sal e Especiarias", description: "Ideal para finalizar pratos e carnes.", price: 45.90, stock: 15 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts(searchQuery);
  };

  const handleAddToCart = async (productId: number) => {
    // Bloqueia a ação se o utilizador não estiver logado
    if (!isAuthenticated || !token || !user) {
      alert("Precisa de entrar na sua conta para adicionar itens ao carrinho.");
      navigate('/login');
      return;
    }

    try {
      // Dispara a requisição com o token Bearer
      const response = await fetch('/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          userId: user.id, 
          productId, 
          quantity: 1 
        }),
      });

      if (!response.ok) throw new Error('Falha ao adicionar ao carrinho');
      
      alert('Produto adicionado ao carrinho com sucesso!');
    } catch (error) {
      console.error("Erro ao adicionar ao carrinho:", error);
      alert('Não foi possível adicionar o produto neste momento.');
    }
  };

  return (
    <div className="w-full">
      
      {/* Secção de Busca (Hero Banner) */}
      <section className="bg-white shadow-sm border-b py-10 md:py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-6 tracking-tight">
            O que está a procurar hoje?
          </h1>
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="Buscar por nome do produto..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-gray-700"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button 
              type="submit" 
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-bold shadow-sm transition-colors"
            >
              Buscar
            </button>
          </form>
        </div>
      </section>

      {/* Conteúdo Principal (Grelha de Produtos) */}
      <main className="p-4 sm:p-8 max-w-7xl mx-auto min-h-[50vh]">
        <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
          <h2 className="text-xl font-bold text-gray-800">
            {searchQuery ? `Resultados para "${searchQuery}"` : 'Produtos em Destaque'}
          </h2>
          <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {products.length} {products.length === 1 ? 'item encontrado' : 'itens encontrados'}
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <p className="text-gray-500 font-medium animate-pulse">A carregar catálogo...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col h-full">
                
                {/* Imagem e Título Clicáveis (Redirecionam para Detalhes) */}
                <Link to={`/produto/${product.id}`} className="group block cursor-pointer">
                  <div className="h-48 bg-gray-50 rounded-lg mb-4 flex items-center justify-center text-gray-400 overflow-hidden border border-gray-100">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                  
                  <h3 className="font-bold text-lg mb-1 truncate text-gray-800 group-hover:text-blue-600 transition-colors" title={product.name}>
                    {product.name}
                  </h3>
                </Link>

                {/* Descrição e Preço */}
                <p className="text-sm text-gray-500 mb-4 line-clamp-2 flex-grow">
                  {product.description}
                </p>
                
                <div className="flex justify-between items-end mb-4">
                  <span className="font-black text-2xl text-blue-600">
                    R$ {parseFloat(product.price as any).toFixed(2)}
                  </span>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${product.stock > 0 ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
                    {product.stock > 0 ? `Stock: ${product.stock}` : 'Esgotado'}
                  </span>
                </div>
                
                {/* Botão de Adicionar ao Carrinho */}
                <button 
                  onClick={() => handleAddToCart(product.id)}
                  disabled={product.stock === 0}
                  className={`w-full py-2.5 rounded-lg font-bold transition-colors shadow-sm
                    ${product.stock === 0 
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                >
                  {product.stock === 0 ? 'Sem stock' : 'Adicionar ao Carrinho'}
                </button>

              </div>
            ))}
          </div>
        )}

        {/* Estado Vazio (Nenhum produto encontrado) */}
        {!loading && products.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300 mt-4">
            <p className="text-gray-500 text-lg">Nenhum produto encontrado.</p>
            <button 
              onClick={() => { setSearchQuery(''); fetchProducts(''); }} 
              className="mt-4 text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors"
            >
              Limpar busca e ver todos os produtos
            </button>
          </div>
        )}
      </main>
    </div>
  );
}