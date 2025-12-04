require('dotenv').config();
const { Content } = require('./src/models');
const { getMovieDetails } = require('./src/services/tmdbService');
const { getBookDetails } = require('./src/services/googleBooksService');

async function updateAllGenres() {
  try {
    console.log('🔄 Tüm içeriklerin genre bilgileri güncelleniyor...\n');
    
    const contents = await Content.findAll();
    console.log(`📚 Toplam ${contents.length} içerik bulundu\n`);
    
    let updated = 0;
    let skipped = 0;
    let failed = 0;
    
    for (const content of contents) {
      try {
        const meta = content.metadata || {};
        
        // Zaten genre'si varsa atla
        if (meta.genres && Array.isArray(meta.genres) && meta.genres.length > 0) {
          // String array mı kontrol et
          if (typeof meta.genres[0] === 'string') {
            skipped++;
            console.log(`⏭️  ${content.type} ${content.id}: Zaten güncel (${meta.genres.length} genre)`);
            continue;
          }
        }
        
        // API'den genre bilgisini çek
        let genres = [];
        
        if (content.source === 'tmdb' && content.type === 'movie') {
          const details = await getMovieDetails(content.external_id);
          genres = details.genres || [];
        } 
        else if (content.source === 'googlebooks' && content.type === 'book') {
          const details = await getBookDetails(content.external_id);
          genres = details.metadata.genres || details.metadata.categories || [];
        }
        
        if (genres.length > 0) {
          await content.update({
            metadata: { ...meta, genres }
          });
          updated++;
          console.log(`✅ ${content.type} ${content.id}: ${genres.length} genre eklendi - ${genres.join(', ')}`);
        } else {
          skipped++;
          console.log(`⚠️  ${content.type} ${content.id}: Genre bulunamadı`);
        }
        
        // Rate limiting için bekle
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (err) {
        failed++;
        console.error(`❌ ${content.type} ${content.id}: Hata - ${err.message}`);
      }
    }
    
    console.log('\n📊 ÖZET:');
    console.log(`✅ Güncellenen: ${updated}`);
    console.log(`⏭️  Atlanan: ${skipped}`);
    console.log(`❌ Başarısız: ${failed}`);
    console.log(`📚 Toplam: ${contents.length}`);
    
    // Genre tablosunu da güncelle
    const genreSyncService = require('./src/services/genreSync');
    await genreSyncService.updateGenreTable();
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Hata:', err);
    process.exit(1);
  }
}

updateAllGenres();
