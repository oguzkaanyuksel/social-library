const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { Rating, Content, Activity, User } = require('../models');

// POST /api/ratings -> Puan ver veya güncelle
router.post('/', auth, async (req, res) => {
  const { content_id, value } = req.body; 
  
  try {
    const user = await User.findByPk(req.user.id);
    const content = await Content.findByPk(content_id);

    const [rating, created] = await Rating.findOrCreate({
      where: { user_id: req.user.id, content_id },
      defaults: { value }
    });

    if (!created) {
      rating.value = value;
      await rating.save();
    }

    // PAYLOAD GÜNCELLENDİ
    await Activity.create({
      user_id: req.user.id,
      type: "rating",
      payload: {
        userId: user.id,
        username: user.username,
        userAvatar: user.avatar,
        contentId: content.id,
        externalId: content.external_id,
        source: content.source,
        contentType: content.type,
        title: content.title,
        poster: content.poster_url,
        rating: value
      }
    });

    res.json({ rating });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/ratings/my-rating/:content_id -> Kullanıcının bu içeriğe verdiği puanı getir
router.get('/my-rating/:content_id', auth, async (req, res) => {
  try {
    const rating = await Rating.findOne({
      where: {
        user_id: req.user.id,
        content_id: req.params.content_id
      }
    });
    
    res.json({ rating });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/ratings/average/:content_id -> İçeriğin ortalama puanını getir
router.get('/average/:content_id', async (req, res) => {
  try {
    const ratings = await Rating.findAll({
      where: { content_id: req.params.content_id }
    });
    
    if (ratings.length === 0) {
      return res.json({ average: 0, count: 0 });
    }
    
    const sum = ratings.reduce((acc, r) => acc + r.value, 0);
    const average = sum / ratings.length;
    
    res.json({ 
      average: Math.round(average * 10) / 10, // 1 ondalık basamak
      count: ratings.length 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;