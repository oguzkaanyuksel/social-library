import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = e =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");

    try {
    const res = await axios.post("http://localhost:4000/api/auth/login", form);

    // token kaydet
    localStorage.setItem("token", res.data.token);

    // yönlendir
    navigate("/feed");
    } catch (err) {
    setError(err?.response?.data?.message || "Giriş yapılamadı");
    }
  };

  const handleForgotPassword = async () => {
    const email = prompt("Şifre sıfırlama için e-posta adresinizi girin:");

    if (!email) return;

    try {
      const res = await axios.post("http://localhost:4000/api/auth/forgot-password", { email });
      alert("Şifre sıfırlama linki e-posta adresinize gönderildi.");
    } catch (err) {
      alert(err?.response?.data?.message || "E-posta gönderilemedi");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Giriş Yap</h2>
          <p>Hesabınıza erişmek için giriş yapın</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-input-group">
            <label>E-posta</label>
            <input
              className="auth-input"
              name="email"
              placeholder="ornek@email.com"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div className="auth-input-group">
            <label>Şifre</label>
            <input
              className="auth-input"
              type="password"
              name="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-btn">Giriş Yap</button>
        </form>

        <div className="auth-footer">
          <button 
            onClick={handleForgotPassword}
            className="auth-link"
          >
            Şifremi Unuttum
          </button>

          <div>
            Hesabınız yok mu?{" "}
            <button 
              onClick={() => navigate("/register")} 
              className="auth-link"
            >
              Kayıt Ol
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
