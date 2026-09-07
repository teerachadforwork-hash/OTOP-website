import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import CommunityList from './pages/CommunityList';
import CommunityDetail from './pages/CommunityDetail';
import OrderList from './pages/OrderList';
import AdminDashboard from './pages/AdminDashboard';
import SellerDashboard from './pages/SellerDashboard';
import CartPage from './pages/CartPage';
import PaymentPage from './pages/PaymentPage';
import ProfilePage from './pages/ProfilePage';
import NewsList from './pages/NewsList';
import NewsDetail from './pages/NewsDetail';
import InvoicePage from './pages/InvoicePage';
import ChatPage from './pages/ChatPage';
import FeedPage from './pages/FeedPage';
import PublicProfilePage from './pages/PublicProfilePage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import NotFoundPage from './pages/NotFoundPage';
import AuthModal from './components/AuthModal';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import useAuthStore from './store/authStore';

function App() {
  const { checkAuth, isLoading, authModalOpen, closeAuthModal, openAuthModal } = useAuthStore();

  React.useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg)' }}>กำลังโหลดระบบ...</div>;
  }

  return (
    <Router>
      <ScrollToTop />
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Navbar onOpenAuth={openAuthModal} />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/communities" element={<CommunityList />} />
          <Route path="/community" element={<CommunityList />} />
          <Route path="/community/:id" element={<CommunityDetail />} />
          <Route path="/news" element={<NewsList />} />
          <Route path="/news/:id" element={<NewsDetail />} />
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/profile/:id" element={<PublicProfilePage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute allowedRoles={['customer', 'admin']}><OrderList /></ProtectedRoute>} />
          <Route path="/orders/:id/invoice" element={<ProtectedRoute allowedRoles={['customer', 'admin']}><InvoicePage /></ProtectedRoute>} />
          <Route path="/cart" element={<ProtectedRoute allowedRoles={['customer', 'admin']}><CartPage /></ProtectedRoute>} />
          <Route path="/payment" element={<ProtectedRoute allowedRoles={['customer', 'admin']}><PaymentPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

          {/* Role Protected Dashboards */}
          <Route
            path="/seller-dashboard"
            element={
              <ProtectedRoute allowedRoles={['seller']}>
                <SellerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Catch All 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
      <AuthModal isOpen={authModalOpen} onClose={closeAuthModal} />
    </Router>
  );
}

export default App;
