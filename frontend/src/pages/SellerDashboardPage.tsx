import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

// --- Interfaces ---
interface Product {
  id: number;
  userId: number;
  name: string;
  description: string;
  price: number;
  stock: number;
}

interface SaleItem {
  id: number;
  productName: string;
  productPrice: number;
  quantity: number;
  subtotal: number;
}

interface Sale {
  id: number;
  totalAmount: number;
  saleDate: string; // Já atualizado para refletir o seu banco de dados
  items?: SaleItem[];
}

export default function SellerDashboardPage() {
  const { user, token } = useContext(AuthContext);
  
  // Estados de Produtos e Vendas
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loadingSales, setLoadingSales] = useState(true);

  // Estados do Formulário
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // NOVO: Estado para controlar se estamos criando ou editando
  const [editingProductId, setEditingProductId] = useState<number | null>(null);

  useEffect(() => {
    if (user && token) {
      fetchMyProducts();
      fetchSales();
    }
  }, [user, token]);

  // --- Buscas na API ---
  const fetchMyProducts = async () => {
    try {
      const response = await fetch('/products');
      if (!response.ok) throw new Error('Erro ao buscar produtos');
      const allProducts: Product[] = await response.json();
      const filteredProducts = allProducts.filter(p => p.userId === user?.id);
      setMyProducts(filteredProducts);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchSales = async () => {
    try {
      const response = await fetch(`/users/${user?.id}/sales`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.status === 404) {
        setSales([]); return;
      }
      if (!response.ok) throw new Error('Erro ao buscar histórico de vendas');
      const data = await response.json();
      setSales(data);
    } catch (error) {
      console.error("Erro ao carregar vendas:", error);
    } finally {
      setLoadingSales(false);
    }
  };

  // --- Ações ---

  // Função para preencher o formulário quando clicar em "Editar"
  const handleEditClick = (product: Product) => {
    setEditingProductId(product.id);
    setName(product.name);
    setDescription(product.description);
    setPrice(product.price.toString());
    setStock(product.stock.toString());
    
    // Rola a página para o topo (útil no celular)
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Função para cancelar a edição e limpar o formulário
  const cancelEdit = () => {
    setEditingProductId(null);
    setName('');
    setDescription('');
    setPrice('');
    setStock('1');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !token) return;
    setIsSubmitting(true);

    try {
      if (editingProductId) {
        // --- MODO EDIÇÃO ---
        
        // 1. Atualiza os dados básicos (Nome, Descrição, Preço)
        const responseData = await fetch(`/products/${editingProductId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ name, description, price: parseFloat(price) })
        });

        if (!responseData.ok) throw new Error('Falha ao atualizar os dados do produto.');

        // 2. Atualiza o estoque (se tiver sido alterado)
        const currentProduct = myProducts.find(p => p.id === editingProductId);
        if (currentProduct && currentProduct.stock !== parseInt(stock, 10)) {
          await fetch(`/products/${editingProductId}/stock`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ stock: parseInt(stock, 10) })
          });
        }

        alert('Produto atualizado com sucesso!');
        cancelEdit(); // Limpa e volta para modo "Novo Produto"

      } else {
        // --- MODO CRIAÇÃO (Já existia) ---
        const response = await fetch('/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ userId: user.id, name, description, price: parseFloat(price), stock: parseInt(stock, 10) })
        });

        if (!response.ok) throw new Error('Falha ao criar o produto.');

        alert('Produto cadastrado com sucesso!');
        cancelEdit(); // Aproveitamos a mesma função para limpar os campos
      }
      
      fetchMyProducts(); // Atualiza a lista
      
    } catch (error: any) {
      console.error(error);
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    const confirmDelete = window.confirm("Tem certeza que deseja excluir este produto?");
    if (!confirmDelete) return;

    try {
      const response = await fetch(`/products/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Falha ao excluir o produto.');
      alert('Produto removido com sucesso!');
      setMyProducts(prev => prev.filter(p => p.id !== productId));
    } catch (error: any) {
      alert(error.message || "Não foi possível remover o produto.");
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Data indisponível';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Data inválida';
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (error) { return 'Erro na data'; }
  };

  const totalFaturado = sales.reduce((acc, sale) => acc + (parseFloat(sale.totalAmount as any) || 0), 0);

  return (
    <div className="max-w-7xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* LADO ESQUERDO: Formulário e Meus Produtos */}
      <div className="lg:col-span-1 flex flex-col gap-8">
        
        {/* Formulário (Agora atende Criação e Edição) */}
        <div className={`p-6 rounded-xl shadow-sm border transition-colors ${editingProductId ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100'}`}>
          <h2 className={`text-xl font-bold mb-4 ${editingProductId ? 'text-blue-800' : 'text-gray-800'}`}>
            {editingProductId ? '✏️ Editando Produto' : 'Novo Produto'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <textarea required value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"></textarea>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
                <input type="number" step="0.01" min="0" required value={price} onChange={(e) => setPrice(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estoque</label>
                <input type="number" min="0" required value={stock} onChange={(e) => setStock(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            
            <div className="flex gap-2 mt-2">
              <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors">
                {isSubmitting ? 'Salvando...' : (editingProductId ? 'Salvar Alterações' : 'Cadastrar')}
              </button>
              
              {/* Botão de cancelar só aparece se estiver no modo edição */}
              {editingProductId && (
                <button type="button" onClick={cancelEdit} className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-bold text-sm hover:bg-gray-300 transition-colors">
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Lista de Produtos Ativos */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Meus Produtos</h2>
          {loadingProducts ? (
            <p className="text-sm text-gray-500">Carregando...</p>
          ) : myProducts.length === 0 ? (
            <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded border border-dashed">Nenhum produto cadastrado.</p>
          ) : (
            <ul className="divide-y divide-gray-100 max-h-80 overflow-y-auto pr-2">
              {myProducts.map(product => (
                <li key={product.id} className="py-3 flex flex-col gap-2">
                  <div className="overflow-hidden">
                    <p className="font-bold text-sm text-gray-800 truncate" title={product.name}>{product.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Qtd: {product.stock} | R$ {parseFloat(product.price as any).toFixed(2)}</p>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => handleEditClick(product)} className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded transition-colors">
                      Editar
                    </button>
                    <button onClick={() => handleDeleteProduct(product.id)} className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded transition-colors">
                      Excluir
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* LADO DIREITO: Histórico de Vendas */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl shadow-md p-6 text-white flex justify-between items-center">
          <div>
            <h2 className="text-lg font-medium text-blue-100">Total Faturado</h2>
            <p className="text-3xl font-black mt-1">R$ {totalFaturado.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-medium text-blue-100">Vendas Realizadas</h2>
            <p className="text-3xl font-black mt-1">{sales.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Histórico de Vendas</h2>

          {loadingSales ? (
            <p className="text-gray-500 animate-pulse">Buscando vendas...</p>
          ) : sales.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
              <p className="text-gray-500 text-lg">Você ainda não realizou nenhuma venda.</p>
              <p className="text-sm text-gray-400 mt-2">Os pedidos dos seus clientes aparecerão aqui.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {sales.map((sale) => (
                <div key={sale.id} className="border border-gray-100 rounded-lg overflow-hidden shadow-sm hover:shadow transition-shadow">
                  <div className="bg-gray-50 px-4 py-3 flex justify-between items-center border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-500">Venda #{sale.id}</span>
                    <span className="text-sm text-gray-600">{formatDate(sale.saleDate)}</span>
                  </div>
                  
                  {sale.items && sale.items.length > 0 && (
                    <ul className="divide-y divide-gray-50 px-4">
                      {sale.items.map(item => (
                        <li key={item.id} className="py-3 flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-gray-800">{item.productName}</p>
                            <p className="text-sm text-gray-500">
                              {item.quantity} un. x R$ {parseFloat(item.productPrice as any).toFixed(2)}
                            </p>
                          </div>
                          <p className="font-bold text-green-600">
                            R$ {parseFloat(item.subtotal as any).toFixed(2)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                  
                  <div className="bg-gray-50 px-4 py-3 text-right border-t border-gray-100">
                    <span className="text-sm text-gray-500 mr-2">Total desta venda:</span>
                    <span className="text-lg font-black text-gray-800">R$ {parseFloat(sale.totalAmount as any).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}