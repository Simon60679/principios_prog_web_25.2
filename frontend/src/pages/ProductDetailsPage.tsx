import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  images?: string[]; 
  userId: number; 
}

export default function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const { token, user, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/products/${id}`);
        if (!response.ok) {
          if (response.status === 404) throw new Error('Produto não encontrado.');
          throw new Error('Erro ao carregar os detalhes do produto.');
        }
        
        const data = await response.json();
        setProduct(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Erro desconhecido.');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!product) return;
    
    if (!isAuthenticated || !token || !user) {
      alert("Precisa iniciar sessão para adicionar itens ao carrinho.");
      navigate('/login');
      return;
    }

    try {
      const response = await fetch('/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          userId: user.id, 
          productId: product.id, 
          quantity: 1 
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.message || 'Falha ao adicionar ao carrinho.');
      }
      
      alert('Produto adicionado ao carrinho com sucesso!');
    } catch (error: any) {
      console.error("Erro ao adicionar ao carrinho:", error);
      alert(error.message || 'Não foi possível adicionar o produto neste momento.');
    }
  };

  // Funções de navegação do carrossel
  const handlePrevImage = () => {
    if (!product?.images) return;
    setSelectedImageIndex((prev) => 
      prev === 0 ? product.images!.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    if (!product?.images) return;
    setSelectedImageIndex((prev) => 
      prev === product.images!.length - 1 ? 0 : prev + 1
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <p className="text-gray-500 font-medium animate-pulse">Carregando detalhes do produto...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center mt-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Ops! Algo deu errado.</h2>
        <p className="text-gray-600 mb-6">{error || 'Produto não encontrado.'}</p>
        <Link to="/" className="text-blue-600 hover:underline font-medium">
          &larr; Voltar à página principal
        </Link>
      </div>
    );
  }

  const hasMultipleImages = product.images && product.images.length > 1;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8">
      <div className="mb-6">
        <Link to="/" className="text-sm text-gray-500 hover:text-blue-600 flex items-center gap-1 transition-colors">
          <span>&larr;</span> Voltar aos produtos
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
          
          <div className="bg-white p-6 md:p-10 flex flex-col items-center border-b md:border-b-0 md:border-r border-gray-100">
            
            {/* O Container da Imagem Principal (Adicionado 'relative' e 'group') */}
            <div className="w-full flex items-center justify-center bg-gray-50 rounded-xl mb-6 overflow-hidden min-h-[300px] md:min-h-[400px] border border-gray-100 p-4 relative group">
              
              {product.images && product.images.length > 0 ? (
                <>
                  <img 
                    src={`http://localhost:3000${product.images[selectedImageIndex]}`} 
                    alt={`${product.name} - Imagem ${selectedImageIndex + 1}`} 
                    className="max-w-full max-h-[350px] object-contain drop-shadow-md transition-opacity duration-300"
                  />

                  {/* Botões do Carrossel (Visíveis apenas no Hover do 'group') */}
                  {hasMultipleImages && (
                    <>
                      <button
                        onClick={handlePrevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none"
                        title="Imagem anterior"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      
                      <button
                        onClick={handleNextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none"
                        title="Próxima imagem"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="text-center text-gray-400">
                  <svg className="w-24 h-24 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p>Imagem não disponível</p>
                </div>
              )}
            </div>

            {hasMultipleImages && (
              <div className="flex gap-3 justify-center w-full overflow-x-auto pb-2">
                {product.images!.map((imgUrl, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                      selectedImageIndex === index 
                        ? 'border-blue-600 shadow-md scale-105 opacity-100' 
                        : 'border-transparent hover:border-gray-300 opacity-60 hover:opacity-100'
                    }`}
                    title={`Ver imagem ${index + 1}`}
                  >
                    <img src={`http://localhost:3000${imgUrl}`} alt={`Miniatura ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            
          </div>

          <div className="p-8 md:p-12 flex flex-col justify-center bg-white">
            <span className="text-xs font-bold tracking-widest text-blue-600 uppercase mb-2 block">
              Ref: {product.id}
            </span>
            <h1 className="text-3xl font-black text-gray-900 mb-4 leading-tight">
              {product.name}
            </h1>
            
            <div className="flex items-center gap-4 mb-6">
              <span className="text-4xl font-extrabold text-gray-900">
                R$ {parseFloat(product.price as any).toFixed(2)}
              </span>
              {product.stock > 0 ? (
                <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full">
                  Em Estoque ({product.stock})
                </span>
              ) : (
                <span className="bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full">
                  Esgotado
                </span>
              )}
            </div>

            <div className="mb-8">
              <h3 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">Descrição</h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>

            <div className="mt-auto">
              <button 
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-sm
                  ${product.stock === 0 
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
                  }`}
              >
                {product.stock === 0 ? 'Sem estoque no momento' : 'Adicionar ao Carrinho'}
              </button>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}