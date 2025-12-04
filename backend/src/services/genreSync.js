const { Content, Genre } = require('../models');
const { getMovieDetails } = require('./tmdbService');
const { getBookDetails } = require('./googleBooksService');

class GenreSyncService {
  
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

  // Genre tablosunu güncelle
  async updateGenreTable() {
    try {
      console.log('📊 Genre tablosu güncelleniyor...');
      
      const contents = await Content.findAll({
        attributes: ['type', 'metadata']
      });

      const genreSet = new Map(); // name -> type mapping

      contents.forEach(content => {
        const meta = content.metadata || {};
        const genres = meta.genres || meta.categories || [];
        
        genres.forEach(g => {
          const genreName = typeof g === 'object' ? g.name : g;
          if (genreName) {
            genreSet.set(`${genreName}-${content.type}`, {
              name: genreName,
              type: content.type
            });
          }
        });
      });

      // Mevcut genre'leri temizle ve yeniden ekle
      await Genre.destroy({ where: {} });
      
      const genreData = Array.from(genreSet.values());
      await Genre.bulkCreate(genreData);

      console.log(`✅ ${genreData.length} genre kaydedildi`);
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