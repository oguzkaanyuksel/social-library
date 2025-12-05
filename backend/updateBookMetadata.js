/**
 * Bu script veritabanındaki tüm kitapların metadata'sını günceller
 * Eksik olan authors, genres, description bilgilerini Google Books API'den çeker
 */

require('dotenv').config();
const { Content } = require('./src/models');
const { getBookDetails } = require('./src/services/googleBooksService');

async function updateBookMetadata() {
  try {
    console.log('📚 Kitap metadata güncelleme başlıyor...\n');

    // Tüm kitapları çek
    const books = await Content.findAll({
      where: { type: 'book', source: 'googlebooks' }
    });

    console.log(`📊 Toplam ${books.length} kitap bulundu.\n`);

    let updated = 0;
    let failed = 0;
    let skipped = 0;

    for (let i = 0; i < books.length; i++) {
      const book = books[i];
      const meta = book.metadata || {};

      // Eksik veri kontrolü
      const needsUpdate = 
        !meta.authors || meta.authors.length === 0 ||
        !meta.genres || meta.genres.length === 0 ||
        book.overview === "Açıklama bulunamadı.";

      if (!needsUpdate) {
        skipped++;
        continue;
      }

      try {
        console.log(`[${i + 1}/${books.length}] Güncelleniyor: ${book.title}`);
        
        // API'den detaylı bilgi çek
        const details = await getBookDetails(book.external_id);
        
        // Metadata'yı güncelle
        await book.update({
          overview: details.overview,
          poster_url: details.poster_url,
          metadata: {
            ...meta,
            ...details.metadata
          }
        });

        console.log(`  ✅ Güncellendi - Yazar: ${details.metadata.authors.join(', ')}, Tür: ${details.metadata.genres.join(', ')}`);
        updated++;

        // API rate limit için bekleme
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (err) {
        console.error(`  ❌ Hata: ${err.message}`);
        failed++;
      }
    }

    console.log('\n📈 Sonuç:');
    console.log(`  ✅ Güncellenen: ${updated}`);
    console.log(`  ⏭️  Atlanan (zaten tam): ${skipped}`);
    console.log(`  ❌ Başarısız: ${failed}`);

  } catch (error) {
    console.error('Kritik hata:', error);
  } finally {
    process.exit(0);
  }
}

updateBookMetadata();
