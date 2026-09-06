import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useOrderStore } from '../store/orderStore';
import { createPayment } from '../services/paymentService';
import { apiErrorMessage } from '../utils/catalog';
import toast from 'react-hot-toast';
import './PaymentPage.css';

const PaymentPage = () => {
  const [searchParams] = useSearchParams();
  const { orders, fetchOrders } = useOrderStore();

  const urlOrderId = searchParams.get('orderId') || '';
  const urlAmount = searchParams.get('amount') || '0';
  const urlMethod = searchParams.get('method') || 'promptpay';

  const [selectedOrderId, setSelectedOrderId] = useState(urlOrderId);
  const [amount, setAmount] = useState(urlAmount);
  const [paymentMethod, setPaymentMethod] = useState(urlMethod === 'bank' ? 'bank' : urlMethod === 'cod' ? 'cod' : 'promptpay');
  const [slipFile, setSlipFile] = useState(null);
  const [slipPreview, setSlipPreview] = useState(null);
  const [transferDate, setTransferDate] = useState(new Date().toISOString().slice(0, 16));
  const [submitting, setSubmitting] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  // Find the matching order to display info
  const currentOrder = orders.find(o => String(o.id) === String(selectedOrderId));

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('ไฟล์ใหญ่เกินไป (สูงสุด 5MB)');
        return;
      }
      setSlipFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSlipPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`คัดลอก ${label} แล้ว: ${text}`);
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();

    // Validate: slip required for non-COD
    if (!slipFile && paymentMethod !== 'cod') {
      toast.error('กรุณาแนบสลิปการโอนเงิน');
      return;
    }

    // Validate: must have order ID
    if (!selectedOrderId) {
      toast.error('กรุณาระบุหมายเลขคำสั่งซื้อ');
      return;
    }

    // Validate: must have amount
    if (!amount || Number(amount) <= 0) {
      toast.error('กรุณาระบุจำนวนเงินที่ชำระ');
      return;
    }

    setSubmitting(true);

    try {
      await createPayment(
        Number(selectedOrderId),
        Number(amount),
        paymentMethod === 'cod' ? null : slipFile,
        paymentMethod
      );
      await fetchOrders();
      setSubmitting(false);
      setPaymentSuccess(true);
      toast.success('แจ้งชำระเงินเรียบร้อยแล้ว');
    } catch (err) {
      console.error('Payment submission error:', err);
      setSubmitting(false);
      toast.error(apiErrorMessage(err, 'เกิดข้อผิดพลาดในการส่งข้อมูลชำระเงิน'));
    }
  };

  if (paymentSuccess) {
    return (
      <div className="payment-page">
        <div className="container">
          <div className="payment-card" style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
            <h2 className="payment-title" style={{ fontSize: '1.8rem' }}>แจ้งชำระเงินสำเร็จแล้ว!</h2>
            <p className="payment-subtitle" style={{ marginBottom: '1.5rem' }}>
              {paymentMethod === 'cod'
                ? <>คำสั่งซื้อ <strong>#{selectedOrderId}</strong> จะชำระเงินปลายทางเมื่อสินค้าถึงมือท่าน</>
                : <>เจ้าหน้าที่จะทำการตรวจสอบสลิปการโอนเงินของคำสั่งซื้อ <strong>#{selectedOrderId}</strong> ภายใน 1-2 ชั่วโมง</>
              }
            </p>
            <div style={{ background: 'var(--eco-light)', color: 'var(--eco)', padding: '1rem', borderRadius: 'var(--radius-md)', fontWeight: 600, marginBottom: '2rem' }}>
              ✓ สถานะ: {paymentMethod === 'cod' ? 'รอจัดส่ง (COD)' : 'รอตรวจสอบหลักฐานชำระเงิน'} ({Number(amount).toLocaleString()} บาท)
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to={`/orders/${selectedOrderId}/invoice`}>
                <button className="payment-submit-btn" style={{ margin: 0 }}>
                  เปิดใบกำกับสินค้า
                </button>
              </Link>
              <Link to="/orders">
                <button className="payment-submit-btn" style={{ margin: 0 }}>
                  ดูสถานะคำสั่งซื้อทั้งหมด ➔
                </button>
              </Link>
              <Link to="/">
                <button className="payment-submit-btn" style={{ margin: 0, background: 'var(--bg-subtle)', color: 'var(--text-main)' }}>
                  กลับหน้าหลัก
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No order ID provided - show a friendly notice
  if (!urlOrderId) {
    return (
      <div className="payment-page">
        <div className="container">
          <div className="payment-card" style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📋</div>
            <h2 className="payment-title" style={{ fontSize: '1.5rem' }}>ไม่พบข้อมูลคำสั่งซื้อ</h2>
            <p className="payment-subtitle" style={{ marginBottom: '1.5rem' }}>
              กรุณาสร้างคำสั่งซื้อจากตะกร้าสินค้าก่อน หรือเลือกคำสั่งซื้อจากรายการคำสั่งซื้อของคุณ
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/orders">
                <button className="payment-submit-btn" style={{ margin: 0 }}>
                  ดูคำสั่งซื้อของฉัน ➔
                </button>
              </Link>
              <Link to="/cart">
                <button className="payment-submit-btn" style={{ margin: 0, background: 'var(--bg-subtle)', color: 'var(--text-main)' }}>
                  ไปที่ตะกร้า
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <div className="container">
        <div className="payment-header">
          <h1 className="payment-title">แจ้งชำระเงิน & แนบสลิป (Payment)</h1>
          <p className="payment-subtitle">เลือกรอบคำสั่งซื้อและวิธีชำระเงินที่ต้องการ พร้อมแนบหลักฐานการโอนเงิน</p>
        </div>

        {/* Order Summary */}
        {currentOrder && (
          <div className="payment-card" style={{ marginBottom: '1.5rem' }}>
            <h3 className="payment-card-title">📦 รายละเอียดคำสั่งซื้อ #{currentOrder.id}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '0.5rem' }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>สถานะ</div>
                <div style={{ fontWeight: 600 }}>{currentOrder.order_status}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>ยอดรวม</div>
                <div style={{ fontWeight: 600, color: 'var(--primary)' }}>{Number(currentOrder.grand_total || currentOrder.total_amount || 0).toLocaleString()} บาท</div>
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>สินค้า</div>
                <div style={{ fontWeight: 600 }}>{(currentOrder.items || []).length} รายการ</div>
              </div>
            </div>
            {(currentOrder.items || []).length > 0 && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                {currentOrder.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '0.25rem 0' }}>
                    <span>{item.name || `สินค้า #${item.product_id}`} x{item.quantity}</span>
                    <span style={{ fontWeight: 600 }}>{Number(item.price || item.subtotal || item.unit_price || 0).toLocaleString()} ฿</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="payment-grid">
          {/* Left: Payment Method & QR/Bank Info */}
          <div className="payment-card">
            <h3 className="payment-card-title">
              💳 1. เลือกช่องทางการชำระเงิน
            </h3>

            {/* Tabs */}
            <div className="payment-methods-tab">
              <button
                className={`payment-tab-btn ${paymentMethod === 'promptpay' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('promptpay')}
              >
                📱 PromptPay QR
              </button>
              <button
                className={`payment-tab-btn ${paymentMethod === 'bank' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('bank')}
              >
                🏦 โอนเงินธนาคาร
              </button>
              <button
                className={`payment-tab-btn ${paymentMethod === 'cod' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('cod')}
              >
                💵 เก็บเงินปลายทาง
              </button>
            </div>

            {/* PromptPay Box */}
            {paymentMethod === 'promptpay' && (
              <div className="qr-box">
                <p style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  สแกน QR Code ด้วยแอปธนาคารใดก็ได้
                </p>
                <div className="qr-image-wrapper">
                  {/* Standard PromptPay QR Representation */}
                  <svg viewBox="0 0 200 200" width="160" height="160">
                    <rect width="200" height="200" fill="#ffffff" />
                    <path d="M10 10 h60 v60 h-60 z M25 25 h30 v30 h-30 z" fill="#000000" />
                    <path d="M130 10 h60 v60 h-60 z M145 25 h30 v30 h-30 z" fill="#000000" />
                    <path d="M10 130 h60 v60 h-60 z M25 145 h30 v30 h-30 z" fill="#000000" />
                    <rect x="85" y="15" width="30" height="15" fill="#000000" />
                    <rect x="95" y="45" width="20" height="30" fill="#000000" />
                    <rect x="15" y="85" width="40" height="20" fill="#000000" />
                    <rect x="80" y="80" width="40" height="40" fill="#b85434" />
                    <text x="100" y="105" fontSize="14" fill="#ffffff" textAnchor="middle" fontWeight="bold">OTOP</text>
                    <rect x="140" y="90" width="45" height="15" fill="#000000" />
                    <rect x="90" y="135" width="20" height="40" fill="#000000" />
                    <rect x="135" y="140" width="50" height="50" fill="#000000" />
                  </svg>
                </div>
                <div>พร้อมเพย์: <strong>081-234-5678</strong> (บจก. OTOP Connect)</div>
                <div className="qr-amount-badge">{Number(amount).toLocaleString()} บาท</div>
              </div>
            )}

            {/* Bank Accounts Box */}
            {paymentMethod === 'bank' && (
              <div className="bank-account-list">
                <div className="bank-account-card">
                  <div className="bank-logo kbank">KBANK</div>
                  <div className="bank-info">
                    <div className="bank-name">ธนาคารกสิกรไทย (KBank)</div>
                    <div className="bank-number">123-4-56789-0</div>
                    <div className="bank-owner">ชื่อบัญชี: บจก. โอทอป คอนเนค ชุมชนไทย</div>
                  </div>
                  <button
                    className="copy-btn"
                    onClick={() => handleCopy('123-4-56789-0', 'เลขบัญชีกสิกรไทย')}
                  >
                    คัดลอก
                  </button>
                </div>

                <div className="bank-account-card">
                  <div className="bank-logo scb">SCB</div>
                  <div className="bank-info">
                    <div className="bank-name">ธนาคารไทยพาณิชย์ (SCB)</div>
                    <div className="bank-number">987-6-54321-0</div>
                    <div className="bank-owner">ชื่อบัญชี: บจก. โอทอป คอนเนค ชุมชนไทย</div>
                  </div>
                  <button
                    className="copy-btn"
                    onClick={() => handleCopy('987-6-54321-0', 'เลขบัญชีไทยพาณิชย์')}
                  >
                    คัดลอก
                  </button>
                </div>
              </div>
            )}

            {/* COD Box */}
            {paymentMethod === 'cod' && (
              <div style={{ background: 'var(--bg-subtle)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                <p style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  💵 ชำระเงินปลายทางกับเจ้าหน้าที่จัดส่งสินค้า (COD)
                </p>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  ท่านจะชำระเงินสดจำนวน <strong>{Number(amount).toLocaleString()} บาท</strong> เมื่อเจ้าหน้าที่ขนส่งนำสินค้าไปส่งถึงบ้าน
                </p>
              </div>
            )}
          </div>

          {/* Right: Upload Slip Form */}
          <div className="payment-card">
            <h3 className="payment-card-title">
              📄 2. กรอกข้อมูล & แนบหลักฐานสลิป
            </h3>

            <form onSubmit={handleSubmitPayment} noValidate>
              <div className="checkout-form-group">
                <label>อ้างอิงหมายเลขคำสั่งซื้อ (Order ID):</label>
                <input
                  type="text"
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  placeholder="เช่น ORD-2026-001"
                  readOnly={!!urlOrderId}
                  style={urlOrderId ? { background: 'var(--bg-subtle)', cursor: 'not-allowed' } : {}}
                />
              </div>

              <div className="checkout-form-group">
                <label>จำนวนเงินที่โอนชำระ (บาท):</label>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="เช่น 1250"
                />
              </div>

              {paymentMethod !== 'cod' && (
                <div className="checkout-form-group">
                  <label>วัน-เวลาที่โอนชำระเงิน:</label>
                  <input
                    type="datetime-local"
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                  />
                </div>
              )}

              {paymentMethod !== 'cod' && (
                <div className="checkout-form-group">
                  <label>แนบรูปภาพสลิปโอนเงิน (Slip Upload):</label>
                  
                  {slipPreview ? (
                    <div className="slip-preview-box">
                      <img src={slipPreview} alt="Slip Preview" />
                      <button
                        type="button"
                        className="slip-remove-btn"
                        onClick={() => { setSlipFile(null); setSlipPreview(null); }}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <label className="slip-upload-zone">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                      />
                      <div className="slip-upload-icon">📸</div>
                      <p style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: '0.25rem' }}>
                        คลิกเพื่อเลือกไฟล์สลิปการโอนเงิน
                      </p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        รองรับไฟล์ JPG, PNG, WEBP (ไม่เกิน 5MB)
                      </p>
                    </label>
                  )}
                </div>
              )}

              <button
                type="submit"
                className="payment-submit-btn"
                disabled={submitting}
              >
                {submitting ? 'กำลังส่งข้อมูล...' : `ยืนยันการแจ้งชำระเงิน (${Number(amount || 0).toLocaleString()} ฿)`}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
