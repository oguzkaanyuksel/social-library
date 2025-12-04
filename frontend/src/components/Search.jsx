import React, { useState } from "react";
import API from "../services/api"; 
import { useNavigate } from "react-router-dom";

export default function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ contents: [], users: [] });
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const navigate = useNavigate();

  const handleSearch = async (value) => {
    setQuery(value);
    
    if (!value.trim()) {
      setResults({ contents: [], users: [] });
      setShowResults(false);
      return;
    }

    setLoading(true);
    setShowResults(true);

    try {
      const response = await API.get(
        `/search?q=${encodeURIComponent(value)}&limit=5`
      );
      
      const uniqueContentsMap = new Map();
      if (response.data.contents) {
        response.data.contents.forEach(item => {
            const key = `${item.source}-${item.external_id}`;
            if (!uniqueContentsMap.has(key)) {
                uniqueContentsMap.set(key, item);
            }
        });
      }
      
      const uniqueContents = Array.from(uniqueContentsMap.values());

      setResults({
          contents: uniqueContents,
          users: response.data.users || []
      });

    } catch (err) {
      console.error("Arama hatası:", err);
      setResults({ contents: [], users: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleViewAll = (type) => {
    navigate(`/search-results?type=${type}&q=${encodeURIComponent(query)}`);
    setShowResults(false);
  };

  const goToDetail = (content) => {
    const targetId = content.external_id || content.id; 
    navigate(`/content/${targetId}?source=${content.source}&type=${content.type}`);
    setShowResults(false);
    setQuery("");
  };

  // GÜNCELLENDİ: Kullanıcı objesini alıp ID ile yönlendiriyor
  const goToProfile = (user) => {
    navigate(`/profile/${user.id}`);
    setShowResults(false);
    setQuery("");
  };

  return (
    <div className="search-container relative w-full max-w-md">
      <input
        type="text"
        placeholder="Kitap, film veya kullanıcı ara..."
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        onFocus={() => { if(query) setShowResults(true); }}
        className="w-full bg-gray-100 border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 transition-shadow focus:shadow-md"
      />

      {showResults && (results.contents.length > 0 || results.users.length > 0) && (
        <div className="search-dropdown">
          
          {results.contents.length > 0 && (
            <div className="search-section">
              <div className="search-header">İçerik</div>
              {results.contents.slice(0, 3).map((content) => (
                <div
                  key={`${content.source}-${content.external_id}`}
                  className="search-item"
                  onClick={() => goToDetail(content)}
                >
                  {content.poster_url && (
                    <img src={content.poster_url} alt={content.title} className="search-poster" />
                  )}
                  <div className="flex-1 overflow-hidden">
                    <p className="font-semibold text-sm truncate">{content.title}</p>
                    <p className="text-xs text-gray-600">
                      {content.type === "movie" ? "Film" : "Kitap"} • {content.year}
                    </p>
                  </div>
                </div>
              ))}
              
              {results.contents.length > 3 && (
                <div className="search-show-more" onClick={() => handleViewAll('contents')}>
                  Tüm içerikleri gör ({results.contents.length}+)
                </div>
              )}
            </div>
          )}

          {results.users.length > 0 && (
            <div className="search-section">
              <div className="search-header">Kullanıcılar</div>
              {results.users.slice(0, 3).map((user) => (
                <div
                  key={user.id}
                  className="search-user-item"
                  onClick={() => goToProfile(user)} // User objesini gönderiyoruz
                >
                  <div className="search-avatar bg-gray-200 flex items-center justify-center">
                    {user.avatar ? (
                      <img
                        src={user.avatar.startsWith('/') 
                          ? `http://localhost:4000${user.avatar}` 
                          : `http://localhost:4000/uploads/${user.avatar}`}
                        alt={user.username}
                        onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.style.backgroundColor = '#ccc'; }}
                      />
                    ) : (
                      <span className="material-icons text-xl text-gray-400">person</span>
                    )}
                  </div>
                  <p className="font-semibold text-sm truncate">{user.username}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}