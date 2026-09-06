import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getNews } from '../services/newsService';
import { resolveMediaUrl, apiErrorMessage } from '../utils/catalog';
import './NewsList.css';

const NewsList = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('ALL');

  useEffect(() => {
    getNews()
      .then((data) => setArticles(Array.isArray(data) ? data : []))
      .catch((err) => setError(apiErrorMessage(err, 'โหลดข่าวไม่สำเร็จ')))
      .finally(() => setLoading(false));
  }, []);

  const categories = ['ALL', ...Array.from(new Set(articles.map((a) => a.category).filter(Boolean)))];
  const filtered = category === 'ALL' ? articles : articles.filter((a) => a.category === category);

  return (
    <div className="news-list-page">
      <div className="container">
        <div className="news-header">
          <span className="news-badge">กระดานข่าว OTOP</span>
          <h1>ข่าวประชาสัมพันธ์และกิจกรรมชุมชน</h1>
          <p>ติดตามข่าวสารเกี่ยวกับโอท็อป นโยบายส่งเสริมวิสาหกิจชุมชน และกิจกรรมประชาสัมพันธ์ต่างๆ</p>
        </div>

        <div className="news-filters">
          {categories.map((cat) => (
            <button key={cat} className={category === cat ? 'active' : ''} onClick={() => setCategory(cat)}>
              {cat === 'ALL' ? 'ทั้งหมด' : cat}
            </button>
          ))}
        </div>

        {loading && <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>กำลังโหลดข่าว...</p>}
        {error && <p style={{ textAlign: 'center', color: '#dc2626' }}>{error}</p>}

        <div className="news-grid">
          {filtered.map((article) => (
            <Link to={`/news/${article.id}`} key={article.id} className="news-card">
              <div className="news-cover">
                <img src={resolveMediaUrl(article.cover_image)} alt={article.title} />
                <span>{article.category}</span>
              </div>
              <div className="news-body">
                <h3>{article.title}</h3>
                <p>{article.excerpt || (article.content || '').slice(0, 140)}</p>
                <div className="news-meta">
                  {article.created_at ? new Date(article.created_at).toLocaleDateString('th-TH') : ''}
                  {article.author_name ? ` · ${article.author_name}` : ''}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {!loading && filtered.length === 0 && (
          <div className="news-empty">ยังไม่มีข่าวในหมวดนี้ ผู้ดูแลระบบสามารถลงข่าวได้จากแดชบอร์ดแอดมิน</div>
        )}
      </div>
    </div>
  );
};

export default NewsList;
