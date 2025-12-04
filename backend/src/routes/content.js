const express = require("express");
const router = express.Router();
const { Content } = require("../models");
const axios = require("axios");
const { Op } = require("sequelize");
const authMiddleware = require("../middlewares/auth");

// Servisleri içe aktar
const { getMovieDetails } = require("../services/tmdbService");
const { getBookDetails } = require("../services/googleBooksService");
const genreSyncService = require('../services/genreSync');

// ÖNEMLİ: Özel route'lar önce tanımlanmalı!

// GET /api/content/genres - Tüm benzersiz genre'leri getir
router.get('/genres', authMiddleware, async (req, res) => {
  try {
    const { type } = req.query;
    const { Genre } = require('../models');
    
    const where = {};
    if (type) where.type = type;

    const genres = await Genre.findAll({
      where,
      attributes: ['name'],
      order: [['name', 'ASC']]
    });

    const genreNames = genres.map(g => g.name);
    res.json(genreNames);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Hata oluştu', error: err.message });
  }
});

// GET /api/content/top-rated
router.get('/top-rated', authMiddleware, async (req, res) => {
  try {
    const { Rating } = require("../models");
    
    // Tüm içerikleri al
    const contents = await Content.findAll({
      limit: 100
    });
    
    // Her içerik için ortalama rating hesapla
    const contentsWithRating = await Promise.all(
      contents.map(async (content) => {
        const ratings = await Rating.findAll({
          where: { content_id: content.id }
        });
        
        const average_rating = ratings.length > 0
          ? ratings.reduce((sum, r) => sum + (r.rating || r.score || r.value || 0), 0) / ratings.length
          : 0;
        
        return {
          ...content.toJSON(),
          average_rating,
          rating_count: ratings.length
        };
      })
    );
    
    // 7 ve üzeri olanları filtrele ve sırala
    const topRated = contentsWithRating
      .filter(c => c.average_rating >= 7)
      .sort((a, b) => b.average_rating - a.average_rating)
      .slice(0, 20);
    
    res.json(topRated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Hata oluştu', error: err.message });
  }
});

// GET /api/content/popular
router.get('/popular', authMiddleware, async (req, res) => {
  try {
    const { Review } = require("../models");
    
    // Her içerik için review sayısını hesapla
    const contents = await Content.findAll({
      attributes: {
        include: [
          [
            require('sequelize').literal(`(
              SELECT COUNT(*)
              FROM reviews
              WHERE reviews.content_id = Content.id
            )`),
            'review_count'
          ]
        ]
      },
      order: [[require('sequelize').literal('review_count'), 'DESC']],
      limit: 20
    });
    
    res.json(contents);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Hata oluştu', error: err.message });
  }
});

// GET /api/content/discover
router.get('/discover', authMiddleware, async (req, res) => {
  try {
    const { type, genre, year, minRating } = req.query;
    const where = {};

    if (type) where.type = type;
    if (year) where.year = year;

    // Genre filtrelemesi için metadata içinde arama
    let contents = await Content.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: 200 // Daha fazla veri çekiyoruz filtrelemek için
    });

    // Genre filtresi varsa metadata içinde ara
    if (genre) {
      contents = contents.filter(content => {
        const metadata = content.metadata || {};
        
        // Film için genres kontrolü
        if (content.type === 'movie') {
          const genres = metadata.genres || [];
          return genres.some(g => {
            if (typeof g === 'object' && g.name) {
              return g.name.toLowerCase().includes(genre.toLowerCase());
            }
            return g.toLowerCase().includes(genre.toLowerCase());
          });
        }
        
        // Kitap için categories VE genres kontrolü
        if (content.type === 'book') {
          const categories = metadata.categories || [];
          const genres = metadata.genres || [];
          
          return categories.some(cat => cat.toLowerCase().includes(genre.toLowerCase())) ||
                 genres.some(g => g.toLowerCase().includes(genre.toLowerCase()));
        }
        
        return false;
      });
    }

    // MinRating filtresi varsa rating hesapla
    if (minRating) {
      const { Rating } = require("../models");
      
      const contentsWithRating = await Promise.all(
        contents.map(async (content) => {
          const ratings = await Rating.findAll({
            where: { content_id: content.id }
          });
          
          const average_rating = ratings.length > 0
            ? ratings.reduce((sum, r) => sum + (r.rating || r.score || r.value || 0), 0) / ratings.length
            : 0;
          
          return {
            ...content.toJSON(),
            average_rating
          };
        })
      );
      
      // Min rating filtresi uygula
      contents = contentsWithRating
        .filter(c => c.average_rating >= parseFloat(minRating))
        .sort((a, b) => b.average_rating - a.average_rating)
        .slice(0, 50);
    } else {
      // Rating filtresi yoksa sadece 50 tane al
      contents = contents.slice(0, 50).map(c => c.toJSON());
    }

    res.json(contents);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Hata oluştu', error: err.message });
  }
});

