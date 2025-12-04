import React, { useEffect, useState } from "react";
import API from "../services/api";
import { useNavigate, useParams } from "react-router-dom";
import ActivityCard from "../components/ActivityCard";
import "../styles/custom.css";

const BASE_URL = "http://localhost:4000"; // Resimler için base URL

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [profileUser, setProfileUser] = useState(null); 
  const [currentUser, setCurrentUser] = useState(null); 
  const [lists, setLists] = useState({ watched: [], towatch: [], read: [], toread: [], custom: [] });
  const [activities, setActivities] = useState([]);
  const [activeTab, setActiveTab] = useState("watched");
  const [isFollowing, setIsFollowing] = useState(false);

  // --- DÜZENLEME STATE'LERİ ---
  const [isEditing, setIsEditing] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editAvatarFile, setEditAvatarFile] = useState(null);
  const [previewAvatar, setPreviewAvatar] = useState(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const meRes = await API.get("/auth/me");
      setCurrentUser(meRes.data.user);

      const targetId = id || meRes.data.user.id;
      
      const profileRes = await API.get(`/users/profile/${targetId}`);
      setProfileUser(profileRes.data.user);
      setActivities(profileRes.data.activities || []);

      const listsRes = await API.get(`/lists/user/${targetId}`);
      const grouped = { watched: [], towatch: [], read: [], toread: [], custom: [] };
      
      if(listsRes.data.lists) {
          listsRes.data.lists.forEach(list => {
              const items = list.ListItems ? list.ListItems.map(li => li.Content) : [];
              if (list.title === 'İzlediklerim') grouped.watched = items;
              else if (list.title === 'İzlenecekler') grouped.towatch = items;
              else if (list.title === 'Okuduklarım') grouped.read = items;
              else if (list.title === 'Okunacaklar') grouped.toread = items;
              else grouped.custom.push(list); 
          });
      }
      setLists(grouped);

      if (id && parseInt(id) !== meRes.data.user.id) {
          const followRes = await API.get(`/users/is-following/${targetId}`);
          setIsFollowing(followRes.data.isFollowing);
      }

    } catch (err) {
      console.error("Profil yüklenemedi", err);
    }
  };

  // --- İŞLEM FONKSİYONLARI ---

  const handleFollow = async () => {
      try {
          await API.post(`/users/follow/${profileUser.id}`);
          setIsFollowing(!isFollowing);
          // Takipçi sayısını güncellemek için veriyi tekrar çekebiliriz
          fetchData(); 
      } catch(e) { alert("İşlem başarısız"); }
  };

  const handleCreateList = async () => {
      const title = prompt("Yeni liste adı:");
      if(!title) return;
      try {
          await API.post('/lists/create', { title });
          fetchData();
      } catch(e) { alert("Liste oluşturulamadı"); }
  };

  // --- DÜZENLEME FONKSİYONLARI ---

  const openEditModal = () => {
    setEditBio(profileUser.bio || "");
    setPreviewAvatar(null);
    setEditAvatarFile(null);
    setIsEditing(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditAvatarFile(file);
      setPreviewAvatar(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async () => {
    try {
      const formData = new FormData();
      formData.append("bio", editBio);
      // Username değiştirmek isterseniz buraya ekleyebilirsiniz
      // formData.append("username", editUsername); 
      if (editAvatarFile) {
        formData.append("avatar", editAvatarFile);
      }

      await API.put("/auth/me", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      alert("Profil güncellendi!");
      setIsEditing(false);
      fetchData(); // Sayfayı yenilemeden verileri güncelle
    } catch (err) {
      console.error(err);
      alert("Güncelleme başarısız oldu.");
    }
  };

  if (!profileUser) return <div className="loading-spinner"></div>;

  const isOwner = currentUser && currentUser.id === profileUser.id;
  const currentList = lists[activeTab] || [];

  // Avatar URL Helper
  const getAvatarUrl = (path) => {
    if (!path) return null;
    return path.startsWith('/')
      ? `http://localhost:4000${path}`
      : `http://localhost:4000/uploads/${path}`;
  };

  return (
    <div className="profile-page fade-in">
      {/* HEADER */}
      <div className="profile-header-card">
        <div className="profile-cover"></div>
        <div className="profile-info-section">
          <div className="profile-avatar-wrapper">
             {profileUser.avatar ? (
                <img src={getAvatarUrl(profileUser.avatar)} className="profile-avatar-img" alt={profileUser.username} />
             ) : (
                <div className="profile-avatar-placeholder">{profileUser.username[0].toUpperCase()}</div>
             )}
          </div>
          
          <div className="profile-details">
            <h1 className="profile-username">{profileUser.username}</h1>
            <p className="profile-bio">{profileUser.bio || "Merhaba, ben bir kütüphane kurdunu!"}</p>
            
            <div className="profile-stats">
              <div className="stat-item"><span className="stat-value">{profileUser.followersCount || 0}</span><span className="stat-label">Takipçi</span></div>
              <div className="stat-item"><span className="stat-value">{profileUser.followingCount || 0}</span><span className="stat-label">Takip</span></div>
            </div>
          </div>

          <div className="profile-actions">
              {isOwner ? (
                  <div className="flex gap-2">
                      <button onClick={openEditModal} className="edit-profile-btn"><span className="material-icons">edit</span> Düzenle</button>
                      <button onClick={handleCreateList} className="edit-profile-btn bg-purple-50 text-purple-700 border-purple-200"><span className="material-icons">add</span> Yeni Liste</button>
                  </div>
              ) : (
                  <button onClick={handleFollow} className={`edit-profile-btn ${isFollowing ? 'bg-red-50 text-red-600' : 'bg-blue-600 text-white border-transparent'}`}>
                      {isFollowing ? 'Takipten Çık' : 'Takip Et'}
                  </button>
              )}
          </div>
        </div>
      </div>

      {/* DÜZENLEME MODALI */}
      {isEditing && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Profili Düzenle</h3>
            
            <div className="modal-body">
              {/* Avatar Değiştirme */}
              <div className="edit-avatar-section">
                <div className="current-avatar">
                  {previewAvatar ? (
                    <img src={previewAvatar} alt="Preview" />
                  ) : profileUser.avatar ? (
                    <img src={getAvatarUrl(profileUser.avatar)} alt="Current" />
                  ) : (
                    <div className="avatar-placeholder">{profileUser.username[0]}</div>
                  )}
                </div>
                <label className="upload-btn">
                  Fotoğraf Yükle
                  <input type="file" accept="image/*" onChange={handleFileChange} hidden />
                </label>
              </div>

              {/* Bio Düzenleme */}
              <div className="form-group">
                <label>Biyografi</label>
                <textarea 
                  value={editBio} 
                  onChange={(e) => setEditBio(e.target.value)} 
                  rows="3"
                  className="form-input"
                  placeholder="Kendinden bahset..."
                />
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setIsEditing(false)} className="btn-cancel">İptal</button>
              <button onClick={handleSaveProfile} className="btn-save">Kaydet</button>
            </div>
          </div>
        </div>
      )}

      {/* İÇERİK ALANI (Tablar ve Grid) */}
      <div className="profile-content">
        <div className="profile-tabs">
          {[
            { k: 'watched', l: 'İzlediklerim', i: 'movie' },
            { k: 'towatch', l: 'İzlenecekler', i: 'schedule' },
            { k: 'read', l: 'Okuduklarım', i: 'menu_book' },
            { k: 'toread', l: 'Okunacaklar', i: 'bookmark_border' }
          ].map(tab => (
            <button key={tab.k} onClick={()=>setActiveTab(tab.k)} className={`tab-btn ${activeTab===tab.k?'active':''}`}>
              <span className="material-icons tab-icon">{tab.i}</span> {tab.l} <span className="tab-count">{lists[tab.k]?.length||0}</span>
            </button>
          ))}
        </div>

        <div className="content-grid mb-10">
          {currentList.length === 0 ? (
            <div className="empty-state">
                <span className="material-icons empty-icon">inbox</span>
                <p>Bu listede henüz içerik yok.</p>
            </div>
          ) : (
            currentList.map(c => (
              <div key={c.id} className="content-card" onClick={()=>navigate(`/content/${c.external_id}?source=${c.source}&type=${c.type}`)}>
                  <div className="poster-wrapper">
                      <img src={c.poster_url || "https://placehold.co/300x450"} className="poster-img" alt={c.title}/>
                      <div className="content-type-badge">{c.type === 'movie' ? 'FİLM' : 'KİTAP'}</div>
                  </div>
                  <div className="card-info"><h4 className="content-title">{c.title}</h4></div>
              </div>
            ))
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Özel Listeler */}
            <div className="col-span-1">
                <h3 className="font-bold text-lg mb-4 text-gray-800">Özel Listeler</h3>
                {lists.custom.length === 0 ? <p className="text-gray-400 text-sm">Özel liste yok.</p> : (
                    <ul className="space-y-2">
                        {lists.custom.map(l => (
                            <li key={l.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm font-medium text-gray-700 flex justify-between items-center">
                                {l.title} 
                                <span className="bg-gray-100 px-2 py-1 rounded-full text-xs text-gray-500 font-bold">{l.ListItems?.length || 0}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Son Aktiviteler */}
            <div className="col-span-2">
                <h3 className="font-bold text-lg mb-4 text-gray-800">Son Aktiviteler</h3>
                <div className="space-y-4">
                    {activities.length === 0 ? <p className="text-gray-400 text-sm">Henüz aktivite yok.</p> : (
                        activities.map(act => (
                            <ActivityCard key={act.id} activity={act} currentUser={currentUser} />
                        ))
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}