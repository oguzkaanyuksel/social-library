const { Content, Genre } = require('../models');
const { getMovieDetails } = require('./tmdbService');
const { getBookDetails } = require('./googleBooksService');
const axios = require('axios');
require('dotenv').config();

class GenreSyncService {
  
  // TMDB'den tüm film genre'lerini çek (19 adet)
  async fetchAllMovieGenres() {
    try {
      console.log('🎬 TMDB film genre\'leri çekiliyor...');
      const response = await axios.get('https://api.themoviedb.org/3/genre/movie/list', {
        params: {
          api_key: process.env.TMDB_API_KEY,
          language: 'en-US'
        }
      });

      const genres = response.data.genres || [];
      console.log(`✅ ${genres.length} film genre çekildi:`, genres.map(g => g.name).join(', '));
      
      return genres.map(g => ({
        name: g.name,
        type: 'movie',
        external_id: g.id
      }));
    } catch (error) {
      console.error('TMDB genre çekme hatası:', error.message);
      return [];
    }
  }

  // Google Books API'den gerçek kitap verilerini çekip kategorileri topla
  async fetchAllBookGenres() {
    try {
      console.log('📚 Google Books API\'den kitap kategorileri çekiliyor...');
      const { searchBooks } = require('./googleBooksService');
      
      const genreSet = new Set();
      
      // Popüler arama terimleri ile kitapları çek
      const searchQueries = [
        'bestseller', 'fiction', 'nonfiction', 'science', 'history',
        'biography', 'business', 'philosophy', 'psychology', 'self-help',
        'travel', 'cooking', 'art', 'music', 'poetry',
        'drama', 'thriller', 'mystery', 'romance', 'fantasy',
        'horror', 'adventure', 'classics', 'contemporary', 'literature'
      ];
      
      let totalBooks = 0;
      let savedBooks = 0;
      
      for (const query of searchQueries) {
        try {
          // Her arama için ilk 40 sonucu çek (2 batch)
          const batch1 = await searchBooks(query, 0);
          const batch2 = await searchBooks(query, 20);
          
          const books = [...batch1, ...batch2];
          totalBooks += books.length;
          
          // Kitapları veritabanına kaydet ve kategorilerini topla
          for (const book of books) {
            try {
              // Duplicate kontrolü ile kaydet
              const [savedContent, created] = await Content.findOrCreate({
                where: {
                  external_id: book.external_id,
                  source: book.source
                },
                defaults: book
              });
              
              if (created) savedBooks++;
              
              // Kategorileri topla
              const categories = book.metadata?.categories || book.metadata?.genres || [];
              categories.forEach(cat => {
                const categoryName = typeof cat === 'object' ? cat.name : cat;
                if (categoryName) {
                  genreSet.add(categoryName);
                }
              });
            } catch (saveErr) {
              console.warn(`  ⚠️ Kitap kaydedilemedi: ${book.title}`, saveErr.message);
            }
          }
          
          console.log(`  ✓ "${query}" araması: ${books.length} kitap, ${savedBooks} yeni kayıt, ${genreSet.size} benzersiz kategori`);
          
          // API rate limit için kısa bekleme
          await new Promise(resolve => setTimeout(resolve, 300));
          
        } catch (err) {
          console.warn(`  ⚠️ "${query}" araması başarısız:`, err.message);
        }
      }
      
      const bookGenres = Array.from(genreSet).map(name => ({
        name,
        type: 'book'
      }));
      
      console.log(`✅ ${totalBooks} kitaptan ${savedBooks} yeni kitap kaydedildi, ${bookGenres.length} benzersiz kategori çekildi`);
      
      return bookGenres;
      
    } catch (error) {
      console.error('Book kategorileri çekme hatası:', error.message);
      return [];
    }
  }

  // Tüm genre'leri veritabanına kaydet
  async initializeGenres() {
    try {
      console.log('🔄 Genre başlatma işlemi başlıyor...');
      
      // SADECE film genre'lerini çek (her zaman aktif)
      const movieGenres = await this.fetchAllMovieGenres();
      
      // Film genre'lerini hemen veritabanına kaydet
      if (movieGenres.length > 0) {
        await Genre.destroy({ where: { type: 'movie' } });
        await Genre.bulkCreate(movieGenres, { ignoreDuplicates: true });
        console.log(`✅ ${movieGenres.length} film genre veritabanına kaydedildi`);
      }
      
      // Kitap genre'leri sadece ENV değişkeni true ise çek
      let bookGenres = [];
      const enableBookSync = process.env.ENABLE_BOOK_GENRE_SYNC === 'true';
      
      if (enableBookSync) {
        console.log('📚 Kitap genre senkronizasyonu aktif...');
        bookGenres = await this.fetchAllBookGenres();
      } else {
        console.log('ℹ️ Kitap genre senkronizasyonu devre dışı (rate limit koruması)');
        console.log('ℹ️ Kitap verileri için seed dosyasını kullanın: node src/seeds/bookSeed.js');
      }
      
      console.log(`📥 ${movieGenres.length} film genre ve ${bookGenres.length} kitap kategorisi çekildi`);
      
      // Veritabanındaki içeriklerden ek genre'leri çıkar
      // Böylece hem API'den gelen hem de içerikte bulunan tüm genre'ler olur
      await this.updateGenreTable();
      
      return movieGenres.length + bookGenres.length;
    } catch (error) {
      console.error('Genre başlatma hatası:', error.message);
      throw error;
    }
  }
  
