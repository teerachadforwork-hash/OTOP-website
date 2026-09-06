import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { User, Mail, Lock, Check, AlertCircle, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useOrderStore } from '../store/orderStore';
import { resolveMediaUrl } from '../utils/catalog';
import './ProfilePage.css';

const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const ProfilePage = () => {
  const { user, updateProfile, uploadAvatar, deleteAccount, logout } = useAuthStore();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState('');
  const [avatarBroken, setAvatarBroken] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        full_name: user.full_name || '',
        email: user.email || ''
      }));
      setAvatarBroken(false);
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleAvatarClick = () => {
    if (!uploadingAvatar) fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setError('รองรับเฉพาะไฟล์รูป JPG, PNG, WEBP หรือ GIF');
      toast.error('รองรับเฉพาะไฟล์รูป JPG, PNG, WEBP หรือ GIF');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('ไฟล์ใหญ่เกินไป (สูงสุด 5MB)');
      toast.error('ไฟล์ใหญ่เกินไป (สูงสุด 5MB)');
      return;
    }
    setUploadingAvatar(true);
    setError('');
    const result = await uploadAvatar(file);
    setUploadingAvatar(false);
    if (result.success) {
      setAvatarBroken(false);
      toast.success('อัปโหลดรูปโปรไฟล์เรียบร้อยแล้ว');
    } else {
      setError(result.error);
      toast.error(result.error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validations
    if (!formData.full_name.trim() || !formData.email.trim()) {
      setError('กรุณากรอกข้อมูลชื่อและอีเมลให้ครบถ้วน');
      return;
    }
    
    if (formData.password) {
      if (formData.password.length < 6) {
        setError('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร');
        return;
      }
      if (formData.password !== formData.confirm_password) {
        setError('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
        return;
      }
    }

    setSubmitting(true);
    
    const result = await updateProfile({
      full_name: formData.full_name,
      email: formData.email,
      password: formData.password || null
    });

    setSubmitting(false);

    if (result.success) {
      toast.success('อัปเดตข้อมูลโปรไฟล์เรียบร้อยแล้ว');
      // Clear password fields after success
      setFormData(prev => ({
        ...prev,
        password: '',
        confirm_password: ''
      }));
    } else {
      setError(result.error || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
      toast.error(result.error || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
    }
  };

  if (!user) {
    return <div style={{ padding: '4rem', textAlign: 'center' }}>กำลังโหลดข้อมูลโปรไฟล์...</div>;
  }

  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar-block">
              <button
                type="button"
                className={`profile-avatar ${uploadingAvatar ? 'is-uploading' : ''}`}
                onClick={handleAvatarClick}
                disabled={uploadingAvatar}
                aria-label="เปลี่ยนรูปโปรไฟล์"
                title="คลิกเพื่อเปลี่ยนรูปโปรไฟล์"
              >
                {user.avatar_url && !avatarBroken ? (
                  <img
                    src={resolveMediaUrl(user.avatar_url)}
                    alt={user.full_name || 'รูปโปรไฟล์'}
                    onError={() => setAvatarBroken(true)}
                    onLoad={() => setAvatarBroken(false)}
                  />
                ) : (
                  <span>{user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}</span>
                )}
                <span className="profile-avatar-overlay">
                  <Camera size={18} />
                </span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleAvatarChange}
                hidden
              />
              <p className="profile-avatar-hint">
                {uploadingAvatar ? 'กำลังอัปโหลดรูป...' : 'คลิกที่รูปเพื่อเปลี่ยนรูปโปรไฟล์'}
              </p>
            </div>
            <div>
              <h1 className="profile-title">จัดการโปรไฟล์</h1>
              <p className="profile-subtitle">แก้ไขข้อมูลส่วนตัวและรูปโปรไฟล์ของคุณในระบบ OTOP Connect</p>
            </div>
          </div>

          <form className="profile-form" onSubmit={handleSubmit}>
            {error && (
              <div className="profile-error">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label>ชื่อ-นามสกุล:</label>
              <div className="input-with-icon">
                <User size={18} className="input-icon" />
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="กรอกชื่อ-นามสกุล"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>อีเมล (ใช้เป็น Username สำหรับเข้าสู่ระบบ):</label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@email.com"
                  required
                />
              </div>
              <p className="input-help">หากเปลี่ยนอีเมล คุณจะต้องใช้อีเมลใหม่นี้ในการเข้าสู่ระบบครั้งถัดไป</p>
            </div>

            <hr className="profile-divider" />
            
            <h3 className="section-title">เปลี่ยนรหัสผ่าน (เว้นว่างไว้หากไม่ต้องการเปลี่ยน)</h3>

            <div className="form-group">
              <label>รหัสผ่านใหม่:</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="กรอกรหัสผ่านใหม่"
                  minLength="6"
                />
              </div>
            </div>

            <div className="form-group">
              <label>ยืนยันรหัสผ่านใหม่:</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input
                  type="password"
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  placeholder="ยืนยันรหัสผ่านใหม่อีกครั้ง"
                />
              </div>
            </div>

            <button type="submit" className="profile-submit-btn" disabled={submitting}>
              {submitting ? 'กำลังบันทึกข้อมูล...' : (
                <>
                  <Check size={18} /> บันทึกการเปลี่ยนแปลง
                </>
              )}
            </button>
          </form>

          {user.role !== 'admin' && (
            <div className="profile-danger">
              <h3>ยกเลิกบัญชี</h3>
              <p>ลูกค้าและผู้ขายสามารถปิดบัญชีได้ถาวร ระบบจะระงับการเข้าสู่ระบบ ยกเลิกคำสั่งซื้อที่ยังไม่ชำระ และปิดสินค้าของผู้ขาย</p>
              <input
                type="password"
                placeholder="กรอกรหัสผ่านเพื่อยืนยัน"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
              />
              <button
                type="button"
                className="profile-delete-btn"
                disabled={deleting}
                onClick={async () => {
                  if (!deletePassword) {
                    toast.error('กรุณากรอกรหัสผ่านเพื่อยืนยัน');
                    return;
                  }
                  if (!window.confirm('ยืนยันยกเลิกบัญชีนี้? การกระทำนี้ไม่สามารถกู้คืนได้')) return;
                  setDeleting(true);
                  const result = await deleteAccount(deletePassword);
                  setDeleting(false);
                  if (result.success) {
                    useCartStore.getState().reloadForUser?.();
                    useOrderStore.getState().reloadForUser?.();
                    logout();
                    toast.success('ยกเลิกบัญชีเรียบร้อยแล้ว');
                    navigate('/');
                  } else {
                    toast.error(result.error);
                  }
                }}
              >
                {deleting ? 'กำลังยกเลิกบัญชี...' : 'ยืนยันยกเลิกบัญชี'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
