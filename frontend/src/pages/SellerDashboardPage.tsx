import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

interface Product {
  id: number;
  userId: number;
  name: string;
  description: string;
  price: number;
  stock: number;
}

export default function SellerDashboardPage() {
  const { user, token } = useContext(AuthContext);
  
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Estados para o formulário de novo produto
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user && token) {
      fetchMyProducts();
    }
  }, [user, token]);

  const fetchMyProducts = async () => {
    try {
      const response = await fetch('/products');
      if (!response.ok) throw new Error('Erro ao buscar produtos');
      
      const allProducts: Product[] = await response.json();
      
      // Filtra para mostrar apenas os produtos criados por este usuário
      const filteredProducts = allProducts.filter(p => p.userId === user?.id);
      setMyProducts(filteredProducts);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !token) return;
    setIsSubmitting(true);

    try {
      const response = await fetch('/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: user.id,
          name,
          description,
          price: parseFloat(price),
          stock: parseInt(stock, 10)
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.message || 'Falha ao criar o produto.');
      }

      alert('Produto cadastrado com sucesso!');
      
      // Limpa o formulário
      setName('');
      setDescription('');
      setPrice('');
      setStock('1');
      
      // Atualiza a lista automaticamente
      fetchMyProducts(); 
      
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
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Falha ao excluir o produto.');

      alert('Produto removido com sucesso!');
      setMyProducts(prev => prev.filter(product => product.id !== productId));
      
    } catch (error: any) {
      console.error("Erro ao excluir produto:", error);
      alert(error.message || "Não foi possível remover o produto neste momento.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      {/* LADO ESQUERDO: Formulário de Cadastro */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Cadastrar Novo Produto</h2>
        
        <form onSubmit={handleCreateProduct} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="Ex: Bicicleta Caloi" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea required value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="Detalhes do produto..."></textarea>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
              <input type="number" step="0.01" min="0" required value={price} onChange={(e) => setPrice(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="99.90" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade em Estoque</label>
              <input type="number" min="1" required value={stock} onChange={(e) => setStock(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2" />
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full py-3 mt-4 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors">
            {isSubmitting ? 'Salvando...' : 'Cadastrar Produto'}
          </button>
        </form>
      </div>

      {/* LADO DIREITO: Lista de Produtos Ativos */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Meus Produtos à Venda</h2>
        
        {loadingProducts ? (
          <p className="text-gray-500 text-sm animate-pulse">Carregando seus produtos...</p>
        ) : myProducts.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <p className="text-gray-500">Você ainda não tem produtos cadastrados.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {myProducts.map(product => (
              <li key={product.id} className="py-4 flex justify-between items-center">
                <div className="overflow-hidden flex-1 pr-4">
                  <Link to={`/produto/${product.id}`} className="font-bold text-lg text-blue-600 hover:underline truncate block" title={product.name}>
                    {product.name}
                  </Link>
                  <p className="text-sm text-gray-500 mt-1">
                    Estoque: <span className="font-semibold text-gray-700">{product.stock}</span> | R$ {parseFloat(product.price as any).toFixed(2)}
                  </p>
                </div>
                <button 
                  onClick={() => handleDeleteProduct(product.id)}
                  className="text-sm font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors"
                >
                  Excluir
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

    </div>
  );
}