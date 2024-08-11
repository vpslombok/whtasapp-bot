// db.js
const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',//jangan lupa ganti dengan ip komputer anda
  user: 'root', // Ganti dengan username MySQL Anda
  password: '123', // Ganti dengan password MySQL Anda
  database: 'webhookDB'
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the MySQL database:', err);
    return;
  }
  console.log('Connected to MySQL database.');
});

module.exports = connection;
