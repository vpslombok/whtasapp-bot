// const mysql = require("mysql2");

// let connection;

// function handleDisconnect() {
//   connection = mysql.createConnection({
//     host: "localhost", // IP atau Hostname MySQL
//     user: "root", // Username MySQL Anda
//     password: "123", // Password MySQL Anda
//     database: "webhookdb",
//     connectTimeout: 10000, // Timeout koneksi (dalam milidetik)
//     // reconnect: true // Hapus opsi reconnect yang tidak valid
//   });

//   // Sambungkan ke database
//   connection.connect((err) => {
//     if (err) {
//       console.error("Error connecting to MySQL database:", err.message);
//       setTimeout(handleDisconnect, 2000); // Coba ulangi setelah 2 detik
//     } else {
//       console.log("Connected to MySQL database.");
//     }
//   });

//   // Tangani error yang terjadi selama koneksi
//   connection.on("error", (err) => {
//     console.error("MySQL error:", err.message);
//     if (err.code === "PROTOCOL_CONNECTION_LOST") {
//       console.log("Koneksi ke MySQL terputus, mencoba menyambungkan ulang...");
//       handleDisconnect(); // Sambungkan ulang
//     } else if (err.fatal) {
//       console.log("Kesalahan fatal, mencoba menyambungkan ulang...");
//       handleDisconnect(); // Sambungkan ulang
//     } else {
//       throw err; // Error lain, lemparkan
//     }
//   });
// }

// handleDisconnect();

// module.exports = connection;
