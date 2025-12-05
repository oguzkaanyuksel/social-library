import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Discover() {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [allGenres, setAllGenres] = useState([]); // Tüm genre'ler
  const [filteredGenres, setFilteredGenres] = useState([]); // Filtrelenmiş genre'ler
  const [loadingGenres, setLoadingGenres] = useState(true);
  const navigate = useNavigate();

  // Filtre state'leri
  const [filters, setFilters] = useState({
    type: "",
    genre: "",
    year: "",
    minRating: ""
  });

  useEffect(() => {
    loadGenres();
    handleSearch();
  }, []);

  // Tür değiştiğinde genre'leri filtrele
  useEffect(() => {
    filterGenresByType();
  }, [filters.type, allGenres]);

  async function loadGenres() {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:4000/api/content/genres", {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("📚 Yüklenen genre'ler:", res.data);
      setAllGenres(res.data);
      setFilteredGenres(res.data); // Başlangıçta hepsini göster
    } catch (err) {
      console.error("Genre yüklenemedi:", err);
      console.error("Hata detayı:", err.response?.data);
    } finally {
      setLoadingGenres(false);
    }
  }

  function filterGenresByType() {
    if (!filters.type) {
      setFilteredGenres(allGenres);
      return;
    }

    // Backend'den türe göre genre'leri çek
    const token = localStorage.getItem("token");
    axios.get(`http://localhost:4000/api/content/genres?type=${filters.type}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      console.log(`📚 ${filters.type} için filtrelenmiş genre'ler:`, res.data);
      setFilteredGenres(res.data);
    }).catch(err => {
      console.error("Genre filtreleme hatası:", err);
      console.error("Hata detayı:", err.response?.data);
    });
  }

  async function handleSearch() {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (filters.type) params.append("type", filters.type);
      if (filters.genre) params.append("genre", filters.genre);
      if (filters.year) params.append("year", filters.year);
      if (filters.minRating) params.append("minRating", filters.minRating);

      const res = await axios.get(`http://localhost:4000/api/content/discover?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setContents(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>İçerik Keşfet</h1>
      </div>

      {/* Filtreler */}
      <div className="filter-card">
        <div className="filter-grid">
          <div className="filter-group">
            <label>Tür</label>
            <select
              className="filter-select"
              value={filters.type}
              onChange={(e) => {
                setFilters({ ...filters, type: e.target.value, genre: "" });
              }}
            >
              <option value="">Tümü</option>
              <option value="movie">Film</option>
              <option value="book">Kitap</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Kategori</label>
            <select
              className="filter-select"
              value={filters.genre}
              onChange={(e) => setFilters({ ...filters, genre: e.target.value })}
              disabled={loadingGenres}
            >
              <option value="">
                {loadingGenres ? "Yükleniyor..." : "Tümü"}
              </option>
              {filteredGenres.map((g, index) => (
                <option key={`${g}-${index}`} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Yıl</label>
            <input
              type="number"
              className="filter-input"
              placeholder="Örn: 2020"
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: e.target.value })}
            />
          </div>

          <div className="filter-group">
            <label>Min. Puan</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="10"
              className="filter-input"
              placeholder="Örn: 7.5"
              value={filters.minRating}
              onChange={(e) => setFilters({ ...filters, minRating: e.target.value })}
            />
          </div>
        </div>

        <button
          onClick={handleSearch}
          className="filter-btn"
        >
          Ara
        </button>
      </div>

      {/* Sonuçlar */}
      {loading ? (
        <div className="loading-spinner"></div>
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
                  {content.average_rating ? `⭐ ${content.average_rating.toFixed(1)}` : '-'}
                </div>
              </div>
              <div className="card-info">
                <h3 className="content-title">{content.title}</h3>
                <p className="content-year">
                  {content.rating_count ? `${content.rating_count} oy` : "Henüz puanlanmamış"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}