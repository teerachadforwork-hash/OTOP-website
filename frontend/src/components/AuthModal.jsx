import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Loader2, Mail, Phone, Store, User, X } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
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
    setShowPassword(false);
    setIsLogin(true);
    onClose();
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
        toast.success('ลงทะเบียนสำเร็จ! ยินดีต้อนรับเข้าสู่ระบบ');
        handleClose();
      } else {
        toast.error(result.error || 'ลงทะเบียนไม่สำเร็จ');
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

        <div className="auth-brand-panel">
          <div className="auth-brand-mark">OTOP</div>
          <div>
            <p className="auth-eyebrow">OTOP Connect</p>
            <h2>{isLogin ? 'ยินดีต้อนรับกลับ' : 'เริ่มต้นใช้งาน'}</h2>
            <p>
              {isLogin
                ? 'เข้าสู่ระบบเพื่อจัดการคำสั่งซื้อ ตะกร้า และข้อมูลร้านค้าจากฐานข้อมูลจริง'
                : 'สร้างบัญชีสำหรับเลือกซื้อสินค้า หรือสมัครเป็นผู้ขายสินค้า OTOP'}
            </p>
          </div>
        </div>

        <div className="auth-modal-body">
          <div className="auth-modal-header">
            <h3>{isLogin ? 'เข้าสู่ระบบ' : 'ลงทะเบียน'}</h3>
            <p>{isLogin ? 'กรอกอีเมลและรหัสผ่านของคุณ' : 'กรอกข้อมูลพื้นฐานให้ครบถ้วน'}</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <div className="form-group">
                  <label>ชื่อ-นามสกุล</label>
                  <div className="input-shell">
                    <User size={18} />
                    <input
                      type="text"
                      placeholder="ชื่อ-นามสกุล"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>เบอร์โทรศัพท์</label>
                  <div className="input-shell">
                    <Phone size={18} />
                    <input
                      type="tel"
                      placeholder="081-234-5678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>ประเภทบัญชี</label>
                  <div className="input-shell select-shell">
                    <Store size={18} />
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    >
                      <option value="customer">ลูกค้าทั่วไป</option>
                      <option value="seller">ผู้ขาย / วิสาหกิจชุมชน</option>
                    </select>
                  </div>
                </div>

                {role === 'seller' && (
                  <div className="form-group">
                    <label>รายละเอียดร้านค้า / วิสาหกิจชุมชน</label>
                    <textarea
                      rows="3"
                      placeholder="เช่น ชื่อร้านค้า, สินค้าที่ขาย, ที่ตั้งร้าน ฯลฯ"
                      value={storeDetails}
                      onChange={(e) => setStoreDetails(e.target.value)}
                      required
                    ></textarea>
                  </div>
                )}
              </>
            )}

            <div className="form-group">
              <label>อีเมล</label>
              <div className="input-shell">
                <Mail size={18} />
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>รหัสผ่าน</label>
              <div className="input-shell">
                <Lock size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" style={{ margin: 'auto' }} size={20} /> : (isLogin ? 'เข้าสู่ระบบ' : 'ลงทะเบียน')}
            </button>
          </form>

          <div className="auth-toggle">
            {isLogin ? 'ยังไม่มีบัญชีผู้ใช้?' : 'มีบัญชีอยู่แล้ว?'}
            <button type="button" onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? 'ลงทะเบียนที่นี่' : 'เข้าสู่ระบบ'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
