import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = e =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post("http://localhost:4000/api/auth/register", form);
      alert("Kayıt başarılı.");
      localStorage.setItem("token", res.data.token);
      navigate("/feed");
    } catch (err) {
      setError(err?.response?.data?.message || "Kayıt yapılamadı");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Kayıt Ol</h2>
          <p>Yeni bir hesap oluşturun</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-input-group">
            <label>Kullanıcı Adı</label>
            <input
              className="auth-input"
              name="username"
              placeholder="kullaniciadi"
              onChange={handleChange}
            />
          </div>

          <div className="auth-input-group">
            <label>E-posta</label>
            <input
              className="auth-input"
              name="email"
              placeholder="ornek@email.com"
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
              onChange={handleChange}
            />
          </div>

          <div className="auth-input-group">
            <label>Şifre Tekrar</label>
            <input
              className="auth-input"
              type="password"
              name="confirmPassword"
              placeholder="••••••••"
              onChange={handleChange}
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-btn">Kayıt Ol</button>
        </form>

        <div className="auth-footer">
          <div>
            Zaten hesabınız var mı?{" "}
            <button
              onClick={() => navigate("/")}
              className="auth-link"
            >
              Giriş Yap
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
