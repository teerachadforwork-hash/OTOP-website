import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Award, Lock, CreditCard, QrCode, HeartHandshake, MapPin } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="otop-footer">
      <div className="otop-footer-top">
        <div className="otop-container otop-footer-grid">
          {/* Brand Info */}
          <div className="footer-col brand-col">
            <div className="footer-brand">
              <span className="brand-title">OTOP Connect</span>
            </div>
            <p className="footer-description">
              แพลตฟอร์มตลาดออนไลน์เพื่อส่งเสริมผลิตภัณฑ์ชุมชน พัฒนาภูมิปัญญาไทยสู่สากล เชื่อมโยงผู้ผลิตวิสาหกิจชุมชนโดยตรงสู่ผู้บริโภค พร้อมระบบตรวจสอบมาตรฐานและแหล่งกำเนิดสินค้า GI
            </p>
            <div className="partner-badges">
              <span className="partner-badge">ความร่วมมือ กรมการพัฒนาชุมชน (CDD)</span>
              <span className="partner-badge">กรมส่งเสริมการค้าระหว่างประเทศ (DITP)</span>
            </div>
          </div>

          {/* 5 Regions Heritage */}
          <div className="footer-col">
            <h4 className="footer-heading">ภูมิปัญญา 5 ภาค</h4>
            <ul className="footer-links">
              <li><Link to="/products?region=north">ภาคเหนือ (Lanna Craft & Silk)</Link></li>
              <li><Link to="/products?region=northeast">ภาคอีสาน (Indigo & Pottery)</Link></li>
              <li><Link to="/products?region=central">ภาคกลาง (Traditional Crafts)</Link></li>
              <li><Link to="/products?region=south">ภาคใต้ (Batik & Herbal Care)</Link></li>
              <li><Link to="/products?region=east">ภาคตะวันออก (Gourmet & Fruits)</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="footer-col">
            <h4 className="footer-heading">บริการลูกค้า & ผู้ผลิต</h4>
            <ul className="footer-links">
              <li><Link to="/orders">ติดตามสถานะคำสั่งซื้อ</Link></li>
              <li><Link to="/products">มาตรฐานรับรอง OTOP 5 ดาว</Link></li>
              <li><Link to="/news">กระดานข่าว OTOP</Link></li>
              <li><Link to="/communities">ทำเนียบวิสาหกิจชุมชน</Link></li>
              <li><Link to="/seller-dashboard">สมัครเป็นผู้ประกอบการวิสาหกิจ</Link></li>
              <li><Link to="/admin-dashboard">ศูนย์จัดการระบบส่วนกลาง</Link></li>
            </ul>
          </div>

          {/* Payment & Trust */}
          <div className="footer-col">
            <h4 className="footer-heading">ความปลอดภัย & การชำระเงิน</h4>
            <p className="footer-payment-text">
              ธุรกรรมมั่นคงปลอดภัย มาตรฐานระดับสากล สนับสนุน PromptPay, บัตรเครดิต, และกระเป๋าเงินดิจิทัลชุมชน
            </p>
            <div className="payment-icons-row">
              <span className="payment-badge" title="ความปลอดภัยระดับ SSL">
                <Lock size={16} />
              </span>
              <span className="payment-badge" title="บัตรเครดิตและเดบิต">
                <CreditCard size={16} />
              </span>
              <span className="payment-badge" title="พร้อมเพย์ QR Code">
                <QrCode size={16} />
              </span>
              <span className="payment-badge" title="ระบบคุ้มครองผู้ซื้อ">
                <ShieldCheck size={16} />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bottom Bar */}
      <div className="otop-footer-bottom">
        <div className="otop-container footer-bottom-inner">
          <p className="copyright-text">
            © 2026 OTOP Connect Thailand. สงวนลิขสิทธิ์ทุกประการ สนับสนุนเศรษฐกิจฐานรากไทย
          </p>
          <div className="footer-bottom-links">
            <a href="#terms">ข้อกำหนดการใช้งาน</a>
            <a href="#privacy">นโยบายความเป็นส่วนตัว</a>
            <a href="#sitemap">แผนผังเว็บไซต์</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
