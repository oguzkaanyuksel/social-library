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
      setAllGenres(res.data);
      setFilteredGenres(res.data); // Başlangıçta hepsini göster
    } catch (err) {
      console.error("Genre yüklenemedi:", err);
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
      setFilteredGenres(res.data);
    }).catch(err => {
      console.error("Genre filtreleme hatası:", err);
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
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">İçerik Keşfet</h1>

      {/* Filtreler */}
      <div className="card mb-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Tür</label>
            <select
              className="w-full border rounded px-3 py-2"
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

          <div>
            <label className="block text-sm font-semibold mb-1">Kategori</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={filters.genre}
              onChange={(e) => setFilters({ ...filters, genre: e.target.value })}
              disabled={loadingGenres}
            >
              <option value="">
                {loadingGenres ? "Yükleniyor..." : "Tümü"}
              </option>
              {filteredGenres.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Yıl</label>
            <input
              type="number"
              className="w-full border rounded px-3 py-2"
              placeholder="Örn: 2020"
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Min. Puan</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="10"
              className="w-full border rounded px-3 py-2"
              placeholder="Örn: 7.5"
              value={filters.minRating}
              onChange={(e) => setFilters({ ...filters, minRating: e.target.value })}
            />
          </div>
        </div>

        <button
          onClick={handleSearch}
          className="btn mt-4"
        >
          Ara
        </button>
      </div>

      {/* Sonuçlar */}
      {loading ? (
        <p className="text-center">Yükleniyor...</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {contents.map((content) => (
            <div
              key={content.id}
              className="cursor-pointer hover:scale-105 transition"
              onClick={() => navigate(`/content/${content.external_id}?source=${content.source}`)}
            >
              <img
                src={content.poster_url || "/placeholder.png"}
                alt={content.title}
                className="w-full h-64 object-cover rounded-lg shadow-md"
              />
              <h3 className="mt-2 font-semibold text-sm">{content.title}</h3>
              <p className="text-xs text-gray-600">⭐ {content.average_rating?.toFixed(1) || "N/A"}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}