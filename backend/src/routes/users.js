const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { User, Follow, Activity, Like, Comment } = require('../models');

// GET /api/users/me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
    const followersCount = await Follow.count({ where: { followee_id: user.id } });
    const followingCount = await Follow.count({ where: { follower_id: user.id } });
    res.json({ user: { ...user.toJSON(), followersCount, followingCount } });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// GET /api/users/profile/:id
router.get('/profile/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const user = await User.findByPk(id, { attributes: { exclude: ['password'] } });
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı' });

    const followersCount = await Follow.count({ where: { followee_id: id } });
    const followingCount = await Follow.count({ where: { follower_id: id } });

    // GÜNCELLENDİ: Like ve Comment modelleri eklendi
    const activities = await Activity.findAll({
      where: { user_id: id },
      limit: 10,
      order: [['created_at', 'DESC']],
      include: [
        { model: User, attributes: ['username', 'avatar'] },
        { model: Like, attributes: ['user_id'] },
        { 
            model: Comment, 
            include: [{ model: User, attributes: ['id', 'username', 'avatar'] }]
            // limit yok
        }
      ]
    });

    res.json({ user: { ...user.toJSON(), followersCount, followingCount }, activities });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/users/follow/:id
router.post('/follow/:id', auth, async (req, res) => {
  try {
    const targetId = parseInt(req.params.id);
    if (targetId === req.user.id) return res.status(400).json({ message: "Kendini takip edemezsin" });

    const existing = await Follow.findOne({ where: { follower_id: req.user.id, followee_id: targetId } });

    if (existing) {
      await existing.destroy();
      return res.json({ message: "Takipten çıkıldı", isFollowing: false });
    } else {
      await Follow.create({ follower_id: req.user.id, followee_id: targetId });
      
      const targetUser = await User.findByPk(targetId);
      const actorUser = req.user;

      await Activity.create({
          user_id: req.user.id,
          type: 'follow',
          payload: { 
              userId: actorUser.id,
              username: actorUser.username,
              userAvatar: actorUser.avatar,
              targetId: targetUser.id,
              targetUsername: targetUser.username,
              targetAvatar: targetUser.avatar
          }
      });

      return res.json({ message: "Takip edildi", isFollowing: true });
    }
  } catch (err) {
    res.status(500).json({ message: 'İşlem başarısız' });
  }
});

// GET /api/users/is-following/:id
router.get('/is-following/:id', auth, async (req, res) => {
    try {
        const targetId = parseInt(req.params.id);
        const existing = await Follow.findOne({ where: { follower_id: req.user.id, followee_id: targetId } });
        res.json({ isFollowing: !!existing });
    } catch(e) { res.json({ isFollowing: false }); }
});

module.exports = router;