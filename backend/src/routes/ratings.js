const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { Rating, Content, Activity, User } = require('../models');

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

module.exports = router;