# Seed'den Gerçek Verilere Geçiş Kılavuzu

## ✅ Hızlı Özet

**Test Aşaması:**
```bash
ENABLE_BOOK_GENRE_SYNC=false  # .env
npm run seed:books            # Seed verileri ekle
```

**Gerçek Verilere Geçiş:**
```bash
npm run cleanup:books         # (Opsiyonel) Seed verilerini temizle
ENABLE_BOOK_GENRE_SYNC=true   # .env dosyasını güncelle
npm run dev                   # Serveri başlat
```

---

## 📝 Detaylı Adımlar

### 1. Seed Verilerini Temizle (Opsiyonel)

Seed ile eklenen test kitaplarını silmek için:

```bash
npm run cleanup:books
```

**Çıktı:**
```
🧹 Seed kitapları temizleniyor...
✅ 25 seed kitap silindi
🔄 Genre tablosu güncelleniyor...
✅ Temizlik tamamlandı!
```

**Not:** Bu adım zorunlu değildir. Gerçek API'den çekilen kitaplar duplicate kontrolü ile eklenir, çakışma olmaz. Ancak test verilerinden kurtulmak istersen kullanabilirsin.

### 2. .env Dosyasını Güncelle

```bash
# .env dosyasında
ENABLE_BOOK_GENRE_SYNC=true
```

### 3. Serveri Yeniden Başlat

```bash
npm run dev
```

**Beklenen Çıktı:**
```
✅ Veritabanı senkronize edildi.
🔄 Film genre senkronizasyonu başlatılıyor...
🎬 TMDB film genre'leri çekiliyor...
✅ 19 film genre çekildi
📚 Kitap genre senkronizasyonu aktif...
📚 Google Books API'den kitap kategorileri çekiliyor...
  ✓ "bestseller" araması: 40 kitap, 35 yeni kayıt, 15 benzersiz kategori
  ✓ "fiction" araması: 40 kitap, 38 yeni kayıt, 25 benzersiz kategori
  ...
✅ 1000 kitaptan 700 yeni kitap kaydedildi, 330 benzersiz kategori çekildi
```

### 4. Veriler Yüklendikten Sonra API'yi Kapat (Önerilen)

Tüm veriler yüklendikten sonra API'yi kapatmak rate limit sorunlarını önler:

```bash
# .env dosyasında
ENABLE_BOOK_GENRE_SYNC=false
```

Bu sayede:
- ✅ Server her başlatıldığında API'ye istek atmaz
- ✅ Mevcut veriler kullanılır
- ✅ Yeni kitaplar kullanıcı aradığında otomatik çekilir
- ✅ Rate limit sorunu olmaz

---

## 🔄 Seed'e Geri Dönme

Eğer tekrar seed verilerini kullanmak istersen:

```bash
# .env
ENABLE_BOOK_GENRE_SYNC=false

# Gerçek verileri sil (opsiyonel)
DELETE FROM contents WHERE source = 'googlebooks' AND external_id NOT LIKE 'seed_%';

# Seed'i tekrar çalıştır
npm run seed:books
```

---

## 🎯 Önerilen Kullanım Senaryoları

### Geliştirme Ortamı
```bash
# İlk kurulum
npm run seed:books
ENABLE_BOOK_GENRE_SYNC=false

# Hızlı başlatma, rate limit yok
npm run dev
```

### Production Ortamı (İlk Kez)
```bash
# Gerçek verilerle başla
ENABLE_BOOK_GENRE_SYNC=true
npm start

# İşlem tamamlandıktan sonra kapat
ENABLE_BOOK_GENRE_SYNC=false
```

### Production Ortamı (Güncelleme)
```bash
# Periyodik olarak güncellemek için
ENABLE_BOOK_GENRE_SYNC=true
npm start

# Yeterli veri toplandıktan sonra tekrar kapat
ENABLE_BOOK_GENRE_SYNC=false
```

---

## ⚠️ Önemli Notlar

1. **Seed dosyasını silme!** Gelecekte tekrar test için kullanabilirsin.

2. **Duplicate sorun yok:** Gerçek API'den çekilen kitaplar duplicate kontrolü ile eklenir. Seed verileri ile çakışmaz.

3. **Rate limit:** API aktifse ve rate limit alırsan hemen `ENABLE_BOOK_GENRE_SYNC=false` yap.

4. **Manuel temizlik:** Seed verilerini silmek için SQL yerine `npm run cleanup:books` kullan.

5. **Kullanıcı aramaları:** API kapalı olsa bile kullanıcılar arama yaptıklarında yeni kitaplar otomatik çekilir ve kaydedilir.

---

## 📋 Komut Referansı

```bash
# Seed ekle
npm run seed:books

# Seed temizle
npm run cleanup:books

# Server başlat (development)
npm run dev

# Server başlat (production)
npm start
```
