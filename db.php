<?php
// Koneksi database php
$host = 'bdeaoblcrmhzuzixz9lu-mysql.services.clever-cloud.com'; // Ganti dengan IP server MySQL
$user = 'uaihieeeuy2yjzsi'; // Ganti dengan username MySQL Anda
$password = 'If8lMe9XdA5THvIZb4Wn'; // Ganti dengan password MySQL Anda
$dbname = 'bdeaoblcrmhzuzixz9lu';

// Membuat koneksi
$conn = new mysqli($host, $user, $password, $dbname);

// Memeriksa koneksi
if ($conn->connect_error) {
    die("Koneksi gagal: " . $conn->connect_error);
}
?>