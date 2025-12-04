import React from "react";
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

  const shouldHideNavbar = 
    pathname === "/" ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/reset-password");

  return (
    <div>
      {!shouldHideNavbar && (
        <nav className="w-full bg-white border-b px-6 py-2 flex items-center justify-between sticky top-0 z-50 shadow-sm gap-4 flex-nowrap">
          {/* -------- Left: Logo -------- */}
          <div 
            className="flex items-center gap-2 cursor-pointer flex-shrink-0"
            onClick={() => navigate("/feed")}
          >
            <div className="bg-blue-600 text-white w-9 h-9 rounded-md flex items-center justify-center text-lg font-bold">
              SL
            </div>
            <span className="text-xl font-semibold text-gray-800 whitespace-nowrap">Social Library</span>
          </div>

          {/* -------- Middle: Search Bar -------- */}
          <div className="flex-1 min-w-0 max-w-md">
            <Search />
          </div>

          {/* -------- Right: Menu Buttons -------- */}
          <div className="flex items-center gap-6 flex-shrink-0">
            <button
              onClick={() => navigate("/feed")}
              className="flex flex-col items-center text-gray-600 hover:text-blue-600 transition"
            >
              <span className="material-icons text-2xl">home</span>
              <span className="text-xs whitespace-nowrap">Feed</span>
            </button>

            <button
              onClick={() => navigate("/top-rated")}
              className="flex flex-col items-center text-gray-600 hover:text-blue-600 transition"
            >
              <span className="material-icons text-2xl">star</span>
              <span className="text-xs whitespace-nowrap">En İyiler</span>
            </button>

            <button
              onClick={() => navigate("/popular")}
              className="flex flex-col items-center text-gray-600 hover:text-blue-600 transition"
            >
              <span className="material-icons text-2xl">trending_up</span>
              <span className="text-xs whitespace-nowrap">Popüler</span>
            </button>

            <button
              onClick={() => navigate("/discover")}
              className="flex flex-col items-center text-gray-600 hover:text-blue-600 transition"
            >
              <span className="material-icons text-2xl">explore</span>
              <span className="text-xs whitespace-nowrap">Keşfet</span>
            </button>

            <button
              onClick={() => navigate("/profile")}
              className="flex flex-col items-center text-gray-600 hover:text-blue-600 transition"
            >
              <span className="material-icons text-2xl">person</span>
              <span className="text-xs whitespace-nowrap">Profil</span>
            </button>

            <button
              onClick={() => { 
                localStorage.removeItem("token"); 
                navigate("/");
              }}
              className="flex flex-col items-center text-red-500 hover:text-red-600 transition"
            >
              <span className="material-icons text-2xl">logout</span>
              <span className="text-xs whitespace-nowrap">Çıkış</span>
            </button>
          </div>
        </nav>
      )}

      {/* İçerik Alanı */}
      <div className={!shouldHideNavbar ? "pt-20 md:pt-24" : ""}>
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