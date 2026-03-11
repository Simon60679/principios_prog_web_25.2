import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

interface PurchaseItem {
  id: number;
  productName: string;
  productPrice: number;
  quantity: number;
  subtotal: number;
}

interface Purchase {
  id: number;
  totalAmount: number;
  purchaseDate: string;
  items?: PurchaseItem[];
}

export default function PurchasesPage() {
  const { user, token } = useContext(AuthContext);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && token) {
      fetchPurchases();
    }
  }, [user, token]);

  const fetchPurchases = async () => {
    try {
      const response = await fetch(`/users/${user?.id}/purchases`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Se o backend retornar 404, significa apenas que a lista está vazia
      if (response.status === 404) {
        setPurchases([]);
        return;
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        // Tratamento da mensagem específica do backend
        if (errData?.message === 'O usuário em questão ainda não realizou nenhuma compra.') {
          setPurchases([]);
          return;
        }
        throw new Error(errData?.message || 'Não foi possível carregar o histórico de compras.');
      }

      const data = await response.json();
      setPurchases(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      day: '2-digit', month: '2-digit', year: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <p className="text-gray-500 font-medium animate-pulse">A carregar os seus pedidos...</p>
      </div>
    );
  }

  // O SEU RETURN EXATAMENTE COMO VOCÊ MANDOU (Com adição do bloco de erro real)
  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Meus Pedidos</h1>
        <Link to="/" className="text-blue-600 hover:underline">Voltar às compras</Link>
      </div>

      {/* Mostra erros reais do servidor, se houver */}
      {error && purchases.length === 0 ? (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg font-medium text-center mb-6">
          {error}
        </div>
      ) : null}

      {/* A sua lógica para lista vazia ou cheia */}
      {purchases.length === 0 && !error ? (
        <div className="bg-white shadow rounded-lg p-10 text-center">
          <p className="text-gray-500 mb-4">Você ainda não realizou nenhuma compra.</p>
          <Link to="/" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
            Explorar Produtos
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {purchases.map((purchase) => (
            <div key={purchase.id} className="bg-white border rounded-lg shadow-sm overflow-hidden">
              {/* Cabeçalho do Pedido */}
              <div className="bg-gray-50 border-b px-6 py-4 flex justify-between items-center flex-wrap gap-4">
                <div>
                  <p className="text-sm text-gray-500">Pedido realizado em</p>
                  <p className="font-semibold text-gray-800">{formatDate(purchase.purchaseDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="font-semibold text-green-600">R$ {parseFloat(purchase.totalAmount as any).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pedido nº</p>
                  <p className="font-semibold text-gray-800">#{purchase.id}</p>
                </div>
              </div>

              {/* Lista de Itens do Pedido */}
              {purchase.items && purchase.items.length > 0 && (
                <ul className="divide-y divide-gray-100 px-6">
                  {purchase.items.map((item) => (
                    <li key={item.id} className="py-4 flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-800">{item.productName}</p>
                        <p className="text-sm text-gray-500">
                          {item.quantity}x de R$ {parseFloat(item.productPrice as any).toFixed(2)}
                        </p>
                      </div>
                      <p className="text-gray-600 font-medium">
                        R$ {parseFloat(item.subtotal as any).toFixed(2)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}