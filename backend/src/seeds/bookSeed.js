/**
 * GEÇİCİ KİTAP SEED DOSYASI
 * 
 * Bu dosya Google Books API rate limit sorunu nedeniyle geçici olarak oluşturulmuştur.
 * Çeşitli genre'lerde örnek kitap verileri içerir.
 * 
 * KULLANIM:
 * node src/seeds/bookSeed.js
 * 
 * NOT: Bu dosya test amaçlıdır. Gerçek veriler için Google Books API kullanılmalıdır.
 */

const { Content } = require('../models');
const sequelize = require('../config/db');

const SAMPLE_BOOKS = [
  // Fiction
  {
    external_id: "seed_1984",
    source: "googlebooks",
    type: "book",
    title: "1984",
    overview: "A dystopian social science fiction novel by George Orwell.",
    year: "1949",
    poster_url: "https://covers.openlibrary.org/b/id/7222246-L.jpg",
    metadata: {
      authors: ["George Orwell"],
      publisher: "Secker & Warburg",
      pageCount: 328,
      categories: ["Fiction", "Dystopian", "Classics"],
      genres: ["Fiction", "Dystopian", "Classics"],
      subtitle: ""
    }
  },
  {
    external_id: "seed_prideandprejudice",
    source: "googlebooks",
    type: "book",
    title: "Pride and Prejudice",
    overview: "A romantic novel of manners by Jane Austen.",
    year: "1813",
    poster_url: "https://covers.openlibrary.org/b/id/8235657-L.jpg",
    metadata: {
      authors: ["Jane Austen"],
      publisher: "T. Egerton",
      pageCount: 432,
      categories: ["Fiction", "Romance", "Classics"],
      genres: ["Fiction", "Romance", "Classics"],
      subtitle: ""
    }
  },
  {
    external_id: "seed_tokillamockingbird",
    source: "googlebooks",
    type: "book",
    title: "To Kill a Mockingbird",
    overview: "A novel about racial injustice and the destruction of innocence.",
    year: "1960",
    poster_url: "https://covers.openlibrary.org/b/id/8225261-L.jpg",
    metadata: {
      authors: ["Harper Lee"],
      publisher: "J. B. Lippincott & Co.",
      pageCount: 324,
      categories: ["Fiction", "Drama", "Classics"],
      genres: ["Fiction", "Drama", "Classics"],
      subtitle: ""
    }
  },
  
  // Science Fiction & Fantasy
  {
    external_id: "seed_dune",
    source: "googlebooks",
    type: "book",
    title: "Dune",
    overview: "A science fiction novel set in the distant future amidst a feudal interstellar society.",
    year: "1965",
    poster_url: "https://covers.openlibrary.org/b/id/8235751-L.jpg",
    metadata: {
      authors: ["Frank Herbert"],
      publisher: "Chilton Books",
      pageCount: 688,
      categories: ["Science Fiction", "Fantasy", "Adventure"],
      genres: ["Science Fiction", "Fantasy", "Adventure"],
      subtitle: ""
    }
  },
  {
    external_id: "seed_harrypotter",
    source: "googlebooks",
    type: "book",
    title: "Harry Potter and the Philosopher's Stone",
    overview: "A young wizard's journey begins at Hogwarts School of Witchcraft and Wizardry.",
    year: "1997",
    poster_url: "https://covers.openlibrary.org/b/id/10521270-L.jpg",
    metadata: {
      authors: ["J.K. Rowling"],
      publisher: "Bloomsbury",
      pageCount: 223,
      categories: ["Fantasy", "Fiction", "Adventure"],
      genres: ["Fantasy", "Fiction", "Adventure"],
      subtitle: ""
    }
  },
  {
    external_id: "seed_lotr",
    source: "googlebooks",
    type: "book",
    title: "The Lord of the Rings",
    overview: "An epic high-fantasy novel about the quest to destroy the One Ring.",
    year: "1954",
    poster_url: "https://covers.openlibrary.org/b/id/8231952-L.jpg",
    metadata: {
      authors: ["J.R.R. Tolkien"],
      publisher: "Allen & Unwin",
      pageCount: 1178,
      categories: ["Fantasy", "Fiction", "Adventure", "Classics"],
      genres: ["Fantasy", "Fiction", "Adventure", "Classics"],
      subtitle: ""
    }
  },
  
  // Mystery & Thriller
  {
    external_id: "seed_sherlockholmes",
    source: "googlebooks",
    type: "book",
    title: "The Adventures of Sherlock Holmes",
    overview: "A collection of twelve short stories featuring the famous detective.",
    year: "1892",
    poster_url: "https://covers.openlibrary.org/b/id/8235849-L.jpg",
    metadata: {
      authors: ["Arthur Conan Doyle"],
      publisher: "George Newnes",
      pageCount: 307,
      categories: ["Mystery", "Fiction", "Classics"],
      genres: ["Mystery", "Fiction", "Classics"],
      subtitle: ""
    }
  },
  {
    external_id: "seed_davincicode",
    source: "googlebooks",
    type: "book",
    title: "The Da Vinci Code",
    overview: "A mystery thriller novel involving secret societies and religious history.",
    year: "2003",
    poster_url: "https://covers.openlibrary.org/b/id/8235917-L.jpg",
    metadata: {
      authors: ["Dan Brown"],
      publisher: "Doubleday",
      pageCount: 454,
      categories: ["Mystery", "Thriller", "Fiction"],
      genres: ["Mystery", "Thriller", "Fiction"],
      subtitle: ""
    }
  },
  
  // Horror
  {
    external_id: "seed_theshining",
    source: "googlebooks",
    type: "book",
    title: "The Shining",
    overview: "A horror novel about a family's terrifying experience at an isolated hotel.",
    year: "1977",
    poster_url: "https://covers.openlibrary.org/b/id/8235963-L.jpg",
    metadata: {
      authors: ["Stephen King"],
      publisher: "Doubleday",
      pageCount: 447,
      categories: ["Horror", "Fiction", "Thriller"],
      genres: ["Horror", "Fiction", "Thriller"],
      subtitle: ""
    }
  },
  {
    external_id: "seed_dracula",
    source: "googlebooks",
    type: "book",
    title: "Dracula",
    overview: "A Gothic horror novel about the vampire Count Dracula.",
    year: "1897",
    poster_url: "https://covers.openlibrary.org/b/id/8236011-L.jpg",
    metadata: {
      authors: ["Bram Stoker"],
      publisher: "Archibald Constable and Company",
      pageCount: 418,
      categories: ["Horror", "Fiction", "Classics", "Gothic"],
      genres: ["Horror", "Fiction", "Classics", "Gothic"],
      subtitle: ""
    }
  },
  
  // Non-Fiction
  {
    external_id: "seed_sapiens",
    source: "googlebooks",
    type: "book",
    title: "Sapiens: A Brief History of Humankind",
    overview: "An exploration of the history and impact of Homo sapiens.",
    year: "2011",
    poster_url: "https://covers.openlibrary.org/b/id/8236059-L.jpg",
    metadata: {
      authors: ["Yuval Noah Harari"],
      publisher: "Harvill Secker",
      pageCount: 443,
      categories: ["Nonfiction", "History", "Science", "Philosophy"],
      genres: ["Nonfiction", "History", "Science", "Philosophy"],
      subtitle: "A Brief History of Humankind"
    }
  },
  {
    external_id: "seed_educated",
    source: "googlebooks",
    type: "book",
    title: "Educated",
    overview: "A memoir about a woman who grows up in a survivalist family and eventually earns a PhD.",
    year: "2018",
    poster_url: "https://covers.openlibrary.org/b/id/8706768-L.jpg",
    metadata: {
      authors: ["Tara Westover"],
      publisher: "Random House",
      pageCount: 334,
      categories: ["Nonfiction", "Biography", "Memoir"],
      genres: ["Nonfiction", "Biography", "Memoir"],
      subtitle: "A Memoir"
    }
  },
  
  // Science
  {
    external_id: "seed_briefhistory",
    source: "googlebooks",
    type: "book",
    title: "A Brief History of Time",
    overview: "A landmark volume in science writing exploring the universe and black holes.",
    year: "1988",
    poster_url: "https://covers.openlibrary.org/b/id/8236107-L.jpg",
    metadata: {
      authors: ["Stephen Hawking"],
      publisher: "Bantam Dell Publishing Group",
      pageCount: 256,
      categories: ["Science", "Nonfiction", "Physics", "Cosmology"],
      genres: ["Science", "Nonfiction", "Physics", "Cosmology"],
      subtitle: "From the Big Bang to Black Holes"
    }
  },
  
  // Business & Self-Help
  {
    external_id: "seed_atomichabits",
    source: "googlebooks",
    type: "book",
    title: "Atomic Habits",
    overview: "An easy and proven way to build good habits and break bad ones.",
    year: "2018",
    poster_url: "https://covers.openlibrary.org/b/id/8706820-L.jpg",
    metadata: {
      authors: ["James Clear"],
      publisher: "Avery",
      pageCount: 320,
      categories: ["Self-Help", "Nonfiction", "Psychology", "Business"],
      genres: ["Self-Help", "Nonfiction", "Psychology", "Business"],
      subtitle: "An Easy & Proven Way to Build Good Habits & Break Bad Ones"
    }
  },
  {
    external_id: "seed_richpoor",
    source: "googlebooks",
    type: "book",
    title: "Rich Dad Poor Dad",
    overview: "Personal finance book about financial independence and building wealth.",
    year: "1997",
    poster_url: "https://covers.openlibrary.org/b/id/8236155-L.jpg",
    metadata: {
      authors: ["Robert T. Kiyosaki"],
      publisher: "Warner Books",
      pageCount: 207,
      categories: ["Business", "Nonfiction", "Finance", "Self-Help"],
      genres: ["Business", "Nonfiction", "Finance", "Self-Help"],
      subtitle: "What the Rich Teach Their Kids About Money That the Poor and Middle Class Do Not!"
    }
  },
  
  // History & Biography
  {
    external_id: "seed_longwalkfreedom",
    source: "googlebooks",
    type: "book",
    title: "Long Walk to Freedom",
    overview: "The autobiography of Nelson Mandela.",
    year: "1994",
    poster_url: "https://covers.openlibrary.org/b/id/8236203-L.jpg",
    metadata: {
      authors: ["Nelson Mandela"],
      publisher: "Little, Brown and Company",
      pageCount: 656,
      categories: ["Biography", "History", "Nonfiction", "Memoir"],
      genres: ["Biography", "History", "Nonfiction", "Memoir"],
      subtitle: "The Autobiography of Nelson Mandela"
    }
  },
  
  // Philosophy & Psychology
  {
    external_id: "seed_manssearch",
    source: "googlebooks",
    type: "book",
    title: "Man's Search for Meaning",
    overview: "A psychiatrist's memoir of life in Nazi death camps and lessons for spiritual survival.",
    year: "1946",
    poster_url: "https://covers.openlibrary.org/b/id/8236251-L.jpg",
    metadata: {
      authors: ["Viktor E. Frankl"],
      publisher: "Beacon Press",
      pageCount: 165,
      categories: ["Philosophy", "Psychology", "Nonfiction", "Biography"],
      genres: ["Philosophy", "Psychology", "Nonfiction", "Biography"],
      subtitle: ""
    }
  },
  
  // Travel
  {
    external_id: "seed_eatpraylove",
    source: "googlebooks",
    type: "book",
    title: "Eat, Pray, Love",
    overview: "One woman's search for everything across Italy, India and Indonesia.",
    year: "2006",
    poster_url: "https://covers.openlibrary.org/b/id/8236299-L.jpg",
    metadata: {
      authors: ["Elizabeth Gilbert"],
      publisher: "Viking Press",
      pageCount: 334,
      categories: ["Travel", "Memoir", "Nonfiction"],
      genres: ["Travel", "Memoir", "Nonfiction"],
      subtitle: "One Woman's Search for Everything Across Italy, India and Indonesia"
    }
  },
  
  // Poetry & Drama
  {
    external_id: "seed_hamlet",
    source: "googlebooks",
    type: "book",
    title: "Hamlet",
    overview: "A tragedy by William Shakespeare about Prince Hamlet's revenge.",
    year: "1603",
    poster_url: "https://covers.openlibrary.org/b/id/8236347-L.jpg",
    metadata: {
      authors: ["William Shakespeare"],
      publisher: "Various",
      pageCount: 342,
      categories: ["Drama", "Classics", "Fiction", "Poetry"],
      genres: ["Drama", "Classics", "Fiction", "Poetry"],
      subtitle: ""
    }
  },
  
  // Art & Music
  {
    external_id: "seed_storyofart",
    source: "googlebooks",
    type: "book",
    title: "The Story of Art",
    overview: "A comprehensive introduction to the history of art.",
    year: "1950",
    poster_url: "https://covers.openlibrary.org/b/id/8236395-L.jpg",
    metadata: {
      authors: ["E.H. Gombrich"],
      publisher: "Phaidon Press",
      pageCount: 688,
      categories: ["Art", "Nonfiction", "History"],
      genres: ["Art", "Nonfiction", "History"],
      subtitle: ""
    }
  },
  
  // Romance
  {
    external_id: "seed_notebook",
    source: "googlebooks",
    type: "book",
    title: "The Notebook",
    overview: "A romantic novel about enduring love.",
    year: "1996",
    poster_url: "https://covers.openlibrary.org/b/id/8236443-L.jpg",
    metadata: {
      authors: ["Nicholas Sparks"],
      publisher: "Warner Books",
      pageCount: 214,
      categories: ["Romance", "Fiction"],
      genres: ["Romance", "Fiction"],
      subtitle: ""
    }
  },
  
  // Contemporary
  {
    external_id: "seed_faultinstars",
    source: "googlebooks",
    type: "book",
    title: "The Fault in Our Stars",
    overview: "A story about two teenagers who meet at a cancer support group.",
    year: "2012",
    poster_url: "https://covers.openlibrary.org/b/id/8236491-L.jpg",
    metadata: {
      authors: ["John Green"],
      publisher: "Dutton Books",
      pageCount: 313,
      categories: ["Fiction", "Contemporary", "Romance", "Drama"],
      genres: ["Fiction", "Contemporary", "Romance", "Drama"],
      subtitle: ""
    }
  },
  
  // Cooking
  {
    external_id: "seed_joyofcooking",
    source: "googlebooks",
    type: "book",
    title: "Joy of Cooking",
    overview: "America's most trusted cookbook with thousands of recipes.",
    year: "1931",
    poster_url: "https://covers.openlibrary.org/b/id/8236539-L.jpg",
    metadata: {
      authors: ["Irma S. Rombauer"],
      publisher: "Scribner",
      pageCount: 1152,
      categories: ["Cooking", "Nonfiction", "Reference"],
      genres: ["Cooking", "Nonfiction", "Reference"],
      subtitle: ""
    }
  }
];

