import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Popular() {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('reviews'); // 'reviews' veya 'lists'
  const navigate = useNavigate();

  useEffect(() => {
    loadPopular();
  }, [category]);

  async function loadPopular() {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`http://localhost:4000/api/content/popular?category=${category}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setContents(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <p className="text-center mt-10">Yükleniyor...</p>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>En Popüler İçerikler</h1>
      </div>
      
      {/* Kategori Seçimi */}
      <div className="category-tabs">
        <button
          onClick={() => setCategory('reviews')}
          className={`category-tab ${category === 'reviews' ? 'active' : 'inactive'}`}
        >
          💬 En Çok Yorumlananlar
        </button>
        <button
          onClick={() => setCategory('lists')}
          className={`category-tab ${category === 'lists' ? 'active' : 'inactive'}`}
        >
          📚 En Çok Listelenenler
        </button>
      </div>
      
      {loading ? (
        <div className="loading-spinner"></div>
      ) : contents.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📉</div>
          <p className="text-gray-500 text-lg">Henüz {category === 'reviews' ? 'yorumlanmış' : 'listelenmiş'} içerik bulunmamaktadır.</p>
        </div>
      ) : (
      <div className="content-grid">
        {contents.map((content) => (
          <div
            key={content.id}
            className="content-card"
            onClick={() => navigate(`/content/${content.external_id}?source=${content.source}`)}
          >
            <div className="poster-wrapper">
              <img
                src={content.poster_url || "/placeholder.png"}
                alt={content.title}
                className="poster-img"
              />
              <div className="card-badge">
                {category === 'reviews' ? '💬' : '📚'}
              </div>
            </div>
            <div className="card-info">
              <h3 className="content-title">{content.title}</h3>
              <p className="content-year">
                {category === 'reviews' ? (
                  <>{content.review_count || 0} yorum</>
                ) : (
                  <>{content.list_count || 0} listede</>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}