<?php
// Koneksi database php
$host = '127.0.0.1'; // Ganti dengan IP server MySQL
$user = 'xayjyaqu_admin'; // Ganti dengan username MySQL Anda
$password = 'y_=jmn4~yG^t'; // Ganti dengan password MySQL Anda
$dbname = 'xayjyaqu_bot_wa';

// Membuat koneksi
$conn = new mysqli($host, $user, $password, $dbname);

// Memeriksa koneksi
if ($conn->connect_error) {
    die("Koneksi gagal: " . $conn->connect_error);
}
