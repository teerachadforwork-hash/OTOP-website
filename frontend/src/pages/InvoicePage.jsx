import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getOrderInvoice, downloadOrderInvoiceHtml, openOrderInvoiceHtml } from '../services/orderService';
import { apiErrorMessage, getProductImage, ORDER_STATUS_LABELS, normalizeOrderStatus } from '../utils/catalog';
import './InvoicePage.css';

const InvoicePage = () => {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getOrderInvoice(id);
        setInvoice(data);
        setError('');
      } catch (err) {
        setError(apiErrorMessage(err, 'ไม่พบใบกำกับสินค้า'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleOpen = async () => {
    try {
      await openOrderInvoiceHtml(id);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'เปิดใบกำกับสินค้าไม่สำเร็จ'));
    }
  };

  const handleDownload = async () => {
    try {
      const filename = `${invoice?.invoice_number || `OTOP-${id}`}.html`;
      await downloadOrderInvoiceHtml(id, filename);
      toast.success('ดาวน์โหลดใบกำกับสินค้าแล้ว');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'ดาวน์โหลดไม่สำเร็จ'));
    }
  };

  if (loading) {
    return <div className="invoice-page"><div className="container">กำลังโหลดใบกำกับสินค้า...</div></div>;
  }
  if (error || !invoice) {
    return (
      <div className="invoice-page">
        <div className="container" style={{ textAlign: 'center', padding: '3rem' }}>
          <h2>ไม่สามารถเปิดใบกำกับสินค้าได้</h2>
          <p>{error}</p>
          <Link to="/orders">กลับไปคำสั่งซื้อ</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="invoice-page">
      <div className="container">
        <div className="invoice-toolbar">
          <Link to="/orders">← กลับไปคำสั่งซื้อ</Link>
          <div className="invoice-toolbar-actions">
            <button type="button" onClick={handleOpen}>เปิดเอกสาร</button>
            <button type="button" className="primary" onClick={handleDownload}>ดาวน์โหลด</button>
            <button type="button" onClick={() => window.print()}>พิมพ์ / บันทึก PDF</button>
          </div>
        </div>

        <article className="invoice-sheet">
          <header className="invoice-brand">
            <div>
              <h1>ใบกำกับสินค้า</h1>
              <p>OTOP Connect · เอกสารประกอบการสั่งซื้อ (ไม่ใช่ใบกำกับภาษี)</p>
            </div>
            <div className="invoice-meta">
              <strong>{invoice.invoice_number}</strong>
              <div>คำสั่งซื้อ #{invoice.id}</div>
              <div>{new Date(invoice.created_at).toLocaleString('th-TH')}</div>
              <div>สถานะ: {ORDER_STATUS_LABELS[normalizeOrderStatus(invoice.order_status)] || invoice.order_status}</div>
            </div>
          </header>

          <div className="invoice-grid">
            <section>
              <h3>ผู้ซื้อ / ที่อยู่จัดส่ง</h3>
              <p>{invoice.customer_name || '-'}</p>
              <p>{invoice.customer_email}</p>
              <p>{invoice.customer_phone}</p>
              <p>{invoice.shipping_address}</p>
            </section>
            <section>
              <h3>ผู้ขาย / แพลตฟอร์ม</h3>
              <p>OTOP Connect Marketplace</p>
              <p>ช่องทางชำระ: {invoice.payment_method || '-'}</p>
              {invoice.tracking_number && <p>เลขพัสดุ: {invoice.tracking_number}</p>}
            </section>
          </div>

          <table className="invoice-table">
            <thead>
              <tr>
                <th>#</th>
                <th>สินค้า</th>
                <th>จำนวน</th>
                <th>ราคา/หน่วย</th>
                <th>รวม</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.items || []).map((item, idx) => (
                <tr key={item.id || idx}>
                  <td>{idx + 1}</td>
                  <td>
                    <div className="invoice-item">
                      <img src={getProductImage({ hero_image: item.image_url, image_url: item.image_url })} alt="" />
                      <span>{item.name || `สินค้า #${item.product_id}`}</span>
                    </div>
                  </td>
                  <td>{item.quantity}</td>
                  <td>{Number(item.unit_price || 0).toLocaleString()} บาท</td>
                  <td>{Number(item.subtotal || 0).toLocaleString()} บาท</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="invoice-totals">
            <div><span>รวมสินค้า</span><span>{Number(invoice.total_price || 0).toLocaleString()} บาท</span></div>
            <div><span>ส่วนลด</span><span>- {Number(invoice.discount_amount || 0).toLocaleString()} บาท</span></div>
            <div><span>ค่าจัดส่ง</span><span>{Number(invoice.shipping_cost || 0).toLocaleString()} บาท</span></div>
            <div className="grand"><span>ยอดสุทธิ</span><span>{Number(invoice.grand_total || 0).toLocaleString()} บาท</span></div>
          </div>
        </article>
      </div>
    </div>
  );
};

export default InvoicePage;
