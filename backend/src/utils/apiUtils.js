const axios = require('axios');

/**
 * Belirli hatalarda (örn: 503, 429) üstel geri çekilme ile API isteğini tekrar dener.
 * @param {string} url - API URL'si
 * @param {object} config - Axios istek konfigürasyonu
 * @param {number} retries - Maksimum deneme sayısı
 * @param {number} initialDelay - İlk bekleme süresi (ms)
 */
async function fetchWithRetry(url, config = {}, retries = 3, initialDelay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await axios.get(url, config);
            return response.data;
        } catch (error) {
            // Hata 503 (Service Unavailable) veya 429 (Too Many Requests) ise ve son deneme değilse
            if (error.response && [503, 429].includes(error.response.status) && i < retries - 1) {
                const delay = initialDelay * (2 ** i); // 1000ms, 2000ms, 4000ms...
                console.warn(`[Retry ${i + 1}/${retries}] API Hatası ${error.response.status} (${url}). ${delay / 1000} saniye sonra tekrar deneniyor...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            // Diğer hataları veya son denemeyi yapıyorsak, hatayı fırlat
            throw error;
        }
    }
    throw new Error('API isteği maksimum deneme sayısını aştı.');
}

module.exports = { fetchWithRetry };