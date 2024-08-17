const mysql = require('mysql2');

let connection;

function handleDisconnect() {
  connection = mysql.createConnection({
    //conek database js
    host: '127.0.0.1', // Ganti dengan IP server MySQL
    user: 'xayjyaqu_admin', // Ganti dengan username MySQL Anda
    password: 'y_=jmn4~yG^t', // Ganti dengan password MySQL Anda
    database: 'xayjyaqu_bot_wa'
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
