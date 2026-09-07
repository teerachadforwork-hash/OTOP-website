import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { createNewsComment, deleteNewsComment, getNewsArticle, getNewsComments } from '../services/newsService';
import useAuthStore from '../store/authStore';
import { resolveMediaUrl, apiErrorMessage } from '../utils/catalog';
import './NewsList.css';

const NewsDetail = () => {
  const { id } = useParams();
  const { user, openAuthModal } = useAuthStore();
  const [article, setArticle] = useState(null);
  const [comments, setComments] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentError, setCommentError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    setCommentError('');
    getNewsArticle(id)
      .then((data) => {
        setArticle(data);
        return getNewsComments(id);
      })
      .then((data) => setComments(Array.isArray(data) ? data : []))
      .catch((err) => setError(apiErrorMessage(err, 'ไม่พบข่าวนี้')))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmitComment = async (event) => {
    event.preventDefault();
    setCommentError('');
    const content = commentText.trim();
    if (!content) {
      setCommentError('กรุณาพิมพ์ข้อความก่อนส่ง');
      return;
    }
    if (!user) {
      openAuthModal();
      return;
    }
    setCommentLoading(true);
    try {
      const created = await createNewsComment(id, content);
      setComments((current) => [...current, created]);
      setCommentText('');
      setArticle((current) => current ? { ...current, comment_count: Number(current.comment_count || 0) + 1 } : current);
    } catch (err) {
      setCommentError(apiErrorMessage(err, 'ส่งความคิดเห็นไม่สำเร็จ'));
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('ลบความคิดเห็นนี้?')) return;
    try {
      await deleteNewsComment(id, commentId);
      setComments((current) => current.filter((comment) => comment.id !== commentId));
      setArticle((current) => current ? { ...current, comment_count: Math.max(0, Number(current.comment_count || 0) - 1) } : current);
    } catch (err) {
      setCommentError(apiErrorMessage(err, 'ลบความคิดเห็นไม่สำเร็จ'));
    }
  };

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

        <section className="news-comments-panel">
          <div className="news-comments-header">
            <div>
              <span className="news-badge">แลกเปลี่ยนความคิดเห็น</span>
              <h2>พูดคุยใต้ข่าวนี้</h2>
            </div>
            <span className="news-comment-count">{comments.length} ความคิดเห็น</span>
          </div>

          <form className="news-comment-form" onSubmit={handleSubmitComment}>
            <textarea
              rows="4"
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              maxLength={1000}
              placeholder={user ? 'พิมพ์ความคิดเห็นหรือแลกเปลี่ยนข้อมูลเกี่ยวกับข่าวนี้...' : 'เข้าสู่ระบบเพื่อร่วมแสดงความคิดเห็น'}
              disabled={commentLoading}
            />
            <div className="news-comment-actions">
              <span>{commentText.trim().length}/1000 ตัวอักษร</span>
              <button type="submit" disabled={commentLoading}>
                {commentLoading ? 'กำลังส่ง...' : user ? 'ส่งความคิดเห็น' : 'เข้าสู่ระบบเพื่อส่ง'}
              </button>
            </div>
            {commentError && <p className="news-comment-error">{commentError}</p>}
          </form>

          <div className="news-comment-list">
            {comments.map((comment) => {
              const canDelete = user && (user.id === comment.user_id || user.role === 'admin');
              return (
                <article className="news-comment-item" key={comment.id}>
                  <div className="news-comment-avatar">
                    {(comment.user_name || 'U').trim().charAt(0).toUpperCase()}
                  </div>
                  <div className="news-comment-content">
                    <div className="news-comment-meta">
                      <div>
                        <strong>{comment.user_name || 'ผู้ใช้งาน OTOP'}</strong>
                        <span>{comment.user_role === 'seller' ? 'ผู้ขาย' : comment.user_role === 'admin' ? 'ผู้ดูแลระบบ' : 'สมาชิก'}</span>
                      </div>
                      <time>{comment.created_at ? new Date(comment.created_at).toLocaleString('th-TH') : ''}</time>
                    </div>
                    <p>{comment.content}</p>
                    {canDelete && (
                      <button type="button" className="news-comment-delete" onClick={() => handleDeleteComment(comment.id)}>
                        ลบความคิดเห็น
                      </button>
                    )}
                  </div>
                </article>
              );
            })}

            {comments.length === 0 && (
              <div className="news-comment-empty">
                ยังไม่มีความคิดเห็นใต้ข่าวนี้ เริ่มบทสนทนาแรกได้เลย
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default NewsDetail;
