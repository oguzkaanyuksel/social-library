const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const sequelize = require("./config/db");
require("./models/index"); // Tüm modelleri yükle

const app = express();
app.use(cors());
app.use(express.json());

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// Routes
const authRoutes = require('./routes/auth');
const contentRoutes = require('./routes/content');
const searchRoutes = require('./routes/search');
const listRoutes = require('./routes/lists');
const ratingRoutes = require('./routes/ratings');
const reviewRoutes = require('./routes/reviews');
const activityRoutes = require('./routes/activities');
const adminRoutes = require('./routes/admin'); // Yeni eklenen

app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/lists', listRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/admin', adminRoutes); // Yeni eklenen

sequelize.sync({ force: false })
  .then(() => {
    console.log("✅ Veritabanı senkronize edildi.");
    app.listen(4000, () => console.log("🚀 Server 4000 portunda çalışıyor."));
  })
  .catch(err => console.error("❌ Veritabanı hatası:", err));