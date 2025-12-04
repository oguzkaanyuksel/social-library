const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { Activity, Follow, User, Like, Comment } = require('../models');
const { Op } = require("sequelize");

// GET /api/feed?cursor=lastId&limit=15
router.get('/', auth, async (req, res) => {
  const limit = parseInt(req.query.limit) || 15;
  const cursor = req.query.cursor ? parseInt(req.query.cursor) : null;

  try {
    const followees = await Follow.findAll({ 
      where: { follower_id: req.user.id },
      attributes: ['followee_id']
    });
    
    const ids = followees.map(f => f.followee_id).concat([req.user.id]);

    const where = { user_id: ids };
    if (cursor) where.id = { [Op.lt]: cursor };

    const activities = await Activity.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      include: [
        { 
          model: User, 
          attributes: ['id', 'username', 'avatar', 'bio'] 
        },
        {
          model: Like,
          attributes: ['user_id'] 
        },
        {
          model: Comment,
          include: [{ model: User, attributes: ['id', 'username', 'avatar'] }],
          // limit: 5 <-- KALDIRILDI: Artık tüm yorumlar geliyor
        }
      ]
    });

    res.json({ activities });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Feed yüklenirken hata oluştu' });
  }
});

module.exports = router;