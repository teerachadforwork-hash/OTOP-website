import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useProductStore } from '../store/productStore';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { getProductImage, apiErrorMessage } from '../utils/catalog';
import './ProductList.css';

const ProductList = () => {
  const { products, fetchProducts, loading, error } = useProductStore();
  const { addItem } = useCartStore();
  const { user, openAuthModal } = useAuthStore();
  const [categoryFilter, setCategoryFilter] = useState('');
  const [communityFilter, setCommunityFilter] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [addedId, setAddedId] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const CATEGORY_MAP = {
    1: 'ผ้าและเครื่องแต่งกาย',
    2: 'อาหารและเครื่องดื่ม',
    3: 'ของใช้และของตกแต่ง',
    4: 'สมุนไพรและสุขภาพ',
    5: 'หัตถกรรม'
  };

  const getCategoryName = (cat) => {
    if (!cat) return null;
    return CATEGORY_MAP[cat] || cat;
  };

  // Extract unique filter options once products are loaded
  const categories = Array.from(new Set(products.map(p => getCategoryName(p.category?.name || p.category_id || p.category)))).filter(Boolean);
  const communities = Array.from(new Set(products.map(p => p.community?.name || p.community_id))).filter(Boolean);
  const provinces = Array.from(new Set(products.map(p => p.province))).filter(Boolean);

  const filteredProducts = products.filter(p => {
    const pCat = getCategoryName(p.category?.name || p.category_id || p.category);
    const pCom = p.community?.name || p.community_id;
    const matchesFilters = (
      (categoryFilter ? pCat === categoryFilter : true) &&
      (communityFilter ? pCom === communityFilter : true) &&
      (provinceFilter ? p.province === provinceFilter : true)
    );
    const matchesSearch = searchTerm.trim() === '' || p.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilters && matchesSearch;
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  // Sync with URL params
  useEffect(() => {
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    if (search !== null) setSearchTerm(search);
    if (category !== null && category !== 'all') setCategoryFilter(category);
  }, [searchParams]);

  const updateSearchParam = (key, value) => {
    if (value) {
      searchParams.set(key, value);
    } else {
      searchParams.delete(key);
    }
    setSearchParams(searchParams);
  };

  const handleSearchTermChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    updateSearchParam('search', val);
  };

  const handleCategoryFilterChange = (cat) => {
    const val = categoryFilter === cat ? '' : cat;
    setCategoryFilter(val);
    updateSearchParam('category', val);
  };

  const resetFilters = () => {
    setCategoryFilter('');
    setCommunityFilter('');
    setProvinceFilter('');
    setSearchTerm('');
    setSearchParams({});
  };

  const handleAddToCart = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      openAuthModal();
      return;
    }
    try {
      await addItem({ product_id: product.id, quantity: 1, product });
      setAddedId(product.id);
      setTimeout(() => setAddedId(null), 1500);
    } catch (err) {
      alert(apiErrorMessage(err));
    }
  };

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center' }}>กำลังโหลดรายการสินค้า...</div>;
  if (error) return <div style={{ padding: '4rem', textAlign: 'center', color: 'red' }}>Error: {error}</div>;

  return (
    <div className="otop-product-list-page">
      <div className="product-layout">
        {/* Filters Sidebar */}
        <aside className="product-filters-sidebar">
          <div className="filter-group">
            <h4 className="filter-title">หมวดหมู่</h4>
            <div className="filter-options">
              {categories.map(cat => (
                <label key={cat} className="filter-label">
                  <input
                    type="radio"
                    name="category"
                    value={cat}
                    checked={categoryFilter === cat}
                    onChange={() => handleCategoryFilterChange(cat)}
                  />
                  {cat}
                </label>
              ))}
              <label className="filter-label">
                <input
                  type="radio"
                  name="category"
                  value=""
                  checked={categoryFilter === ''}
                  onChange={() => setCategoryFilter('')}
                />
                ทั้งหมด
              </label>
            </div>
          </div>

          <div className="filter-group">
            <h4 className="filter-title">จังหวัด</h4>
            <div className="filter-options">
              {provinces.map(prov => (
                <label key={prov} className="filter-label">
                  <input
                    type="radio"
                    name="province"
                    value={prov}
                    checked={provinceFilter === prov}
                    onChange={() => setProvinceFilter(prov)}
                  />
                  {prov}
                </label>
              ))}
              <label className="filter-label">
                <input
                  type="radio"
                  name="province"
                  value=""
                  checked={provinceFilter === ''}
                  onChange={() => setProvinceFilter('')}
                />
                ทั้งหมด
              </label>
            </div>
          </div>

          <button className="reset-filters-btn" onClick={resetFilters}>รีเซ็ตตัวกรอง</button>
        </aside>

        {/* Main Content */}
        <section className="product-list-content">
          <div className="product-toolbar">
            <div className="results-count">พบ {filteredProducts.length} รายการสินค้า OTOP</div>
            <input
              type="text"
              placeholder="🔍 ค้นหาสินค้า OTOP..."
              className="search-input"
              value={searchTerm}
              onChange={handleSearchTermChange}
            />
          </div>
          <div className="products-grid">
            {filteredProducts.map(p => {
              const stock = p.stock !== undefined ? Number(p.stock) : 10;
              return (
                <div key={p.id} className="product-card">
                  <Link to={`/product/${p.id}`} className="product-image-container">
                    <img src={getProductImage(p)} alt={p.name} className="product-image" />
                  </Link>
                  <div className="product-info">
                    <h3 className="product-title">
                      <Link to={`/product/${p.id}`}>{p.name}</Link>
                    </h3>
                    <div className="product-meta">
                      <span className="product-price">{Number(p.price).toLocaleString()} บาท</span>
                      <span className="product-location">📍 {p.province}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.85rem' }}>
                      <span style={{ fontSize: '0.8rem', color: stock > 0 ? 'var(--eco)' : '#ef4444' }}>
                        {stock > 0 ? `สต็อก: ${stock}` : 'สินค้าหมด'}
                      </span>
                      <button
                        onClick={(e) => handleAddToCart(e, p)}
                        disabled={stock <= 0}
                        style={{
                          background: addedId === p.id ? 'var(--eco)' : 'var(--terracotta)',
                          color: '#fff',
                          border: 'none',
                          padding: '0.4rem 0.85rem',
                          borderRadius: '8px',
                          cursor: stock <= 0 ? 'not-allowed' : 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                        }}
                      >
                        {addedId === p.id ? '✓ เพิ่มแล้ว' : '🛒 ใส่ตะกร้า'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProductList;
