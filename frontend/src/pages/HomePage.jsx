import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowRight, 
  ShoppingBag, 
  Heart, 
  Star, 
  ShieldCheck, 
  Award, 
  Users, 
  Leaf, 
  MapPin, 
  Store, 
  CheckCircle2, 
  ChevronRight,
  TrendingUp,
  PackageCheck
} from 'lucide-react';
import { useProductStore } from '../store/productStore';
import { useCommunityStore } from '../store/communityStore';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { apiErrorMessage, getCommunityImage, resolveMediaUrl } from '../utils/catalog';
import { getNews } from '../services/newsService';
import './HomePage.css';



const CATEGORIES = [
  { id: 1, name: 'ผ้าและเครื่องแต่งกาย', en: 'Textiles & Silk', icon: '🧵', count: '180+ รายการ' },
  { id: 2, name: 'อาหารและเครื่องดื่ม', en: 'Gourmet & Delicacies', icon: '🍵', count: '240+ รายการ' },
  { id: 3, name: 'ของใช้และของตกแต่ง', en: 'Home & Craft Decor', icon: '🏺', count: '150+ รายการ' },
  { id: 4, name: 'สมุนไพรและสุขภาพ', en: 'Herbal & Wellness', icon: '🌿', count: '90+ รายการ' },
  { id: 5, name: 'หัตถกรรมพื้นบ้าน', en: 'Folk Handicrafts', icon: '🧺', count: '120+ รายการ' },
  { id: 6, name: 'ของฝากและของที่ระลึก', en: 'Gifts & Souvenirs', icon: '🎁', count: '160+ รายการ' },
];

const COMMUNITIES_SHOWCASE = [
  {
    id: 1,
    name: 'กลุ่มวิสาหกิจชุมชนทอผ้าย้อมครามบ้านดอนกอย',
    province: 'สกลนคร',
    district: 'พรรณนานิคม',
    specialty: 'ผ้าย้อมครามธรรมชาติ มรดกภูมิปัญญาลุ่มน้ำสงคราม',
    members: '48 ครัวเรือน',
    image: '/artisan-portrait.png',
    established: 'พ.ศ. 2546'
  },
  {
    id: 2,
    name: 'วิสาหกิจชุมชนหัตถกรรมเครื่องเงินบ้านป่าสัก',
    province: 'น่าน',
    district: 'ปัว',
    specialty: 'เครื่องเงินโบราณตอกลายล้านนา เงินแท้ 96%',
    members: '32 ช่างฝีมือ',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80',
    established: 'พ.ศ. 2539'
  },
  {
    id: 3,
    name: 'กลุ่มจักสานกระจูดทะเลน้อย พัทลุง',
    province: 'พัทลุง',
    district: 'ควนขนุน',
    specialty: 'กระจูดสานเส้นละเอียด ผสมผสานดีไซน์ร่วมสมัย',
    members: '60 ช่างสาน',
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80',
    established: 'พ.ศ. 2542'
  }
];

