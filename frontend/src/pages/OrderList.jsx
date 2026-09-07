import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useOrderStore } from '../store/orderStore';
import { useCartStore } from '../store/cartStore';
import { downloadOrderInvoiceHtml, openOrderInvoiceHtml } from '../services/orderService';
import { getProductImage, normalizeOrderStatus, ORDER_STATUS, ORDER_STATUS_LABELS, apiErrorMessage } from '../utils/catalog';
import toast from 'react-hot-toast';
import './OrderList.css';

const OrderList = () => {
  const navigate = useNavigate();
  const { orders, loading, error, fetchOrders } = useOrderStore();
  const { addItem } = useCartStore();
  const [activeTab, setActiveTab] = useState('ALL');
  const [selectedAddress, setSelectedAddress] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(o => {
    const status = normalizeOrderStatus(o.order_status);
    if (activeTab === 'ALL') return true;
    if (activeTab === 'PENDING') return status === ORDER_STATUS.PENDING_PAYMENT;
    if (activeTab === 'PROCESSING') return status === ORDER_STATUS.PAYMENT_VERIFICATION || status === ORDER_STATUS.PREPARING;
    if (activeTab === 'SHIPPED') return status === ORDER_STATUS.SHIPPED;
    if (activeTab === 'COMPLETED') return status === ORDER_STATUS.COMPLETED;
    if (activeTab === 'CANCELLED') return status === ORDER_STATUS.CANCELLED;
    return false;
  });

  const getStatusBadge = (status) => {
    const normalized = normalizeOrderStatus(status);
    const label = ORDER_STATUS_LABELS[normalized] || normalized;
    if (normalized === ORDER_STATUS.PENDING_PAYMENT) {
      return <span className="order-status-badge pending">รอการชำระเงิน</span>;
    }
    if (normalized === ORDER_STATUS.PAYMENT_VERIFICATION) {
      return <span className="order-status-badge processing">รอตรวจสอบสลิป</span>;
    }
    if (normalized === ORDER_STATUS.PREPARING) {
      return <span className="order-status-badge processing">กำลังเตรียมจัดส่ง</span>;
    }
    if (normalized === ORDER_STATUS.SHIPPED) {
      return <span className="order-status-badge shipped">อยู่ระหว่างจัดส่ง</span>;
    }
    if (normalized === ORDER_STATUS.COMPLETED) {
      return <span className="order-status-badge completed">สำเร็จแล้ว</span>;
    }
    if (normalized === ORDER_STATUS.CANCELLED) {
      return <span className="order-status-badge" style={{ background: '#fef2f2', color: '#dc2626' }}>ยกเลิกแล้ว</span>;
    }
    return <span className="order-status-badge processing">{label}</span>;
  };

  const countByStatus = (statuses) => orders.filter(o => statuses.includes(normalizeOrderStatus(o.order_status))).length;

  const handleReorder = (items) => {
    if (!items || items.length === 0) return;
    items.forEach(item => {
      addItem({
        product_id: item.product_id || item.id,
        quantity: item.quantity || 1,
        product: {
          id: item.product_id || item.id,
          name: item.name,
          price: Number(item.price || item.unit_price || 0),
          image_url: item.image_url,
        }
      });
    });
    navigate('/cart');
  };

  return (
    <div className="order-list-page">
      <div className="container">
        <div className="order-header">
          <h1 className="order-title">คำสั่งซื้อของฉัน</h1>
          <p className="order-subtitle">ติดตามสถานะและประวัติการสั่งซื้อสินค้า OTOP ทั้งหมดของคุณ</p>
        </div>

        {/* Filter Tabs */}
        <div className="order-tabs">
          <button
            className={`order-tab ${activeTab === 'ALL' ? 'active' : ''}`}
            onClick={() => setActiveTab('ALL')}
          >
            ทั้งหมด ({orders.length})
          </button>
          <button
            className={`order-tab ${activeTab === 'PENDING' ? 'active' : ''}`}
            onClick={() => setActiveTab('PENDING')}
          >
            รอชำระเงิน ({countByStatus([ORDER_STATUS.PENDING_PAYMENT])})
          </button>
          <button
            className={`order-tab ${activeTab === 'PROCESSING' ? 'active' : ''}`}
            onClick={() => setActiveTab('PROCESSING')}
          >
            กำลังเตรียมจัดส่ง ({countByStatus([ORDER_STATUS.PAYMENT_VERIFICATION, ORDER_STATUS.PREPARING])})
          </button>
          <button
            className={`order-tab ${activeTab === 'SHIPPED' ? 'active' : ''}`}
            onClick={() => setActiveTab('SHIPPED')}
          >
            อยู่ระหว่างจัดส่ง ({countByStatus([ORDER_STATUS.SHIPPED])})
          </button>
          <button
            className={`order-tab ${activeTab === 'COMPLETED' ? 'active' : ''}`}
            onClick={() => setActiveTab('COMPLETED')}
          >
            สั่งซื้อสำเร็จ ({countByStatus([ORDER_STATUS.COMPLETED])})
          </button>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            กำลังโหลดข้อมูลคำสั่งซื้อ...
          </div>
        )}

        {error && orders.length === 0 && (
          <div style={{ color: '#dc2626', padding: '1.5rem', textAlign: 'center' }}>
            ข้อผิดพลาด: {error}
          </div>
        )}

        {!loading && (
          <div>
            {filteredOrders.map((order) => (
              <div key={order.id} className="order-card">
                <div className="order-card-header">
                  <div>
                    <span className="order-number">หมายเลขคำสั่งซื้อ #{order.id}</span>
                    <div className="order-date">
                      สั่งซื้อเมื่อ: {new Date(order.created_at || Date.now()).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {order.tracking_number && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--terracotta)', fontWeight: 600, marginTop: '0.25rem' }}>
                        🚚 เลขพัสดุจัดส่ง: <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{order.tracking_number}</code>
                      </div>
                    )}
                  </div>
                  <div>{getStatusBadge(order.order_status)}</div>
                </div>

                {/* Items */}
                <div className="order-items-list">
                  {(order.items && order.items.length > 0) ? order.items.map((item, idx) => (
                    <div key={idx} className="order-item-row">
                      <div className="order-item-img">
                        <img src={getProductImage({ hero_image: item.image_url, image_url: item.image_url })} alt={item.name} />
                      </div>
                      <div className="order-item-info">
                        <div className="order-item-title">{item.name || `สินค้า #${item.product_id}`}</div>
                        <div className="order-item-qty">จำนวน {item.quantity} ชิ้น</div>
                      </div>
                      <div className="order-item-price">
                        {(Number(item.price || item.unit_price || 0) * item.quantity).toLocaleString()} บาท
                      </div>
                    </div>
                  )) : (
                    <div style={{ padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      ไม่มีรายละเอียดสินค้า
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="order-card-footer">
                  <div className="order-total-price">
                    ยอดรวมสุทธิ: <strong>{(order.grand_total || order.total_price || order.total_amount || 0).toLocaleString()} บาท</strong>
                    {order.payment_method && (
                      <span style={{ fontSize: '0.85rem', marginLeft: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                        ({order.payment_method})
                      </span>
                    )}
                  </div>

                  <div className="order-actions">
                    <button
                      className="order-btn-secondary"
                      onClick={() => setSelectedAddress(order.shipping_address || 'ไม่มีข้อมูลที่อยู่')}
                    >
                      📍 ดูที่อยู่จัดส่ง
                    </button>

                    {normalizeOrderStatus(order.order_status) === ORDER_STATUS.PENDING_PAYMENT && (
                      <Link to={`/payment?orderId=${order.id}&amount=${order.grand_total || order.total_price || 0}&method=${order.payment_method || 'promptpay'}`}>
                        <button className="order-btn-primary">
                          แจ้งชำระเงิน
                        </button>
                      </Link>
                    )}

                    {normalizeOrderStatus(order.order_status) === ORDER_STATUS.PENDING_PAYMENT && (
                      <button
                        className="order-btn-secondary"
                        onClick={async () => {
                          if (!window.confirm('ยืนยันยกเลิกคำสั่งซื้อนี้? สินค้าจะถูกคืนเข้าสต็อก')) return;
                          try {
                            await useOrderStore.getState().updateOrderStatus(order.id, ORDER_STATUS.CANCELLED);
                            toast.success('ยกเลิกคำสั่งซื้อแล้ว');
                          } catch (err) {
                            toast.error(apiErrorMessage(err));
                          }
                        }}
                      >
                        ยกเลิกคำสั่งซื้อ
                      </button>
                    )}

                    <Link to={`/orders/${order.id}/invoice`}>
                      <button className="order-btn-secondary">ใบกำกับสินค้า</button>
                    </Link>
                    <button
                      className="order-btn-secondary"
                      onClick={async () => {
                        try {
                          await openOrderInvoiceHtml(order.id);
                        } catch (err) {
                          toast.error(apiErrorMessage(err, 'เปิดใบกำกับสินค้าไม่สำเร็จ'));
                        }
                      }}
                    >
                      เปิดเอกสาร
                    </button>
                    <button
                      className="order-btn-secondary"
                      onClick={async () => {
                        try {
                          await downloadOrderInvoiceHtml(order.id, `${order.invoice_number || `OTOP-${order.id}`}.html`);
                          toast.success('ดาวน์โหลดใบกำกับสินค้าแล้ว');
                        } catch (err) {
                          toast.error(apiErrorMessage(err, 'ดาวน์โหลดไม่สำเร็จ'));
                        }
                      }}
                    >
                      ดาวน์โหลด
                    </button>

                    {normalizeOrderStatus(order.order_status) === ORDER_STATUS.SHIPPED && (
                      <button 
                        className="order-btn-primary"
                        style={{ background: 'var(--eco)' }}
                        onClick={async () => {
                          if(window.confirm('ยืนยันว่าคุณได้รับสินค้าครบถ้วนและถูกต้องแล้ว?')) {
                            try {
                              await useOrderStore.getState().updateOrderStatus(order.id, ORDER_STATUS.COMPLETED);
                            } catch (err) {
                              alert(apiErrorMessage(err));
                            }
                          }
                        }}
                      >
                        ฉันได้รับสินค้าแล้ว
                      </button>
                    )}

                    <button
                      className="order-btn-secondary"
                      onClick={() => handleReorder(order.items || [])}
                      disabled={!order.items || order.items.length === 0}
                    >
                      🔄 สั่งซื้ออีกครั้ง
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredOrders.length === 0 && (
              <div className="order-empty">
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                <h3>{activeTab === 'ALL' ? 'ยังไม่มีคำสั่งซื้อ' : 'ไม่พบคำสั่งซื้อในหมวดหมู่นี้'}</h3>
                <p>{activeTab === 'ALL' ? 'เริ่มต้นเลือกซื้อสินค้า OTOP คุณภาพจากชุมชนไทย' : 'คุณยังไม่มีประวัติคำสั่งซื้อตามตัวกรองที่เลือก'}</p>
                <Link to="/products" style={{ textDecoration: 'none' }}>
                  <button className="order-btn-primary" style={{ marginTop: '1rem' }}>
                    เลือกซื้อสินค้า OTOP
                  </button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedAddress && (
        <div className="shipping-address-modal-overlay" onClick={() => setSelectedAddress(null)}>
          <div className="shipping-address-modal" onClick={e => e.stopPropagation()}>
            <h3>📍 ที่อยู่จัดส่ง</h3>
            <p>{selectedAddress}</p>
            <button className="order-btn-primary" onClick={() => setSelectedAddress(null)}>
              ปิด
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderList;
