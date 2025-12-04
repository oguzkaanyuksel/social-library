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
    <div style={{ maxWidth: 300, margin: "50px auto" }}>
      <h2>Giriş Yap</h2>

      <form onSubmit={handleSubmit}>
        <input
          name="email"
          placeholder="E-posta"
          value={form.email}
          onChange={handleChange}
        />
        <br />

        <input
          type="password"
          name="password"
          placeholder="Şifre"
          value={form.password}
          onChange={handleChange}
        />
        <br />

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button type="submit">Giriş Yap</button>
      </form>

      {/* Şifremi unuttum */}
      <button 
        onClick={handleForgotPassword}
        style={{ marginTop: "10px", display: "block" }}
      >
        Şifremi Unuttum
      </button>

      {/* Kayıt Ol butonu */}
      <button 
        onClick={() => navigate("/register")} 
        style={{ marginTop: "10px" }}
      >
        Kayıt Ol
      </button>
    </div>
  );
}
