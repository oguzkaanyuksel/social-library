import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function TopRated() {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadTopRated();
  }, []);

  async function loadTopRated() {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:4000/api/content/top-rated", {
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
  
  if (!contents || contents.length === 0) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>En Yüksek Puanlılar</h1>
        </div>
        <div className="empty-state">
          <div className="empty-icon">⭐</div>
          <p className="text-gray-500 text-lg">Henüz puanlanmış içerik bulunmamaktadır.</p>
          <p className="text-gray-400 text-sm mt-2">İçerikleri keşfet ve puan vererek bu listeyi oluşturmaya yardımcı ol!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>En Yüksek Puanlılar</h1>
      </div>
      
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
                ⭐ {content.average_rating?.toFixed(1) || "N/A"}
              </div>
            </div>
            <div className="card-info">
              <h3 className="content-title">{content.title}</h3>
              <p className="content-year">{content.rating_count || 0} oy</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}