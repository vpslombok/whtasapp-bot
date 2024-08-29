const mysql = require('mysql2');

// Buat pool koneksi
const pool = mysql.createPool({
  host: 'bdeaoblcrmhzuzixz9lu-mysql.services.clever-cloud.com', // Ganti dengan IP server MySQL Anda
  user: 'uaihieeeuy2yjzsi', // Ganti dengan username MySQL Anda
  password: 'aVw6FpQ2JcmOlbvLGWgt', // Ganti dengan password MySQL Anda
  database: 'bdeaoblcrmhzuzixz9lu', // Nama database Anda
  waitForConnections: true, // Tunggu jika semua koneksi sibuk
  connectionLimit: 10, // Batas maksimum koneksi
  queueLimit: 0 // Tidak ada batasan antrian
});

// Fungsi untuk mengeksekusi query dengan pool
function executeQuery(query, params) {
  return new Promise((resolve, reject) => {
    pool.query(query, params, (error, results) => {
      if (error) {
        console.error('Error executing query:', error.message);
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}



connectToWhatsApp();

// Ekspor pool jika Anda ingin menggunakannya di modul lain
module.exports = pool;
