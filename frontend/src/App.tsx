import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Componentes Globais
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Páginas
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import CartPage from './pages/CartPage';
import PurchasesPage from './pages/PurchasesPage';
import SellerDashboardPage from './pages/SellerDashboardPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import RegisterPage from './pages/RegisterPage';

export default function App() {
  return (
    <Router>
      {/* Container principal que garante que o footer fique no fundo */}
      <div className="flex flex-col min-h-screen bg-gray-50">
        
        <Navbar />

        {/* A tag <main> ocupa todo o espaço restante disponível na tela */}
        <main className="flex-grow">
          <Routes>
            {/* Rotas Públicas */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/produto/:id" element={<ProductDetailsPage />} />
            <Route path="/cadastro" element={<RegisterPage />} />

            {/* Rotas Protegidas */}
            <Route path="/carrinho" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
            <Route path="/compras" element={<ProtectedRoute><PurchasesPage /></ProtectedRoute>} />
            <Route path="/painel-vendedor" element={<ProtectedRoute><SellerDashboardPage /></ProtectedRoute>} />
            <Route path="/painel-vendedor" element={<SellerDashboardPage />} />
          </Routes>
        </main>

        <Footer />
        
      </div>
    </Router>
  );
}