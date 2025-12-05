import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError(""); 
    setSuccess("");

    try {
      const res = await axios.post(`http://localhost:4000/api/auth/reset-password/${token}`, form);
      setSuccess(res.data.message);
      setTimeout(() => navigate("/"), 2000); // 2 saniye sonra login sayfasına yönlendir
    } catch (err) {
      setError(err?.response?.data?.message || "Şifre değiştirilemedi");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Yeni Şifre Belirle</h2>
          <p>Hesabınız için yeni bir şifre oluşturun</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-input-group">
            <label>Yeni Şifre</label>
            <input
              className="auth-input"
              type="password"
              name="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
            />
          </div>

          <div className="auth-input-group">
            <label>Şifreyi Tekrar</label>
            <input
              className="auth-input"
              type="password"
              name="confirmPassword"
              placeholder="••••••••"
              value={form.confirmPassword}
              onChange={handleChange}
            />
          </div>

          {error && <div className="auth-error">{error}</div>}
          {success && <div style={{ 
            backgroundColor: '#f0fdf4', 
            color: '#16a34a', 
            padding: '12px', 
            borderRadius: '8px', 
            fontSize: '0.9rem', 
            textAlign: 'center', 
            border: '1px solid #bbf7d0' 
          }}>{success}</div>}

          <button type="submit" className="auth-btn">Şifreyi Güncelle</button>
        </form>

        <div className="auth-footer">
          <button 
            onClick={() => navigate("/")} 
            className="auth-link"
          >
            Giriş Sayfasına Dön
          </button>
        </div>
      </div>
    </div>
  );
}
