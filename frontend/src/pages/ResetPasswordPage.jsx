import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import './ResetPasswordPage.css';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error('ลิงก์ไม่ถูกต้อง หรือไม่มี Token สำหรับรีเซ็ตรหัสผ่าน');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error('ไม่พบ Token สำหรับเปลี่ยนรหัสผ่าน');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setLoading(true);
    const result = await useAuthStore.getState().resetPassword(token, newPassword);
    setLoading(false);

    if (result.success) {
      setSuccess(true);
      toast.success(result.message);
    } else {
      toast.error(result.error);
    }
  };

  if (!token) {
    return (
      <div className="reset-password-page">
        <div className="reset-password-card">
          <h2>เกิดข้อผิดพลาด</h2>
          <p>ลิงก์ที่คุณเข้าสู่ไม่ถูกต้อง หรือไม่มี Token สำหรับรีเซ็ตรหัสผ่าน</p>
          <Link to="/" className="back-to-home-btn">กลับสู่หน้าแรก</Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="reset-password-page">
        <div className="reset-password-card reset-success-box">
          <CheckCircle size={60} color="#10b981" style={{ margin: '0 auto 1rem' }} />
          <h3>เปลี่ยนรหัสผ่านสำเร็จ!</h3>
          <p>รหัสผ่านของคุณถูกเปลี่ยนเรียบร้อยแล้ว คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที</p>
          <Link to="/" className="back-to-home-btn">กลับสู่หน้าแรก</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-page">
      <div className="reset-password-card">
        <h2>ตั้งรหัสผ่านใหม่</h2>
        <p>กรุณากำหนดรหัสผ่านใหม่ของคุณ (อย่างน้อย 6 ตัวอักษร)</p>

        <form className="reset-password-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>รหัสผ่านใหม่</label>
            <div className="input-shell">
              <Lock size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>ยืนยันรหัสผ่านใหม่</label>
            <div className="input-shell">
              <Lock size={18} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="reset-submit-btn" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" style={{ margin: 'auto' }} size={20} /> : 'บันทึกรหัสผ่านใหม่'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
