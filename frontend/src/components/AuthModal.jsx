import React, { useState } from 'react';
import { X, User, ShieldCheck, Store, ArrowRight, Loader2 } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useOrderStore } from '../store/orderStore';
import toast from 'react-hot-toast';
import './AuthModal.css';

const AuthModal = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('customer');
  const [storeDetails, setStoreDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuthStore();

  if (!isOpen) return null;

  const handleClose = () => {
    // Reset all forms state
    setEmail('');
    setPassword('');
    setFullName('');
    setPhone('');
    setRole('customer');
    setStoreDetails('');
    setIsLogin(true);
    onClose();
  };

  const handleDemoLogin = async (demoEmail, demoPassword) => {
    setLoading(true);
    const success = await login(demoEmail, demoPassword);
    setLoading(false);
    
    if (success) {
      // Reload user-scoped data
      useCartStore.getState().reloadForUser();
      useOrderStore.getState().reloadForUser();
      toast.success('เข้าสู่ระบบสำเร็จ');
      handleClose();
    } else {
      toast.error('เข้าสู่ระบบไม่สำเร็จ');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    if (isLogin) {
      const success = await login(email, password);
      if (success) {
        useCartStore.getState().reloadForUser();
        useOrderStore.getState().reloadForUser();
        toast.success('เข้าสู่ระบบสำเร็จ');
        handleClose();
      } else {
        toast.error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      }
    } else {
      // Register logic
      const result = await register({
        fullName,
        email,
        password,
        phone,
        role,
      });

      if (result.success) {
        useCartStore.getState().reloadForUser();
        useOrderStore.getState().reloadForUser();
        toast.success('สมัครสมาชิกสำเร็จ! ยินดีต้อนรับเข้าสู่ระบบ');
        handleClose();
      } else {
        toast.error(result.error || 'สมัครสมาชิกไม่สำเร็จ');
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="otop-auth-modal-overlay" onClick={handleClose}>
      <div className="otop-auth-modal" onClick={e => e.stopPropagation()}>
        <button className="auth-close-btn" onClick={handleClose}>
          <X size={20} />
        </button>
        
        <div className="auth-modal-header">
          <h2>{isLogin ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'} OTOP Connect</h2>
          <p>{isLogin ? 'เข้าสู่ระบบเพื่อสั่งซื้อ หรือจัดการร้านค้าวิสาหกิจชุมชนของคุณ' : 'สร้างบัญชีใหม่เพื่อเข้าใช้งานระบบและซื้อสินค้า OTOP'}</p>
        </div>
        
        <div className="auth-modal-body">
          {/* Demo Logins */}
          {isLogin && (
            <div className="demo-login-section">
              <button 
                type="button" 
                className="demo-login-btn customer"
                onClick={() => handleDemoLogin('customer@otop.th', 'customer123')}
                disabled={loading}
              >
                <div className="demo-role">
                  <div className="demo-icon-wrapper"><User size={20} /></div>
                  <span>บัญชีลูกค้า (Customer)</span>
                </div>
                <div className="demo-action">ทดสอบซื้อ <ArrowRight size={14} /></div>
              </button>
              
              <button 
                type="button" 
                className="demo-login-btn seller"
                onClick={() => handleDemoLogin('seller@otop.th', 'seller123')}
                disabled={loading}
              >
                <div className="demo-role">
                  <div className="demo-icon-wrapper"><Store size={20} /></div>
                  <span>บัญชีวิสาหกิจชุมชน (Seller)</span>
                </div>
                <div className="demo-action">แดชบอร์ด <ArrowRight size={14} /></div>
              </button>
              
              <button 
                type="button" 
                className="demo-login-btn admin"
                onClick={() => handleDemoLogin('admin@otop.th', 'admin123')}
                disabled={loading}
              >
                <div className="demo-role">
                  <div className="demo-icon-wrapper"><ShieldCheck size={20} /></div>
                  <span>ผู้ดูแลระบบ (Admin)</span>
                </div>
                <div className="demo-action">จัดการระบบ <ArrowRight size={14} /></div>
              </button>
            </div>
          )}

          {isLogin && <div className="auth-divider">หรือเข้าสู่ระบบด้วยอีเมล</div>}

          {/* Form */}
          <form className="auth-form" onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <div className="form-group">
                  <label>ชื่อ-นามสกุล</label>
                  <input
                    type="text"
                    placeholder="ชื่อ-นามสกุล"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>เบอร์โทรศัพท์</label>
                  <input
                    type="tel"
                    placeholder="081-234-5678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>ประเภทบัญชี</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.9rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      fontSize: '0.95rem',
                      outline: 'none',
                    }}
                  >
                    <option value="customer">ลูกค้าทั่วไป (Customer)</option>
                    <option value="seller">ผู้ขาย / วิสาหกิจชุมชน (Seller)</option>
                  </select>
                </div>
                
                {role === 'seller' && (
                  <div className="form-group" style={{ marginTop: '0.5rem' }}>
                    <label>รายละเอียดร้านค้า / วิสาหกิจชุมชน</label>
                    <textarea
                      rows="3"
                      placeholder="เช่น ชื่อร้านค้า, สินค้าที่ขาย, ที่ตั้งร้าน ฯลฯ"
                      value={storeDetails}
                      onChange={(e) => setStoreDetails(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem 0.9rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)',
                        fontSize: '0.95rem',
                        outline: 'none',
                        resize: 'vertical'
                      }}
                    ></textarea>
                  </div>
                )}
              </>
            )}

            <div className="form-group">
              <label>อีเมล</label>
              <input 
                type="email" 
                placeholder="email@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>

            <div className="form-group">
              <label>รหัสผ่าน</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
            
            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" style={{ margin: 'auto' }} size={20} /> : (isLogin ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก')}
            </button>
          </form>

          <div className="auth-toggle">
            {isLogin ? 'ยังไม่มีบัญชีผู้ใช้?' : 'มีบัญชีอยู่แล้ว?'}
            <button type="button" onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? 'สมัครสมาชิกที่นี่' : 'เข้าสู่ระบบ'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
