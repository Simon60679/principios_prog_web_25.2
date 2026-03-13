import React, { useEffect, useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

interface CartItem {
  id: number;
  productId: number;
  name: string;
  price: number;
  quantity: number;
}

export default function CartPage() {
  const { user, token } = useContext(AuthContext);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    if (user && token) {
      fetchCart();
    }
  }, [user, token]);

  // Busca os itens do carrinho no backend
  const fetchCart = async () => {
    try {
      const response = await fetch(`/users/${user?.id}/cart`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Erro ao buscar o carrinho');
      
      const data = await response.json();
      
      const rawItems = Array.isArray(data) ? data : (data.items || []);

      const normalizedItems = rawItems.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        name: item.name || item.Product?.name || item.product?.name || 'Produto',
        price: parseFloat(item.price || item.Product?.price || item.product?.price || 0)
      }));

      setCartItems(normalizedItems); 

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Aumenta a quantidade de um item
  const handleIncrease = async (productId: number) => {
    try {
      const response = await fetch(`/cart/${user?.id}/item/${productId}/increase`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ quantity: 1 }) // Adiciona +1 à quantidade
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Erro ao aumentar a quantidade.');
      }
      
      fetchCart(); // Atualiza a tela se der sucesso
    } catch (error: any) {
      console.error('Erro ao aumentar quantidade', error);
      alert(error.message); // Exibe alerta se o estoque acabar, por exemplo
    }
  };

  // Diminui a quantidade de um item
  const handleDecrease = async (productId: number) => {
    try {
      const response = await fetch(`/cart/${user?.id}/item/${productId}/decrease`, {
        method: 'PATCH',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ quantity: 1 })
      });
      if (response.ok) fetchCart();
    } catch (error) {
      console.error('Erro ao diminuir quantidade', error);
    }
  };

  // Remove o item completamente do carrinho
  const handleRemove = async (productId: number) => {
    try {
      const response = await fetch(`/cart/${user?.id}/item/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) fetchCart();
    } catch (error) {
      console.error('Erro ao remover item', error);
    }
  };

  // Processa o pagamento/checkout
  const handleCheckout = async () => {
    if (!user || !token) return;

    if (cartItems.length === 0) {
      alert("Seu carrinho está vazio!");
      return;
    }

    setIsCheckingOut(true);

    try {
      const response = await fetch(`/checkout/${user.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Muitas tentativas de compra. Aguarde um momento.');
        }
        
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.message || 'Erro ao finalizar a compra. Tente novamente.');
      }

      alert('Compra finalizada com sucesso!');
      setCartItems([]);
      navigate('/compras'); 

    } catch (error: any) {
      console.error("Erro no checkout:", error);
      alert(error.message || "Não foi possível concluir a transação.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const total = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <p className="text-gray-500 font-medium animate-pulse">Carregando seu carrinho...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Seu Carrinho de Compras</h1>
        <Link to="/" className="text-blue-600 hover:underline text-sm font-medium transition-colors">
          &larr; Continuar comprando
        </Link>
      </div>
      
      {cartItems.length === 0 ? (
        <div className="bg-white shadow-sm border border-gray-100 rounded-xl p-10 text-center">
          <p className="text-gray-500 text-lg mb-6">Seu carrinho está vazio.</p>
          <Link to="/" className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-sm">
            Explorar Produtos
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden">
          
          <ul className="divide-y divide-gray-100">
            {cartItems.map((item) => (
              <li key={item.id} className="p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-lg font-bold text-gray-800">{item.name}</h3>
                  <p className="text-gray-500 font-medium">R$ {parseFloat(item.price as any).toFixed(2)}</p>
                </div>
                
                <div className="flex items-center gap-4 sm:gap-6">
                  {/* Controles de Quantidade */}
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    <button 
                      onClick={() => handleDecrease(item.productId)}
                      className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold transition-colors"
                      title="Diminuir quantidade"
                    >
                      -
                    </button>
                    <span className="px-4 font-bold text-gray-800 bg-white">
                      {item.quantity}
                    </span>
                    {/* Botão de MAIS atualizado */}
                    <button 
                      onClick={() => handleIncrease(item.productId)}
                      className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold transition-colors"
                      title="Aumentar quantidade"
                    >
                      +
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => handleRemove(item.productId)}
                    className="text-red-500 hover:text-red-700 font-bold text-sm px-3 py-2 rounded hover:bg-red-50 transition-colors"
                  >
                    Remover
                  </button>
                </div>
              </li>
            ))}
          </ul>
          
          <div className="bg-gray-50 p-6 flex justify-between items-center border-t border-gray-100">
            <span className="text-xl font-bold text-gray-600">Total:</span>
            <span className="text-3xl font-black text-blue-600">
              R$ {total.toFixed(2)}
            </span>
          </div>
          
          <div className="p-6 bg-white border-t border-gray-100 flex justify-end">
            <button 
              onClick={handleCheckout}
              disabled={isCheckingOut || cartItems.length === 0}
              className={`px-8 py-4 rounded-xl font-bold text-lg text-white transition-all shadow-sm
                ${isCheckingOut 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700 hover:shadow-md'
                }`}
            >
              {isCheckingOut ? 'Processando pagamento...' : 'Finalizar Compra'}
            </button>
          </div>
          
        </div>
      )}
    </div>
  );
}