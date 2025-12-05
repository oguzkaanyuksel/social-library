const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { User } = require('../models');
// Merkezi middleware dosyasını kullanıyoruz (Duplicate tanımları sildim)
const authMiddleware = require('../middlewares/auth');

// Uploads klasörü ve Multer ayarları
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `avatar_${req.user.id}_${uniqueSuffix}${ext}`);
  }
});
const upload = multer({ storage });

// --- ROUTES ---

// PUT /auth/me -> Profil Güncelleme
router.put('/me', authMiddleware, upload.single('avatar'), async (req,res) => {
  try {
    const user = req.user; 

    const { username, bio } = req.body;

    if (req.file && user.avatar) {
      const oldPath = path.join(uploadsDir, user.avatar);
      if (fs.existsSync(oldPath)) {
        try { fs.unlinkSync(oldPath); } catch(e) { console.warn("Eski avatar silinemedi"); }
      }
    }

    if (req.file) user.avatar = req.file.filename;
    if (username) user.username = username;
    if (bio) user.bio = bio;

    await user.save();

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        avatar: user.avatar ? `/uploads/${user.avatar}` : null
      }
    });
  } catch(err){
    console.error(err);
    res.status(500).json({ message: "Profil güncellenemedi" });
  }
});

// GET /auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        avatar: user.avatar ? `/uploads/${user.avatar}` : null
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Profil alınamadı" });
  }
});

// POST /auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    if (!username || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: "Tüm alanlar gerekli" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Şifreler eşleşmiyor" });
    }

    const existingUser = await User.findOne({ 
      where: { [require('sequelize').Op.or]: [{ email }, { username }] } 
    });

    if (existingUser) {
      return res.status(409).json({ message: "Email veya username zaten kullanılıyor" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      password: hashedPassword
    });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: "Kayıt başarılı",
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ message: "Kayıt başarısız" });
  }
});

// POST /auth/login
router.post('/login', async (req,res)=>{
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email }});
    
    if(!user) return res.status(400).json({ message:'E-posta veya şifre hatalı' });
    
    const validPass = await bcrypt.compare(password, user.password); 
    
    if(!validPass) return res.status(400).json({ message:'E-posta veya şifre hatalı' });
    
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email }});
  } catch(err){
    console.error(err);
    res.status(500).json({ message:'Giriş yapılamadı' });
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "E-posta adresi gerekli" });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: "Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı" });
    }

    // Rastgele token oluştur
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Token'ı hash'le ve veritabanına kaydet
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 3600000; // 1 saat geçerli
    await user.save();

    // Reset linki
    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

    // E-posta gönderme (nodemailer konfigürasyonu gerekli)
    // Eğer .env'de email ayarları yoksa konsola yazdır
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
      console.log('\n=== ŞİFRE SIFIRLAMA LİNKİ ===');
      console.log(`Kullanıcı: ${user.email}`);
      console.log(`Link: ${resetUrl}`);
      console.log('=============================\n');
      
      return res.json({ 
        message: "Şifre sıfırlama linki konsola yazdırıldı (email yapılandırması eksik)",
        resetUrl // Geliştirme amaçlı
      });
    }

    // E-posta gönderme
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: user.email,
      subject: 'Şifre Sıfırlama Talebi',
      html: `
        <h2>Şifre Sıfırlama</h2>
        <p>Şifrenizi sıfırlamak için aşağıdaki linke tıklayın:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>Bu link 1 saat geçerlidir.</p>
        <p>Eğer bu talebi siz yapmadıysanız, bu e-postayı görmezden gelin.</p>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: "Şifre sıfırlama linki e-posta adresinize gönderildi" });
  } catch (err) {
    console.error("Forgot Password Error:", err);
    res.status(500).json({ message: "Şifre sıfırlama isteği başarısız" });
  }
});

// Reset Password
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
      return res.status(400).json({ message: "Şifre alanları gerekli" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Şifreler eşleşmiyor" });
    }

    // Token'ı hash'le
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Token'a sahip ve süresi dolmamış kullanıcıyı bul
    const user = await User.findOne({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { [require('sequelize').Op.gt]: Date.now() }
      }
    });

    if (!user) {
      return res.status(400).json({ message: "Geçersiz veya süresi dolmuş token" });
    }

    // Yeni şifreyi hash'le ve kaydet
    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ message: "Şifreniz başarıyla sıfırlandı. Giriş yapabilirsiniz." });
  } catch (err) {
    console.error("Reset Password Error:", err);
    res.status(500).json({ message: "Şifre sıfırlama başarısız" });
  }
});

module.exports = router;