import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProductStore } from '../store/productStore';
import { useCartStore } from '../store/cartStore';
import { useOrderStore } from '../store/orderStore';
import { useAuthStore } from '../store/authStore';
import { useReviewStore } from '../store/reviewStore';
import { useChatStore } from '../store/chatStore';
import { getProductImage, apiErrorMessage, ORDER_STATUS, normalizeOrderStatus } from '../utils/catalog';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, fetchProductById, loading, error } = useProductStore();
  const { addItem, loading: cartLoading } = useCartStore();
  const { orders, fetchOrders } = useOrderStore();
  const { user, openAuthModal } = useAuthStore();
  const { fetchReviewsForProduct, addReview, getReviewsByProduct, getProductRatingSummary } = useReviewStore();
  const { startPrivateChat } = useChatStore();

  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Review Form state
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    fetchProductById(id).catch(() => {});
    if (user) {
      fetchOrders().catch(() => {});
    }
    fetchReviewsForProduct(id).catch(() => {});
  }, [id, user]);

  const product = products.find(p => p.id === Number(id));
  const productReviews = getReviewsByProduct(id);
  const ratingSummary = getProductRatingSummary(id);

  // Check BR-04 Rule: Can only review if user bought this product & order status is COMPLETED
  const hasCompletedPurchase = Boolean(
    user && orders.some(order =>
      normalizeOrderStatus(order.order_status) === ORDER_STATUS.COMPLETED &&
      (order.items || []).some(item => Number(item.product_id || item.id) === Number(id))
    )
  );

  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    // Find user's completed order ID if available
    const completedOrder = orders.find(order =>
      normalizeOrderStatus(order.order_status) === ORDER_STATUS.COMPLETED &&
      (order.items || []).some(item => Number(item.product_id || item.id) === Number(id))
    );

    if (!completedOrder) {
      alert('ไม่พบคำสั่งซื้อที่สำเร็จสำหรับสินค้านี้');
      return;
    }

    try {
      await addReview({
        product_id: Number(id),
        order_id: completedOrder.id,
        rating: newRating,
        comment: newComment.trim(),
      });
      setNewComment('');
      alert('บันทึกรีวิวเรียบร้อยแล้ว');
    } catch (err) {
      alert(apiErrorMessage(err, 'ไม่สามารถบันทึกรีวิวได้'));
    }
  };

  // Fallback images if product doesn't have gallery
  const images = product
    ? [getProductImage(product)]
    : [];

  // BR-03: Quantity must not exceed stock
  const productStock = product ? (product.stock !== undefined ? Number(product.stock) : 0) : 0;

  const handleQuantityChange = (delta) => {
    setQuantity(prev => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (productStock > 0 && next > productStock) return productStock;
      return next;
    });
  };

  const handleAddToCart = async () => {
    if (!product) return;
    // BR-01: Must login before adding to cart for checkout
    if (!user) {
      if (window.confirm('กรุณาเข้าสู่ระบบก่อนเพิ่มสินค้าลงตะกร้า\n\nต้องการเข้าสู่ระบบหรือไม่?')) {
        openAuthModal();
      }
      return;
    }
    // BR-02: Cannot add out-of-stock product
    if (productStock <= 0) {
      alert('สินค้าหมด ไม่สามารถเพิ่มลงตะกร้าได้');
      return;
    }
    try {
      await addItem({ product_id: product.id, quantity: Math.min(quantity, productStock), product });
      setToastMessage(`เพิ่ม "${product.name}" (${quantity} ชิ้น) ลงในตะกร้าเรียบร้อย`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    } catch (e) {
      alert(apiErrorMessage(e, 'เกิดข้อผิดพลาดในการเพิ่มสินค้าลงตะกร้า'));
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    if (!user) {
      if (window.confirm('กรุณาเข้าสู่ระบบก่อนสั่งซื้อสินค้า\n\nต้องการเข้าสู่ระบบหรือไม่?')) {
        openAuthModal();
      }
      return;
    }
    if (productStock <= 0) {
      alert('สินค้าหมด ไม่สามารถสั่งซื้อได้');
      return;
    }
    try {
      await addItem({ product_id: product.id, quantity: Math.min(quantity, productStock), product });
      navigate('/cart');
    } catch (e) {
      alert('เกิดข้อผิดพลาดในการซื้อสินค้าด่วน');
    }
  };

  const handleStartChatWithSeller = async () => {
    if (!user) {
      if (window.confirm('กรุณาเข้าสู่ระบบก่อนเริ่มการสนทนา\n\nต้องการเข้าสู่ระบบหรือไม่?')) {
        openAuthModal();
      }
      return;
    }
    if (user.id === product.seller_id) {
      alert('คุณไม่สามารถแชทกับตัวเองได้');
      return;
    }
    try {
      await startPrivateChat(product.seller_id);
      navigate('/chat');
    } catch (error) {
      alert('ไม่สามารถเริ่มการสนทนาได้');
    }
  };

  if (loading) {
    return (
      <div className="product-detail-page">
        <div className="product-detail-container pd-loading">
          <div className="pd-spinner"></div>
          <p>กำลังโหลดข้อมูลสินค้า...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-detail-page">
        <div className="product-detail-container pd-error">
          <h3>{error ? 'เกิดข้อผิดพลาด' : 'ไม่พบสินค้านี้'}</h3>
          <p>{error || 'สินค้าอาจถูกลบหรือไม่มีอยู่ในระบบ'}</p>
          <Link to="/products">
            <button className="pd-error-btn">กลับไปหน้ารายการสินค้า</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="product-detail-page">
      <div className="product-detail-container">
        {/* Breadcrumb Navigation */}
        <nav className="pd-breadcrumb">
          <Link to="/">หน้าแรก</Link>
          <span className="separator">/</span>
          <Link to="/products">สินค้า OTOP</Link>
          <span className="separator">/</span>
          <span>{product.name}</span>
        </nav>

        {/* Toast Notification */}
        {showToast && (
          <div className="pd-cart-toast">
            <div className="pd-cart-toast-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div className="pd-cart-toast-info">
              <h4>เพิ่มลงตะกร้าแล้ว</h4>
              <p>{toastMessage}</p>
            </div>
            <button className="pd-cart-toast-close" onClick={() => setShowToast(false)}>×</button>
          </div>
        )}

        {/* Main Details Grid */}
        <div className="pd-main">
          {/* Left: Gallery */}
          <div className="pd-gallery">
            <div className="pd-image-main">
              <img src={images[activeImageIndex] || images[0]} alt={product.name} />
            </div>
            {images.length > 1 && (
              <div className="pd-thumbnails">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className={`pd-thumb ${idx === activeImageIndex ? 'active' : ''}`}
                    onClick={() => setActiveImageIndex(idx)}
                  >
                    <img src={img} alt={`${product.name} thumb ${idx + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Info */}
          <div className="pd-info">
            <div className="pd-badges">
              <span className="pd-category-badge">
                🏷️ {product.category?.name || product.category || 'สินค้าภูมิปัญญาไทย'}
              </span>
              <span className={`pd-stock ${productStock > 0 ? 'in-stock' : 'out-of-stock'}`} style={productStock <= 0 ? { background: '#fef2f2', color: '#dc2626' } : {}}>
                {productStock > 0 ? `✓ มีสินค้าพร้อมส่ง (เหลือ ${productStock} ชิ้น)` : '✕ สินค้าหมด'}
              </span>
            </div>

            <h1 className="pd-title">{product.name}</h1>

            <div className="pd-price-section">
              <span className="pd-price">{Number(product.price).toLocaleString()}</span>
              <span className="pd-price-currency">บาท</span>
            </div>

            <div className="pd-description">
              <p>{product.description || '-'}</p>
            </div>

            {/* Quantity Selector */}
            <div className="pd-quantity-section">
              <span className="pd-quantity-label">จำนวน:</span>
              <div className="pd-quantity-control">
                <button
                  className="pd-qty-btn"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <input
                  type="text"
                  className="pd-qty-value"
                  value={quantity}
                  readOnly
                />
                <button
                  className="pd-qty-btn"
                  onClick={() => handleQuantityChange(1)}
                  disabled={productStock > 0 && quantity >= productStock}
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            {(!user || user.role !== 'seller') ? (
              <div className="pd-actions">
                <button
                  className="pd-btn-cart"
                  onClick={handleAddToCart}
                  disabled={cartLoading || productStock <= 0}
                  style={productStock <= 0 ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                  </svg>
                  {productStock <= 0 ? 'สินค้าหมด' : cartLoading ? 'กำลังบันทึก...' : 'เพิ่มลงตะกร้า'}
                </button>

                <button
                  className="pd-btn-buy"
                  onClick={handleBuyNow}
                  disabled={productStock <= 0}
                  style={productStock <= 0 ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                >
                  {productStock <= 0 ? '✕ สินค้าหมด' : '⚡ ซื้อเลย (ซื้อด่วน)'}
                </button>
              </div>
            ) : (
              <div className="pd-actions">
                <button className="pd-btn-cart" disabled style={{ opacity: 0.5, cursor: 'not-allowed', width: '100%' }}>
                  🛍️ บัญชีผู้ขายไม่สามารถสั่งซื้อสินค้าได้
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sub Sections: Seller & Reviews */}
        <div className="pd-sections">
          {/* Seller / Map Section */}
          <div className="pd-section-card">
            <h3 className="pd-section-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              ข้อมูลผู้ขาย & พิกัดร้านค้า
            </h3>
            <div className="pd-seller-info">
              <div className="pd-seller-avatar" style={{ cursor: 'pointer' }} onClick={() => navigate(`/profile/${product.seller_id}`)}>
                {product.seller_id ? `S${product.seller_id}` : 'ไม่มีข้อมูล'}
              </div>
              <div>
                <div className="pd-seller-name" style={{ cursor: 'pointer' }} onClick={() => navigate(`/profile/${product.seller_id}`)}>
                  {product.seller?.full_name || 'ไม่ทราบชื่อผู้ขาย'}
                </div>
                <div className="pd-seller-location">
                  📍 {product.community?.district ? `อ.${product.community.district} ` : ''}
                  จ.{product.community?.province || product.province || '-'}
                </div>
                {product.community?.name && (
                  <div className="pd-seller-location">ชุมชน: {product.community.name}</div>
                )}
                {product.seller_id && user?.id !== product.seller_id && (
                  <button 
                    onClick={handleStartChatWithSeller}
                    style={{
                      marginTop: '10px',
                      background: 'var(--primary)',
                      color: 'white',
                      border: 'none',
                      padding: '6px 16px',
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    ทักแชทร้านค้า
                  </button>
                )}
              </div>
            </div>
            <div className="pd-map-placeholder">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                <line x1="8" y1="2" x2="8" y2="18"></line>
                <line x1="16" y1="6" x2="16" y2="22"></line>
              </svg>
              <span>แผนที่ตั้งชุมชนผู้ผลิต OTOP (ระบบพิกัด GPS)</span>
            </div>
          </div>

          {/* Reviews Section (BR-04 Compliant & Persistent) */}
          <div className="pd-section-card">
            <h3 className="pd-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
                <span>รีวิวและความเห็นจากผู้สั่งซื้อ ({productReviews.length} รีวิว)</span>
              </div>
              <div style={{ fontSize: '1rem', color: '#f59e0b', fontWeight: 700 }}>
                ⭐️ {ratingSummary.average} / 5.0
              </div>
            </h3>

            {/* BR-04 Review Form */}
            {hasCompletedPurchase ? (
              <form onSubmit={handleAddReview} style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--terracotta)', marginBottom: '0.75rem' }}>
                  ✍️ เขียนรีวิวสินค้าที่คุณเคยซื้อแล้ว (BR-04 Verified Buyer)
                </h4>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 500 }}>ให้คะแนน:</label>
                  <select
                    value={newRating}
                    onChange={(e) => setNewRating(Number(e.target.value))}
                    style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)' }}
                  >
                    <option value={5}>⭐️⭐️⭐️⭐️⭐️ (5 ดาว - ดีเยี่ยม)</option>
                    <option value={4}>⭐️⭐️⭐️⭐️ (4 ดาว - ดีมาก)</option>
                    <option value={3}>⭐️⭐️⭐️ (3 ดาว - ปานกลาง)</option>
                    <option value={2}>⭐️⭐️ (2 ดาว - พอใช้)</option>
                    <option value={1}>⭐️ (1 ดาว - ต้องปรับปรุง)</option>
                  </select>
                </div>
                <textarea
                  rows="3"
                  placeholder="แบ่งปันความประทับใจเกี่ยวกับสินค้า OTOP ชิ้นนี้…"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '0.75rem' }}
                  required
                ></textarea>
                <button
                  type="submit"
                  style={{ background: 'var(--terracotta)', color: '#fff', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                >
                  ส่งรีวิวสินค้า
                </button>
              </form>
            ) : (
              <div style={{ background: '#fffbeb', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid #fef3c7', marginBottom: '1.5rem', fontSize: '0.9rem', color: '#92400e' }}>
                🔒 <strong>สิทธิ์การรีวิว:</strong> เฉพาะผู้ซื้อที่เข้าสู่ระบบและมีคำสั่งซื้อสินค้านี้ในสถานะ <strong>สำเร็จแล้ว</strong> เท่านั้น จึงจะสามารถเขียนรีวิวได้
              </div>
            )}

            {/* Reviews List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {productReviews.map(rev => (
                <div key={rev.id} style={{ padding: '1rem', borderRadius: '10px', background: '#f8fafc', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>{rev.user_name || 'ผู้ซื้อ'}</strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(rev.created_at || Date.now()).toLocaleDateString('th-TH')}
                    </span>
                  </div>
                  <div style={{ color: '#f59e0b', fontSize: '0.9rem', marginBottom: '0.35rem' }}>
                    {'★'.repeat(Number(rev.rating || 5))}{'☆'.repeat(5 - Number(rev.rating || 5))} ({rev.rating} ดาว)
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', margin: 0 }}>"{rev.comment}"</p>
                </div>
              ))}

              {productReviews.length === 0 && (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  ยังไม่มีรีวิวสำหรับสินค้านี้
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
