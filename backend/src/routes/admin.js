const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const genreSyncService = require('../services/genreSync');

// POST /api/admin/sync-genres - Tüm genre'leri senkronize et
router.post('/sync-genres', authMiddleware, async (req, res) => {
  try {
    // Sadece admin kullanıcılar çalıştırabilir (opsiyonel)
    // if (req.user.role !== 'admin') {
    //   return res.status(403).json({ message: 'Yetkiniz yok' });
    // }

    const result = await genreSyncService.syncAllGenres();
    
    res.json({
      message: 'Genre senkronizasyonu tamamlandı',
      ...result
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Senkronizasyon hatası', error: err.message });
  }
});

module.exports = router;