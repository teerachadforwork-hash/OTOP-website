import React from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const ProtectedRoute = ({ allowedRoles = [], children }) => {
  const { user, isAuthenticated } = useAuthStore();

  const userRole = (user?.role || '').toLowerCase();
  const isAllowed = isAuthenticated && (allowedRoles.length === 0 || allowedRoles.map(r => r.toLowerCase()).includes(userRole));

  if (!isAuthenticated) {
    return (
      <div style={{ padding: '4rem 1.5rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
        <div className="card" style={{ background: 'white', padding: '2.5rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', textAlign: 'center' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🔒</div>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>ต้องเข้าสู่ระบบก่อนใช้งาน</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            กรุณาเข้าสู่ระบบด้วยบัญชีของคุณเพื่อเข้าถึงส่วนนี้
          </p>
          <Link to="/">
            <button style={{ padding: '0.75rem 1.75rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
              กลับสู่หน้าหลัก
            </button>
          </Link>
        </div>
      </div>
    );
  }

  if (!isAllowed) {
    const roleNames = {
      customer: 'ลูกค้าทั่วไป (Customer)',
      seller: 'ร้านค้าวิสาหกิจชุมชน (Seller)',
      admin: 'ผู้ดูแลระบบ (Admin)',
    };

    return (
      <div style={{ padding: '4rem 1.5rem', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ background: 'white', padding: '2.5rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', textAlign: 'center', border: '1px solid #fecaca' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>⛔</div>
          <h2 style={{ fontSize: '1.6rem', color: '#dc2626', marginBottom: '0.5rem' }}>ไม่มีสิทธิ์เข้าถึงหน้านี้ (Access Denied)</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
            บัญชีของคุณปัจจุบันคือ: <strong style={{ color: 'var(--text-main)' }}>{roleNames[userRole] || userRole}</strong>
          </p>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem', background: '#fef2f2', padding: '0.75rem', borderRadius: '8px' }}>
            หน้านี้สงวนสิทธิ์เฉพาะสิทธิ์: <strong>{allowedRoles.map(r => roleNames[r] || r).join(', ')}</strong> เท่านั้น
          </p>
          <Link to="/">
            <button style={{ padding: '0.75rem 1.75rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
              กลับสู่หน้าหลัก
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
