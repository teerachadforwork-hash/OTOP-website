import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getNewsArticle } from '../services/newsService';
import { resolveMediaUrl, apiErrorMessage } from '../utils/catalog';
import './NewsList.css';

const NewsDetail = () => {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getNewsArticle(id)
      .then(setArticle)
      .catch((err) => setError(apiErrorMessage(err, 'ไม่พบข่าวนี้')))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="news-detail"><div className="container">กำลังโหลดข่าว...</div></div>;
  if (error || !article) {
    return (
      <div className="news-detail">
        <div className="container" style={{ textAlign: 'center', padding: '3rem' }}>
          <h2>ไม่พบข่าวนี้</h2>
          <p>{error}</p>
          <Link to="/news">กลับไปกระดานข่าว</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="news-detail">
      <div className="container">
        <Link to="/news" style={{ display: 'inline-block', marginBottom: '1rem' }}>← กระดานข่าวทั้งหมด</Link>
        <article className="news-detail-card">
          <div className="news-detail-cover">
            <img src={resolveMediaUrl(article.cover_image)} alt={article.title} />
          </div>
          <div className="news-detail-body">
            <span className="news-badge">{article.category}</span>
            <h1>{article.title}</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: 0 }}>
              {article.created_at ? new Date(article.created_at).toLocaleString('th-TH') : ''}
              {article.author_name ? ` · โดย ${article.author_name}` : ''}
            </p>
            <div className="news-content">{article.content}</div>
          </div>
        </article>
      </div>
    </div>
  );
};

export default NewsDetail;
