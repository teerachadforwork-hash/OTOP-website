import { create } from 'zustand';
import api from '../services/api';

const CURRENT_USER_KEY = 'otop_current_user_email';

const setCurrentUserEmail = (email) => {
  try {
    if (email) localStorage.setItem(CURRENT_USER_KEY, email);
    else localStorage.removeItem(CURRENT_USER_KEY);
  } catch (e) {}
};

const getCurrentUserEmail = () => {
  try {
    return localStorage.getItem(CURRENT_USER_KEY) || null;
  } catch (e) {
    return null;
  }
};

const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: true,
  authModalOpen: false,

  openAuthModal: () => set({ authModalOpen: true }),
  closeAuthModal: () => set({ authModalOpen: false }),

  register: async (userData) => {
    const cleanEmail = (userData.email || '').trim().toLowerCase();
    const cleanName = (userData.fullName || userData.full_name || '').trim();
    const cleanRole = userData.role === 'seller' ? 'seller' : 'customer';
    const cleanPhone = (userData.phone || userData.phone_number || '').trim();

    if (!cleanEmail || !userData.password) {
      return { success: false, error: 'กรุณากรอกอีเมลและรหัสผ่าน' };
    }
    if (!cleanName) {
      return { success: false, error: 'กรุณากรอกชื่อ-นามสกุล' };
    }
    if (userData.password.length < 6) {
      return { success: false, error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' };
    }

    try {
      await api.post('/api/auth/register', {
        email: cleanEmail,
        password: userData.password,
        full_name: cleanName,
        phone_number: cleanPhone || '0800000000',
        role: cleanRole,
      });
      const loggedIn = await get().login(cleanEmail, userData.password);
      if (!loggedIn) {
        return { success: false, error: 'สมัครสำเร็จ แต่เข้าสู่ระบบไม่สำเร็จ กรุณาเข้าสู่ระบบอีกครั้ง' };
      }
      return { success: true };
    } catch (error) {
      const detail = error?.response?.data?.detail || '';
      if (String(detail).toLowerCase().includes('already')) {
        return { success: false, error: 'อีเมลนี้ถูกใช้สมัครสมาชิกแล้ว' };
      }
      return { success: false, error: detail || 'สมัครสมาชิกไม่สำเร็จ กรุณาตรวจสอบว่าเซิร์ฟเวอร์ทำงานอยู่' };
    }
  },

  login: async (email, password) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !password) return false;

    try {
      const params = new URLSearchParams();
      params.append('username', cleanEmail);
      params.append('password', password);

      const response = await api.post('/api/auth/login', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      setCurrentUserEmail(cleanEmail);
      set({ token: access_token, isAuthenticated: true });

      const userRes = await api.get('/api/auth/me');
      set({ user: userRes.data });
      return true;
    } catch (error) {
      return false;
    }
  },

  updateProfile: async (userData) => {
    const cleanEmail = (userData.email || '').trim().toLowerCase();
    const cleanName = (userData.full_name || '').trim();
    const cleanPassword = userData.password || null;

    if (!cleanEmail || !cleanName) {
      return { success: false, error: 'กรุณากรอกข้อมูลให้ครบถ้วน' };
    }

    try {
      const response = await api.put('/api/auth/profile', {
        email: cleanEmail,
        full_name: cleanName,
        password: cleanPassword,
      });
      setCurrentUserEmail(cleanEmail);
      set({ user: response.data });
      return { success: true, data: response.data };
    } catch (error) {
      const detail = error?.response?.data?.detail || '';
      if (detail.includes('already taken') || detail.includes('ถูกใช้งาน')) {
        return { success: false, error: 'อีเมลนี้ถูกใช้งานโดยบัญชีอื่นแล้ว' };
      }
      return { success: false, error: detail || 'ไม่สามารถอัปเดตข้อมูลได้' };
    }
  },

  uploadAvatar: async (file) => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const response = await api.put('/api/auth/profile/avatar', formData);
      set({ user: response.data });
      return { success: true, data: response.data };
    } catch (error) {
      const detail = error?.response?.data?.detail || '';
      return { success: false, error: detail || 'อัปโหลดรูปโปรไฟล์ไม่สำเร็จ' };
    }
  },

  deleteAccount: async (password) => {
    if (!password) {
      return { success: false, error: 'กรุณากรอกรหัสผ่านเพื่อยืนยัน' };
    }
    try {
      await api.delete('/api/auth/account', { data: { password } });
      localStorage.removeItem('token');
      setCurrentUserEmail(null);
      set({ user: null, token: null, isAuthenticated: false });
      return { success: true };
    } catch (error) {
      const detail = error?.response?.data?.detail || '';
      return { success: false, error: detail || 'ยกเลิกบัญชีไม่สำเร็จ' };
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    setCurrentUserEmail(null);
    set({ user: null, token: null, isAuthenticated: false });
  },

  forgotPassword: async (email) => {
    try {
      const response = await api.post('/api/auth/forgot-password', { email });
      return { success: true, message: response.data.message };
    } catch (error) {
      const detail = error?.response?.data?.detail || 'เกิดข้อผิดพลาดในการส่งอีเมล';
      return { success: false, error: detail };
    }
  },

  resetPassword: async (token, newPassword) => {
    try {
      const response = await api.post('/api/auth/reset-password', {
        token: token,
        new_password: newPassword
      });
      return { success: true, message: response.data.message };
    } catch (error) {
      const detail = error?.response?.data?.detail || 'ลิงก์ไม่ถูกต้องหรือหมดอายุแล้ว';
      return { success: false, error: detail };
    }
  },

  getSavedAddresses: () => {
    const currentEmail = getCurrentUserEmail();
    if (!currentEmail) return [];
    try {
      const all = JSON.parse(localStorage.getItem('otop_addresses') || '{}');
      return all[currentEmail] || [];
    } catch {
      return [];
    }
  },

  saveAddress: (address) => {
    const currentEmail = getCurrentUserEmail();
    if (!currentEmail) return;
    try {
      const all = JSON.parse(localStorage.getItem('otop_addresses') || '{}');
      const userAddresses = all[currentEmail] || [];
      const isDuplicate = userAddresses.some(
        (a) =>
          a.name === address.name &&
          a.phone === address.phone &&
          a.addressDetail === address.addressDetail &&
          a.province === address.province
      );
      if (!isDuplicate) {
        all[currentEmail] = [...userAddresses, { ...address, id: Date.now() }];
        localStorage.setItem('otop_addresses', JSON.stringify(all));
      }
    } catch {}
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token || token.startsWith('local_token_') || token.startsWith('token_')) {
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      return;
    }
    try {
      const userRes = await api.get('/api/auth/me');
      setCurrentUserEmail(userRes.data.email);
      set({ user: userRes.data, isAuthenticated: true, isLoading: false });
    } catch (error) {
      localStorage.removeItem('token');
      setCurrentUserEmail(null);
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },
}));

export { useAuthStore };
export default useAuthStore;
