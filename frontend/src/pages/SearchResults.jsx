import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";

// Yardımcı Bileşen: Açılıp Kapanabilir Metin
const ExpandableText = ({ text, maxLength = 100 }) => {
  const [expanded, setExpanded] = useState(false);

  if (!text) return <p className="text-sm text-gray-400 italic">Açıklama yok.</p>;

  if (text.length <= maxLength) {
    return <p className="text-sm text-gray-600">{text}</p>;
  }

  return (
    <div className="text-sm text-gray-600">
      <p>
        {expanded ? text : `${text.substring(0, maxLength)}...`}
      </p>
      <button
        onClick={(e) => {
          e.stopPropagation(); // Kart tıklamasını engelle
          setExpanded(!expanded);
        }}
        className="read-more-btn"
      >
        {expanded ? "Daha Az Göster" : "Daha Fazla Göster"}
      </button>
    </div>
  );
};

export default function SearchResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const q = queryParams.get("q");
  const type = queryParams.get("type"); // 'contents' veya 'users' (URL parametresinden gelir)

  useEffect(() => {
    // Token kontrolü: Eğer giriş yapılmamışsa ana sayfaya at
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    if (!q) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `http://localhost:4000/api/search?q=${encodeURIComponent(q)}&limit=50`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (type === 'users') {
          setResults(response.data.users || []);
        } else {
          setResults(response.data.contents || []);
        }
      } catch (err) {
        console.error("Arama sonuçları alınamadı:", err);
        if (err.response && err.response.status === 401) {
          localStorage.removeItem("token");
          navigate("/");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [q, type, navigate]);

  // Karta tıklama işlemi
  const handleCardClick = (item) => {
    if (type === 'users') {
      // Kullanıcı profiline git (GÜNCELLENDİ)
      navigate(`/profile/${item.id}`);
    } else {
      // İçerik detayına git
      navigate(`/content/${item.external_id}?source=${item.source}&type=${item.type}`);
    }
  };

  return (
    <div className="container mx-auto p-4 pt-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-4">
        <span className="text-blue-600">"{q}"</span> için {type === 'users' ? 'Kullanıcı' : 'İçerik'} Sonuçları
      </h2>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {results.length === 0 && (
            <div className="text-center text-gray-500 py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <span className="material-icons text-4xl mb-2 block">search_off</span>
              Aradığınız kriterlere uygun sonuç bulunamadı.
            </div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {results.map((item) => (
              <div 
                key={item.id || item.external_id} 
                className="result-card group cursor-pointer hover:shadow-xl transition-shadow duration-300"
                onClick={() => handleCardClick(item)}
              >
                
                {/* --- KULLANICI KARTI --- */}
                {type === 'users' ? (
                  <div className="flex flex-col items-center p-6 text-center h-full">
                    <div className="user-avatar-wrapper mb-4">
                       {item.avatar ? (
                        <img 
                          src={item.avatar.startsWith('/') 
                            ? `http://localhost:4000${item.avatar}` 
                            : `http://localhost:4000/uploads/${item.avatar}`}
                          alt={item.username} 
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
                        />
                       ) : null}
                       <div className="fallback-avatar hidden">
                          <span className="material-icons text-5xl text-gray-400">person</span>
                       </div>
                       {!item.avatar && (
                         <div className="fallback-avatar flex">
                            <span className="material-icons text-5xl text-gray-400">person</span>
                         </div>
                       )}
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 mb-1">{item.username}</h3>
                    <div className="w-full mt-2">
                       <ExpandableText text={item.bio || "Henüz bir biyografi eklenmemiş."} maxLength={60} />
                    </div>
                  </div>
                ) : (
                  /* --- İÇERİK KARTI --- */
                  <div className="flex flex-col h-full">
                    <div className="card-image-wrapper relative">
                      {item.poster_url ? (
                        <img 
                          src={item.poster_url} 
                          alt={item.title} 
                          className="card-image w-full h-auto object-cover" 
                        />
                      ) : (
                        <div className="h-64 flex flex-col items-center justify-center text-gray-400 bg-gray-100">
                          <span className="material-icons text-4xl mb-2">image_not_supported</span>
                          <span className="text-xs">Görsel Yok</span>
                        </div>
                      )}
                      <div className="card-badge absolute top-2 right-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded">
                        {item.type === 'movie' ? 'Film' : 'Kitap'}
                      </div>
                    </div>
                    
                    <div className="card-content p-4 flex flex-col flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-gray-900 leading-tight line-clamp-2 text-sm" title={item.title}>
                          {item.title}
                        </h3>
                        {item.year && (
                          <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded ml-2 shrink-0">
                            {item.year}
                          </span>
                        )}
                      </div>
                      
                      <div className="mt-auto">
                        <ExpandableText text={item.overview} maxLength={80} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}