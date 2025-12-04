import React, { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

const BASE_URL = "http://localhost:4000"; // Backend adresi

export default function ActivityCard({ activity, currentUser }) {
  const { id, type, payload, created_at, User, Likes, Comments } = activity;
  const navigate = useNavigate();
  
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [showAllComments, setShowAllComments] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);

  const COMMENTS_LIMIT = 3;

  // Avatar URL Helper
  const getAvatarUrl = (path) => {
    if (!path) return null;
    return path.startsWith('/')
      ? `http://localhost:4000${path}`
      : `http://localhost:4000/uploads/${path}`;
  };

  useEffect(() => {
    if (Likes) {
       setLikeCount(Likes.length);
       if (currentUser) {
         const isLiked = Likes.some(l => l.user_id === currentUser.id);
         setLiked(isLiked);
       }
    }
    if (Comments) {
        setComments(Comments);
    }
  }, [activity, currentUser]);

  const timeAgo = formatDistanceToNow(new Date(created_at), { addSuffix: true, locale: tr });

  // User modelinden (include ile) gelen veri her zaman en güncelidir.
  const actorName = User?.username || payload.username || "Kullanıcı";
  const actorAvatar = getAvatarUrl(User?.avatar || payload.userAvatar); // URL düzeltildi
  const actorId = User?.id || payload.userId;

  const getActionText = () => {
    switch (type) {
      case "rating": return "bir içeriği oyladı";
      case "review": return "bir yorum yaptı";
      case "list_add": return "listesine ekledi";
      case "follow": return ""; 
      default: return "bir işlem yaptı";
    }
  };

  const goToActorProfile = (e) => { e.stopPropagation(); if (actorId) navigate(`/profile/${actorId}`); };
  const goToTargetProfile = (e) => { e.stopPropagation(); if (payload.targetId) navigate(`/profile/${payload.targetId}`); };
  
  const goToContent = (e) => {
    if(e && (e.target.closest('button') || e.target.closest('input') || e.target.closest('.activity-comments-section'))) return;
    const targetId = payload.externalId || payload.contentId;
    const src = payload.source || 'db'; 
    const tp = payload.contentType || 'movie';
    if (targetId) navigate(`/content/${targetId}?source=${src}&type=${tp}`);
  };

  const handleLike = async (e) => {
    e.stopPropagation();
    if(!currentUser) return alert("Giriş yapmalısınız");
    const previousLiked = liked;
    setLiked(!liked);
    setLikeCount(prev => !liked ? prev + 1 : prev - 1);
    try {
        const res = await API.post(`/activities/${id}/like`);
        setLiked(res.data.liked); 
        setLikeCount(res.data.count);
    } catch(err) { setLiked(previousLiked); }
  };

  const handleCommentClick = (e) => {
    e.stopPropagation();
    setShowCommentInput(!showCommentInput);
  };

  const submitComment = async () => {
      if (!newComment.trim()) return;
      if(!currentUser) return alert("Giriş yapmalısınız");
      try {
          const res = await API.post(`/activities/${id}/comments`, { text: newComment });
          const addedComment = {
              ...res.data.comment,
              User: { username: currentUser.username, avatar: currentUser.avatar }
          };
          setComments([...comments, addedComment]);
          setNewComment("");
          setShowAllComments(true); 
      } catch(e) { alert("Yorum yapılamadı"); }
  };

  const displayedComments = showAllComments ? comments : comments.slice(0, COMMENTS_LIMIT);

  // Takip edilen avatarı için de kontrol
  const targetAvatarUrl = getAvatarUrl(payload.targetAvatar);

  return (
    <div className="activity-card">
      <div className="activity-header">
        <div className="activity-avatar" onClick={goToActorProfile}>
          {actorAvatar ? <img src={actorAvatar} alt="avatar" /> : <div className="avatar-placeholder-small">{actorName[0].toUpperCase()}</div>}
        </div>
        <div className="activity-meta">
          <div className="activity-user">
            <span className="username" onClick={goToActorProfile}>{actorName}</span>
            {type === 'follow' ? (
                <span className="action-text">
                  , <span className="target-username" onClick={goToTargetProfile}>
                    {payload.targetUsername || "bir kullanıcıyı"}
                  </span> kişisini takip etmeye başladı.
                </span>
            ) : (
                <span className="action-text">{getActionText()}</span>
            )}
          </div>
          <div className="activity-time">{timeAgo}</div>
        </div>
      </div>

      <div className="activity-body" onClick={type === 'follow' ? goToTargetProfile : goToContent}>
        
        {(type === 'rating' || type === 'review' || type === 'list_add') && (
          <div className="content-preview">
            <div className="preview-poster">
              <img src={payload.poster || "https://placehold.co/300x450?text=No+Img"} alt={payload.title} />
            </div>
            <div className="preview-info">
              <h4 className="content-title">{payload.title || payload.contentTitle}</h4>
              {type === 'rating' && <div className="rating-display"><div className="stars">{"★".repeat(Math.round(payload.rating / 2))}<span className="stars-empty">{"★".repeat(5 - Math.round(payload.rating / 2))}</span></div><span className="rating-number">{payload.rating}/10</span></div>}
              {type === 'review' && <div className="review-display"><p className="review-excerpt">"{payload.excerpt}"</p></div>}
              {type === 'list_add' && <div className="list-display"><span className="material-icons list-icon">playlist_add_check</span><span>"{payload.listName}" listesine eklendi.</span></div>}
            </div>
          </div>
        )}

        {type === 'follow' && (
           <div className="follow-display-card">
             <div className="follow-user-section" onClick={goToActorProfile}>
               <div className="follow-avatar-wrapper">
                 {actorAvatar ? <img src={actorAvatar} className="follow-avatar-img"/> : <div className="follow-placeholder">{actorName[0]}</div>}
               </div>
               <span className="follow-name">{actorName}</span>
             </div>
             <div className="follow-arrow"><span className="material-icons">arrow_forward</span></div>
             <div className="follow-user-section" onClick={goToTargetProfile}>
               <div className="follow-avatar-wrapper">
                 {targetAvatarUrl ? <img src={targetAvatarUrl} className="follow-avatar-img"/> : <div className="follow-placeholder">{(payload.targetUsername || "K")[0]}</div>}
               </div>
               <span className="follow-name">{payload.targetUsername}</span>
             </div>
           </div>
        )}
      </div>

      <div className="activity-footer">
        <button className={`act-btn like-btn ${liked ? 'active' : ''}`} onClick={handleLike}>
          <span className="material-icons">{liked ? 'thumb_up' : 'thumb_up_off_alt'}</span> {liked ? 'Beğendin' : 'Beğen'} ({likeCount})
        </button>
        <button className="act-btn comment-btn" onClick={handleCommentClick}>
          <span className="material-icons">chat_bubble_outline</span> 
          {comments.length > 0 ? comments.length : 'Yorum'}
        </button>
      </div>

      {(showCommentInput || comments.length > 0) && (
          <div className="activity-comments-section">
              {showCommentInput && (
                <div className="comment-input-wrapper">
                    <input 
                      type="text" 
                      className="inline-comment-input"
                      placeholder="Yorum yaz..."
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      onClick={e => e.stopPropagation()}
                      onKeyDown={e => { if(e.key === 'Enter') submitComment(); }}
                    />
                    <button onClick={(e)=>{e.stopPropagation(); submitComment();}} className="inline-send-btn" disabled={!newComment.trim()}>
                      <span className="material-icons">send</span>
                    </button>
                </div>
              )}

              <div className="inline-comment-list">
                  {displayedComments.map(c => {
                    // Yorum yapan kişinin avatarını da düzeltelim
                    const commentUserAvatar = getAvatarUrl(c.User?.avatar);
                    return (
                      <div key={c.id} className="inline-comment-item">
                          <div className="comment-avatar-tiny" style={{width: '24px', height: '24px', borderRadius: '50%', overflow: 'hidden', marginRight: '8px', flexShrink: 0}}>
                             {commentUserAvatar ? <img src={commentUserAvatar} style={{width:'100%', height:'100%', objectFit:'cover'}}/> : <div style={{background:'#eee', width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px'}}>{(c.User?.username || "U")[0]}</div>}
                          </div>
                          <div>
                            <span 
                                className="inline-comment-user" 
                                onClick={(e)=>{e.stopPropagation(); navigate(`/profile/${c.User?.id}`)}}
                            >
                                {c.User?.username}:
                            </span>
                            <span className="inline-comment-text ml-1">{c.text}</span>
                          </div>
                      </div>
                    );
                  })}
              </div>

              {comments.length > COMMENTS_LIMIT && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowAllComments(!showAllComments); }}
                  className="show-more-comments-btn"
                >
                  {showAllComments ? "Daha az göster" : `Diğer ${comments.length - COMMENTS_LIMIT} yorumu gör...`}
                </button>
              )}
          </div>
      )}
    </div>
  );
}