async function seedBooks() {
  try {
    console.log('📚 Kitap seed işlemi başlatılıyor...');
    
    // Database bağlantısını test et
    await sequelize.authenticate();
    console.log('✅ Veritabanı bağlantısı başarılı');
    
    let created = 0;
    let skipped = 0;
    
    for (const book of SAMPLE_BOOKS) {
      try {
        const [content, wasCreated] = await Content.findOrCreate({
          where: {
            external_id: book.external_id,
            source: book.source
          },
          defaults: book
        });
        
        if (wasCreated) {
          created++;
          console.log(`  ✓ Eklendi: ${book.title}`);
        } else {
          skipped++;
          console.log(`  ⊘ Zaten var: ${book.title}`);
        }
      } catch (err) {
        console.error(`  ✗ Hata (${book.title}):`, err.message);
      }
    }
    
    console.log('\n📊 Özet:');
    console.log(`  ✅ ${created} yeni kitap eklendi`);
    console.log(`  ⊘ ${skipped} kitap zaten vardı`);
    console.log(`  📚 Toplam ${SAMPLE_BOOKS.length} kitap işlendi`);
    
    // Genre'leri güncelle
    console.log('\n🔄 Genre tablosu güncelleniyor...');
    const genreSyncService = require('../services/genreSync');
    await genreSyncService.updateGenreTable();
    
    console.log('\n✅ Seed işlemi tamamlandı!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Seed işlemi başarısız:', error);
    process.exit(1);
  }
}

// Script olarak çalıştırıldığında
if (require.main === module) {
  seedBooks();
}

/**
 * Seed verilerini temizleme fonksiyonu
 * Gerçek verilere geçmeden önce test verilerini siler
 */
async function cleanupSeedBooks() {
  try {
    console.log('🧹 Seed kitapları temizleniyor...');
    
    await sequelize.authenticate();
    
    const deletedCount = await Content.destroy({
      where: {
        external_id: {
          [require('sequelize').Op.like]: 'seed_%'
        },
        source: 'googlebooks'
      }
    });
    
    console.log(`✅ ${deletedCount} seed kitap silindi`);
    
    // Genre'leri güncelle
    console.log('🔄 Genre tablosu güncelleniyor...');
    const genreSyncService = require('../services/genreSync');
    await genreSyncService.updateGenreTable();
    
    console.log('✅ Temizlik tamamlandı!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Temizlik hatası:', error);
    process.exit(1);
  }
}

module.exports = { seedBooks, cleanupSeedBooks, SAMPLE_BOOKS };
