import React, { useEffect, useState } from 'react';
import { useChatStore } from '../store/chatStore';
import useAuthStore from '../store/authStore';
import { resolveMediaUrl } from '../utils/catalog';
import { User, Send, Users, MessageSquare, Info, Settings, Trash2, LogOut, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import './ChatPage.css';

const ChatPage = () => {
  const { user } = useAuthStore();
  const { groups, privateRooms, currentChatMessages, loading, fetchGroups, fetchPrivateRooms, fetchGroupMessages, fetchPrivateMessages, sendGroupMessage, sendPrivateMessage, createGroup, updateGroup, deleteGroup, fetchGroupMembers, addGroupMember, leaveGroup } = useChatStore();
  
  const [activeTab, setActiveTab] = useState('private'); // 'private' or 'group'
  const [activeChatId, setActiveChatId] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  
  // Group Info Modal State
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [groupMembers, setGroupMembers] = useState([]);
  const [editingGroupName, setEditingGroupName] = useState('');
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');

  useEffect(() => {
    if (user) {
      fetchGroups();
      fetchPrivateRooms();
    }
  }, [user]);

  useEffect(() => {
    if (activeChatId) {
      if (activeTab === 'private') {
        fetchPrivateMessages(activeChatId);
      } else {
        fetchGroupMessages(activeChatId);
        setShowGroupInfo(false); // Close modal when switching groups
      }
    }
  }, [activeChatId, activeTab]);

  const loadGroupMembers = async () => {
    try {
      const members = await fetchGroupMembers(activeChatId);
      setGroupMembers(members);
    } catch (error) {
      toast.error('ไม่สามารถโหลดข้อมูลสมาชิกได้');
    }
  };

  const handleOpenGroupInfo = () => {
    if (activeTab !== 'group' || !activeChatId) return;
    loadGroupMembers();
    const group = groups.find(g => g.id === activeChatId);
    setEditingGroupName(group?.name || '');
    setIsEditingGroup(false);
    setShowGroupInfo(true);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activeChatId) return;

    try {
      if (activeTab === 'private') {
        await sendPrivateMessage(activeChatId, messageText);
      } else {
        await sendGroupMessage(activeChatId, messageText);
      }
      setMessageText('');
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    try {
      const group = await createGroup(newGroupName);
      setNewGroupName('');
      setActiveTab('group');
      setActiveChatId(group.id);
    } catch (error) {
      console.error(error);
    }
  };

  const activeChatDetails = activeTab === 'private' 
    ? privateRooms.find(r => r.id === activeChatId)
    : groups.find(g => g.id === activeChatId);

  const isOwner = activeTab === 'group' && activeChatDetails?.owner_id === user?.id;

  const handleUpdateGroupName = async () => {
    if (!editingGroupName.trim()) return;
    try {
      await updateGroup(activeChatId, editingGroupName);
      setIsEditingGroup(false);
      toast.success('อัปเดตชื่อกลุ่มสำเร็จ');
    } catch (error) {
      toast.error('ไม่สามารถแก้ไขชื่อกลุ่มได้');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) return;
    try {
      await addGroupMember(activeChatId, newMemberEmail);
      setNewMemberEmail('');
      loadGroupMembers();
      toast.success('เชิญสมาชิกสำเร็จ');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'ไม่สามารถเพิ่มสมาชิกได้');
    }
  };

  const handleDeleteGroup = async () => {
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบกลุ่มนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้')) {
      try {
        await deleteGroup(activeChatId);
        setActiveChatId(null);
        setShowGroupInfo(false);
        toast.success('ลบกลุ่มเรียบร้อยแล้ว');
      } catch (error) {
        toast.error('ไม่สามารถลบกลุ่มได้');
      }
    }
  };

  const handleLeaveGroup = async () => {
    if (isOwner) {
      toast.error('เจ้าของกลุ่มไม่สามารถออกจากกลุ่มได้ กรุณากดลบกลุ่มแทน');
      return;
    }
    if (window.confirm('คุณต้องการออกจากกลุ่มนี้หรือไม่?')) {
      try {
        await leaveGroup(activeChatId, user.id);
        setActiveChatId(null);
        setShowGroupInfo(false);
        toast.success('คุณได้ออกจากกลุ่มแล้ว');
      } catch (error) {
        toast.error('ไม่สามารถออกจากกลุ่มได้');
      }
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <div className="chat-tabs">
          <button className={`chat-tab ${activeTab === 'private' ? 'active' : ''}`} onClick={() => {setActiveTab('private'); setActiveChatId(null);}}>
            <MessageSquare size={16} /> แชทส่วนตัว
          </button>
          <button className={`chat-tab ${activeTab === 'group' ? 'active' : ''}`} onClick={() => {setActiveTab('group'); setActiveChatId(null);}}>
            <Users size={16} /> แชทกลุ่ม
          </button>
        </div>

        <div className="chat-list">
          {activeTab === 'private' ? (
            privateRooms.length > 0 ? privateRooms.map(room => (
              <div key={room.id} className={`chat-list-item ${activeChatId === room.id ? 'active' : ''}`} onClick={() => setActiveChatId(room.id)}>
                <div className="chat-avatar">
                  {room.other_user_avatar ? <img src={resolveMediaUrl(room.other_user_avatar)} alt="avatar" /> : <User size={20} />}
                </div>
                <div className="chat-info">
                  <h4>{room.other_user_name || 'ผู้ใช้ทั่วไป'}</h4>
                </div>
              </div>
            )) : <p className="empty-chat">ยังไม่มีการสนทนาส่วนตัว</p>
          ) : (
            <>
              <form onSubmit={handleCreateGroup} className="create-group-form">
                <input type="text" placeholder="ชื่อกลุ่มใหม่..." value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} />
                <button type="submit">สร้าง</button>
              </form>
              {groups.length > 0 ? groups.map(group => (
                <div key={group.id} className={`chat-list-item ${activeChatId === group.id ? 'active' : ''}`} onClick={() => setActiveChatId(group.id)}>
                  <div className="chat-avatar group">
                    <Users size={20} />
                  </div>
                  <div className="chat-info">
                    <h4>{group.name}</h4>
                  </div>
                </div>
              )) : <p className="empty-chat">ยังไม่ได้เข้าร่วมกลุ่มใดๆ</p>}
            </>
          )}
        </div>
      </div>

      <div className="chat-main">
        {activeChatId ? (
          <>
            <div className="chat-header">
              <h3>
                {activeTab === 'private' 
                  ? activeChatDetails?.other_user_name || 'สนทนาส่วนตัว'
                  : activeChatDetails?.name || 'สนทนากลุ่ม'}
              </h3>
              {activeTab === 'group' && (
                <button className="group-info-btn" onClick={handleOpenGroupInfo} title="ข้อมูลกลุ่ม">
                  <Info size={20} />
                </button>
              )}
            </div>
            
            <div className="chat-messages">
              {currentChatMessages.map(msg => {
                const isMine = msg.sender_id === user?.id;
                
                // Map roles to Thai
                const getRoleLabel = (role) => {
                  if (role === 'admin') return 'แอดมิน';
                  if (role === 'seller') return 'ผู้ขาย';
                  return 'ผู้ซื้อ';
                };

                return (
                  <div key={msg.id} className={`message-bubble-wrapper ${isMine ? 'mine' : 'theirs'}`}>
                    <div className="message-sender-info">
                      <div className="message-sender-avatar">
                        {msg.sender_avatar ? (
                          <img src={resolveMediaUrl(msg.sender_avatar)} alt="avatar" />
                        ) : (
                          <User size={14} />
                        )}
                      </div>
                      <span className="message-sender-name">
                        {msg.sender_name || (isMine ? user?.full_name : 'ผู้ใช้')}
                      </span>
                      <span className={`message-sender-role role-${msg.sender_role || (isMine ? user?.role : 'customer')}`}>
                        {getRoleLabel(msg.sender_role || (isMine ? user?.role : 'customer'))}
                      </span>
                    </div>

                    <div className={`message-bubble ${isMine ? 'mine' : 'theirs'}`}>
                      <div className="message-content">
                        {msg.content}
                        {msg.image_url && <img src={resolveMediaUrl(msg.image_url)} alt="attachment" className="message-image" />}
                      </div>
                      <span className="message-time">
                        {new Date(msg.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <form className="chat-input-area" onSubmit={handleSendMessage}>
              <input 
                type="text" 
                placeholder="พิมพ์ข้อความ..." 
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
              />
              <button type="submit" disabled={!messageText.trim()}>
                <Send size={18} />
              </button>
            </form>
          </>
        ) : (
          <div className="chat-placeholder">
            <MessageSquare size={48} />
            <p>เลือกการสนทนาเพื่อเริ่มต้นแชท</p>
          </div>
        )}
      </div>

      {showGroupInfo && (
        <div className="group-info-overlay" onClick={() => setShowGroupInfo(false)}>
          <div className="group-info-modal" onClick={e => e.stopPropagation()}>
            <div className="group-info-header">
              <h3>ข้อมูลกลุ่ม</h3>
              <button className="close-btn" onClick={() => setShowGroupInfo(false)}>×</button>
            </div>
            
            <div className="group-info-body">
              {isOwner ? (
                <div className="group-edit-section">
                  {isEditingGroup ? (
                    <div className="edit-group-form">
                      <input 
                        type="text" 
                        value={editingGroupName} 
                        onChange={e => setEditingGroupName(e.target.value)} 
                      />
                      <button onClick={handleUpdateGroupName} className="save-btn">บันทึก</button>
                      <button onClick={() => setIsEditingGroup(false)} className="cancel-btn">ยกเลิก</button>
                    </div>
                  ) : (
                    <div className="group-name-display">
                      <h4>{activeChatDetails?.name}</h4>
                      <button onClick={() => setIsEditingGroup(true)} className="edit-btn" title="แก้ไขชื่อ">
                        <Settings size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <h4 className="group-name-display-only">{activeChatDetails?.name}</h4>
              )}

              <div className="group-members-section">
                <h5>สมาชิก ({groupMembers.length})</h5>
                <ul className="member-list">
                  {groupMembers.map(m => (
                    <li key={m.user_id}>
                      <div className="member-avatar">
                        {m.user_avatar ? <img src={resolveMediaUrl(m.user_avatar)} alt="avatar" /> : <User size={16} />}
                      </div>
                      <span className="member-name">{m.user_name}</span>
                      {m.role === 'owner' && <span className="member-role badge">ผู้สร้าง</span>}
                    </li>
                  ))}
                </ul>
              </div>

              {isOwner && (
                <form className="add-member-form" onSubmit={handleAddMember}>
                  <input 
                    type="email" 
                    placeholder="เชิญด้วยอีเมล..." 
                    value={newMemberEmail}
                    onChange={e => setNewMemberEmail(e.target.value)}
                  />
                  <button type="submit"><Plus size={16} /> เชิญ</button>
                </form>
              )}

              <div className="group-actions">
                {isOwner ? (
                  <button className="danger-btn" onClick={handleDeleteGroup}>
                    <Trash2 size={16} /> ลบกลุ่มนี้
                  </button>
                ) : (
                  <button className="warning-btn" onClick={handleLeaveGroup}>
                    <LogOut size={16} /> ออกจากกลุ่ม
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
