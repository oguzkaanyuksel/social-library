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
      limit: 200
    });
    
    // Her içerik için ortalama rating hesapla
    const contentsWithRating = await Promise.all(
      contents.map(async (content) => {
        const ratings = await Rating.findAll({
          where: { content_id: content.id }
        });
        
        const average_rating = ratings.length > 0
          ? ratings.reduce((sum, r) => sum + (r.value || 0), 0) / ratings.length
          : 0;
        
        return {
          ...content.toJSON(),
          average_rating,
          rating_count: ratings.length
        };
      })
    );
    
    // Rating'i olan içerikleri filtrele ve sırala (eşik kaldırıldı)
    const topRated = contentsWithRating
      .filter(c => c.rating_count > 0) // En az 1 rating olmalı
      .sort((a, b) => b.average_rating - a.average_rating)
      .slice(0, 50); // İlk 50 içerik
    
    console.log(`✅ Top Rated: ${topRated.length} içerik bulundu`);
    res.json(topRated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Hata oluştu', error: err.message });
  }
});

// GET /api/content/popular
router.get('/popular', authMiddleware, async (req, res) => {
  try {
    const { category = 'reviews' } = req.query; // 'reviews' veya 'lists'
    const { Review, ListItem } = require("../models");
    
    if (category === 'lists') {
      // En çok listelenen içerikler
      const contents = await Content.findAll({
        attributes: {
          include: [
            [
              require('sequelize').literal(`(
                SELECT COUNT(*)
                FROM list_items
                WHERE list_items.content_id = Content.id
              )`),
              'list_count'
            ]
          ]
        },
        having: require('sequelize').literal('list_count > 0'), // 0 olanları gösterme
        order: [[require('sequelize').literal('list_count'), 'DESC']],
        limit: 50
      });
      
      return res.json(contents);
    }
    
    // En çok yorumlanan içerikler (default)
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
      having: require('sequelize').literal('review_count > 0'), // 0 olanları gösterme
      order: [[require('sequelize').literal('review_count'), 'DESC']],
      limit: 50
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
    
    // 1. VERİTABANINDAN MEVCUT İÇERİKLERİ ÇEK
    const where = {};
    if (type) where.type = type;
    if (year) where.year = year;

    let dbContents = await Content.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });

    // Genre filtresi varsa metadata içinde ara
    if (genre) {
      dbContents = dbContents.filter(content => {
        const metadata = content.metadata || {};
        const genres = metadata.genres || [];
        
        // Tam eşleşme kontrolü (case-insensitive)
        return genres.some(g => {
          const genreName = typeof g === 'object' && g.name ? g.name : g;
          return genreName.toLowerCase() === genre.toLowerCase();
        });
      });
    }

    // 2. API'DEN YENİ İÇERİKLERİ ÇEK (GENRE VARSA)
    let apiContents = [];
    
    if (genre && type) {
      try {
        const { searchMovies } = require('../services/tmdbService');
        const { searchBooks } = require('../services/googleBooksService');
        
        if (type === 'movie') {
          // TMDB'de genre ile arama yap
          console.log(`🔍 TMDB'de "${genre}" arıyor...`);
          const movieResults = await searchMovies(genre, 1);
          
          // Sayfa 2 ve 3'ü de çek
          const page2 = await searchMovies(genre, 2);
          const page3 = await searchMovies(genre, 3);
          
          apiContents = [...movieResults, ...page2, ...page3];
          
        } else if (type === 'book') {
          // Google Books'da kategori ile arama yap
          console.log(`🔍 Google Books'da "${genre}" arıyor...`);
          const bookResults = await searchBooks(`subject:${genre}`, 0);
          
          // Daha fazla sonuç için startIndex artır
          const batch2 = await searchBooks(`subject:${genre}`, 20);
          const batch3 = await searchBooks(`subject:${genre}`, 40);
          
          apiContents = [...bookResults, ...batch2, ...batch3];
        }
        
        // API'den gelen içerikleri veritabanına kaydet (duplicate önleme)
        for (const apiContent of apiContents) {
          const [savedContent, created] = await Content.findOrCreate({
            where: {
              external_id: apiContent.external_id,
              source: apiContent.source
            },
            defaults: apiContent
          });
          
          if (created) {
            console.log(`➕ Yeni içerik kaydedildi: ${savedContent.title}`);
          }
        }
        
      } catch (apiErr) {
        console.error('API arama hatası:', apiErr.message);
        // API hatası olsa bile DB sonuçlarını göster
      }
    }

    // 3. DB'DEKİ TÜM SONUÇLARI BİRLEŞTİR (API'den yeni eklenenler de dahil)
    let allContents = await Content.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });

    // Genre filtresi tekrar uygula
    if (genre) {
      allContents = allContents.filter(content => {
        const metadata = content.metadata || {};
        const genres = metadata.genres || [];
        
        return genres.some(g => {
          const genreName = typeof g === 'object' && g.name ? g.name : g;
          return genreName.toLowerCase() === genre.toLowerCase();
        });
      });
    }

    // DUPLICATE KONTROLÜ: Aynı external_id ve source'a sahip içerikleri temizle
    const uniqueMap = new Map();
    allContents.forEach(item => {
      const key = `${item.source}-${item.external_id}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, item);
      }
    });
    allContents = Array.from(uniqueMap.values());

    // 4. MinRating filtresi varsa rating hesapla
    if (minRating) {
      const { Rating } = require("../models");
      
      const contentsWithRating = await Promise.all(
        allContents.map(async (content) => {
          const ratings = await Rating.findAll({
            where: { content_id: content.id }
          });
          
          const average_rating = ratings.length > 0
            ? ratings.reduce((sum, r) => sum + (r.value || 0), 0) / ratings.length
            : 0;
          
          return {
            ...content.toJSON(),
            average_rating,
            rating_count: ratings.length
          };
        })
      );
      
      // Min rating filtresi uygula ve sırala
      allContents = contentsWithRating
        .filter(c => c.average_rating >= parseFloat(minRating))
        .sort((a, b) => b.average_rating - a.average_rating);
    } else {
      // Rating hesapla ama filtre uygulama
      const { Rating } = require("../models");
      
      const contentsWithRating = await Promise.all(
        allContents.map(async (content) => {
          const ratings = await Rating.findAll({
            where: { content_id: content.id }
          });
          
          const average_rating = ratings.length > 0
            ? ratings.reduce((sum, r) => sum + (r.value || 0), 0) / ratings.length
            : 0;
          
          return {
            ...content.toJSON(),
            average_rating,
            rating_count: ratings.length
          };
        })
      );
      
      allContents = contentsWithRating;
    }

    console.log(`✅ Toplam ${allContents.length} sonuç bulundu`);
    res.json(allContents);
    
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