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
    <div style={{ maxWidth: 300, margin: "50px auto" }}>
      <h2>Kayıt Ol</h2>

      <form onSubmit={handleSubmit}>
        <input name="username" placeholder="Kullanıcı Adı" onChange={handleChange} />
        <br />

        <input name="email" placeholder="E-posta" onChange={handleChange} />
        <br />

        <input type="password" name="password" placeholder="Şifre" onChange={handleChange} />
        <br />

        <input
          type="password"
          name="confirmPassword"
          placeholder="Şifre Tekrar"
          onChange={handleChange}
        />
        <br />

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button type="submit">Kayıt Ol</button>
      </form>

      {/* Giriş yap butonu */}
      <button
        onClick={() => navigate("/")}
        style={{ marginTop: "15px" }}
      >
        Giriş Yap
      </button>
    </div>
  );
}
