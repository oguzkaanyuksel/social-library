import React, { useState } from "react";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";

import Feed from "./pages/Feed";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import ResetPassword from "./pages/ResetPassword";
import SearchResults from "./pages/SearchResults"; 
import ContentDetail from "./pages/ContentDetail";
import TopRated from "./pages/TopRated";
import Popular from "./pages/Popular";
import Discover from "./pages/Discover";

import Search from "./components/Search"; 

export default function App() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const shouldHideNavbar = 
    pathname === "/" ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/reset-password");

  const handleNavigation = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
    setMobileMenuOpen(false);
  };

  return (
    <div>
      {!shouldHideNavbar && (
        <nav className="navbar">
          <div className="navbar-container">
            {/* -------- Left: Logo -------- */}
            <div 
              className="nav-logo"
              onClick={() => handleNavigation("/feed")}
            >
              <div className="logo-icon">
                SL
              </div>
              <span className="logo-text">Social Library</span>
            </div>

            {/* -------- Middle: Search Bar -------- */}
            <div className="nav-search">
              <Search />
            </div>

            {/* -------- Right: Desktop Menu -------- */}
            <div className="nav-actions desktop-menu">
              <button onClick={() => handleNavigation("/feed")} className="nav-btn">
                <span className="material-icons">home</span>
                <span className="nav-label">Feed</span>
              </button>

              <button onClick={() => handleNavigation("/top-rated")} className="nav-btn">
                <span className="material-icons">star</span>
                <span className="nav-label">En İyiler</span>
              </button>

              <button onClick={() => handleNavigation("/popular")} className="nav-btn">
                <span className="material-icons">trending_up</span>
                <span className="nav-label">Popüler</span>
              </button>

              <button onClick={() => handleNavigation("/discover")} className="nav-btn">
                <span className="material-icons">explore</span>
                <span className="nav-label">Keşfet</span>
              </button>

              <button onClick={() => handleNavigation("/profile")} className="nav-btn">
                <span className="material-icons">person</span>
                <span className="nav-label">Profil</span>
              </button>

              <button onClick={handleLogout} className="nav-btn logout">
                <span className="material-icons">logout</span>
                <span className="nav-label">Çıkış</span>
              </button>
            </div>

            {/* -------- Mobile Menu Toggle -------- */}
            <button 
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="material-icons">
                {mobileMenuOpen ? "close" : "menu"}
              </span>
            </button>
          </div>

          {/* -------- Mobile Dropdown Menu -------- */}
          {mobileMenuOpen && (
            <div className="mobile-menu-dropdown">
              <button onClick={() => handleNavigation("/feed")} className="mobile-nav-item">
                <span className="material-icons">home</span>
                <span>Feed</span>
              </button>

              <button onClick={() => handleNavigation("/top-rated")} className="mobile-nav-item">
                <span className="material-icons">star</span>
                <span>En İyiler</span>
              </button>

              <button onClick={() => handleNavigation("/popular")} className="mobile-nav-item">
                <span className="material-icons">trending_up</span>
                <span>Popüler</span>
              </button>

              <button onClick={() => handleNavigation("/discover")} className="mobile-nav-item">
                <span className="material-icons">explore</span>
                <span>Keşfet</span>
              </button>

              <button onClick={() => handleNavigation("/profile")} className="mobile-nav-item">
                <span className="material-icons">person</span>
                <span>Profil</span>
              </button>

              <button onClick={handleLogout} className="mobile-nav-item logout">
                <span className="material-icons">logout</span>
                <span>Çıkış</span>
              </button>
            </div>
          )}
        </nav>
      )}

      {/* İçerik Alanı */}
      <div className={!shouldHideNavbar ? "pt-4" : ""}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/feed" element={<Feed />} />
          
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:id" element={<Profile />} />
          
          <Route path="/search-results" element={<SearchResults />} />
          <Route path="/content/:id" element={<ContentDetail />} />
          
          {/* Yeni Sayfalar */}
          <Route path="/top-rated" element={<TopRated />} />
          <Route path="/popular" element={<Popular />} />
          <Route path="/discover" element={<Discover />} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  );
}