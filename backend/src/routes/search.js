const express = require("express");
const router = express.Router();
const { User, Content } = require("../models");
const authMiddleware = require("../middlewares/auth");
const { Op } = require("sequelize");

const { searchMovies } = require("../services/tmdbService");
const { searchBooks } = require("../services/googleBooksService");

// GET /api/search?q=Harry&limit=10
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { q, limit } = req.query;
    const queryLimit = limit ? parseInt(limit) : 10;

    if (!q || q.trim().length < 2) {
      return res.json({ contents: [], users: [] });
    }

    // 1. Harici API'lerden veri çek
    const [movieResults, bookResults] = await Promise.all([
      searchMovies(q).catch(err => { console.error("Movie Error:", err); return []; }),
      searchBooks(q).catch(err => { console.error("Book Error:", err); return []; })
    ]);

    // 2. API sonuçlarını birleştir
    const externalResults = [...movieResults, ...bookResults];

    // 3. API'den gelenleri DB'ye kaydet (Sessizce)
    for (const item of externalResults) {
      if (!item.title || item.title.trim() === "") continue;
      try {
        await Content.findOrCreate({
          where: { external_id: item.external_id, source: item.source },
          defaults: item
        });
      } catch (dbError) { continue; }
    }

    // 4. DB'den sonuçları çek (Bu, API'den gelenlerin DB versiyonlarını da içerir)
    const dbContents = await Content.findAll({
      where: {
        [Op.or]: [
          { title: { [Op.like]: `%${q}%` } },
          { overview: { [Op.like]: `%${q}%` } }
        ]
      },
      limit: queryLimit * 2, // Daha fazla çekip sonra filtreleyeceğiz
      order: [['year', 'DESC']]
    });

    // 5. DEDUPLICATION (Çift Kayıtları Temizle)
    // Hem API'den hem DB'den gelenler karışabilir.
    // Önceliği DB'den gelenlere verelim çünkü ID'leri bizim sistemimize ait.
    
    const uniqueContentMap = new Map();

    // Önce DB sonuçlarını ekle
    dbContents.forEach(c => {
        const key = `${c.source}-${c.external_id}`;
        uniqueContentMap.set(key, c.toJSON()); // Sequelize instance -> JSON
    });

    // Sonra API sonuçlarını ekle (Eğer map'te yoksa)
    // Not: Aslında yukarıda DB'ye kaydettik ve DB'den çektik, yani externalResults'taki her şey
    // teorik olarak dbContents içinde olmalı. Ancak zamanlama (async) nedeniyle olmayabilir.
    // Bu yüzden externalResults'ı da kontrol edelim.
    externalResults.forEach(item => {
        const key = `${item.source}-${item.external_id}`;
        if (!uniqueContentMap.has(key)) {
             // DB'de henüz yoksa veya sorguya takılmadıysa ekle
             // Ancak frontend için bir 'id' (internal id) olması iyi olur.
             // DB'ye henüz yazılmadıysa id'si null olabilir, bu durumda external_id ile idare ederiz.
             uniqueContentMap.set(key, { ...item, id: null }); 
        }
    });

    // Map'ten array'e çevir ve limiti uygula
    const uniqueContents = Array.from(uniqueContentMap.values()).slice(0, queryLimit);

    // Kullanıcıları ara
    const users = await User.findAll({
      where: {
        [Op.or]: [
          { username: { [Op.like]: `%${q}%` } },
          { email: { [Op.like]: `%${q}%` } }
        ]
      },
      attributes: ['id', 'username', 'avatar', 'bio'],
      limit: 5
    });

    res.json({ contents: uniqueContents, users });

  } catch (err) {
    console.error("Search Route Error:", err);
    res.status(500).json({ message: 'Arama sırasında sunucu hatası oluştu.' });
  }
});

module.exports = router;