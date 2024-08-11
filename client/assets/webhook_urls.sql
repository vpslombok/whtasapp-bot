-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Waktu pembuatan: 10 Agu 2024 pada 13.58
-- Versi server: 8.0.30
-- Versi PHP: 8.1.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `webhookdb`
--

-- --------------------------------------------------------

--
-- Struktur dari tabel `webhook_urls`
--

CREATE TABLE `webhook_urls` (
  `id` int NOT NULL,
  `url` varchar(255) NOT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `webhook_urls`
--

INSERT INTO `webhook_urls` (`id`, `url`, `updated_at`) VALUES
(4, 'https://script.google.com/macros/s/AKfycbwCk_QYcUYZt7nQPiRnoWTpjO7dpVlCB2GkoMD7_mAgLMnXLbTc6usoxejFwX-fvW0J/exec', '2024-08-10 13:05:19');

--
-- Indexes for dumped tables
--

--
-- Indeks untuk tabel `webhook_urls`
--
ALTER TABLE `webhook_urls`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT untuk tabel yang dibuang
--

--
-- AUTO_INCREMENT untuk tabel `webhook_urls`
--
ALTER TABLE `webhook_urls`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
