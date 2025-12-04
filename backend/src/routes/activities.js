const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { Activity, Like, Comment, User } = require('../models');

// POST /api/activities/:id/like -> Beğen / Vazgeç
router.post('/:id/like', auth, async (req, res) => {
  try {
    const activityId = req.params.id;
    const userId = req.user.id;

    const existingLike = await Like.findOne({ where: { user_id: userId, activity_id: activityId } });

    let isLiked = false;

    if (existingLike) {
      await existingLike.destroy();
      isLiked = false;
    } else {
      await Like.create({ user_id: userId, activity_id: activityId });
      isLiked = true;
    }

    // Güncel beğeni sayısını hesapla ve döndür
    const likeCount = await Like.count({ where: { activity_id: activityId } });

    return res.json({ liked: isLiked, count: likeCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/activities/:id/comments -> Yorumları getir
router.get('/:id/comments', async (req, res) => {
    try {
        const comments = await Comment.findAll({
            where: { activity_id: req.params.id },
            include: [{ model: User, attributes: ['id', 'username', 'avatar'] }],
            order: [['created_at', 'ASC']]
        });
        res.json({ comments });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/activities/:id/comments -> Yorum yap
router.post('/:id/comments', auth, async (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: "Yorum boş olamaz" });

    try {
        const comment = await Comment.create({
            user_id: req.user.id,
            activity_id: req.params.id,
            text
        });
        
        const commentWithUser = await Comment.findByPk(comment.id, {
            include: [{ model: User, attributes: ['id', 'username', 'avatar'] }]
        });

        res.json({ comment: commentWithUser });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;