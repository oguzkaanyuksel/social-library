import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/custom.css";

const API_BASE = "http://localhost:4000/api";
const BASE_URL = "http://localhost:4000"; // Avatar ve resimler için

export default function ContentDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const source = queryParams.get("source");

  // ------------------------------
  // STATE
  // ------------------------------
  const [content, setContent] = useState(null);
  const [dbContentId, setDbContentId] = useState(null);
  const [loading, setLoading] = useState(true);

  const [currentUserId, setCurrentUserId] = useState(null);
  const [userRating, setUserRating] = useState(0);
  const [libraryStatus, setLibraryStatus] = useState("none");
  
  // Site içi rating verileri
  const [averageRating, setAverageRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  const [customLists, setCustomLists] = useState([]);
  const [showListMenu, setShowListMenu] = useState(false);

  // Yeni eklenen özellikler
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editText, setEditText] = useState("");

  // Avatar tam URL helper
  const getAvatarUrl = (path) => {
    if (!path) return null;
    return path.startsWith('/')
      ? `http://localhost:4000${path}`
      : `http://localhost:4000/uploads/${path}`;
  };

  // ------------------------------
  // FETCH / INIT
  // ------------------------------
  useEffect(() => {
    const token = localStorage.getItem("token");

    // Kullanıcı bilgisi çek
    if (token) {
      axios
        .get(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          setCurrentUserId(res.data.user.id);
          fetchCustomLists(token);
        })
        .catch(() => {});
    }

    // Tüm verileri yükle
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // İçerik
        const contentRes = await axios.get(
          `${API_BASE}/content/${id}?source=${source || ""}`,
          { headers }
        );
        setContent(contentRes.data);
        setDbContentId(contentRes.data.id);

        // Yorumlar
        try {
          const reviewsRes = await axios.get(
            `${API_BASE}/reviews/content/${contentRes.data.id}`
          );
          setComments(reviewsRes.data.reviews || []);
        } catch (e) {}

        // Kullanıcı kütüphane durumu
        if (token) {
          try {
            const statusRes = await axios.get(
              `${API_BASE}/lists/my-status/${contentRes.data.id}`,
              { headers }
            );
            setLibraryStatus(statusRes.data.status);
          } catch (e) {}
          
          // Kullanıcının bu içeriğe verdiği puanı çek
          try {
            const userRatingRes = await axios.get(
              `${API_BASE}/ratings/my-rating/${contentRes.data.id}`,
              { headers }
            );
            if (userRatingRes.data.rating) {
              setUserRating(userRatingRes.data.rating.value);
            }
          } catch (e) {
            // Kullanıcı henüz puan vermemiş
          }
        }
        
        // İçeriğin ortalama rating'ini çek
        try {
          const avgRatingRes = await axios.get(
            `${API_BASE}/ratings/average/${contentRes.data.id}`
          );
          setAverageRating(avgRatingRes.data.average || 0);
          setRatingCount(avgRatingRes.data.count || 0);
        } catch (e) {
          // Rating yok
        }
      } catch (error) {
        console.error("Hata:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchAllData();
    else setLoading(false);
  }, [id, source]);

  // ------------------------------
  // ACTION FONKSİYONLARI
  // ------------------------------

  const fetchCustomLists = async (token) => {
    try {
      const res = await axios.get(`${API_BASE}/lists/my-custom-lists`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCustomLists(res.data.lists);
    } catch (e) {}
  };

  const handleRate = async (score) => {
    const token = localStorage.getItem("token");
    if (!token) return alert("Giriş yapmalısınız.");
    if (!dbContentId) return;

    try {
      await axios.post(
        `${API_BASE}/ratings`,
        { content_id: dbContentId, value: score },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUserRating(score);
      
      // Ortalama rating'i güncelle
      const avgRatingRes = await axios.get(
        `${API_BASE}/ratings/average/${dbContentId}`
      );
      setAverageRating(avgRatingRes.data.average || 0);
      setRatingCount(avgRatingRes.data.count || 0);
      
      alert(`${score} puan verildi!`);
    } catch (e) {
      alert("Hata: Puan verilemedi");
    }
  };

  const handleLibraryAction = async (statusKey) => {
    const token = localStorage.getItem("token");
    if (!token) return alert("Giriş yapmalısınız.");
    if (!dbContentId) return;

    try {
      const res = await axios.post(
        `${API_BASE}/lists/manage`,
        { content_id: dbContentId, status_key: statusKey },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLibraryStatus(res.data.status);
      alert(res.data.message);
    } catch (e) {
      console.error('Library action error:', e);
      alert("Hata: İşlem başarısız.");
    }
  };

  const handleAddToCustomList = async (listId) => {
    const token = localStorage.getItem("token");
    if (!token) return alert("Giriş yapmalısınız.");
    if (!dbContentId) return;

    try {
      await axios.post(
        `${API_BASE}/lists/add-item`,
        { list_id: listId, content_id: dbContentId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Listeye eklendi!");
      setShowListMenu(false);
    } catch (e) {
      alert("Hata");
    }
  };

  const handleAddComment = async () => {
    const token = localStorage.getItem("token");
    if (!token) return alert("Giriş yapmalısınız.");
    if (!newComment.trim() || !dbContentId) return;

    try {
      const res = await axios.post(
        `${API_BASE}/reviews`,
        { content_id: dbContentId, text: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const addedReview = {
        ...res.data.review,
        User: { username: "Ben", id: currentUserId, avatar: null },
      };

      setComments([addedReview, ...comments]);
      setNewComment("");
    } catch (e) {
      alert("Yorum gönderilemedi.");
    }
  };

  const handleDeleteComment = async (commentId) => {
    const token = localStorage.getItem("token");
    if (!window.confirm("Yorumu silmek istiyor musunuz?")) return;

    try {
      await axios.delete(`${API_BASE}/reviews/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComments(comments.filter((c) => c.id !== commentId));
    } catch (e) {
      alert("Silinemedi.");
    }
  };

  // ------------------------------
  // YORUM DÜZENLEME (YENİ ÖZELLİK)
  // ------------------------------
  const startEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditText(comment.text);
  };

  const saveEditComment = async (commentId) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await axios.put(
        `${API_BASE}/reviews/${commentId}`,
        { text: editText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setComments(
        comments.map((c) =>
          c.id === commentId ? { ...c, text: editText } : c
        )
      );

      setEditingCommentId(null);
      setEditText("");
    } catch (err) {
      alert("Yorum güncellenemedi.");
    }
  };

  const cancelEdit = () => {
    setEditingCommentId(null);
    setEditText("");
  };

  // ------------------------------
  // RENDER
  // ------------------------------
  if (loading) return <div className="loading-spinner"></div>;
  if (!content) return <div className="p-10 text-center">İçerik bulunamadı.</div>;

  const isMovie = content.type === "movie";
  const meta = content.metadata || {};
  let genresDisplay = "Belirtilmemiş";

  if (meta.genres) {
    if (Array.isArray(meta.genres)) {
       // Eğer string array ise (Google Books yapısı veya bizim map'lediğimiz yapı)
       if (typeof meta.genres[0] === 'string') {
          genresDisplay = meta.genres.join(", ");
       } 
       // Eğer obje array ise (TMDB ham verisi bazen böyle kalabilir: {name: 'Drama'})
       else if (typeof meta.genres[0] === 'object' && meta.genres[0].name) {
          genresDisplay = meta.genres.map(g => g.name).join(", ");
       }
    }
  }

  const creators = isMovie
    ? meta.director || "Bilinmiyor"
    : Array.isArray(meta.authors) && meta.authors.length > 0
    ? meta.authors.join(", ")
    : meta.authors || "Yazar bilgisi bulunamadı";
  
  // Subtitle varsa göster
  const subtitle = meta.subtitle || "";

  return (
    <div className="content-detail-page fade-in">
      {/* --------------------------------------------------- */}
      {/* KÜNYE BÖLÜMÜ */}
      {/* --------------------------------------------------- */}
      <div className="detail-info-box">
        <div className="detail-poster">
          <img
            src={
              content.poster_url ||
              "https://placehold.co/300x450?text=No+Poster"
            }
            alt={content.title}
          />
        </div>

        <div className="detail-texts">
          <h1 className="detail-title">{content.title}</h1>
          {subtitle && (
            <p className="text-gray-600 italic mb-2">{subtitle}</p>
          )}

          <div className="detail-subtitle">
            <span className="badge-type">{isMovie ? "FİLM" : "KİTAP"}</span>
            <span>{content.year}</span>
          </div>

          <div className="platform-rating">
            <div className="rating-score">
              <span className="rating-value">
                {averageRating > 0
                  ? averageRating.toFixed(1)
                  : "N/A"}
              </span>
              <span className="rating-label">PUAN</span>
            </div>
            <div className="rating-visuals">
              <div className="rating-count">{ratingCount} oy</div>
            </div>
          </div>

          <div className="summary-section">
            <h3>ÖZET</h3>
            <p className="summary-text">
              {content.overview && content.overview !== "Açıklama bulunamadı." 
                ? content.overview 
                : subtitle 
                ? `${subtitle}` 
                : "Bu kitap için detaylı açıklama bulunmamaktadır."}
            </p>
          </div>

          <div className="meta-grid">
            <div className="meta-item">
              <strong>{isMovie ? "YÖNETMEN" : "YAZAR"}</strong>
              <span>{creators}</span>
            </div>

            {/* --- YENİ EKLENEN TÜR ALANI --- */}
            <div className="meta-item">
              <strong>TÜR</strong>
              <span className={genresDisplay === "Belirtilmemiş" ? "text-gray-400" : ""}>
                {genresDisplay}
              </span>
            </div>
            {/* ----------------------------- */}

            <div className="meta-item">
              <strong>{isMovie ? "SÜRE" : "SAYFA"}</strong>
              <span>{isMovie ? meta.duration : `${meta.pageCount || 0} sayfa`}</span>
            </div>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------- */}
      {/* AKSİYONLAR */}
      {/* --------------------------------------------------- */}
      <div className="action-grid">
        {/* PUAN VER */}
        <div className="action-card">
          <div className="action-title">
            <span className="material-icons text-yellow-500">star</span> Puan Ver
          </div>
          <div className="interactive-stars">
            {[1,2,3,4,5,6,7,8,9,10].map((s) => (
              <button
                key={s}
                onClick={() => handleRate(s)}
                className={`star-btn ${s <= userRating ? "active" : ""}`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        {/* KÜTÜPHANE */}
        <div className="action-card">
          <div className="action-title">
            <span className="material-icons text-blue-500">library_add</span>{" "}
            Kütüphane
          </div>
          <div className="library-buttons">
            <button
              onClick={() => handleLibraryAction(isMovie ? "watched" : "read")}
              className={`lib-btn ${
                ["watched", "read"].includes(libraryStatus)
                  ? "watched"
                  : "default"
              }`}
            >
              {["watched", "read"].includes(libraryStatus) ? "✓ " : ""}
              {isMovie ? "İzledim" : "Okudum"}
            </button>

            <button
              onClick={() =>
                handleLibraryAction(isMovie ? "to_watch" : "to_read")
              }
              className={`lib-btn ${
                ["to_watch", "to_read", "towatch", "toread"].includes(
                  libraryStatus
                )
                  ? "towatch"
                  : "default"
              }`}
            >
              {["to_watch", "to_read", "towatch", "toread"].includes(libraryStatus) ? "✓ " : ""}
              {isMovie ? "İzlenecek" : "Okunacak"}
            </button>
          </div>
        </div>

        {/* ÖZEL LİSTE */}
        <div className="action-card relative">
          <div className="action-title">
            <span className="material-icons text-purple-500">
              playlist_add
            </span>{" "}
            Listeler
          </div>

          <button className="list-btn" onClick={() => setShowListMenu(!showListMenu)}>
            Özel Listeye Ekle <span className="material-icons">expand_more</span>
          </button>

          {showListMenu && (
            <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-2 z-20 py-2">
              {customLists.length === 0 ? (
                <div className="px-4 py-2 text-sm text-gray-500">
                  Hiç özel listeniz yok.
                </div>
              ) : (
                customLists.map((list) => (
                  <button
                    key={list.id}
                    onClick={() => handleAddToCustomList(list.id)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 block"
                  >
                    {list.name}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* --------------------------------------------------- */}
      {/* YORUMLAR */}
      {/* --------------------------------------------------- */}
      <div className="comments-section">
        <div className="section-title">Yorumlar ({comments.length})</div>

        {/* Yeni yorum */}
        <div className="comment-form">
          <div className="user-avatar">
            <span className="material-icons">person</span>
          </div>
          <div className="input-group">
            <textarea
              className="comment-textarea"
              placeholder="Düşüncelerin..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button className="send-btn" onClick={handleAddComment}>
              Gönder
            </button>
          </div>
        </div>

        {/* Yorum listesi */}
        <div className="comment-list">
          {comments.map((c) => {
            const username = c.User?.username || "Kullanıcı";
            const avatar = getAvatarUrl(c.User?.avatar);
            const userId = c.User?.id;

            const isOwner = currentUserId === userId;
            const isEditing = editingCommentId === c.id;

            return (
              <div key={c.id} className="comment-item">
                {/* Avatar */}
                <div
                  className="comment-avatar"
                  onClick={() => navigate(`/profile/${userId}`)}
                >
                  {avatar ? (
                    <img src={avatar} alt="avatar" />
                  ) : (
                    <div className="avatar-placeholder-small">
                      {username[0].toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Yorum içi */}
                <div className="comment-body">
                  <div
                    className="comment-username"
                    onClick={() => navigate(`/profile/${userId}`)}
                  >
                    {username}
                  </div>

                  {!isEditing ? (
                    <div className="comment-text">
                      {/* 150 karakter kontrol */}
                      {c.text.length > 150 ? (
                        <>
                          {c.showFull ? c.text : c.text.slice(0, 150) + "..."}
                          <button
                            className="read-more-btn"
                            onClick={() => {
                              // Toggle işlemi
                              setComments(prev =>
                                prev.map(item =>
                                  item.id === c.id
                                    ? { ...item, showFull: !item.showFull }
                                    : item
                                )
                              );
                            }}
                          >
                            {c.showFull ? "Daha az" : "Daha fazlasını oku"}
                          </button>
                        </>
                      ) : (
                        c.text
                      )}
                    </div>
                  ) : (
                    <div className="edit-box">
                      <textarea
                        className="edit-textarea"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                      />
                      <div className="edit-actions">
                        <button
                          className="edit-save"
                          onClick={() => saveEditComment(c.id)}
                        >
                          Kaydet
                        </button>
                        <button className="edit-cancel" onClick={cancelEdit}>
                          İptal
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Aksiyonlar */}
                {isOwner && !isEditing && (
                  <div className="comment-actions">
                    <button
                      className="comment-edit-btn"
                      onClick={() => startEditComment(c)}
                    >
                      <span className="material-icons">edit</span>
                    </button>

                    <button
                      className="comment-delete-btn"
                      onClick={() => handleDeleteComment(c.id)}
                    >
                      <span className="material-icons">delete</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
