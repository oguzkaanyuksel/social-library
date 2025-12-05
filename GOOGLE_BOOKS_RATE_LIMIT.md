# Google Books API Rate Limit Sorunu ve Çözümü

## ✅ GÜNCEL DURUM

**Filmler:** ✅ Her zaman otomatik çekiliyor (TMDB API limiti yüksek)
**Kitaplar:** ⚠️ Seed dosyası ile yükleniyor (Rate limit koruması)

## Yeni Yapı

### Film Genre Senkronizasyonu
- **Otomatik**: Server başlatıldığında her zaman çalışır
- **Kaynak**: TMDB API
- **Limit**: Yüksek (sorun çıkmaz)
- **Genre Sayısı**: 19 adet

### Kitap Genre Senkronizasyonu
- **Varsayılan**: KAPALI (rate limit koruması)
- **Alternatif**: Seed dosyası kullanılır
- **Manuel Aktifleştirme**: `ENABLE_BOOK_GENRE_SYNC=true` (.env)

## Kitap Verilerini Yükleme

### Yöntem 1: Seed Dosyası (ÖNERİLEN - Geçici)

```bash
# Seed script'i çalıştır
npm run seed:books

# veya direkt
node src/seeds/bookSeed.js
```

**Seed İçeriği:**
- 25 örnek kitap
- 20+ farklı genre
- Classics, Fiction, Science Fiction, Fantasy, Mystery, Horror, Romance, Drama, Poetry, Art, History, Biography, Science, Philosophy, Psychology, Business, Self-Help, Travel, Cooking, Contemporary

### Yöntem 2: Google Books API (Gerçek Veriler)

`.env` dosyasında:
```
ENABLE_BOOK_GENRE_SYNC=true
```

**Dikkat:** Rate limit sorunu yaşarsanız hemen `false` yapın ve seed kullanın.

## .env Konfigürasyonu

```bash
# Film genre'leri - HER ZAMAN AKTİF (değiştirmeyin)
# Kitap genre'leri - Sadece rate limit sorun değilse true yapın
ENABLE_BOOK_GENRE_SYNC=false
```

## Kullanım Senaryoları

### Geliştirme Ortamı (Önerilen)
```bash
ENABLE_BOOK_GENRE_SYNC=false
npm run seed:books  # İlk kurulumda bir kez
npm run dev
```

### Production Ortamı
```bash
# Seed ile başla
npm run seed:books

# Rate limit düşükse API'den gerçek veri çek
ENABLE_BOOK_GENRE_SYNC=true
npm start

# Veriler yüklendikten sonra tekrar kapat
ENABLE_BOOK_GENRE_SYNC=false
```

## Seed Dosyası Hakkında

**Konum:** `backend/src/seeds/bookSeed.js`

**Özellikler:**
- ✅ 25 popüler kitap
- ✅ Çeşitli genre'ler
- ✅ Gerçekçi metadata
- ✅ Duplicate kontrolü
- ✅ Otomatik genre tablosu güncelleme

**Not:** Bu geçici bir çözümdür. İlerleyen zamanlarda Google Books API ile değiştirilecektir.

## Sorun Giderme