  // Tüm içeriklerin genre'lerini senkronize et
  async syncAllGenres() {
    try {
      console.log('🔄 Genre senkronizasyonu başlatılıyor...');
      
      const contents = await Content.findAll({
        attributes: ['id', 'external_id', 'source', 'type', 'metadata']
      });

      let updated = 0;
      let failed = 0;

      for (const content of contents) {
        try {
          const success = await this.syncContentGenres(content);
          if (success) updated++;
        } catch (err) {
          console.error(`❌ İçerik ${content.id} senkronize edilemedi:`, err.message);
          failed++;
        }
      }

      console.log(`✅ Senkronizasyon tamamlandı. Güncellenen: ${updated}, Başarısız: ${failed}`);
      
      // Genre tablosunu güncelle
      await this.updateGenreTable();
      
      return { updated, failed, total: contents.length };
    } catch (err) {
      console.error('Genre senkronizasyon hatası:', err);
      throw err;
    }
  }

  // Tek bir content'in genre'lerini senkronize et
  async syncContentGenres(content) {
    const meta = content.metadata || {};
    
    // Eğer genre bilgisi zaten varsa atla
    if (meta.genres && Array.isArray(meta.genres) && meta.genres.length > 0) {
      // Ama string array değilse (obje array ise) düzelt
      if (typeof meta.genres[0] === 'object' && meta.genres[0].name) {
        const genreNames = meta.genres.map(g => g.name);
        await content.update({
          metadata: { ...meta, genres: genreNames }
        });
        console.log(`📝 ${content.type} ${content.id}: Genre formatı düzeltildi`);
        return true;
      }
      return false;
    }

    // API'den genre bilgisini çek
    try {
      let genres = [];

      if (content.source === 'tmdb' && content.type === 'movie') {
        const details = await getMovieDetails(content.external_id);
        genres = details.genres || [];
      } 
      else if (content.source === 'googlebooks' && content.type === 'book') {
        const details = await getBookDetails(content.external_id);
        genres = details.metadata.genres || details.metadata.categories || [];
      }

      // Metadata'yı güncelle
      if (genres.length > 0) {
        await content.update({
          metadata: { ...meta, genres }
        });
        console.log(`✅ ${content.type} ${content.id}: ${genres.length} genre eklendi`);
        return true;
      }

      return false;
    } catch (err) {
      throw err;
    }
  }

  // Genre tablosunu güncelle - SADECE içeriği olan genre'leri kaydet
  async updateGenreTable() {
    try {
      console.log('📊 Genre tablosu güncelleniyor...');
      
      const contents = await Content.findAll({
        attributes: ['type', 'metadata']
      });

      const genreSet = new Map(); // name -> type mapping
      const genreCount = new Map(); // genre'lerin kaç içerikte geçtiğini say

      contents.forEach(content => {
        const meta = content.metadata || {};
        const genres = meta.genres || meta.categories || [];
        
        genres.forEach(g => {
          const genreName = typeof g === 'object' ? g.name : g;
          if (genreName) {
            const key = `${genreName}-${content.type}`;
            genreSet.set(key, {
              name: genreName,
              type: content.type
            });
            
            // Bu genre'nin kaç içerikte geçtiğini say
            genreCount.set(key, (genreCount.get(key) || 0) + 1);
          }
        });
      });

      // Sadece içerik metadata'sından gelen genre'leri ekle (API'den gelenler zaten var)
      // Mevcut genre'leri temizleme, sadece yeni ekle
      const genreData = Array.from(genreSet.values());
      
      if (genreData.length > 0) {
        await Genre.bulkCreate(genreData, { ignoreDuplicates: true });
        console.log(`✅ İçeriklerden ${genreData.length} ek genre eklendi`);
      }

      // Toplam genre sayısını göster
      const totalGenres = await Genre.count();
      console.log(`📊 Toplam ${totalGenres} genre veritabanında`);
      
      // En popüler 10 genre'yi logla (sadece içeriklerden gelenler için)
      if (genreCount.size > 0) {
        const topGenres = Array.from(genreCount.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10);
        
        console.log('📈 İçeriklerde en popüler genre\'ler:');
        topGenres.forEach(([key, count]) => {
          const genre = genreSet.get(key);
          console.log(`   ${genre.name} (${genre.type}): ${count} içerik`);
        });
      }
      
    } catch (err) {
      console.error('Genre tablosu güncelleme hatası:', err);
    }
  }

  // Yeni eklenen içeriğin genre'lerini otomatik kaydet
  async syncNewContent(contentId) {
    try {
      const content = await Content.findByPk(contentId);
      if (!content) return false;

      await this.syncContentGenres(content);
      await this.updateGenreTable();
      return true;
    } catch (err) {
      console.error('Yeni içerik genre sync hatası:', err);
      return false;
    }
  }
}

module.exports = new GenreSyncService();