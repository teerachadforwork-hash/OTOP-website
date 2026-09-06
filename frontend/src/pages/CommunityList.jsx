import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCommunityStore } from '../store/communityStore';
import { getCommunityImage } from '../utils/catalog';
import './CommunityList.css';

const REGION_PROVINCES = {
  NORTH: ['เชียงใหม่', 'เชียงราย', 'ลำพูน', 'ลำปาง', 'แพร่', 'น่าน', 'พะเยา', 'แม่ฮ่องสอน', 'อุตรดิตถ์'],
  NE: ['นครราชสีมา', 'ขอนแก่น', 'อุดรธานี', 'อุบลราชธานี', 'สกลนคร', 'มหาสารคาม', 'บุรีรัมย์', 'สุรินทร์', 'ร้อยเอ็ด', 'กาฬสินธุ์'],
  CENTRAL: ['กรุงเทพมหานคร', 'สุพรรณบุรี', 'ปทุมธานี', 'นนทบุรี', 'อยุธยา', 'นครปฐม', 'สมุทรสาคร', 'ราชบุรี', 'กาญจนบุรี', 'เพชรบุรี'],
  SOUTH: ['สุราษฎร์ธานี', 'ภูเก็ต', 'สงขลา', 'พัทลุง', 'นครศรีธรรมราช', 'กระบี่', 'ตรัง', 'ชุมพร', 'ยะลา', 'ปัตตานี'],
};

const CommunityList = () => {
  const { communities, fetchCommunities, loading, error } = useCommunityStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('ALL');

  useEffect(() => {
    fetchCommunities();
  }, []);

  const filteredCommunities = (communities || []).filter((c) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      c.name?.toLowerCase().includes(q) ||
      c.province?.toLowerCase().includes(q) ||
      c.district?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q);

    if (selectedRegion === 'ALL') return matchesSearch;
    return matchesSearch && (REGION_PROVINCES[selectedRegion] || []).includes(c.province);
  });

  return (
    <div className="community-list-page">
      <div className="container">
        <div className="community-header">
          <span className="community-header-badge">🌱 วิสาหกิจชุมชนจริงจากฐานข้อมูล</span>
          <h1 className="community-header-title">ชุมชนวิสาหกิจ OTOP ไทย</h1>
          <p className="community-header-subtitle">
            สำรวจเรื่องราวชุมชน ดูสินค้าจากแหล่งผลิต และติดต่อกลุ่มอาชีพได้โดยตรง
          </p>

          <div className="community-controls">
            <div className="community-search-box">
              <svg className="community-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                placeholder="ค้นหาชื่อชุมชน จังหวัด หรือเรื่องราว..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="community-region-select"
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
            >
              <option value="ALL">ทุกภูมิภาค</option>
              <option value="NORTH">ภาคเหนือ</option>
              <option value="NE">ภาคตะวันออกเฉียงเหนือ</option>
              <option value="CENTRAL">ภาคกลาง</option>
              <option value="SOUTH">ภาคใต้</option>
            </select>
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            กำลังโหลดข้อมูลชุมชน OTOP...
          </div>
        )}

        {error && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#dc2626' }}>
            โหลดข้อมูลชุมชนไม่สำเร็จ: {error}
          </div>
        )}

        {!loading && (
          <div className="community-grid">
            {filteredCommunities.map((c) => (
              <Link to={`/community/${c.id}`} key={c.id} className="community-card">
                <div className="community-cover">
                  <img src={getCommunityImage(c)} alt={c.name} />
                  <span className="community-province-badge">📍 {c.province}</span>
                </div>

                <div className="community-card-body">
                  <h3 className="community-name">{c.name}</h3>
                  <div className="community-location">
                    <span>อ.{c.district || 'เมือง'}</span> • <span>จ.{c.province}</span>
                  </div>
                  <p className="community-desc">
                    {c.description || 'วิสาหกิจชุมชนผู้สร้างสรรค์นวัตกรรมจากภูมิปัญญาท้องถิ่น'}
                  </p>

                  <div className="community-footer">
                    <div className="community-stats">
                      <div className="community-stat-item">📦 {c.products_count || 0} สินค้า</div>
                      {c.leader_name && <div className="community-stat-item">👤 {c.leader_name}</div>}
                    </div>
                    <span className="community-link-btn">เยี่ยมชม ➔</span>
                  </div>
                </div>
              </Link>
            ))}

            {filteredCommunities.length === 0 && (
              <div className="community-empty">
                <h3>ยังไม่มีข้อมูลชุมชนในตัวกรองนี้</h3>
                <p>ลองเปลี่ยนคำค้นหา หรือรอผู้ดูแลระบบเพิ่มชุมชนใหม่</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityList;
