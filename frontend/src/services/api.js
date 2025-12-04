import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:4000/api"
});

// İstekleri yakala (Interceptor)
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Yanıtları yakala
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 Unauthorized hatası gelirse token'ı sil ve ana sayfaya at
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default API;