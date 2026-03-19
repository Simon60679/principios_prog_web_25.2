import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

interface PurchaseItem {
  id: number;
  productName: string;
  productPrice: number;
  quantity: number;
  subtotal: number;
}

interface SubOrder {
  id: number;
  sellerId: number;
  status: string;
  totalAmount: number;
  specificItems?: PurchaseItem[];
}

interface Purchase {
  id: number;
  totalAmount: number;
  purchaseDate: string;
  status?: string;
  items?: PurchaseItem[];
  subOrders?: SubOrder[];
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

      if (response.status === 404) {
        setPurchases([]);
        return;
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
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

  const handleCompletePurchase = async (purchaseId: number, saleId: number) => {
    const confirm = window.confirm("Confirmar o recebimento e concluir este pacote definitivamente?");
    if (!confirm) return;

    try {
      const response = await fetch(`/users/purchases/${purchaseId}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ saleId: saleId, newStatus: 'Concluído' })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.message || 'Erro ao atualizar o status do pacote.');
      }

      alert("Recebimento do pacote confirmado com sucesso!");
      fetchPurchases();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      day: '2-digit', month: '2-digit', year: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
  };

  const renderStatusBadge = (status?: string) => {
    const currentStatus = status || 'Aguardando pagamento';
    let colorClasses = 'bg-yellow-100 text-yellow-800'; 

    if (currentStatus === 'Em processamento') colorClasses = 'bg-blue-100 text-blue-800';
    else if (currentStatus === 'Enviado') colorClasses = 'bg-purple-100 text-purple-800';
    else if (currentStatus === 'Entregue') colorClasses = 'bg-green-100 text-green-800';
    else if (currentStatus === 'Concluído') colorClasses = 'bg-gray-200 text-gray-800 font-bold';

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colorClasses}`}>
        {currentStatus}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <p className="text-gray-500 font-medium animate-pulse">Carregando seus pedidos...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Meus Pedidos</h1>
        <Link to="/" className="text-blue-600 hover:underline font-medium">&larr; Voltar às compras</Link>
      </div>

      {error && purchases.length === 0 ? (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg font-medium text-center mb-6">
          {error}
        </div>
      ) : null}

      {purchases.length === 0 && !error ? (
        <div className="bg-white shadow-sm border border-gray-100 rounded-xl p-10 text-center">
          <p className="text-gray-500 text-lg mb-6">Você ainda não realizou nenhuma compra.</p>
          <Link to="/" className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-sm">
            Explorar Produtos
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {purchases.map((purchase) => (
            <div key={purchase.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              
              <div className="bg-gray-800 text-white px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Pedido #{purchase.id}</p>
                  <p className="font-medium">{formatDate(purchase.purchaseDate)}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Total da Compra</p>
                  <p className="font-bold text-lg">R$ {parseFloat(purchase.totalAmount as any).toFixed(2)}</p>
                </div>
                <div className="text-left sm:text-right mt-2 sm:mt-0">
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-2">Status Geral</p>
                  {renderStatusBadge(purchase.status)}
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 border-b pb-2">Pacotes deste pedido</h3>
                
                {purchase.subOrders && purchase.subOrders.length > 0 ? (
                  <div className="space-y-6">
                    {purchase.subOrders.map((subOrder, index) => (
                      <div key={subOrder.id} className="border border-gray-100 rounded-lg p-4 bg-gray-50 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="bg-white border border-gray-200 text-gray-600 text-xs font-bold px-2 py-1 rounded">Pacote {index + 1}</span>
                            <span className="text-sm text-gray-500 font-medium">Vendedor #{subOrder.sellerId}</span>
                          </div>
                          
                          <ul className="mt-3 space-y-2 border-t border-gray-100 pt-3">
                            {subOrder.specificItems && subOrder.specificItems.length > 0 ? (
                                subOrder.specificItems.map(item => (
                                    <li key={item.id} className="text-sm text-gray-700 flex justify-between gap-4">
                                        <span className="font-medium text-gray-800 flex-1">{item.productName}</span>
                                        <span className="text-gray-500 min-w-[50px] text-right">{item.quantity} x</span>
                                        <span className="text-gray-900 font-bold min-w-[70px] text-right">
                                          R$ {parseFloat(item.productPrice as any).toFixed(2)}
                                        </span>
                                    </li>
                                ))
                            ) : (
                                <p className="text-xs text-gray-400 italic">Detalhes dos itens deste pacote não disponíveis.</p>
                            )}
                          </ul>
                        </div>
                        
                        <div className="flex flex-col items-end gap-3 min-w-[150px]">
                          <div className="text-right">
                             <p className="text-xs text-gray-500 mb-1">Status do Pacote</p>
                             {renderStatusBadge(subOrder.status)}
                          </div>
                          
                          {subOrder.status === 'Entregue' && (
                            <button 
                              onClick={() => handleCompletePurchase(purchase.id, subOrder.id)}
                              className="w-full bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-green-700 transition-colors shadow-sm"
                            >
                              ✓ Recebi este pacote
                            </button>
                          )}
                        </div>

                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm italic">Detalhes dos pacotes não disponíveis.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}