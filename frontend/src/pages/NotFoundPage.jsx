import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import './NotFoundPage.css';

const NotFoundPage = () => {
  return (
    <div className="notfound-container">
      <div className="notfound-content">
        <AlertCircle size={80} color="var(--primary)" />
        <h1>404</h1>
        <h2>ไม่พบหน้าที่คุณต้องการ</h2>
        <p>ขออภัย หน้าเว็บที่คุณพยายามเข้าถึงอาจถูกลบ ย้าย หรือไม่มีอยู่จริง</p>
        <Link to="/" className="notfound-home-btn">
          กลับสู่หน้าแรก
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