const HomePage = () => {
  const navigate = useNavigate();
  const { products, fetchProducts } = useProductStore();
  const { communities, fetchCommunities } = useCommunityStore();
  const { addItem } = useCartStore();
  const { user, openAuthModal } = useAuthStore();
  const [addedProductId, setAddedProductId] = useState(null);
  const [newsItems, setNewsItems] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchCommunities();
    getNews().then((data) => setNewsItems(Array.isArray(data) ? data.slice(0, 3) : [])).catch(() => setNewsItems([]));
  }, []);

  // Display ONLY products that exist in the database (productStore)
  const displayProducts = (products || []).slice(0, 6).map((p, idx) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    province: p.province || 'ไทย',
    community_name: p.community?.name || 'กลุ่มวิสาหกิจชุมชนไทย',
    category_name: p.category?.name || p.category || 'สินค้า OTOP',
    rating_cache: p.rating_cache || 5.0,
    review_count: p.review_count || 12,
    badge: idx % 2 === 0 ? 'OTOP 5 ดาว' : 'สินค้าชุมชน GI',
    is_gi: idx % 2 !== 0,
    hero_image: p.hero_image || p.image_url || 'https://images.unsplash.com/photo-1590736704728-f4730bb30770?w=600&auto=format&fit=crop&q=80',
    description: p.description
  }));

  const handleAddToCart = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      openAuthModal();
      return;
    }
    try {
      await addItem({ product_id: product.id, quantity: 1 });
      setAddedProductId(product.id);
      setTimeout(() => setAddedProductId(null), 1800);
    } catch (err) {
      alert(apiErrorMessage(err));
    }
  };

  return (
    <div className="otop-home-page">
      {/* 1. HERO BANNER SECTION */}
      <section className="otop-hero-section">
        <div className="hero-background-wrapper">
          <img 
            src="/hero-banner.png" 
            alt="Authentic Thai Craftsmanship" 
            className="hero-bg-image"
            onError={(e) => {
              // Fallback to high quality atmospheric image if local not yet loaded
              e.target.src = 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=1920&q=80';
            }}
          />
          <div className="hero-overlay-gradient"></div>
        </div>

        <div className="otop-container hero-inner-content">
          <div className="hero-text-block">
            <div className="hero-top-pill">
              <span className="pill-dot"></span>
              <span>🇹🇭 สินค้าตรงจากวิสาหกิจชุมชน 77 จังหวัด ทั่วประเทศไทย</span>
            </div>

            <h1 className="hero-main-title">
              สินค้าดีจากชุมชนไทย <br />
              <span className="text-highlight">ส่งตรงจากผู้ผลิต</span>
            </h1>

            <p className="hero-subtitle">
              ร่วมสนับสนุนเศรษฐกิจฐานราก ค้นพบผ้าทอมือ ย้อมครามธรรมชาติ งานหัตถศิลป์ล้ำค่า 
              และของกินของใช้ระดับ 5 ดาว GI ที่ผ่านการคัดสรรมาตรฐาน ส่งถึงมือคุณอย่างมั่นใจ
            </p>

            <div className="hero-cta-group">
              <Link to="/products" className="btn-hero-primary">
                <ShoppingBag size={20} />
                <span>เลือกซื้อสินค้า</span>
              </Link>
              <Link to="/communities" className="btn-hero-secondary">
                <Users size={20} />
                <span>ดูวิสาหกิจชุมชน</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Floating Impact Stats Banner */}
        <div className="otop-container hero-stats-container">
          <div className="hero-stats-bar">
            <div className="stat-card">
              <div className="stat-icon-wrapper terracotta">
                <Users size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-value">85% รายได้ตรง</span>
                <span className="stat-label">ส่งมอบสู่กลุ่มแม่บ้าน & ช่างทอ</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper indigo">
                <Leaf size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-value">ครามธรรมชาติ 100%</span>
                <span className="stat-label">ปลอดภัย เป็นมิตรต่อสิ่งแวดล้อม</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper gold">
                <Award size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-value">OTOP 5 ดาว & GI</span>
                <span className="stat-label">รับรองมาตรฐาน กรมการพัฒนาชุมชน</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper green">
                <ShieldCheck size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-value">จัดส่งทั่วประเทศ</span>
                <span className="stat-label">การันตีสินค้าแท้จากแหล่งผลิต</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATEGORIES SECTION */}
      <section className="otop-section categories-section">
        <div className="otop-container">
          <div className="section-header">
            <div className="section-title-wrap">
              <span className="section-eyebrow">เลือกชมตามประเภท</span>
              <h2 className="section-title">หมวดหมู่ภูมิปัญญาไทย</h2>
            </div>
            <Link to="/products" className="section-view-all">
              <span>ดูทั้งหมด</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="categories-grid">
            {CATEGORIES.map((cat) => (
              <Link 
                to={`/products?category=${encodeURIComponent(cat.name)}`} 
                key={cat.id} 
                className="category-card"
              >
                <div className="cat-icon-bubble">{cat.icon}</div>
                <div className="cat-text-group">
                  <h3 className="cat-name">{cat.name}</h3>
                  <span className="cat-en">{cat.en}</span>
                  <span className="cat-count">{cat.count}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. FEATURED PRODUCTS SECTION */}
      <section className="otop-section featured-products-section">
        <div className="otop-container">
          <div className="section-header">
            <div className="section-title-wrap">
              <span className="section-eyebrow">คัดสรรพิเศษ (Curated Showcase)</span>
              <h2 className="section-title">สินค้า OTOP แนะนำและยอดนิยม</h2>
            </div>
            <Link to="/products" className="section-view-all">
              <span>ดูสินค้าทั้งหมด ({products?.length || 30}+ ชิ้น)</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="products-grid">
            {displayProducts.map((product) => (
              <div key={product.id} className="product-card">
                <Link to={`/product/${product.id}`} className="product-card-media">
                  <img 
                    src={product.hero_image} 
                    alt={product.name} 
                    className="product-img"
                    loading="lazy"
                  />
                  <div className="product-card-tags">
                    <span className="province-tag">
                      <MapPin size={11} />
                      <span>{product.province}</span>
                    </span>
                    {product.is_gi ? (
                      <span className="gi-tag">GI สิ่งบ่งชี้</span>
                    ) : (
                      <span className="otop-tag">{product.badge || 'OTOP 5 ดาว'}</span>
                    )}
                  </div>
                </Link>

                <div className="product-card-body">
                  <div className="product-artisan-line">
                    <span className="artisan-name">{product.community_name}</span>
                  </div>

                  <h3 className="product-title">
                    <Link to={`/product/${product.id}`}>{product.name}</Link>
                  </h3>

                  <div className="product-rating-row">
                    <div className="stars-group">
                      <Star size={14} className="star-filled" />
                      <span className="rating-num">{product.rating_cache}</span>
                    </div>
                    <span className="review-count">({product.review_count} รีวิว)</span>
                  </div>

                  <div className="product-card-footer">
                    <div className="price-box">
                      <span className="currency">฿</span>
                      <span className="amount">{product.price.toLocaleString()}</span>
                    </div>

                    <button 
                      onClick={(e) => handleAddToCart(e, product)}
                      className={`btn-add-cart ${addedProductId === product.id ? 'added' : ''}`}
                      title="ใส่ตะกร้า"
                    >
                      {addedProductId === product.id ? (
                        <>
                          <CheckCircle2 size={16} />
                          <span>เพิ่มแล้ว</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag size={16} />
                          <span>ใส่ตะกร้า</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. ARTISAN STORYTELLING SPOTLIGHT */}
      <section className="otop-section artisan-spotlight-section">
        <div className="otop-container">
          <div className="artisan-spotlight-card">
            <div className="spotlight-image-col">
              <img 
                src="/artisan-portrait.png" 
                alt="แม่ครูช่างทอผ้าครามดอนกอย" 
                className="spotlight-portrait"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80';
                }}
              />
              <div className="spotlight-badge-floating">
                <Award size={18} />
                <div>
                  <div className="badge-main-text">รางวัลครูช่างศิลปหัตถกรรม</div>
                  <div className="badge-sub-text">กรมการพัฒนาชุมชน กระทรวงมหาดไทย</div>
                </div>
              </div>
            </div>

            <div className="spotlight-content-col">
              <div className="spotlight-header-pill">
                <Leaf size={14} />
                <span>ภูมิปัญญาและเรื่องราวชุมชน (Community Story)</span>
              </div>

              <h2 className="spotlight-title">
                “ผ้าครามแต่ละผืน คือชีวิตและความผูกพันของแม่ผู้ทอ”
              </h2>

              <p className="spotlight-story">
                ที่บ้านดอนกอย จังหวัดสกลนคร เราปลูกต้นครามริมลำน้ำสงคราม หมักครามด้วยน้ำขี้เถ้าและสูตรโบราณกว่า 4 ชั่วอายุคน 
                ทุกเส้นใยฝ้ายเข็นด้วยมือ ผ่านการย้อมซ้ำกว่า 8 แดด เพื่อให้ได้สีครามธรรมชาติที่ติดทนและมีกลิ่นหอมเฉพาะตัว
              </p>

              <div className="spotlight-metrics-row">
                <div className="metric-item">
                  <span className="metric-number">48</span>
                  <span className="metric-label">ครัวเรือนช่างทอ</span>
                </div>
                <div className="metric-divider"></div>
                <div className="metric-item">
                  <span className="metric-number">100%</span>
                  <span className="metric-label">ครามธรรมชาติแท้</span>
                </div>
                <div className="metric-divider"></div>
                <div className="metric-item">
                  <span className="metric-number">20+</span>
                  <span className="metric-label">ปีแห่งการสืบสาน</span>
                </div>
              </div>

              <div className="spotlight-actions">
                <Link to="/communities" className="btn-spotlight-primary">
                  <span>สำรวจเรื่องราววิสาหกิจชุมชน</span>
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. COMMUNITIES GRID */}
      <section className="otop-section communities-section">
        <div className="otop-container">
          <div className="section-header">
            <div className="section-title-wrap">
              <span className="section-eyebrow">เครือข่ายวิสาหกิจชุมชน</span>
              <h2 className="section-title">วิสาหกิจชุมชนต้นแบบ</h2>
            </div>
            <Link to="/communities" className="section-view-all">
              <span>ดูทำเนียบชุมชนทั้งหมด</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="communities-grid">
            {(communities && communities.length > 0 ? communities.slice(0, 3) : COMMUNITIES_SHOWCASE).map((comm) => (
              <div key={comm.id} className="community-card">
                <div className="comm-card-image-wrap">
                  <img src={comm.image || getCommunityImage(comm)} alt={comm.name} className="comm-img" />
                  <span className="comm-province-badge">
                    <MapPin size={12} />
                    <span>จ.{comm.province}</span>
                  </span>
                </div>
                <div className="comm-card-body">
                  <h3 className="comm-name">{comm.name}</h3>
                  <p className="comm-specialty">{comm.specialty || comm.description}</p>
                  
                  <div className="comm-details-row">
                    <span className="comm-member-count">
                      <Users size={14} />
                      <span>{comm.members || `${comm.products_count || 0} สินค้า`}</span>
                    </span>
                    <span className="comm-est">{comm.established || (comm.established_year ? `ก่อตั้ง พ.ศ. ${comm.established_year}` : 'วิสาหกิจชุมชน')}</span>
                  </div>

                  <Link to={`/community/${comm.id}`} className="btn-comm-visit">
                    <span>ดูสินค้าชุมชนนี้</span>
                    <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="otop-section">
        <div className="otop-container">
          <div className="section-header">
            <div className="section-title-wrap">
              <span className="section-eyebrow">กระดานข่าวประชาสัมพันธ์</span>
              <h2 className="section-title">ข่าวสารโอท็อปและชุมชน</h2>
            </div>
            <Link to="/news" className="section-view-all">
              <span>อ่านข่าวทั้งหมด</span>
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="communities-grid">
            {newsItems.map((article) => (
              <Link to={`/news/${article.id}`} key={article.id} className="community-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="comm-card-image-wrap">
                  <img src={resolveMediaUrl(article.cover_image)} alt={article.title} className="comm-img" />
                </div>
                <div className="comm-card-body">
                  <h3 className="comm-name">{article.title}</h3>
                  <p className="comm-specialty">{article.excerpt}</p>
                  <span className="btn-comm-visit">อ่านต่อ <ChevronRight size={16} /></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 6. TRUST & VALUE PILLARS */}
      <section className="otop-section trust-pillars-section">
        <div className="otop-container">
          <div className="trust-grid">
            <div className="trust-card">
              <div className="trust-icon-box">
                <Store size={28} />
              </div>
              <h3 className="trust-card-title">ส่งตรงจากแหล่งผลิต</h3>
              <p className="trust-card-desc">
                เชื่อมต่อผู้บริโภคเข้ากับชาวบ้านและช่างฝีมือโดยตรง ไม่ผ่านคนกลาง รายได้เข้าสู่ชุมชนเต็มเม็ดเต็มหน่วย
              </p>
            </div>

            <div className="trust-card">
              <div className="trust-icon-box">
                <Award size={28} />
              </div>
              <h3 className="trust-card-title">มาตรฐาน OTOP 5 ดาว & GI</h3>
              <p className="trust-card-desc">
                ผ่านการรับรองคุณภาพมาตรฐานผลิตภัณฑ์ชุมชนและตราสัญลักษณ์สิ่งบ่งชี้ทางภูมิศาสตร์ระดับชาติ
              </p>
            </div>

            <div className="trust-card">
              <div className="trust-icon-box">
                <ShieldCheck size={28} />
              </div>
              <h3 className="trust-card-title">ชำระเงินปลอดภัย 100%</h3>
              <p className="trust-card-desc">
                รองรับ PromptPay QR Code, บัตรเครดิต และโอนผ่านธนาคาร พร้อมระบบตรวจสอบหลักฐานการโอนเงินอัตโนมัติ
              </p>
            </div>

            <div className="trust-card">
              <div className="trust-icon-box">
                <PackageCheck size={28} />
              </div>
              <h3 className="trust-card-title">บรรจุภัณฑ์ใส่ใจสิ่งแวดล้อม</h3>
              <p className="trust-card-desc">
                ใช้วัสดุธรรมชาติและกระดาษรีไซเคิลในการจัดส่ง ลดขยะพลาสติกเพื่อความยั่งยืนของโลกและชุมชน
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
