const axios = require('axios');
require('dotenv').config();

const { fetchWithRetry } = require('../utils/apiUtils');

const TMDB_BASE = 'https://api.themoviedb.org/3';

async function searchMovies(query, page = 1) {
  try {
    const resData = await fetchWithRetry(`${TMDB_BASE}/search/movie`, {
      params: {
        api_key: process.env.TMDB_API_KEY,
        query,
        page,
      }
    }, 3, 1000);

    if (!resData.results) return [];

    // Her film için detaylı bilgi çek (genre bilgisi için)
    const detailedMovies = await Promise.all(
      resData.results.slice(0, 10).map(async (movie) => {
        try {
          const details = await getMovieDetails(movie.id);
          
          const year = movie.release_date ? movie.release_date.split("-")[0] : null;
          const defaultImage = "https://placehold.co/500x750?text=Gorsel+Yok"; 
          const posterUrl = movie.poster_path 
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` 
            : defaultImage;

          return {
            external_id: movie.id.toString(),
            source: 'tmdb',
            type: 'movie',
            title: movie.title || "Adsız Film",
            overview: movie.overview || "Özet bulunmuyor.",
            year: year,
            poster_url: posterUrl,
            metadata: {
              popularity: movie.popularity,
              vote_average: details.vote_average,
              vote_count: details.vote_count,
              genres: details.genres || [], // Genre bilgisi eklendi
              director: details.director || 'Bilinmiyor',
              duration: details.duration || null
            }
          };
        } catch (err) {
          console.error(`Film detayı çekilemedi: ${movie.id}`, err.message);
          // Hata durumunda temel bilgiyle dön
          const year = movie.release_date ? movie.release_date.split("-")[0] : null;
          const defaultImage = "https://placehold.co/500x750?text=Gorsel+Yok"; 
          const posterUrl = movie.poster_path 
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` 
            : defaultImage;

          return {
            external_id: movie.id.toString(),
            source: 'tmdb',
            type: 'movie',
            title: movie.title || "Adsız Film",
            overview: movie.overview || "Özet bulunmuyor.",
            year: year,
            poster_url: posterUrl,
            metadata: {
              popularity: movie.popularity,
              vote_average: movie.vote_average,
              genres: [] // Boş genre
            }
          };
        }
      })
    );

    return detailedMovies;
  } catch (error) {
    console.error("TMDB Arama API Hatası:", error.message);
    return [];
  }
}

// Detay Çekme Fonksiyonu (ContentDetail için gereklidir)
async function getMovieDetails(id) {
    const resData = await fetchWithRetry(`${TMDB_BASE}/movie/${id}`, {
        params: {
            api_key: process.env.TMDB_API_KEY,
            append_to_response: 'credits'
        }
    }, 3, 1000);
    
    return {
        ...resData,
        director: resData.credits?.crew?.find(crew => crew.job === 'Director')?.name || 'Bilinmiyor',
        genres: resData.genres?.map(g => g.name) || [],
        duration: resData.runtime ? `${resData.runtime} dk` : null,
        vote_average: resData.vote_average,
        vote_count: resData.vote_count
    };
}

module.exports = { searchMovies, getMovieDetails };