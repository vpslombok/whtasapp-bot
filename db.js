const mysql = require('mysql2');

let connection;

function handleDisconnect() {
  connection = mysql.createConnection({
    //conek database js
    host: 'bdeaoblcrmhzuzixz9lu-mysql.services.clever-cloud.com', // Ganti dengan IP server MySQL
    user: 'uaihieeeuy2yjzsi', // Ganti dengan username MySQL Anda
    password: 'If8lMe9XdA5THvIZb4Wn', // Ganti dengan password MySQL Anda
    database: 'bdeaoblcrmhzuzixz9lu'
  });

  // Sambungkan ke database
  connection.connect((err) => {
    if (err) {
      console.error('Error connecting to MySQL database:', err);
      setTimeout(handleDisconnect, 2000); // Coba ulangi setelah 2 detik
    } else {
      console.log('Connected to MySQL database.');
    }
  });

  // Tangani error yang terjadi selama koneksi
  connection.on('error', (err) => {
    console.error('MySQL error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.log('Koneksi ke MySQL terputus, mencoba menyambungkan ulang...');
      handleDisconnect(); // Sambungkan ulang
    } else {
      throw err; // Error lain, lemparkan
    }
  });
}

handleDisconnect();

module.exports = connection;
