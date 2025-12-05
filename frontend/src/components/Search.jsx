import React, { useState, useEffect, useRef } from "react";
import API from "../services/api"; 
import { useNavigate } from "react-router-dom";

export default function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ contents: [], users: [] });
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);

  const navigate = useNavigate();

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Avatar URL helper
  const getAvatarUrl = (path) => {
    if (!path) return null;
    return path.startsWith('/')
      ? `http://localhost:4000${path}`
      : `http://localhost:4000/uploads/${path}`;
  };

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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      navigate(`/search-results?q=${encodeURIComponent(query)}`);
      setShowResults(false);
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
    <div ref={searchRef} className="search-container relative w-full max-w-md">
      <input
        type="text"
        placeholder="Kitap, film veya kullanıcı ara..."
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        onFocus={() => { if(query) setShowResults(true); }}
        onClick={() => { if(query) setShowResults(true); }}
        onKeyDown={handleKeyDown}
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
                  onClick={() => goToProfile(user)}
                >
                  <div className="search-avatar">
                    {user.avatar ? (
                      <img
                        src={getAvatarUrl(user.avatar)}
                        alt={user.username}
                        style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%'}}
                        onError={(e) => { 
                          e.target.style.display = 'none'; 
                          const placeholder = document.createElement('div');
                          placeholder.className = 'avatar-placeholder-small';
                          placeholder.textContent = user.username[0].toUpperCase();
                          placeholder.style.cssText = 'width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #e5e7eb; color: #6b7280; font-weight: bold; border-radius: 50%';
                          e.target.parentNode.appendChild(placeholder);
                        }}
                      />
                    ) : (
                      <div className="avatar-placeholder-small" style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e5e7eb', color: '#6b7280', fontWeight: 'bold', borderRadius: '50%'}}>
                        {user.username[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <p className="font-semibold text-sm truncate">{user.username}</p>
                </div>
              ))}
              
              {results.users.length > 3 && (
                <div className="search-show-more" onClick={() => handleViewAll('users')}>
                  Tüm kullanıcıları gör ({results.users.length}+)
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}