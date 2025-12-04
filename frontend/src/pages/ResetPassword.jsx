import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: "", passwordConfirm: "" });
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
      setTimeout(() => navigate("/login"), 2000); // 2 saniye sonra login sayfasına yönlendir
    } catch (err) {
      setError(err?.response?.data?.message || "Şifre değiştirilemedi");
    }
  };

  return (
    <div style={{ maxWidth: 300, margin: "50px auto" }}>
      <h2>Yeni Şifre Belirle</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          name="password"
          placeholder="Yeni Şifre"
          value={form.password}
          onChange={handleChange}
        />
        <br />
        <input
          type="password"
          name="passwordConfirm"
          placeholder="Şifreyi Tekrar"
          value={form.passwordConfirm}
          onChange={handleChange}
        />
        <br />
        {error && <p style={{ color: "red" }}>{error}</p>}
        {success && <p style={{ color: "green" }}>{success}</p>}
        <button type="submit">Şifreyi Güncelle</button>
      </form>
    </div>
  );
}
