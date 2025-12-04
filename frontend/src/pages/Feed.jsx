import React, { useEffect, useState, useRef } from "react";
import API from "../services/api";
import ActivityCard from "../components/ActivityCard";
import "../styles/custom.css";

export default function Feed() {
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentUser, setCurrentUser] = useState(null); // Mevcut kullanıcı
  
  const effectRan = useRef(false);

  useEffect(() => {
    // Kullanıcı bilgisini al
    API.get("/auth/me").then(res => setCurrentUser(res.data.user)).catch(() => {});

    if (!effectRan.current) {
      loadMore();
      effectRan.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadMore() {
    if (loading) return;
    setLoading(true);

    try {
      const res = await API.get("/feed", {
        params: { cursor, limit: 10 },
      });

      const list = res.data.activities;

      setItems((prev) => {
        const newItems = list.filter(newItem => !prev.some(prevItem => prevItem.id === newItem.id));
        return [...prev, ...newItems];
      });

      if (list.length < 10) setHasMore(false);
      
      if (list.length > 0) {
        setCursor(list[list.length - 1].id);
      }
    } catch (err) {
      console.error("Feed yüklenemedi", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="feed-container">
      <h2 className="feed-title">Zaman Tüneli</h2>

      <div className="feed-timeline">
        <div className="timeline-line"></div>

        <div className="space-y-6">
          {items.map((item) => (
            // currentUser prop'u eklendi
            <ActivityCard key={item.id} activity={item} currentUser={currentUser} />
          ))}

          {loading && <div className="text-center text-gray-500 py-4">Yükleniyor...</div>}

          {!loading && hasMore && (
            <button
              className="btn my-4 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded transition"
              onClick={loadMore}
            >
              Daha Fazla Yükle
            </button>
          )}
          
          {!loading && !hasMore && items.length > 0 && (
            <p className="text-center text-gray-500 my-4 text-sm">
              Tüm aktiviteler yüklendi.
            </p>
          )}

          {!loading && items.length === 0 && (
             <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
               <span className="material-icons text-4xl mb-2 text-gray-300">feed</span>
               <p>Henüz bir aktivite yok. Arkadaşlarını takip etmeye başla!</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}