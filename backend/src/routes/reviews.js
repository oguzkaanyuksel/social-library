const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { Review, Content, Activity, User } = require('../models');

router.post('/', auth, async (req, res) => {
  const { content_id, text } = req.body;
  if (!content_id || !text) return res.status(400).json({ message: "Eksik alan" });

  try {
    const user = await User.findByPk(req.user.id);
    const content = await Content.findByPk(content_id);
    if (!content) return res.status(404).json({ message: "İçerik bulunamadı" });

    const review = await Review.create({
      user_id: req.user.id,
      content_id,
      text
    });

    // PAYLOAD GÜNCELLENDİ: source, type, external_id eklendi
    await Activity.create({
      user_id: req.user.id,
      type: "review",
      payload: {
        userId: user.id,
        username: user.username,
        userAvatar: user.avatar, // Avatar eklendi
        contentId: content.id,
        externalId: content.external_id, // Önemli
        source: content.source,          // Önemli
        contentType: content.type,       // Önemli
        title: content.title,
        poster: content.poster_url,
        excerpt: text.substring(0, 100) + (text.length > 100 ? "..." : "")
      }
    });

    // Frontend uyumluluğu
    const reviewWithUser = review.toJSON();
    reviewWithUser.User = { id: user.id, username: user.username, avatar: user.avatar };

    res.json({ review: reviewWithUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ... Diğer endpointler aynı kalabilir ...
// GET ve DELETE endpointlerini koruyun

router.get('/content/:contentId', async (req, res) => {
  try {
    const reviews = await Review.findAll({
      where: { content_id: req.params.contentId },
      include: [{ model: User, attributes: ['id', 'username', 'avatar'] }],
      order: [['created_at', 'DESC']]
    });
    res.json({ reviews });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) return res.status(404).json({ message: "Yorum bulunamadı" });
    if (review.user_id !== req.user.id) return res.status(403).json({ message: "Yetkisiz" });
    await review.destroy();
    res.json({ message: "Silindi" });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

router.put('/:id', auth, async (req, res) => {
    const { text } = req.body;
    try {
      const review = await Review.findByPk(req.params.id);
      if (!review) return res.status(404).json({ message: "Yorum bulunamadı" });
      if (review.user_id !== req.user.id) return res.status(403).json({ message: "Yetkisiz" });
      review.text = text;
      await review.save();
      res.json({ review });
    } catch (err) { res.status(500).json({ message: "Server error" }); }
});

module.exports = router;