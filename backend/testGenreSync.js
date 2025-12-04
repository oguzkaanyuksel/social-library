require('dotenv').config();
const sequelize = require('./src/config/db');
const genreSyncService = require('./src/services/genreSync');

async function test() {
  try {
    console.log('🔄 Genre senkronizasyonu başlatılıyor...\n');
    
    await sequelize.authenticate();
    console.log('✅ Veritabanı bağlantısı başarılı\n');
    
    const result = await genreSyncService.syncAllGenres();
    
    console.log('\n📊 Sonuç:', result);
    console.log('✅ İşlem tamamlandı!');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Hata:', err);
    process.exit(1);
  }
}

test();
