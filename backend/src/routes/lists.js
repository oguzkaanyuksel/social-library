// ... (Önceki kodların aynısı, sadece Activity.create kısımlarını güncelliyoruz)
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { List, ListItem, Content, Activity, User } = require('../models');

const STANDARD_LISTS = {
  watched: 'İzlediklerim',
  towatch: 'İzlenecekler',
  read: 'Okuduklarım',
  toread: 'Okunacaklar'
};

router.get('/my-custom-lists', auth, async (req, res) => {
    try {
      const lists = await List.findAll({ where: { user_id: req.user.id } });
      const standardTitles = Object.values(STANDARD_LISTS);
      const customLists = lists.filter(l => !standardTitles.includes(l.title));
      res.json({ lists: customLists });
    } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.post('/create', auth, async (req, res) => {
    const { title } = req.body;
    if (!title) return res.status(400).json({ message: "Başlık gerekli" });
    try {
      const list = await List.create({ user_id: req.user.id, title, description: 'Özel Liste' });
      res.json({ list, message: "Liste oluşturuldu" });
    } catch (err) { res.status(500).json({ message: "Server error" }); }
});

// --- PAYLOAD GÜNCELLENEN KISIMLAR ---

router.post('/add-item', auth, async (req, res) => {
  const { list_id, content_id } = req.body;
  try {
    const list = await List.findOne({ where: { id: list_id, user_id: req.user.id } });
    if (!list) return res.status(404).json({ message: "Liste bulunamadı" });

    const content = await Content.findByPk(content_id);
    const exists = await ListItem.findOne({ where: { list_id, content_id } });
    if (exists) return res.json({ message: "İçerik zaten bu listede" });

    await ListItem.create({ list_id, content_id });
    const user = await User.findByPk(req.user.id);

    await Activity.create({
      user_id: req.user.id,
      type: "list_add",
      payload: {
        userId: user.id,
        username: user.username,
        userAvatar: user.avatar,
        contentId: content.id,
        externalId: content.external_id, // EK
        source: content.source,          // EK
        contentType: content.type,       // EK
        title: content.title,
        poster: content.poster_url,
        listName: list.title
      }
    });
    res.json({ message: "Listeye eklendi" });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

router.get('/my-status/:contentId', auth, async (req, res) => {
    try {
        const userLists = await List.findAll({
            where: { user_id: req.user.id },
            include: [{ model: ListItem, where: { content_id: req.params.contentId }, required: true }]
        });
        const statusMap = {};
        userLists.forEach(list => {
            const key = Object.keys(STANDARD_LISTS).find(k => STANDARD_LISTS[k] === list.title);
            if (key) statusMap[key] = true;
        });
        let status = 'none';
        if (statusMap.watched) status = 'watched';
        else if (statusMap.read) status = 'read';
        else if (statusMap.towatch) status = 'to_watch';
        else if (statusMap.toread) status = 'to_read';
        res.json({ status });
    } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.post('/manage', auth, async (req, res) => {
    const { content_id, status_key } = req.body;
    if (!content_id || !status_key) return res.status(400).json({ message: "Eksik bilgi" });
  
    try {
      const listTitle = STANDARD_LISTS[status_key.replace('_', '')];
      if(!listTitle) return res.status(400).json({ message: "Geçersiz liste tipi" });
  
      const content = await Content.findByPk(content_id);
      const [list] = await List.findOrCreate({ where: { user_id: req.user.id, title: listTitle } });
      const isMovie = content.type === 'movie';
      const conflictKeys = isMovie ? ['watched', 'towatch'] : ['read', 'toread'];
      
      for (const key of conflictKeys) {
          if (STANDARD_LISTS[key] === listTitle) continue;
          const otherList = await List.findOne({ where: { user_id: req.user.id, title: STANDARD_LISTS[key] } });
          if (otherList) await ListItem.destroy({ where: { list_id: otherList.id, content_id } });
      }
  
      const [item, created] = await ListItem.findOrCreate({ where: { list_id: list.id, content_id } });
      
      if(created) {
          const user = await User.findByPk(req.user.id);
          await Activity.create({
              user_id: req.user.id,
              type: "list_add",
              payload: {
                  userId: user.id,
                  username: user.username,
                  userAvatar: user.avatar,
                  contentId: content.id,
                  externalId: content.external_id, // EK
                  source: content.source,          // EK
                  contentType: content.type,       // EK
                  title: content.title,
                  poster: content.poster_url,
                  listName: listTitle
              }
          });
      }
      res.json({ message: "Listeye eklendi", status: status_key });
    } catch (err) { res.status(500).json({ message: "Server error" }); }
  });

router.get('/user/:userId', async (req, res) => {
    try {
        const lists = await List.findAll({
            where: { user_id: req.params.userId },
            include: [{ model: ListItem, include: [{ model: Content }] }]
        });
        res.json({ lists });
    } catch (err) { res.status(500).json({ message: "Server error" }); }
});

module.exports = router;