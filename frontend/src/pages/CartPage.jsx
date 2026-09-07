import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useProductStore } from '../store/productStore';
import { useAuthStore } from '../store/authStore';
import { getProvinces, getDistricts, getSubdistricts } from '../data/thaiAddressData';
import { useOrderStore } from '../store/orderStore';
import { getProductImage, apiErrorMessage, ORDER_STATUS } from '../utils/catalog';
import toast from 'react-hot-toast';
import './CartPage.css';

const CartPage = () => {
  const navigate = useNavigate();
  const { items, fetchCart, updateItem, removeItem, clearCart } = useCartStore();
  const { products, fetchProducts } = useProductStore();
  const { user, isAuthenticated, getSavedAddresses, saveAddress, openAuthModal } = useAuthStore();
  const { placeOrder } = useOrderStore();

  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);

  // Modal Checkout State
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState('new');

  const handleStartCheckout = () => {
    if (!user) {
      if (window.confirm('กรุณาเข้าสู่ระบบก่อนทำการสั่งซื้อสินค้า\n\nต้องการเข้าสู่ระบบตอนนี้หรือไม่?')) {
        openAuthModal();
      }
      return;
    }
    setShowCheckoutModal(true);
  };

  const handleCloseCheckoutModal = () => {
    setShippingAddress({ name: '', phone: '', addressDetail: '' });
    setShowCheckoutModal(false);
  };

  // Thai Address States
  const provinces = getProvinces();
  const [selectedProvince, setSelectedProvince] = useState(provinces[0] || 'เชียงใหม่');
  const [selectedDistrict, setSelectedDistrict] = useState('เมืองเชียงใหม่');
  const [selectedSubdistrict, setSelectedSubdistrict] = useState('สุเทพ');
  const [postalCode, setPostalCode] = useState('50200');

  const [shippingAddress, setShippingAddress] = useState({
    name: '',
    phone: '',
    addressDetail: '',
  });

  useEffect(() => {
    fetchCart();
    if (!products || products.length === 0) {
      fetchProducts();
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const addresses = getSavedAddresses();
      setSavedAddresses(addresses);
      if (addresses.length > 0) {
        handleSelectSavedAddress(addresses[0]);
      } else {
        setShippingAddress({
          name: user?.full_name || '',
          phone: user?.phone_number || '',
          addressDetail: '',
        });
      }
    }
  }, [isAuthenticated, user]);

  const handleSelectSavedAddress = (addr) => {
    if (addr === 'new') {
      setSelectedSavedAddressId('new');
      setShippingAddress({ name: user?.full_name || '', phone: user?.phone_number || '', addressDetail: '' });
      setSelectedProvince(provinces[0]);
      setPostalCode('');
    } else {
      setSelectedSavedAddressId(addr.id);
      setShippingAddress({ name: addr.name, phone: addr.phone, addressDetail: addr.addressDetail });
      setSelectedProvince(addr.province);
      setSelectedDistrict(addr.district);
      setSelectedSubdistrict(addr.subdistrict);
      setPostalCode(addr.zipcode);
    }
  };

  // Update Districts when Province changes
  const handleProvinceChange = (prov) => {
    setSelectedProvince(prov);
    const dists = getDistricts(prov);
    const firstDist = dists[0] || '';
    setSelectedDistrict(firstDist);

    const subs = getSubdistricts(prov, firstDist);
    const firstSub = subs[0] || { name: '', zip: '' };
    setSelectedSubdistrict(firstSub.name || '');
    setPostalCode(firstSub.zip || '');
  };

  // Update Subdistricts when District changes
  const handleDistrictChange = (dist) => {
    setSelectedDistrict(dist);
    const subs = getSubdistricts(selectedProvince, dist);
    const firstSub = subs[0] || { name: '', zip: '' };
    setSelectedSubdistrict(firstSub.name || '');
    setPostalCode(firstSub.zip || '');
  };

  // Update Zipcode when Subdistrict changes
  const handleSubdistrictChange = (subName) => {
    setSelectedSubdistrict(subName);
    const subs = getSubdistricts(selectedProvince, selectedDistrict);
    const foundSub = subs.find(s => s.name === subName);
    if (foundSub) {
      setPostalCode(foundSub.zip);
    }
  };

  // Helper to resolve product details strictly from database / store
  const getItemProduct = (item) => {
    const found = products.find(p => p.id === item.product_id);
    if (found) return found;
    if (item.product) return item.product;
    return {
      id: item.product_id,
      name: item.name || 'สินค้า OTOP ในระบบ',
      price: item.price || 0,
      hero_image: item.image_url,
    };
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => {
    const p = getItemProduct(item);
    return sum + (Number(p.price || 0) * item.quantity);
  }, 0);

  const shippingFee = subtotal > 1000 || subtotal === 0 ? 0 : 50;
  const grandTotal = Math.max(0, subtotal - discount + shippingFee);

  const handleApplyCoupon = () => {
    if (couponCode.toUpperCase() === 'OTOP10') {
      const disc = Math.round(subtotal * 0.1);
      setDiscount(disc);
      alert('ใช้งานโค้ดส่วนลด OTOP10 (ลด 10%) เรียบร้อย');
    } else {
      alert('โค้ดส่วนลดไม่ถูกต้อง (ลองใช้โค้ด: OTOP10)');
    }
  };

  const handleCreateOrderSubmit = async (e) => {
    e.preventDefault();
    if (!shippingAddress.name || !shippingAddress.phone || !shippingAddress.addressDetail) {
      alert('กรุณากรอกข้อมูลชื่อ เบอร์โทร และรายละเอียดที่อยู่ให้ครบถ้วน');
      return;
    }

    // BR-03: Revalidate stock before submitting order
    for (const item of items) {
      const prod = getItemProduct(item);
      const stock = prod?.stock !== undefined ? Number(prod.stock) : 0;
      if (stock <= 0) {
        alert(`สินค้า "${prod?.name || 'สินค้า OTOP'}" หมดแล้ว กรุณาลบออกจากตะกร้า`);
        return;
      }
      if (item.quantity > stock) {
        alert(`สินค้า "${prod?.name}" เหลือเพียง ${stock} ชิ้น กรุณาลดจำนวน`);
        return;
      }
    }

    setSubmittingOrder(true);

    const fullAddress = `${shippingAddress.name} (${shippingAddress.phone}) ${shippingAddress.addressDetail} ต.${selectedSubdistrict} อ.${selectedDistrict} จ.${selectedProvince} ${postalCode}`;

    try {
      const orderPayload = {
        shipping_address: fullAddress,
        shipping_cost: shippingFee,
        payment_method: 'promptpay',
        coupon_code: discount > 0 ? couponCode : null,
        items: items.map(i => ({
          product_id: i.product_id,
          quantity: i.quantity,
        })),
      };

      const createdOrder = await useOrderStore.getState().placeOrder(orderPayload);

      saveAddress({
        name: shippingAddress.name,
        phone: shippingAddress.phone,
        addressDetail: shippingAddress.addressDetail,
        province: selectedProvince,
        district: selectedDistrict,
        subdistrict: selectedSubdistrict,
        zipcode: postalCode
      });

      setSubmittingOrder(false);
      handleCloseCheckoutModal();
      await clearCart();

      if (createdOrder?.order_status === ORDER_STATUS.PREPARING) {
        toast.success(`สั่งซื้อสำเร็จ #${createdOrder.id} สามารถเปิดใบกำกับสินค้าได้ทันที`);
        navigate(`/orders/${createdOrder.id}/invoice`);
        return;
      }

      toast.success(`สั่งซื้อสำเร็จ #${createdOrder.id} กรุณาชำระเงิน`);
      navigate(`/payment?orderId=${createdOrder.id}&amount=${createdOrder.grand_total}`);
    } catch (err) {
      setSubmittingOrder(false);
      toast.error(apiErrorMessage(err, 'เกิดข้อผิดพลาดในการทำรายการ'));
    }
  };

  if (items.length === 0) {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="cart-empty">
            <div className="cart-empty-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
            </div>
            <h3>ตะกร้าสินค้าของคุณยังว่างอยู่</h3>
            <p>เลือกชมสินค้า OTOP และสนับสนุนภูมิปัญญาท้องถิ่นไทย</p>
            <Link to="/products">
              <button className="cart-checkout-btn" style={{ maxWidth: '240px', margin: '0 auto' }}>
                ไปที่หน้ารายการสินค้า ➔
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        <div className="cart-header">
          <h1 className="cart-title">ตะกร้าสินค้า OTOP</h1>
          <p className="cart-subtitle">ตรวจสอบรายการสินค้าและดำเนินการสั่งซื้อ ({items.length} รายการ)</p>
        </div>

        <div className="cart-layout">
          {/* Left: Cart Items Table */}
          <div className="cart-items-card">
            <div className="cart-table-header">
              <span>รายการสินค้า</span>
              <span>ราคา</span>
              <span>จำนวน</span>
              <span>รวม</span>
              <span></span>
            </div>

            {items.map((item) => {
              const prod = getItemProduct(item);
              const itemTotal = Number(prod.price || 0) * item.quantity;
              const maxStock = prod.stock !== undefined ? Number(prod.stock) : 99;

              return (
                <div key={item.id} className="cart-item-row">
                  <div className="cart-item-product">
                    <div className="cart-item-img">
                      <img src={getProductImage(prod)} alt={prod.name} />
                    </div>
                    <div>
                      <div className="cart-item-name">{prod.name}</div>
                      <div className="cart-item-seller">
                        ผู้ขาย: ID {prod.seller_id || 1} | <span style={{ color: maxStock > 0 ? 'var(--eco)' : '#ef4444' }}>{maxStock > 0 ? `สต็อก: ${maxStock} ชิ้น` : 'สินค้าหมด'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="cart-item-price">
                    {Number(prod.price || 0).toLocaleString()} ฿
                  </div>

                  <div>
                    <div className="cart-qty-control">
                      <button
                        className="cart-qty-btn"
                        onClick={() => updateItem(item.id, item.quantity - 1)}
                      >
                        -
                      </button>
                      <input
                        type="text"
                        className="cart-qty-val"
                        value={item.quantity}
                        readOnly
                      />
                      <button
                        className="cart-qty-btn"
                        disabled={item.quantity >= maxStock}
                        onClick={() => updateItem(item.id, item.quantity + 1)}
                        title={item.quantity >= maxStock ? `คงเหลือเพียง ${maxStock} ชิ้น` : 'เพิ่มจำนวน'}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="cart-item-total">
                    {itemTotal.toLocaleString()} ฿
                  </div>

                  <div>
                    <button
                      className="cart-remove-btn"
                      onClick={() => removeItem(item.id)}
                      title="ลบรายการ"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Summary Box */}
          <div className="cart-summary-card">
            <h3 className="cart-summary-title">สรุปยอดสั่งซื้อ</h3>

            <div className="cart-summary-row">
              <span>ยอดรวมสินค้า</span>
              <span>{subtotal.toLocaleString()} บาท</span>
            </div>

            <div className="cart-summary-row">
              <span>ค่าจัดส่ง {subtotal > 1000 && <strong style={{ color: 'var(--eco)' }}>(ส่งฟรี!)</strong>}</span>
              <span>{shippingFee === 0 ? 'ฟรี' : `${shippingFee} บาท`}</span>
            </div>

            {discount > 0 && (
              <div className="cart-summary-row" style={{ color: 'var(--eco)' }}>
                <span>ส่วนลด (OTOP10)</span>
                <span>-{discount.toLocaleString()} บาท</span>
              </div>
            )}

            <div className="cart-coupon-box">
              <input
                type="text"
                className="cart-coupon-input"
                placeholder="กรอกโค้ดส่วนลด (ลอง: OTOP10)"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
              />
              <button
                className="cart-coupon-btn"
                onClick={handleApplyCoupon}
              >
                ใช้โค้ด
              </button>
            </div>

            <div className="cart-summary-row total">
              <span>ยอดชำระสุทธิ</span>
              <span>{grandTotal.toLocaleString()} บาท</span>
            </div>

            <button
              className="cart-checkout-btn"
              onClick={handleStartCheckout}
            >
              ดำเนินการสั่งซื้อ ➔
            </button>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div className="checkout-modal-backdrop" onClick={handleCloseCheckoutModal}>
          <div className="checkout-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="checkout-modal-title">📦 ข้อมูลการจัดส่ง</h2>
            <form onSubmit={handleCreateOrderSubmit}>
              
              {savedAddresses.length > 0 && (
                <div className="checkout-form-group">
                  <label>เลือกที่อยู่สำหรับจัดส่ง:</label>
                  <select 
                    value={selectedSavedAddressId} 
                    onChange={(e) => {
                      if (e.target.value === 'new') {
                        handleSelectSavedAddress('new');
                      } else {
                        const addr = savedAddresses.find(a => String(a.id) === e.target.value);
                        if (addr) handleSelectSavedAddress(addr);
                      }
                    }}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '1rem', background: 'var(--bg-subtle)' }}
                  >
                    {savedAddresses.map(addr => (
                      <option key={addr.id} value={addr.id}>
                        {addr.name} ({addr.phone}) - {addr.province}
                      </option>
                    ))}
                    <option value="new">+ เพิ่มที่อยู่จัดส่งใหม่</option>
                  </select>
                </div>
              )}

              <div className="checkout-form-group">
                <label>ชื่อ-นามสกุล ผู้รับ:</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น สมชาย ใจดี"
                  value={shippingAddress.name}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, name: e.target.value })}
                />
              </div>

              <div className="checkout-form-group">
                <label>เบอร์โทรศัพท์:</label>
                <input
                  type="tel"
                  required
                  placeholder="081-234-5678"
                  value={shippingAddress.phone}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                />
              </div>

              <div className="checkout-form-group">
                <label>บ้านเลขที่ / ซอย / ถนน / จุดสังเกต:</label>
                <textarea
                  rows="2"
                  required
                  placeholder="เช่น 123/45 หมู่ 5 ถนนสุเทพ ซอย 3..."
                  value={shippingAddress.addressDetail}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, addressDetail: e.target.value })}
                ></textarea>
              </div>

              {/* Dynamic Thai Address Selectors */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div className="checkout-form-group">
                  <label>จังหวัด (Province):</label>
                  <select
                    value={selectedProvince}
                    onChange={(e) => handleProvinceChange(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem 0.9rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}
                  >
                    {provinces.map((prov, idx) => (
                      <option key={idx} value={prov}>{prov}</option>
                    ))}
                  </select>
                </div>

                <div className="checkout-form-group">
                  <label>อำเภอ / เขต (District):</label>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem 0.9rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}
                  >
                    {getDistricts(selectedProvince).map((dist, idx) => (
                      <option key={idx} value={dist}>{dist}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div className="checkout-form-group">
                  <label>ตำบล / แขวง (Subdistrict):</label>
                  <select
                    value={selectedSubdistrict}
                    onChange={(e) => handleSubdistrictChange(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem 0.9rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}
                  >
                    {getSubdistricts(selectedProvince, selectedDistrict).map((sub, idx) => (
                      <option key={idx} value={sub.name}>{sub.name}</option>
                    ))}
                  </select>
                </div>

                <div className="checkout-form-group">
                  <label>รหัสไปรษณีย์ (Zipcode):</label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="50200"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="cart-coupon-btn"
                  style={{ flex: 1, padding: '0.85rem' }}
                  onClick={handleCloseCheckoutModal}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="cart-checkout-btn"
                  style={{ flex: 2, margin: 0 }}
                  disabled={submittingOrder}
                >
                  {submittingOrder ? 'กำลังบันทึก...' : `ยืนยันข้อมูลจัดส่ง (${grandTotal.toLocaleString()} ฿)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
