import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProductStore } from '../store/productStore';
import { useOrderStore } from '../store/orderStore';
import { useCommunityStore } from '../store/communityStore';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAdminUsers,
  setUserActive,
  setUserRole,
  adminDeleteUser,
} from '../services/categoryService';
import { getAdminCarts } from '../services/cartService';
import { updateProductStatusApi } from '../services/productService';
import { createCommunity, updateCommunity, deleteCommunity, uploadCommunityBanner } from '../services/communityService';
import { getNews, createNews, updateNews, deleteNews, uploadNewsCover } from '../services/newsService';
import { apiErrorMessage, ORDER_STATUS, ORDER_STATUS_LABELS, normalizeOrderStatus } from '../utils/catalog';
import toast from 'react-hot-toast';
import './SellerDashboard.css';
import './AdminDashboard.css';

const emptyCommunity = {
  name: '',
  province: '',
  district: '',
  subdistrict: '',
  description: '',
  history: '',
  story: '',
  contact_phone: '',
  contact_email: '',
  leader_name: '',
  established_year: '',
  banner_image: '',
};

const emptyNews = {
  title: '',
  excerpt: '',
  content: '',
  category: 'ประชาสัมพันธ์',
  cover_image: '',
  is_published: true,
};

const roleLabels = {
  admin: 'แอดมิน',
  seller: 'ผู้ขาย',
  customer: 'ผู้ซื้อ',
};

const roleDescriptions = {
  admin: 'ดูแลสมาชิก สิทธิ์ คำสั่งซื้อ ชุมชน ข่าว และหมวดหมู่',
  seller: 'เพิ่มสินค้า จัดการสต็อก และติดตามคำสั่งซื้อของร้าน',
  customer: 'เลือกซื้อสินค้า ชำระเงิน ติดตามคำสั่งซื้อ และรีวิว',
};

const roleFilterOptions = [
  ['all', 'สมาชิกทั้งหมด'],
  ['customer', 'ผู้ซื้อ'],
  ['seller', 'ผู้ขาย'],
  ['admin', 'แอดมิน'],
  ['inactive', 'ถูกระงับ'],
];

const businessFlows = [
  {
    title: 'ผู้ซื้อ',
    steps: ['สมัครสมาชิกหรือเข้าสู่ระบบ', 'ค้นหาสินค้าและชุมชน', 'เพิ่มสินค้าเข้าตะกร้า', 'สร้างคำสั่งซื้อและแนบหลักฐานชำระเงิน', 'ติดตามสถานะและเปิดใบกำกับ'],
  },
  {
    title: 'ผู้ขาย',
    steps: ['เข้าสู่ Seller Hub', 'เพิ่มสินค้าและข้อมูลชุมชนที่เกี่ยวข้อง', 'รอแอดมินอนุมัติสินค้า', 'จัดการสต็อกและคำสั่งซื้อที่มีสินค้าของร้าน', 'อัปเดตการจัดส่งเมื่อพร้อมส่ง'],
  },
  {
    title: 'แอดมิน',
    steps: ['ดูภาพรวมสมาชิกและ role', 'ค้นหา เปลี่ยนสิทธิ์ ระงับ หรือยกเลิกบัญชี', 'ตรวจคำสั่งซื้อและใบกำกับ', 'อนุมัติหรือปฏิเสธสินค้าที่ผู้ขายส่งเข้ามา', 'จัดการชุมชน หมวดหมู่ และข่าวหน้าบ้าน'],
  },
];

const testAccounts = [
  { role: 'แอดมิน', email: 'admin@otop.th', password: 'admin123', path: '/admin-dashboard' },
  { role: 'ผู้ขาย', email: 'seller@otop.th', password: 'seller123', path: '/seller-dashboard' },
  { role: 'ผู้ขายสำรอง', email: 'seller2@otop.th', password: 'seller123', path: '/seller-dashboard' },
  { role: 'ผู้ซื้อ', email: 'customer@otop.th', password: 'customer123', path: '/products' },
  { role: 'ผู้ซื้อสำรอง', email: 'customer2@otop.th', password: 'customer123', path: '/orders' },
];

const launchCommands = [
  { label: 'เปิด API หลังบ้าน', command: 'cd backend && python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000' },
  { label: 'เปิดเว็บหน้าบ้าน', command: 'cd frontend && npm run dev' },
  { label: 'สร้างข้อมูลทดสอบ', command: 'cd backend && python scripts/seed_data.py' },
  { label: 'ตรวจ build หน้าบ้าน', command: 'cd frontend && npm run build' },
];

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

