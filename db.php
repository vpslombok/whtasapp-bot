<?php
// Koneksi ke basis data
$servername = "127.0.0.1";
$username = "root";
$password = "123";
$dbname = "webhookdb";

// Membuat koneksi
$conn = new mysqli($servername, $username, $password, $dbname);

// Memeriksa koneksi
if ($conn->connect_error) {
    die("Koneksi gagal: " . $conn->connect_error);
}
?>