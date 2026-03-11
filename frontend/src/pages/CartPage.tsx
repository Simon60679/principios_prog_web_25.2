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
      
      // VAMOS DEPURAR: Ver o formato exato que a sua API manda
      console.log("Dados brutos do carrinho:", data);
      
      // Pega a lista de itens (esteja ela solta no array ou dentro de data.items)
      const rawItems = Array.isArray(data) ? data : (data.items || []);

      // TRUQUE DE MESTRE: Normalizar os dados
      // Aqui nós verificamos se o nome e o preço estão direto no 'item' ou aninhados no 'Product'
      const normalizedItems = rawItems.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        // Procura o nome e preço em vários lugares possíveis
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

  // Diminui a quantidade de um item
  const handleDecrease = async (productId: number) => {
    try {
      const response = await fetch(`/cart/${user?.id}/item/${productId}/decrease`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
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
      alert("O seu carrinho está vazio!");
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
        // Tratamento específico para o limite de requisições configurado no app.ts
        if (response.status === 429) {
          throw new Error('Muitas tentativas de compra. Aguarde um momento.');
        }
        
        // Tenta capturar a mensagem de erro vinda do backend (ex: Estoque insuficiente)
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.message || 'Erro ao finalizar a compra. Tente novamente.');
      }

      alert('Compra finalizada com sucesso!');
      
      // Limpa o carrinho na tela e redireciona para o histórico
      setCartItems([]);
      navigate('/compras'); 

    } catch (error: any) {
      console.error("Erro no checkout:", error);
      alert(error.message || "Não foi possível concluir a transação.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Calcula o valor total do carrinho
  const total = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <p className="text-gray-500 font-medium animate-pulse">A carregar o seu carrinho...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8">
      {/* Cabeçalho da página */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">O seu Carrinho de Compras</h1>
        <Link to="/" className="text-blue-600 hover:underline text-sm font-medium transition-colors">
          &larr; Continuar a comprar
        </Link>
      </div>
      
      {cartItems.length === 0 ? (
        <div className="bg-white shadow-sm border border-gray-100 rounded-xl p-10 text-center">
          <p className="text-gray-500 text-lg mb-6">O seu carrinho está vazio.</p>
          <Link to="/" className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-sm">
            Explorar Produtos
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden">
          
          {/* Lista de Itens */}
          <ul className="divide-y divide-gray-100">
            {cartItems.map((item) => (
              <li key={item.id} className="p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-lg font-bold text-gray-800">{item.name}</h3>
                  {/* parseFloat garante que valores em string (DECIMAL do SQL) não quebrem o toFixed */}
                  <p className="text-gray-500 font-medium">R$ {parseFloat(item.price as any).toFixed(2)}</p>
                </div>
                
                <div className="flex items-center gap-4 sm:gap-6">
                  {/* Controles de Quantidade */}
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    <button 
                      onClick={() => handleDecrease(item.productId)}
                      className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold transition-colors"
                    >
                      -
                    </button>
                    <span className="px-4 font-bold text-gray-800 bg-white">
                      {item.quantity}
                    </span>
                    <button 
                      className="px-4 py-2 bg-gray-50 text-gray-300 cursor-not-allowed font-bold"
                      title="Para adicionar mais unidades, volte à página do produto"
                    >
                      +
                    </button>
                  </div>
                  
                  {/* Botão Remover */}
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
          
          {/* Resumo e Total */}
          <div className="bg-gray-50 p-6 flex justify-between items-center border-t border-gray-100">
            <span className="text-xl font-bold text-gray-600">Total:</span>
            <span className="text-3xl font-black text-blue-600">
              R$ {total.toFixed(2)}
            </span>
          </div>
          
          {/* Ação de Checkout */}
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
              {isCheckingOut ? 'A processar o pagamento...' : 'Finalizar Compra'}
            </button>
          </div>
          
        </div>
      )}
    </div>
  );
}