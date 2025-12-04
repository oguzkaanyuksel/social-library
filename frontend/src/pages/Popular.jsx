import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Popular() {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadPopular();
  }, []);

  async function loadPopular() {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:4000/api/content/popular", {
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
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">En Popüler İçerikler</h1>
      
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
            <p className="text-xs text-gray-600">💬 {content.review_count || 0} yorum</p>
          </div>
        ))}
      </div>
    </div>
  );
}