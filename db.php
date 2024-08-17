<?php
// Koneksi database php
$host = '127.0.0.1'; // Ganti dengan IP server MySQL
$user = 'root'; // Ganti dengan username MySQL Anda
$password = '123'; // Ganti dengan password MySQL Anda
$dbname = 'webhookdb';

// Membuat koneksi
$conn = new mysqli($host, $user, $password, $dbname);

// Memeriksa koneksi
if ($conn->connect_error) {
    die("Koneksi gagal: " . $conn->connect_error);
}
?>