const countBy = (items, selector) => items.reduce((acc, item) => {
  const key = selector(item);
  acc[key] = (acc[key] || 0) + 1;
  return acc;
}, {});

const AdminDashboard = () => {
  const { products, fetchAdminProducts } = useProductStore();
  const { orders, fetchOrders, updateOrderStatus } = useOrderStore();
  const { communities, fetchCommunities } = useCommunityStore();

  const [tab, setTab] = useState('overview');
  const [usersList, setUsersList] = useState([]);
  const [cartList, setCartList] = useState([]);
  const [adminError, setAdminError] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [categories, setCategories] = useState([]);
  const [newCatName, setNewCatName] = useState('');
  const [newsList, setNewsList] = useState([]);
  const [communityForm, setCommunityForm] = useState(emptyCommunity);
  const [editingCommunityId, setEditingCommunityId] = useState(null);
  const [newsForm, setNewsForm] = useState(emptyNews);
  const [editingNewsId, setEditingNewsId] = useState(null);

  const reloadAdmin = useCallback(async () => {
    setAdminError('');
    const results = await Promise.allSettled([
      fetchAdminProducts(),
      fetchOrders(),
      fetchCommunities(),
      getCategories().then((data) => setCategories(Array.isArray(data) ? data : [])).catch(() => setCategories([])),
      getAdminUsers()
        .then((data) => setUsersList(Array.isArray(data) ? data : []))
        .catch((err) => {
          setUsersList([]);
          throw err;
        }),
      getAdminCarts()
        .then((data) => setCartList(Array.isArray(data) ? data : []))
        .catch((err) => {
          setCartList([]);
          throw err;
        }),
      getNews(true).then((data) => setNewsList(Array.isArray(data) ? data : [])).catch(() => setNewsList([])),
    ]);
    const failed = results.find((result, index) => result.status === 'rejected' && [4, 5].includes(index));
    if (failed && failed.status === 'rejected') {
      const message = apiErrorMessage(failed.reason, 'โหลดข้อมูลสมาชิกหรือตะกร้าไม่สำเร็จ');
      setAdminError(message);
      toast.error(message);
    }
  }, [fetchAdminProducts, fetchOrders, fetchCommunities]);

  useEffect(() => {
    reloadAdmin();
  }, [reloadAdmin]);

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.grand_total || 0), 0);
  const pendingProducts = products.filter((p) => p.status === 'pending');
  const productStatusCounts = useMemo(() => countBy(products, (p) => p.status || 'unknown'), [products]);
  const orderStatusCounts = useMemo(() => countBy(orders, (order) => normalizeOrderStatus(order.order_status)), [orders]);

  const memberStats = useMemo(() => {
    const activeUsers = usersList.filter((u) => u.is_active !== false);
    const inactiveUsers = usersList.filter((u) => u.is_active === false);
    return {
      total: usersList.length,
      active: activeUsers.length,
      inactive: inactiveUsers.length,
      admin: usersList.filter((u) => u.role === 'admin').length,
      seller: usersList.filter((u) => u.role === 'seller').length,
      customer: usersList.filter((u) => u.role === 'customer').length,
    };
  }, [usersList]);

  const filteredUsers = useMemo(() => {
    const keyword = memberSearch.trim().toLowerCase();
    return usersList.filter((user) => {
      const matchesRole = roleFilter === 'all'
        || (roleFilter === 'inactive' ? user.is_active === false : user.role === roleFilter);
      const searchable = `${user.full_name || ''} ${user.email || ''} ${user.phone_number || ''} ${user.id}`.toLowerCase();
      return matchesRole && (!keyword || searchable.includes(keyword));
    });
  }, [usersList, memberSearch, roleFilter]);

  const recentMembers = [...usersList]
    .sort((a, b) => Number(b.id || 0) - Number(a.id || 0))
    .slice(0, 5);
  const cartCount = cartList.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const paymentVerificationOrders = orderStatusCounts[ORDER_STATUS.PAYMENT_VERIFICATION] || 0;

  const handleApproveProduct = async (id, name) => {
    try {
      await updateProductStatusApi(id, 'approved');
      await fetchAdminProducts();
      toast.success(`อนุมัติสินค้า "${name}" แล้ว`);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const handleRejectProduct = async (id, name) => {
    try {
      await updateProductStatusApi(id, 'rejected');
      await fetchAdminProducts();
      toast.success(`ปฏิเสธสินค้า "${name}" แล้ว`);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const handleToggleUserBlock = async (userId, currentStatus) => {
    const nextActive = currentStatus === true ? false : true;
    try {
      const updated = await setUserActive(userId, nextActive);
      setUsersList(usersList.map((u) => (u.id === userId ? updated : u)));
      toast.success(nextActive ? 'ปลดระงับบัญชีแล้ว' : 'ระงับบัญชีแล้ว');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const handleChangeUserRole = async (userId, role) => {
    try {
      const updated = await setUserRole(userId, role);
      setUsersList(usersList.map((item) => (item.id === userId ? updated : item)));
      toast.success('เปลี่ยนสิทธิ์สมาชิกแล้ว');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const saveCommunity = async (e) => {
    e.preventDefault();
    const payload = {
      ...communityForm,
      established_year: communityForm.established_year ? Number(communityForm.established_year) : null,
    };
    try {
      if (editingCommunityId) {
        await updateCommunity(editingCommunityId, payload);
        toast.success('อัปเดตชุมชนแล้ว');
      } else {
        await createCommunity(payload);
        toast.success('เพิ่มชุมชนแล้ว');
      }
      setCommunityForm(emptyCommunity);
      setEditingCommunityId(null);
      fetchCommunities();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'บันทึกชุมชนไม่สำเร็จ'));
    }
  };

  const saveNews = async (e) => {
    e.preventDefault();
    try {
      if (editingNewsId) {
        await updateNews(editingNewsId, newsForm);
        toast.success('อัปเดตข่าวแล้ว');
      } else {
        await createNews(newsForm);
        toast.success('ลงข่าวแล้ว');
      }
      setNewsForm(emptyNews);
      setEditingNewsId(null);
      const data = await getNews(true);
      setNewsList(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'บันทึกข่าวไม่สำเร็จ'));
    }
  };

  return (
    <div className="dashboard-page admin-dashboard-page">
      <div className="container admin-shell">
        <div className="dashboard-header admin-header">
          <div>
            <p className="admin-eyebrow">Admin control center</p>
            <h1 className="dashboard-title">ศูนย์ผู้ดูแลระบบ OTOP Connect</h1>
            <p className="dashboard-subtitle">เน้นจัดการสมาชิก สิทธิ์ เวิร์กโฟลว์คำสั่งซื้อ ตะกร้า ชุมชน ข่าว และหมวดหมู่ โดยผู้ดูแลระบบไม่สามารถเพิ่มสินค้าแทนผู้ขายได้</p>
          </div>
          <div className="admin-header-actions">
            <Link to="/" className="admin-action-btn">เปิดหน้าบ้าน</Link>
            <Link to="/admin-dashboard" className="admin-action-btn approve">เปิดหลังบ้าน</Link>
          </div>
        </div>

        <div className="admin-tabs" role="tablist" aria-label="เมนูผู้ดูแลระบบ">
          {[
            ['overview', 'ภาพรวม'],
            ['users', 'สมาชิก'],
            ['orders', 'คำสั่งซื้อ'],
            ['carts', 'ตะกร้า'],
            ['workflow', 'เวิร์กโฟลว์'],
            ['communities', 'ชุมชน'],
            ['news', 'กระดานข่าว'],
            ['categories', 'หมวดหมู่'],
            ['testing', 'ข้อมูลทดสอบ'],
          ].map(([key, label]) => (
            <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)} type="button">
              {label}
            </button>
          ))}
        </div>

        {adminError && (
          <p className="empty-note" style={{ marginBottom: '1rem' }}>{adminError}</p>
        )}

        {tab === 'overview' && (
          <>
            <div className="dashboard-stat-grid admin-stat-grid">
              <div className="stat-card">
                <div className="stat-icon users">คน</div>
                <div>
                  <div className="stat-label">สมาชิกทั้งหมด</div>
                  <div className="stat-val">{memberStats.total}</div>
                  <div className="stat-sub">{memberStats.active} ใช้งาน / {memberStats.inactive} ระงับ</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon orders">บิล</div>
                <div>
                  <div className="stat-label">คำสั่งซื้อ</div>
                  <div className="stat-val">{orders.length}</div>
                  <div className="stat-sub">{paymentVerificationOrders} รอตรวจชำระ • {cartList.length} ตะกร้า</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon revenue">บาท</div>
                <div>
                  <div className="stat-label">ยอดขายรวม</div>
                  <div className="stat-val">{totalRevenue.toLocaleString()} ฿</div>
                  <div className="stat-sub">จากคำสั่งซื้อทุกสถานะ</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon avg">รอ</div>
                <div>
                  <div className="stat-label">สินค้ารอตรวจ</div>
                  <div className="stat-val">{pendingProducts.length}</div>
                  <div className="stat-sub">{communities.length} ชุมชน / {categories.length} หมวดหมู่</div>
                </div>
              </div>
            </div>

            <div className="admin-insight-grid">
              <section className="dashboard-card">
                <div className="dashboard-card-title">โครงสร้างสมาชิกตามบทบาท</div>
                <div className="role-summary-grid">
                  {['customer', 'seller', 'admin'].map((role) => (
                    <button
                      type="button"
                      key={role}
                      className={`role-summary-card role-${role}`}
                      onClick={() => {
                        setRoleFilter(role);
                        setTab('users');
                      }}
                    >
                      <span>{roleLabels[role]}</span>
                      <strong>{memberStats[role]}</strong>
                      <small>{roleDescriptions[role]}</small>
                    </button>
                  ))}
                </div>
              </section>

              <section className="dashboard-card">
                <div className="dashboard-card-title">สมาชิกเข้าใหม่ล่าสุด</div>
                <div className="compact-member-list">
                  {recentMembers.map((user) => (
                    <button
                      type="button"
                      key={user.id}
                      onClick={() => {
                        setMemberSearch(user.email);
                        setRoleFilter('all');
                        setTab('users');
                      }}
                    >
                      <span>
                        <strong>{user.full_name}</strong>
                        <small>{user.email}</small>
                      </span>
                      <em>{roleLabels[user.role] || user.role}</em>
                    </button>
                  ))}
                  {recentMembers.length === 0 && <p className="empty-note">ยังไม่มีข้อมูลสมาชิก</p>}
                </div>
              </section>
            </div>

            <section className="dashboard-card">
              <div className="dashboard-card-title">คิวตรวจสินค้าโดยแอดมิน ({pendingProducts.length})</div>
              <p className="admin-help-text">ผู้ขายเป็นผู้เพิ่มสินค้า แอดมินมีหน้าที่ตรวจความถูกต้องและเลือกอนุมัติหรือปฏิเสธก่อนแสดงในหน้าบ้าน</p>
              <div className="admin-table-scroll">
                <table className="dashboard-table admin-responsive-table">
                  <thead>
                    <tr>
                      <th>สินค้า</th>
                      <th>จังหวัด</th>
                      <th>ผู้ขาย</th>
                      <th>ดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingProducts.map((p) => (
                      <tr key={p.id}>
                        <td data-label="สินค้า">{p.name}</td>
                        <td data-label="จังหวัด">{p.province}</td>
                        <td data-label="ผู้ขาย">#{p.seller_id}</td>
                        <td data-label="ดำเนินการ">
                          <div className="admin-row-actions">
                            <button className="admin-action-btn approve" onClick={() => handleApproveProduct(p.id, p.name)} type="button">อนุมัติ</button>
                            <button className="admin-action-btn reject" onClick={() => handleRejectProduct(p.id, p.name)} type="button">ปฏิเสธ</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {pendingProducts.length === 0 && (
                      <tr><td colSpan={4} className="empty-note">ไม่มีสินค้าค้างอนุมัติ</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {tab === 'users' && (
          <section className="dashboard-card">
            <div className="dashboard-card-title">จัดการรายการสมาชิก สิทธิ์ และสถานะบัญชี</div>
            <div className="member-toolbar">
              <input
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="ค้นหาชื่อ อีเมล เบอร์โทร หรือ ID"
                aria-label="ค้นหาสมาชิก"
              />
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} aria-label="กรองบทบาทสมาชิก">
                {roleFilterOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              <button type="button" className="admin-action-btn" onClick={reloadAdmin}>รีเฟรช</button>
            </div>
            <div className="admin-table-scroll">
              <table className="dashboard-table admin-responsive-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>สมาชิก</th>
                    <th>ติดต่อ</th>
                    <th>สิทธิ์</th>
                    <th>สถานะ</th>
                    <th>สมัครเมื่อ</th>
                    <th>ดำเนินการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td data-label="ID">#{u.id}</td>
                      <td data-label="สมาชิก">
                        <strong>{u.full_name}</strong>
                        <small className="admin-muted-line">{roleDescriptions[u.role] || '-'}</small>
                      </td>
                      <td data-label="ติดต่อ">
                        <span>{u.email}</span>
                        <small className="admin-muted-line">{u.phone_number || 'ไม่มีเบอร์โทร'}</small>
                      </td>
                      <td data-label="สิทธิ์">
                        {u.role === 'admin' ? (
                          <span className="role-pill role-admin">แอดมิน</span>
                        ) : (
                          <select value={u.role} onChange={(e) => handleChangeUserRole(u.id, e.target.value)}>
                            <option value="customer">ผู้ซื้อ</option>
                            <option value="seller">ผู้ขาย</option>
                          </select>
                        )}
                      </td>
                      <td data-label="สถานะ">
                        <span className={`status-pill ${u.is_active !== false ? 'active' : 'inactive'}`}>
                          {u.is_active !== false ? 'ใช้งานได้' : 'ระงับ / ยกเลิก'}
                        </span>
                      </td>
                      <td data-label="สมัครเมื่อ">{formatDate(u.created_at)}</td>
                      <td data-label="ดำเนินการ">
                        {u.role !== 'admin' ? (
                          <div className="admin-row-actions">
                            <button className={`admin-action-btn ${u.is_active !== false ? 'reject' : 'approve'}`} onClick={() => handleToggleUserBlock(u.id, u.is_active)} type="button">
                              {u.is_active !== false ? 'ระงับ' : 'ปลดระงับ'}
                            </button>
                            <button
                              className="admin-action-btn reject"
                              type="button"
                              onClick={async () => {
                                if (!window.confirm(`ยืนยันยกเลิกบัญชี ${u.email}?`)) return;
                                try {
                                  await adminDeleteUser(u.id);
                                  toast.success('ยกเลิกบัญชีแล้ว');
                                  const list = await getAdminUsers();
                                  setUsersList(list);
                                } catch (err) {
                                  toast.error(apiErrorMessage(err));
                                }
                              }}
                            >
                              ยกเลิกบัญชี
                            </button>
                          </div>
                        ) : (
                          <span className="empty-note">บัญชีระบบ</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr><td colSpan={7} className="empty-note">ไม่พบสมาชิกตามเงื่อนไขที่เลือก</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === 'orders' && (
          <section className="dashboard-card">
            <div className="dashboard-card-title">จัดการคำสั่งซื้อทั้งหมด</div>
            <div className="admin-table-scroll">
              <table className="dashboard-table admin-responsive-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>ลูกค้า</th>
                    <th>สินค้า</th>
                    <th>ยอดสุทธิ</th>
                    <th>สถานะ</th>
                    <th>ใบกำกับ / ปรับสถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td data-label="#">#{order.id}</td>
                      <td data-label="ลูกค้า">
                        <strong>{order.customer_name || '-'}</strong>
                        <small className="admin-muted-line">{order.customer_email || order.customer_phone || '-'}</small>
                      </td>
                      <td data-label="สินค้า">
                        {(order.items || []).map((item) => item.name).filter(Boolean).join(', ') || `${(order.items || []).length} รายการ`}
                      </td>
                      <td data-label="ยอดสุทธิ">{Number(order.grand_total || 0).toLocaleString()} ฿</td>
                      <td data-label="สถานะ">{ORDER_STATUS_LABELS[normalizeOrderStatus(order.order_status)] || order.order_status}</td>
                      <td data-label="ใบกำกับ / ปรับสถานะ">
                        <div className="admin-row-actions">
                          <Link to={`/orders/${order.id}/invoice`} className="admin-action-btn">เปิดใบกำกับ</Link>
                          <select
                            value={normalizeOrderStatus(order.order_status)}
                            onChange={async (e) => {
                              try {
                                await updateOrderStatus(order.id, e.target.value);
                                toast.success('อัปเดตสถานะแล้ว');
                              } catch (err) {
                                toast.error(apiErrorMessage(err));
                              }
                            }}
                          >
                            {Object.values(ORDER_STATUS).map((status) => (
                              <option key={status} value={status}>{ORDER_STATUS_LABELS[status]}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr><td colSpan={6} className="empty-note">ยังไม่มีคำสั่งซื้อ</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === 'carts' && (
          <section className="dashboard-card">
            <div className="dashboard-card-title">ตะกร้าสินค้าของสมาชิกทั้งหมด ({cartList.length} รายการ / {cartCount} ชิ้น)</div>
            <p className="admin-help-text">แสดงสินค้าที่สมาชิกใส่ตะกร้าไว้แล้วยังไม่ได้สร้างคำสั่งซื้อ</p>
            <div className="member-toolbar">
              <button type="button" className="admin-action-btn" onClick={reloadAdmin}>รีเฟรช</button>
            </div>
            <div className="admin-table-scroll">
              <table className="dashboard-table admin-responsive-table">
                <thead>
                  <tr>
                    <th>สมาชิก</th>
                    <th>สินค้า</th>
                    <th>จำนวน</th>
                    <th>ราคา/ชิ้น</th>
                    <th>อัปเดต</th>
                  </tr>
                </thead>
                <tbody>
                  {cartList.map((item) => (
                    <tr key={item.id}>
                      <td data-label="สมาชิก">
                        <strong>{item.user_name || `ผู้ใช้ #${item.user_id}`}</strong>
                        <small className="admin-muted-line">{item.user_email || '-'}</small>
                      </td>
                      <td data-label="สินค้า">{item.product?.name || `สินค้า #${item.product_id}`}</td>
                      <td data-label="จำนวน">{item.quantity}</td>
                      <td data-label="ราคา/ชิ้น">{Number(item.product?.price || 0).toLocaleString()} ฿</td>
                      <td data-label="อัปเดต">{formatDate(item.updated_at || item.created_at)}</td>
                    </tr>
                  ))}
                  {cartList.length === 0 && (
                    <tr><td colSpan={5} className="empty-note">ยังไม่มีสินค้าในตะกร้าของสมาชิก</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === 'workflow' && (
          <div className="admin-workflow-grid">
            {businessFlows.map((flow) => (
              <section className="dashboard-card workflow-card" key={flow.title}>
                <div className="dashboard-card-title">{flow.title}</div>
                <ol>
                  {flow.steps.map((step) => <li key={step}>{step}</li>)}
                </ol>
              </section>
            ))}
            <section className="dashboard-card workflow-card workflow-wide">
              <div className="dashboard-card-title">สถานะที่ต้องเฝ้าดู</div>
              <div className="workflow-metrics">
                <span>คำสั่งซื้อรอชำระ: {orderStatusCounts[ORDER_STATUS.PENDING_PAYMENT] || 0}</span>
                <span>รอตรวจชำระเงิน: {paymentVerificationOrders}</span>
                <span>กำลังเตรียมจัดส่ง: {orderStatusCounts[ORDER_STATUS.PREPARING] || 0}</span>
                <span>สินค้ารออนุมัติ: {productStatusCounts.pending || 0}</span>
                <span>สินค้าถูกปฏิเสธ: {productStatusCounts.rejected || 0}</span>
                <span>สมาชิกถูกระงับ: {memberStats.inactive}</span>
              </div>
            </section>
          </div>
        )}

        {tab === 'communities' && (
          <section className="dashboard-card">
            <div className="dashboard-card-title">{editingCommunityId ? 'แก้ไขชุมชน' : 'เพิ่มชุมชนใหม่'}</div>
            <form className="admin-form-grid" onSubmit={saveCommunity}>
              <input required placeholder="ชื่อชุมชน" value={communityForm.name} onChange={(e) => setCommunityForm({ ...communityForm, name: e.target.value })} />
              <input required placeholder="จังหวัด" value={communityForm.province} onChange={(e) => setCommunityForm({ ...communityForm, province: e.target.value })} />
              <input required placeholder="อำเภอ" value={communityForm.district} onChange={(e) => setCommunityForm({ ...communityForm, district: e.target.value })} />
              <input placeholder="ตำบล" value={communityForm.subdistrict} onChange={(e) => setCommunityForm({ ...communityForm, subdistrict: e.target.value })} />
              <input placeholder="ประธานกลุ่ม" value={communityForm.leader_name} onChange={(e) => setCommunityForm({ ...communityForm, leader_name: e.target.value })} />
              <input placeholder="ปีที่ก่อตั้ง พ.ศ." value={communityForm.established_year} onChange={(e) => setCommunityForm({ ...communityForm, established_year: e.target.value })} />
              <input placeholder="โทรศัพท์" value={communityForm.contact_phone} onChange={(e) => setCommunityForm({ ...communityForm, contact_phone: e.target.value })} />
              <input placeholder="อีเมล" value={communityForm.contact_email} onChange={(e) => setCommunityForm({ ...communityForm, contact_email: e.target.value })} />
              <textarea placeholder="คำอธิบาย" value={communityForm.description} onChange={(e) => setCommunityForm({ ...communityForm, description: e.target.value })} />
              <textarea placeholder="ประวัติชุมชน" value={communityForm.history} onChange={(e) => setCommunityForm({ ...communityForm, history: e.target.value })} />
              <textarea placeholder="เรื่องราวสินค้า" value={communityForm.story} onChange={(e) => setCommunityForm({ ...communityForm, story: e.target.value })} />
              <input placeholder="ลิงก์รูปปก (ถ้ามี)" value={communityForm.banner_image} onChange={(e) => setCommunityForm({ ...communityForm, banner_image: e.target.value })} />
              <div className="admin-form-actions">
                <button type="submit" className="admin-action-btn approve">{editingCommunityId ? 'บันทึกการแก้ไข' : 'เพิ่มชุมชน'}</button>
                {editingCommunityId && (
                  <button type="button" className="admin-action-btn" onClick={() => { setEditingCommunityId(null); setCommunityForm(emptyCommunity); }}>ยกเลิกแก้ไข</button>
                )}
              </div>
            </form>

            <div className="admin-table-scroll">
              <table className="dashboard-table admin-responsive-table">
                <thead>
                  <tr>
                    <th>ชุมชน</th>
                    <th>จังหวัด</th>
                    <th>สินค้า</th>
                    <th>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {communities.map((c) => (
                    <tr key={c.id}>
                      <td data-label="ชุมชน">{c.name}</td>
                      <td data-label="จังหวัด">{c.province}</td>
                      <td data-label="สินค้า">{c.products_count || 0}</td>
                      <td data-label="จัดการ">
                        <div className="admin-row-actions">
                          <button className="admin-action-btn approve" type="button" onClick={() => { setEditingCommunityId(c.id); setCommunityForm({ ...emptyCommunity, ...c, established_year: c.established_year || '' }); }}>แก้ไข</button>
                          <label className="admin-action-btn">
                            อัปโหลดรูป
                            <input
                              type="file"
                              accept="image/*"
                              hidden
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                e.target.value = '';
                                if (!file) return;
                                try {
                                  await uploadCommunityBanner(c.id, file);
                                  toast.success('อัปโหลดรูปชุมชนแล้ว');
                                  fetchCommunities();
                                } catch (err) {
                                  toast.error(apiErrorMessage(err));
                                }
                              }}
                            />
                          </label>
                          <button
                            className="admin-action-btn reject"
                            type="button"
                            onClick={async () => {
                              if (!window.confirm(`ลบชุมชน ${c.name}?`)) return;
                              try {
                                await deleteCommunity(c.id);
                                toast.success('ลบชุมชนแล้ว');
                                fetchCommunities();
                              } catch (err) {
                                toast.error(apiErrorMessage(err));
                              }
                            }}
                          >
                            ลบ
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === 'news' && (
          <section className="dashboard-card">
            <div className="dashboard-card-title">{editingNewsId ? 'แก้ไขข่าว' : 'ลงข่าวประชาสัมพันธ์'}</div>
            <form className="admin-form-grid" onSubmit={saveNews}>
              <input required placeholder="หัวข้อข่าว" value={newsForm.title} onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })} />
              <select value={newsForm.category} onChange={(e) => setNewsForm({ ...newsForm, category: e.target.value })}>
                <option>ประชาสัมพันธ์</option>
                <option>กิจกรรม</option>
                <option>นโยบาย</option>
                <option>ชุมชน</option>
              </select>
              <input placeholder="คำโปรย" value={newsForm.excerpt} onChange={(e) => setNewsForm({ ...newsForm, excerpt: e.target.value })} />
              <input placeholder="ลิงก์รูปปก" value={newsForm.cover_image} onChange={(e) => setNewsForm({ ...newsForm, cover_image: e.target.value })} />
              <textarea required placeholder="เนื้อหาข่าว" value={newsForm.content} onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })} />
              <label className="admin-checkbox-line">
                <input type="checkbox" checked={newsForm.is_published} onChange={(e) => setNewsForm({ ...newsForm, is_published: e.target.checked })} />
                เผยแพร่ทันที
              </label>
              <div className="admin-form-actions">
                <button type="submit" className="admin-action-btn approve">{editingNewsId ? 'บันทึกข่าว' : 'ลงข่าว'}</button>
                {editingNewsId && <button type="button" className="admin-action-btn" onClick={() => { setEditingNewsId(null); setNewsForm(emptyNews); }}>ยกเลิก</button>}
              </div>
            </form>
            <div className="admin-table-scroll">
              <table className="dashboard-table admin-responsive-table">
                <thead>
                  <tr>
                    <th>หัวข้อ</th>
                    <th>หมวด</th>
                    <th>สถานะ</th>
                    <th>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {newsList.map((article) => (
                    <tr key={article.id}>
                      <td data-label="หัวข้อ">{article.title}</td>
                      <td data-label="หมวด">{article.category}</td>
                      <td data-label="สถานะ">{article.is_published ? 'เผยแพร่' : 'ฉบับร่าง'}</td>
                      <td data-label="จัดการ">
                        <div className="admin-row-actions">
                          <button className="admin-action-btn approve" type="button" onClick={() => { setEditingNewsId(article.id); setNewsForm({ title: article.title, excerpt: article.excerpt || '', content: article.content, category: article.category, cover_image: article.cover_image || '', is_published: article.is_published }); }}>แก้ไข</button>
                          <label className="admin-action-btn">
                            รูปปก
                            <input type="file" accept="image/*" hidden onChange={async (e) => {
                              const file = e.target.files?.[0];
                              e.target.value = '';
                              if (!file) return;
                              try {
                                await uploadNewsCover(article.id, file);
                                toast.success('อัปโหลดรูปข่าวแล้ว');
                                setNewsList(await getNews(true));
                              } catch (err) {
                                toast.error(apiErrorMessage(err));
                              }
                            }} />
                          </label>
                          <button className="admin-action-btn reject" type="button" onClick={async () => {
                            if (!window.confirm('ลบข่าวนี้?')) return;
                            try {
                              await deleteNews(article.id);
                              toast.success('ลบข่าวแล้ว');
                              setNewsList(await getNews(true));
                            } catch (err) {
                              toast.error(apiErrorMessage(err));
                            }
                          }}>ลบ</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === 'categories' && (
          <section className="dashboard-card">
            <div className="dashboard-card-title">หมวดหมู่สินค้า</div>
            <form
              className="admin-inline-form"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newCatName.trim()) return;
                try {
                  const created = await createCategory({ name: newCatName.trim() });
                  setCategories([...categories, created]);
                  setNewCatName('');
                  toast.success('เพิ่มหมวดหมู่แล้ว');
                } catch (err) {
                  toast.error(apiErrorMessage(err));
                }
              }}
            >
              <input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="ชื่อหมวดหมู่ใหม่" />
              <button className="admin-action-btn approve" type="submit">เพิ่ม</button>
            </form>
            <div className="admin-table-scroll">
              <table className="dashboard-table admin-responsive-table">
                <thead>
                  <tr>
                    <th>หมวดหมู่</th>
                    <th>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => (
                    <tr key={cat.id}>
                      <td data-label="หมวดหมู่">{cat.name}</td>
                      <td data-label="จัดการ">
                        <div className="admin-row-actions">
                          <button
                            className="admin-action-btn approve"
                            type="button"
                            onClick={async () => {
                              const name = window.prompt('ชื่อหมวดหมู่ใหม่', cat.name);
                              if (!name) return;
                              try {
                                const updated = await updateCategory(cat.id, { name });
                                setCategories(categories.map((item) => (item.id === cat.id ? updated : item)));
                                toast.success('แก้ไขหมวดหมู่แล้ว');
                              } catch (err) {
                                toast.error(apiErrorMessage(err));
                              }
                            }}
                          >
                            เปลี่ยนชื่อ
                          </button>
                          <button
                            className="admin-action-btn reject"
                            type="button"
                            onClick={async () => {
                              if (!window.confirm(`ลบหมวดหมู่ ${cat.name}?`)) return;
                              try {
                                await deleteCategory(cat.id);
                                setCategories(categories.filter((item) => item.id !== cat.id));
                                toast.success('ลบหมวดหมู่แล้ว');
                              } catch (err) {
                                toast.error(apiErrorMessage(err));
                              }
                            }}
                          >
                            ลบ
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === 'testing' && (
          <div className="admin-testing-grid">
            <section className="dashboard-card">
              <div className="dashboard-card-title">บัญชีทดสอบตามบทบาท</div>
              <div className="admin-table-scroll">
                <table className="dashboard-table admin-responsive-table">
                  <thead>
                    <tr>
                      <th>บทบาท</th>
                      <th>อีเมล</th>
                      <th>รหัสผ่าน</th>
                      <th>หน้าหลักที่ควรเปิด</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testAccounts.map((account) => (
                      <tr key={account.email}>
                        <td data-label="บทบาท">{account.role}</td>
                        <td data-label="อีเมล"><code>{account.email}</code></td>
                        <td data-label="รหัสผ่าน"><code>{account.password}</code></td>
                        <td data-label="หน้าหลักที่ควรเปิด"><Link to={account.path}>{account.path}</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="dashboard-card">
              <div className="dashboard-card-title">คำสั่งเปิดระบบ</div>
              <div className="launch-command-list">
                {launchCommands.map((item) => (
                  <div key={item.label}>
                    <strong>{item.label}</strong>
                    <code>{item.command}</code>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
