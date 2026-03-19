import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import CartPage from './pages/CartPage';
import PurchasesPage from './pages/PurchasesPage';
import SellerDashboardPage from './pages/SellerDashboardPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';

export default function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-gray-50">

        <Navbar />

        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/produto/:id" element={<ProductDetailsPage />} />
            <Route path="/cadastro" element={<RegisterPage />} />

            <Route path="/carrinho" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
            <Route path="/compras" element={<ProtectedRoute><PurchasesPage /></ProtectedRoute>} />
            <Route path="/painel-vendedor" element={<ProtectedRoute><SellerDashboardPage /></ProtectedRoute>} />
            <Route path="/painel-vendedor" element={<SellerDashboardPage />} />
            <Route path="/perfil" element={<ProfilePage />} />
          </Routes>
        </main>

        <Footer />

      </div>
    </Router>
  );
}