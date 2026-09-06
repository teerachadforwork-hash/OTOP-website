import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, 
  ShoppingBag, 
  User, 
  Menu, 
  X, 
  Award, 
  ShieldCheck, 
  Store, 
  Package
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useOrderStore } from '../store/orderStore';
import { resolveMediaUrl } from '../utils/catalog';
import './Navbar.css';

const Navbar = ({ onOpenAuth }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { user, isAuthenticated, logout } = useAuthStore();
  const { items, fetchCart } = useCartStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}${selectedCategory !== 'all' ? `&category=${selectedCategory}` : ''}`);
    } else {
      navigate('/products');
    }
  };

  const cartItemCount = items ? items.reduce((acc, item) => acc + (item.quantity || 1), 0) : 0;
  const userRole = (user?.role || '').toLowerCase();

  const getProfileLink = () => {
    if (userRole === 'admin') return '/admin-dashboard';
    if (userRole === 'seller') return '/seller-dashboard';
    return '/profile';
  };

  const getRoleBadge = () => {
    if (userRole === 'admin') return '👑 Admin';
    if (userRole === 'seller') return '🏪 ร้านค้า OTOP';
    return '👤 ผู้ซื้อ';
  };

  return (
    <header className="otop-navbar-wrapper">
      {/* Top Announcement Bar */}
      <div className="otop-topbar">
        <div className="otop-container otop-topbar-content">
          <div className="otop-topbar-left">
            <span className="otop-topbar-badge">🌟 คัดสรรพิเศษ</span>
            <span className="otop-topbar-text">
              ตลาดออนไลน์ส่งเสริมสินค้า OTOP และผลิตภัณฑ์ชุมชนไทย ส่งตรงจากผู้ผลิต 77 จังหวัด
            </span>
          </div>
          <div className="otop-topbar-right">
            <div className="topbar-trust-item">
              <ShieldCheck size={14} />
              <span>รับรองมาตรฐาน OTOP 5 ดาว</span>
            </div>
            <div className="topbar-trust-item">
              <Award size={14} />
              <span>จัดส่งตรงจากแหล่งผลิต GI</span>
            </div>
            {(!isAuthenticated || userRole === 'seller') && userRole !== 'admin' && (
              <Link to="/seller-dashboard" className="topbar-link">
                <Store size={14} />
                <span>สำหรับผู้ผลิตชุมชน (Seller Hub)</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="otop-main-nav">
        <div className="otop-container otop-main-nav-inner">
          {/* Brand Logo */}
          <Link to="/" className="otop-brand">
            <div className="otop-logo-mark">
              <svg viewBox="0 0 48 48" width="40" height="40">
                <defs>
                  <linearGradient id="navLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#b85434" />
                    <stop offset="100%" stopColor="#8c3619" />
                  </linearGradient>
                  <linearGradient id="navLeafGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#2d6a4f" />
                    <stop offset="100%" stopColor="#52b788" />
                  </linearGradient>
                </defs>
                <circle cx="24" cy="24" r="22" fill="url(#navLogoGrad)" />
                <path d="M24 10 L34 24 L24 38 L14 24 Z" fill="#ffffff" opacity="0.95" />
                <circle cx="24" cy="24" r="4.5" fill="#d4a373" />
                <path d="M34 14 C39 10, 44 15, 41 21 C37 21, 34 18, 34 14 Z" fill="url(#navLeafGrad)" />
                <circle cx="24" cy="8" r="2" fill="#ffffff" />
                <circle cx="24" cy="40" r="2" fill="#ffffff" />
                <circle cx="8" cy="24" r="2" fill="#ffffff" />
                <circle cx="40" cy="24" r="2" fill="#ffffff" />
              </svg>
            </div>
            <div className="otop-brand-titles">
              <div className="brand-name">
                <span className="name-bold">OTOP</span>
                <span className="name-accent">Connect</span>
              </div>
              <span className="brand-tagline">ตลาดชุมชนและภูมิปัญญาไทย</span>
            </div>
          </Link>

          {/* Search Form */}
          <form className="otop-search-bar" onSubmit={handleSearch}>
            <div className="search-category-select">
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                aria-label="เลือกหมวดหมู่"
              >
                <option value="all">ทุกหมวดหมู่</option>
                <option value="ผ้าและเครื่องแต่งกาย">ผ้าและเครื่องแต่งกาย</option>
                <option value="อาหารและเครื่องดื่ม">อาหารและเครื่องดื่ม</option>
                <option value="ของใช้และของตกแต่ง">ของใช้และของตกแต่ง</option>
                <option value="สมุนไพรและสุขภาพ">สมุนไพรและสุขภาพ</option>
                <option value="หัตถกรรม">หัตถกรรมพื้นบ้าน</option>
              </select>
            </div>
            <input 
              type="text" 
              placeholder="ค้นหาสินค้า OTOP, ภูมิปัญญาชุมชน, หรือจังหวัด..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" className="search-submit-btn" title="ค้นหา">
              <Search size={18} />
              <span className="search-btn-text">ค้นหา</span>
            </button>
          </form>

          {/* Action Links */}
          <div className="otop-nav-actions">
            <Link to="/orders" className="nav-action-btn" title="ประวัติการสั่งซื้อ">
              <Package size={20} />
              <span className="action-label">คำสั่งซื้อ</span>
            </Link>

            <Link to="/cart" className="nav-action-btn otop-cart-btn" title="ตะกร้าสินค้า">
              <div className="cart-icon-wrapper">
                <ShoppingBag size={21} />
                {cartItemCount > 0 && (
                  <span className="cart-count-badge">{cartItemCount}</span>
                )}
              </div>
              <span className="action-label">ตะกร้า</span>
            </Link>

            {isAuthenticated ? (
              <div className="user-profile-menu">
                <Link to={getProfileLink()} className="user-profile-btn" style={{ gap: '0.4rem' }}>
                  <div className="user-avatar-circle">
                    {user?.avatar_url ? (
                      <img
                        src={resolveMediaUrl(user.avatar_url)}
                        alt={user.full_name || 'รูปโปรไฟล์'}
                      />
                    ) : (
                      <User size={18} />
                    )}
                  </div>
                  <div>
                    <span className="user-display-name" style={{ display: 'block', lineHeight: 1.2 }}>
                      {user?.full_name || 'บัญชีของฉัน'}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 600 }}>
                      {getRoleBadge()}
                    </span>
                  </div>
                </Link>
                <Link to="/profile" className="logout-mini-btn" style={{ background: 'var(--eco-light)', color: 'var(--eco)', textDecoration: 'none' }} title="จัดการโปรไฟล์">
                  ⚙️
                </Link>
                <button onClick={() => {
                  logout();
                  useCartStore.getState().reloadForUser();
                  useOrderStore.getState().reloadForUser();
                  navigate('/');
                }} className="logout-mini-btn" title="ออกจากระบบ">
                  ออก
                </button>
              </div>
            ) : (
              <button onClick={onOpenAuth} className="login-pill-btn">
                <User size={16} />
                <span>เข้าสู่ระบบ</span>
              </button>
            )}

            {/* Mobile Menu Hamburger */}
            <button 
              className="mobile-hamburger-btn" 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="เปิดเมนู"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Links - Filtered by User Role */}
      <nav className={`otop-sub-nav ${isMenuOpen ? 'mobile-expanded' : ''}`}>
        <div className="otop-container otop-sub-nav-inner">
          <ul className="sub-nav-list">
            <li>
              <Link 
                to="/" 
                className={`sub-nav-link ${location.pathname === '/' ? 'active' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                หน้าแรก (Home)
              </Link>
            </li>
            <li>
              <Link 
                to="/products" 
                className={`sub-nav-link ${location.pathname === '/products' ? 'active' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                สินค้าทั้งหมด (Products)
              </Link>
            </li>
            <li>
              <Link 
                to="/communities" 
                className={`sub-nav-link ${location.pathname.startsWith('/communit') ? 'active' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                วิสาหกิจชุมชน
              </Link>
            </li>
            <li>
              <Link 
                to="/news" 
                className={`sub-nav-link ${location.pathname.startsWith('/news') ? 'active' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                กระดานข่าว
              </Link>
            </li>
            <li>
              <Link 
                to="/orders" 
                className={`sub-nav-link ${location.pathname === '/orders' ? 'active' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                รายการสั่งซื้อ (Orders)
              </Link>
            </li>

            {/* Seller Only / Admin Links */}
            {userRole === 'seller' && (
              <li>
                <Link 
                  to="/seller-dashboard" 
                  className={`sub-nav-link ${location.pathname === '/seller-dashboard' ? 'active' : ''}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  🏪 แดชบอร์ดผู้ขาย (Seller)
                </Link>
              </li>
            )}

            {/* Admin Only Link */}
            {userRole === 'admin' && (
              <li>
                <Link 
                  to="/admin-dashboard" 
                  className={`sub-nav-link ${location.pathname === '/admin-dashboard' ? 'active' : ''}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  👑 ผู้ดูแลระบบ (Admin)
                </Link>
              </li>
            )}
          </ul>

          <div className="sub-nav-certifications">
            <span className="cert-tag otop-cert">
              <Award size={13} />
              <span>รับรองมาตรฐาน OTOP</span>
            </span>
            <span className="cert-tag gi-cert">
              <ShieldCheck size={13} />
              <span>จัดส่งตรงจากแหล่งผลิต</span>
            </span>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
