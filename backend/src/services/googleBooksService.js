const axios = require("axios");
require("dotenv").config();
const { fetchWithRetry } = require('../utils/apiUtils');

// Mevcut searchBooks fonksiyonu...
async function searchBooks(query, startIndex = 0) {
  try {
    const response = await fetchWithRetry(
      "https://www.googleapis.com/books/v1/volumes",
      {
        params: {
          q: query,
          startIndex,
          maxResults: 20,
          key: process.env.GOOGLE_BOOKS_API_KEY
        }
      },
      3,
      1000
    );

    if (!response.items) return [];

    return response.items.map((item) => {
      const volumeInfo = item.volumeInfo;
      return {
        external_id: item.id,
        source: "googlebooks",
        type: "book",
        title: volumeInfo.title || "Başlık bilinmiyor",
        overview: volumeInfo.description || "Açıklama bulunamadı.",
        year: volumeInfo.publishedDate?.slice(0, 4) || "N/A",
        poster_url: volumeInfo.imageLinks?.thumbnail || "https://placehold.co/500x750?text=Gorsel+Yok",
        metadata: {
          authors: volumeInfo.authors || [],
          publisher: volumeInfo.publisher || "",
          pageCount: volumeInfo.pageCount || 0,
          categories: volumeInfo.categories || [],
          genres: volumeInfo.categories || [] // Aynı veriyi genres olarak da kaydet
        }
      };
    });
  } catch (error) {
    console.error("Google Books API Hatası:", error.message);
    return [];
  }
}

// --- YENİ EKLENEN FONKSİYON ---
async function getBookDetails(volumeId) {
  try {
    const response = await fetchWithRetry(
      `https://www.googleapis.com/books/v1/volumes/${volumeId}`,
      {
        params: {
          key: process.env.GOOGLE_BOOKS_API_KEY
        }
      },
      3,
      1000
    );

    const volumeInfo = response.volumeInfo;

    return {
      external_id: volumeId,
      source: "googlebooks",
      type: "book",
      title: volumeInfo.title || "Başlık bilinmiyor",
      overview: volumeInfo.description || "Açıklama bulunamadı.",
      year: volumeInfo.publishedDate?.slice(0, 4) || "N/A",
      poster_url: volumeInfo.imageLinks?.thumbnail || 
                  volumeInfo.imageLinks?.smallThumbnail ||
                  "https://placehold.co/500x750?text=Gorsel+Yok",
      metadata: {
        authors: volumeInfo.authors || [],
        publisher: volumeInfo.publisher || "",
        publishedDate: volumeInfo.publishedDate || "",
        pageCount: volumeInfo.pageCount || 0,
        language: volumeInfo.language || "",
        isbn: volumeInfo.industryIdentifiers || [],
        categories: volumeInfo.categories || [],
        genres: volumeInfo.categories || [], // Aynı veriyi genres olarak da kaydet
        averageRating: volumeInfo.averageRating || null,
        ratingsCount: volumeInfo.ratingsCount || 0
      }
    };
  } catch (error) {
    console.error("Google Books Detail API Hatası:", error.message);
    throw error;
  }
}

module.exports = { searchBooks, getBookDetails };