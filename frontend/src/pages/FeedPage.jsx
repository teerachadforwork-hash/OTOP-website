import React, { useEffect, useState } from 'react';
import { useFeedStore } from '../store/feedStore';
import useAuthStore from '../store/authStore';
import { resolveMediaUrl } from '../utils/catalog';
import { User, MessageCircle, Heart, Share2, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './FeedPage.css';

const FeedPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { posts, loading, fetchPosts, createPost, deletePost, updatePost, currentPostComments, fetchComments, createComment } = useFeedStore();
  
  const [newPostContent, setNewPostContent] = useState('');
  const [activePostId, setActivePostId] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [editingPostId, setEditingPostId] = useState(null);
  const [editPostContent, setEditPostContent] = useState('');
  const [replyingToCommentId, setReplyingToCommentId] = useState(null);
  const [replyText, setReplyText] = useState('');

  // Map roles to Thai
  const getRoleLabel = (role) => {
    if (role === 'admin') return 'แอดมิน';
    if (role === 'seller') return 'ผู้ขาย';
    return 'ผู้ซื้อ';
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;
    try {
      await createPost(newPostContent);
      setNewPostContent('');
    } catch (error) {
      console.error(error);
    }
  };

  const toggleComments = (postId) => {
    if (activePostId === postId) {
      setActivePostId(null);
    } else {
      setActivePostId(postId);
      fetchComments(postId);
    }
  };

  const handleCreateComment = async (e, postId) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      await createComment(postId, commentText);
      setCommentText('');
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdatePost = async (e, postId) => {
    e.preventDefault();
    if (!editPostContent.trim()) return;
    try {
      await updatePost(postId, editPostContent);
      setEditingPostId(null);
    } catch (error) {
      console.error(error);
    }
  };

  const handleReplyComment = async (e, postId, parentCommentId) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    try {
      await createComment(postId, replyText, parentCommentId);
      setReplyText('');
      setReplyingToCommentId(null);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="feed-container">
      <div className="feed-main">
        {user && (
          <div className="feed-create-post">
            <div className="feed-create-header">
              {user.avatar_url ? <img src={resolveMediaUrl(user.avatar_url)} alt="avatar" className="feed-avatar" /> : <div className="feed-avatar-placeholder"><User size={24}/></div>}
              <form onSubmit={handleCreatePost} className="feed-create-form">
                <textarea 
                  placeholder="แบ่งปันเรื่องราวสินค้า OTOP หรือชุมชนของคุณ..." 
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  rows={2}
                />
                <div className="feed-create-actions">
                  <button type="submit" disabled={!newPostContent.trim()}>โพสต์</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="feed-posts-list">
          {posts.map(post => (
            <div key={post.id} className="feed-post-card">
              <div className="post-header">
                <div 
                  className="post-author-link" 
                  onClick={() => navigate(`/profile/${post.author_id}`)}
                  style={{ cursor: 'pointer', display: 'flex', gap: '12px', flex: 1 }}
                >
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
                {user && (user.id === post.author_id || user.role === 'admin') && (
                  <div className="post-header-actions" style={{ display: 'flex', gap: '8px' }}>
                    {user.id === post.author_id && (
                      <button className="post-edit-btn" onClick={() => {
                        setEditingPostId(post.id);
                        setEditPostContent(post.content);
                      }}>แก้ไข</button>
                    )}
                    <button className="post-delete-btn" onClick={() => {
                      if (window.confirm('คุณต้องการลบโพสต์นี้หรือไม่?')) {
                        deletePost(post.id);
                      }
                    }}>ลบ</button>
                  </div>
                )}
              </div>
              <div className="post-content">
                {editingPostId === post.id ? (
                  <form onSubmit={(e) => handleUpdatePost(e, post.id)} style={{ width: '100%' }}>
                    <textarea 
                      value={editPostContent}
                      onChange={(e) => setEditPostContent(e.target.value)}
                      rows={3}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '8px' }}
                    />
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button type="button" onClick={() => setEditingPostId(null)} style={{ background: '#f3f4f6', color: '#374151', padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>ยกเลิก</button>
                      <button type="submit" style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>บันทึก</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <p>{post.content}</p>
                    {post.image_url && <img src={resolveMediaUrl(post.image_url)} alt="post media" className="post-image" />}
                  </>
                )}
              </div>
              <div className="post-actions">
                <button className="post-action-btn"><Heart size={18} /> ถูกใจ</button>
                <button className="post-action-btn" onClick={() => toggleComments(post.id)}>
                  <MessageCircle size={18} /> ความคิดเห็น ({post.comments_count})
                </button>
                <button className="post-action-btn"><Share2 size={18} /> แชร์</button>
              </div>

              {activePostId === post.id && (
                <div className="post-comments-section">
                  {user && (
                    <form className="comment-input-area" onSubmit={(e) => handleCreateComment(e, post.id)}>
                      <input 
                        type="text" 
                        placeholder="แสดงความคิดเห็น..." 
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                      />
                      <button type="submit" disabled={!commentText.trim()}><Send size={16} /></button>
                    </form>
                  )}
                  <div className="comments-list">
                    {currentPostComments.map(comment => (
                      <div key={comment.id} className="comment-item">
                        <div 
                          className="comment-author-link" 
                          onClick={() => navigate(`/profile/${comment.author_id}`)}
                          style={{ cursor: 'pointer' }}
                        >
                          {comment.author_avatar ? <img src={resolveMediaUrl(comment.author_avatar)} alt="avatar" className="comment-avatar" /> : <div className="comment-avatar-placeholder"><User size={16}/></div>}
                        </div>
                        <div className="comment-content">
                          <div className="comment-header">
                            <strong 
                              onClick={() => navigate(`/profile/${comment.author_id}`)}
                              style={{ cursor: 'pointer' }}
                            >{comment.author_name}</strong>
                            <span>{new Date(comment.created_at).toLocaleString('th-TH')}</span>
                          </div>
                          <p>{comment.content}</p>
                          {user && (
                            <button 
                              className="comment-reply-toggle-btn"
                              onClick={() => setReplyingToCommentId(replyingToCommentId === comment.id ? null : comment.id)}
                            >
                              ตอบกลับ
                            </button>
                          )}

                          {/* Reply Input Form */}
                          {replyingToCommentId === comment.id && (
                            <form className="reply-input-area" onSubmit={(e) => handleReplyComment(e, post.id, comment.id)}>
                              <input 
                                type="text" 
                                placeholder="เขียนการตอบกลับ..." 
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                autoFocus
                              />
                              <button type="submit" disabled={!replyText.trim()}><Send size={14} /></button>
                            </form>
                          )}

                          {/* Nested Replies List */}
                          {comment.replies && comment.replies.length > 0 && (
                            <div className="nested-replies-list" style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {comment.replies.map(reply => (
                                <div key={reply.id} className="comment-item reply-item" style={{ marginTop: 0, padding: '8px', background: '#f8fafc', borderRadius: '8px' }}>
                                  <div 
                                    className="comment-author-link" 
                                    onClick={() => navigate(`/profile/${reply.author_id}`)}
                                    style={{ cursor: 'pointer' }}
                                  >
                                    {reply.author_avatar ? <img src={resolveMediaUrl(reply.author_avatar)} alt="avatar" className="comment-avatar" style={{ width: '24px', height: '24px' }} /> : <div className="comment-avatar-placeholder" style={{ width: '24px', height: '24px' }}><User size={14}/></div>}
                                  </div>
                                  <div className="comment-content">
                                    <div className="comment-header">
                                      <strong 
                                        onClick={() => navigate(`/profile/${reply.author_id}`)}
                                        style={{ cursor: 'pointer', fontSize: '0.85rem' }}
                                      >{reply.author_name}</strong>
                                      <span style={{ fontSize: '0.75rem' }}>{new Date(reply.created_at).toLocaleString('th-TH')}</span>
                                    </div>
                                    <p style={{ fontSize: '0.85rem', marginTop: '2px' }}>{reply.content}</p>
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
          {posts.length === 0 && !loading && (
            <div className="empty-feed">
              <p>ยังไม่มีโพสต์ในชุมชน</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Sidebar for Feed (e.g. trending communities, suggestions) */}
      <div className="feed-sidebar">
        <div className="feed-widget">
          <h3>📌 ชุมชนยอดฮิต</h3>
          <p className="feed-widget-item">OTOP เชียงใหม่</p>
          <p className="feed-widget-item">วิสาหกิจชุมชนทอผ้า</p>
        </div>
      </div>
    </div>
  );
};

export default FeedPage;
