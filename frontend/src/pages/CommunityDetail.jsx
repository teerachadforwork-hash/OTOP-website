import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCommunityStore } from '../store/communityStore';
import { useProductStore } from '../store/productStore';
import { getCommunityImage, getProductImage } from '../utils/catalog';
import './CommunityDetail.css';

const CommunityDetail = () => {
  const { id } = useParams();
  const { current: community, fetchCommunity, loading, error } = useCommunityStore();
  const { products, fetchProducts } = useProductStore();

  useEffect(() => {
    fetchCommunity(id);
    fetchProducts();
  }, [id]);

  const communityProducts = (products || []).filter((p) => Number(p.community_id) === Number(id));

  if (loading) {
    return (
      <div className="community-detail-page" style={{ padding: '4rem', textAlign: 'center' }}>
        กำลังโหลดข้อมูลชุมชน...
      </div>
    );
  }

  if (error || !community) {
    return (
      <div className="community-detail-page" style={{ padding: '4rem', textAlign: 'center' }}>
        <h2>ไม่พบข้อมูลชุมชนนี้</h2>
        <p style={{ color: 'var(--text-muted)', margin: '0.75rem 0 1.5rem' }}>{error || 'ชุมชนอาจถูกลบหรือยังไม่ได้ลงข้อมูล'}</p>
        <Link to="/communities">กลับไปหน้ารายชื่อชุมชน</Link>
      </div>
    );
  }

  const contactPhone = community.contact_phone || community.phone;
  const contactEmail = community.contact_email;

  return (
    <div className="community-detail-page">
      <div
        className="cd-hero"
        style={{ backgroundImage: `url(${getCommunityImage(community)})` }}
      >
        <div className="cd-hero-overlay"></div>
        <div className="container cd-hero-content">
          <span className="cd-hero-badge">🏛️ วิสาหกิจชุมชน OTOP</span>
          <h1 className="cd-hero-title">{community.name}</h1>
          <div className="cd-hero-location">
            📍 อ.{community.district || 'เมือง'} จ.{community.province}
            {community.established_year ? ` • ก่อตั้ง พ.ศ. ${community.established_year}` : ''}
          </div>
        </div>
      </div>

      <div className="container">
        <div className="cd-body">
          <div>
            <div className="cd-main-card">
              <h2 className="cd-section-title">📖 เรื่องราวและภูมิปัญญาของชุมชน</h2>
              <p className="cd-description-text">
                {community.description || 'วิสาหกิจชุมชนผู้ผลิตสินค้า OTOP จากภูมิปัญญาท้องถิ่น'}
              </p>
              {community.history && (
                <>
                  <h3 className="cd-section-title" style={{ fontSize: '1.1rem', marginTop: '1.25rem' }}>ประวัติชุมชน</h3>
                  <p className="cd-description-text">{community.history}</p>
                </>
              )}
              {community.story && (
                <>
                  <h3 className="cd-section-title" style={{ fontSize: '1.1rem', marginTop: '1.25rem' }}>เรื่องราวสินค้า</h3>
                  <p className="cd-description-text">{community.story}</p>
                </>
              )}
            </div>

            <div className="cd-main-card">
              <h2 className="cd-section-title">📦 สินค้าของชุมชนนี้ ({communityProducts.length})</h2>
              <div className="cd-products-grid">
                {communityProducts.length > 0 ? (
                  communityProducts.map((product) => (
                    <Link to={`/product/${product.id}`} key={product.id} className="cd-product-card">
                      <div className="cd-product-img">
                        <img src={getProductImage(product)} alt={product.name} />
                      </div>
                      <div className="cd-product-info">
                        <div className="cd-product-name">{product.name}</div>
                        <div className="cd-product-price">{Number(product.price).toLocaleString()} บาท</div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p style={{ color: 'var(--text-muted)' }}>ยังไม่มีสินค้าที่พร้อมจำหน่ายจากชุมชนนี้</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="cd-sidebar-card">
              <h3 className="cd-section-title" style={{ fontSize: '1.1rem' }}>ข้อมูลติดต่อ</h3>
              <div className="cd-stat-list">
                {community.leader_name && (
                  <div className="cd-stat-row">
                    <span className="cd-stat-label">ประธานกลุ่ม:</span>
                    <span className="cd-stat-val">{community.leader_name}</span>
                  </div>
                )}
                <div className="cd-stat-row">
                  <span className="cd-stat-label">สินค้าในระบบ:</span>
                  <span className="cd-stat-val">{community.products_count ?? communityProducts.length} รายการ</span>
                </div>
                <div className="cd-stat-row">
                  <span className="cd-stat-label">จังหวัด:</span>
                  <span className="cd-stat-val">{community.province}</span>
                </div>
                {community.subdistrict && (
                  <div className="cd-stat-row">
                    <span className="cd-stat-label">ตำบล:</span>
                    <span className="cd-stat-val">{community.subdistrict}</span>
                  </div>
                )}
                {contactPhone && (
                  <div className="cd-stat-row">
                    <span className="cd-stat-label">โทรศัพท์:</span>
                    <span className="cd-stat-val">{contactPhone}</span>
                  </div>
                )}
                {contactEmail && (
                  <div className="cd-stat-row">
                    <span className="cd-stat-label">อีเมล:</span>
                    <span className="cd-stat-val">{contactEmail}</span>
                  </div>
                )}
              </div>

              {contactPhone ? (
                <a className="cd-contact-btn" href={`tel:${contactPhone}`} style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
                  📞 โทรหาชุมชน
                </a>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>ยังไม่มีเบอร์ติดต่อในระบบ</p>
              )}
              {contactEmail && (
                <a className="cd-contact-btn" href={`mailto:${contactEmail}`} style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: '0.6rem', background: 'var(--secondary)' }}>
                  ✉️ ส่งอีเมล
                </a>
              )}
            </div>

            <Link to="/communities" style={{ textDecoration: 'none' }}>
              <button className="cd-contact-btn" style={{ background: 'var(--secondary)' }}>
                ⬅️ กลับไปหน้ารายชื่อชุมชน
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityDetail;
