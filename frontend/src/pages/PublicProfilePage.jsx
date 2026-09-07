import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { resolveMediaUrl } from '../utils/catalog';
import { User, MessageCircle, Heart, Share2, Calendar } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import './PublicProfilePage.css';

const PublicProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { startPrivateChat } = useChatStore();
  
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activePostId, setActivePostId] = useState(null);
  const [comments, setComments] = useState({});
  const [commentText, setCommentText] = useState('');
  const [replyingToCommentId, setReplyingToCommentId] = useState(null);
  const [replyText, setReplyText] = useState('');

  // Map roles to Thai
  const getRoleLabel = (role) => {
    if (role === 'admin') return 'แอดมิน';
    if (role === 'seller') return 'ผู้ขาย';
    return 'ผู้ซื้อ';
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [profileRes, postsRes] = await Promise.all([
          api.get(`/auth/users/${id}/public`),
          api.get(`/feed/users/${id}/posts`)
        ]);
        setProfile(profileRes.data);
        setPosts(postsRes.data);
      } catch (err) {
        setError('ไม่พบข้อมูลผู้ใช้นี้ หรือเกิดข้อผิดพลาด');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProfileData();
    }
  }, [id]);

  const handleStartChat = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await startPrivateChat(profile.id);
      navigate('/chat');
    } catch (err) {
      console.error(err);
    }
  };

  const toggleComments = async (postId) => {
    if (activePostId === postId) {
      setActivePostId(null);
    } else {
      setActivePostId(postId);
      if (!comments[postId]) {
        try {
          const { data } = await api.get(`/feed/posts/${postId}/comments`);
          setComments(prev => ({ ...prev, [postId]: data }));
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  const handleCreateComment = async (e, postId) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const { data } = await api.post(`/feed/posts/${postId}/comments`, { content: commentText });
      setComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), data]
      }));
      setPosts(posts.map(p => p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p));
      setCommentText('');
    } catch (error) {
      console.error(error);
    }
  };

  const handleReplyComment = async (e, postId, parentCommentId) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    try {
      const { data } = await api.post(`/feed/posts/${postId}/comments`, { content: replyText, parent_comment_id: parentCommentId });
      setComments(prev => ({
        ...prev,
        [postId]: prev[postId].map(c => 
          c.id === parentCommentId 
            ? { ...c, replies: [...(c.replies || []), data] }
            : c
        )
      }));
      setPosts(posts.map(p => p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p));
      setReplyText('');
      setReplyingToCommentId(null);
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div className="profile-loading">กำลังโหลดข้อมูล...</div>;
  if (error) return <div className="profile-error-msg">{error}</div>;
  if (!profile) return null;

  const isOwnProfile = user && user.id === profile.id;

  return (
    <div className="public-profile-container">
      <div className="public-profile-header-card">
        <div className="public-profile-cover"></div>
        <div className="public-profile-info">
          <div className="public-profile-avatar-wrapper">
            {profile.avatar_url ? (
              <img src={resolveMediaUrl(profile.avatar_url)} alt={profile.full_name} className="public-profile-avatar" />
            ) : (
              <div className="public-profile-avatar-placeholder"><User size={48} /></div>
            )}
          </div>
          <div className="public-profile-details">
            <h2>{profile.full_name}</h2>
            <span className="profile-role-badge">{profile.role}</span>
            <div className="profile-meta">
              <span><Calendar size={14} /> เข้าร่วมเมื่อ {new Date(profile.created_at).toLocaleDateString('th-TH')}</span>
            </div>
            {profile.role === 'seller' && (
              <div className="profile-shop-info" style={{ marginTop: '8px', padding: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <strong>🛍️ ข้อมูลร้านค้า OTOP</strong>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>วิสาหกิจชุมชน OTOP ที่ได้รับการรับรอง</p>
                <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>ติดต่อสอบถามสินค้าเพิ่มเติมได้ทางข้อความ</p>
              </div>
            )}
          </div>
          <div className="public-profile-actions">
            {isOwnProfile ? (
              <button onClick={() => navigate('/profile')} className="edit-profile-btn">แก้ไขโปรไฟล์</button>
            ) : (
              <button onClick={handleStartChat} className="message-btn">ส่งข้อความ</button>
            )}
          </div>
        </div>
      </div>

      <div className="public-profile-content">
        <h3>โพสต์ล่าสุด ({posts.length})</h3>
        <div className="feed-posts-list">
          {posts.map(post => (
            <div key={post.id} className="feed-post-card">
              <div className="post-header">
                {post.author_avatar ? <img src={resolveMediaUrl(post.author_avatar)} alt="avatar" className="post-avatar" /> : <div className="post-avatar-placeholder"><User size={20}/></div>}
                <div className="post-author-info">
                  <h4>
                    {post.author_name}
                    <span className={`post-role-badge role-${post.author_role || 'customer'}`}>
                      {getRoleLabel(post.author_role)}
                    </span>
                  </h4>
                  <span className="post-time">{new Date(post.created_at).toLocaleString('th-TH')}</span>
                </div>
              </div>
              <div className="post-content">
                <p>{post.content}</p>
                {post.image_url && <img src={resolveMediaUrl(post.image_url)} alt="post media" className="post-image" />}
              </div>
              <div className="post-actions">
                <button className="post-action-btn"><Heart size={18} /> ถูกใจ</button>
                <button className="post-action-btn" onClick={() => toggleComments(post.id)}>
                  <MessageCircle size={18} /> ความคิดเห็น ({post.comments_count})
                </button>
              </div>

              {activePostId === post.id && (
                <div className="post-comments-section" style={{ marginTop: '15px' }}>
                  {user && (
                    <form className="comment-input-area" onSubmit={(e) => handleCreateComment(e, post.id)}>
                      <input 
                        type="text" 
                        placeholder="แสดงความคิดเห็น..." 
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                      />
                      <button type="submit" disabled={!commentText.trim()} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>ส่ง</button>
                    </form>
                  )}
                  <div className="comments-list">
                    {(comments[post.id] || []).map(comment => (
                      <div key={comment.id} className="comment-item" style={{ marginTop: '10px', padding: '10px', background: '#f8fafc', borderRadius: '8px' }}>
                        <div 
                          className="comment-author-link" 
                          onClick={() => navigate(`/profile/${comment.author_id}`)}
                          style={{ cursor: 'pointer', float: 'left', marginRight: '10px' }}
                        >
                          {comment.author_avatar ? <img src={resolveMediaUrl(comment.author_avatar)} alt="avatar" className="comment-avatar" style={{ width: '32px', height: '32px', borderRadius: '50%' }} /> : <div className="comment-avatar-placeholder" style={{ width: '32px', height: '32px', background: '#e5e7eb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={16}/></div>}
                        </div>
                        <div className="comment-content" style={{ overflow: 'hidden' }}>
                          <div className="comment-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <strong 
                              onClick={() => navigate(`/profile/${comment.author_id}`)}
                              style={{ cursor: 'pointer', fontSize: '0.9rem' }}
                            >{comment.author_name}</strong>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(comment.created_at).toLocaleString('th-TH')}</span>
                          </div>
                          <p style={{ fontSize: '0.9rem', margin: 0 }}>{comment.content}</p>
                          {user && (
                            <button 
                              className="comment-reply-toggle-btn"
                              onClick={() => setReplyingToCommentId(replyingToCommentId === comment.id ? null : comment.id)}
                              style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.8rem', cursor: 'pointer', padding: 0, marginTop: '4px', fontWeight: 600 }}
                            >
                              ตอบกลับ
                            </button>
                          )}

                          {/* Reply Input Form */}
                          {replyingToCommentId === comment.id && (
                            <form className="reply-input-area" onSubmit={(e) => handleReplyComment(e, post.id, comment.id)} style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                              <input 
                                type="text" 
                                placeholder="เขียนการตอบกลับ..." 
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                autoFocus
                                style={{ flex: 1, padding: '6px 10px', borderRadius: '16px', border: '1px solid var(--border)' }}
                              />
                              <button type="submit" disabled={!replyText.trim()} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '16px', cursor: 'pointer' }}>ส่ง</button>
                            </form>
                          )}

                          {/* Nested Replies List */}
                          {comment.replies && comment.replies.length > 0 && (
                            <div className="nested-replies-list" style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {comment.replies.map(reply => (
                                <div key={reply.id} className="comment-item reply-item" style={{ marginTop: 0, padding: '8px', background: '#f1f5f9', borderRadius: '8px' }}>
                                  <div 
                                    className="comment-author-link" 
                                    onClick={() => navigate(`/profile/${reply.author_id}`)}
                                    style={{ cursor: 'pointer', float: 'left', marginRight: '8px' }}
                                  >
                                    {reply.author_avatar ? <img src={resolveMediaUrl(reply.author_avatar)} alt="avatar" className="comment-avatar" style={{ width: '24px', height: '24px', borderRadius: '50%' }} /> : <div className="comment-avatar-placeholder" style={{ width: '24px', height: '24px', background: '#e5e7eb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={14}/></div>}
                                  </div>
                                  <div className="comment-content" style={{ overflow: 'hidden' }}>
                                    <div className="comment-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                                      <strong 
                                        onClick={() => navigate(`/profile/${reply.author_id}`)}
                                        style={{ cursor: 'pointer', fontSize: '0.85rem' }}
                                      >{reply.author_name}</strong>
                                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(reply.created_at).toLocaleString('th-TH')}</span>
                                    </div>
                                    <p style={{ fontSize: '0.85rem', margin: 0 }}>{reply.content}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          {posts.length === 0 && (
            <div className="empty-feed">
              <p>ผู้ใช้นี้ยังไม่มีการโพสต์</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicProfilePage;
