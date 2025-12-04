const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(bodyParser.json());

// routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/content', require('./routes/content'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/ratings', require('./routes/ratings'));
app.use('/api/feed', require('./routes/feed'));
app.use('/api/lists', require('./routes/lists')); // YENİ EKLENEN

// health
app.get('/api/health', (req,res)=> res.json({ ok: true }));

module.exports = app;