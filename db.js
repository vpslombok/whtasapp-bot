// db.js
const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'xayjyaqu_wa_server', // Ganti dengan username MySQL Anda
  password: 'OF(pU^O+Zw56', // Ganti dengan password MySQL Anda
  database: 'xayjyaqu_wa_server'
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the MySQL database:', err);
    return;
  }
  console.log('Connected to MySQL database.');
});

module.exports = connection;