// GET /api/content/:id?source=... (En sona taşındı - DİNAMİK ROUTE EN SONDA OLMALI!)
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params; 
    const { source } = req.query;

    // 1. Source yoksa veya 'db' ise yerel ID ile bul
    if (!source || source === 'undefined' || source === 'null' || source === 'db') {
      const internalContent = await Content.findByPk(id);
      if (internalContent) return res.json(internalContent);
      return res.status(404).json({ message: "İçerik bulunamadı." });
    }

    // 2. DB'de external_id ve source ile ara
    let content = await Content.findOne({
      where: { external_id: id, source }
    });

    // 3. EKSİK VERİ KONTROLÜ (Update Logic)
    let needsUpdate = false;

    if (content) {
       const meta = content.metadata || {};
       
       // TMDB Kontrolü - genres array kontrolü eklendi
       if (source === 'tmdb') {
          if (!meta.director || 
              !meta.duration || 
              !meta.genres || 
              !Array.isArray(meta.genres) || 
              meta.genres.length === 0) {
            needsUpdate = true;
          }
       } 
       // GOOGLE BOOKS Kontrolü
       else if (source === 'googlebooks') {
          if (content.overview === "Açıklama bulunamadı." || 
              !meta.genres || 
              !Array.isArray(meta.genres) || 
              meta.genres.length === 0) {
             needsUpdate = true;
          }
       }

       // Eğer veriler tamsa ve güncellenmesi gerekmiyorsa direkt döndür
       if (!needsUpdate) {
          return res.json(content);
       }
       
       console.log(`${source} için eksik veriler tamamlanıyor: ${id}`);
    }

    // 4. API'den Çekme ve DB Güncelleme/Oluşturma
    let externalDataFormatted;

    try {
        if (source === "tmdb") {
            const tmdbData = await getMovieDetails(id);
            
            const posterUrl = tmdbData.poster_path 
                ? (tmdbData.poster_path.startsWith('http') ? tmdbData.poster_path : `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}`)
                : "https://placehold.co/500x750?text=Gorsel+Yok";

            externalDataFormatted = {
                external_id: id,
                source: "tmdb",
                type: "movie",
                title: tmdbData.title,
                overview: tmdbData.overview,
                year: tmdbData.release_date?.slice(0, 4),
                poster_url: posterUrl,
                metadata: {
                  ...tmdbData,
                  genres: tmdbData.genres || [] // Genre bilgisini ekle
                }
            };

        } else if (source === "googlebooks") {
            const bookData = await getBookDetails(id);
            
            externalDataFormatted = {
                external_id: bookData.external_id,
                source: "googlebooks",
                type: "book",
                title: bookData.title,
                overview: bookData.overview,
                year: bookData.year,
                poster_url: bookData.poster_url,
                metadata: bookData.metadata
            };
        }

        // DB İşlemleri
        if (externalDataFormatted) {
            if (content) {
                await content.update(externalDataFormatted);
            } else {
                content = await Content.create(externalDataFormatted);
            }
            
            // Yeni içerik eklendiyse genre tablosunu güncelle (async)
            genreSyncService.syncNewContent(content.id).catch(err => {
              console.error('Genre sync hatası:', err);
            });
        }

        return res.json(content);

    } catch (e) {
        console.error("API Fetch Error:", e.message);
        if (content) return res.json(content);
        return res.status(404).json({ message: "Kaynak serviste içerik bulunamadı." });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Sunucu hatası", error: err.message });
  }
});

module.exports = router;