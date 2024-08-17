<?php
include 'db.php';

$query = "SELECT * FROM sent_messages";
$result = mysqli_query($conn, $query);

// hapus data
if (isset($_GET['id'])) {
    $id = $_GET['id'];
    $query = "DELETE FROM sent_messages WHERE id = $id";
    mysqli_query($conn, $query);
    header('Location: riwayat.php');
}
?>

<?php
include 'layout/header.php';
?>

<?php
include 'layout/sidebar.php';
?>

<div class="content">
    <div class="form-riwayat">
        <h2>Riwayat Pesan Terkirim</h2>
        <div class="table-responsive">
            <table class="table table-bordered table-striped">
                <thead>
                    <tr>
                        <th>No</th>
                        <th>Nomor Tujuan</th>
                        <th>Pesan</th>
                        <th>Tanggal</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    <?php
                    $no = 1;
                    if (mysqli_num_rows($result) > 0) {
                        while ($riwayat = mysqli_fetch_array($result)) {
                            echo "<tr>";
                            echo "<td>" . $no++ . "</td>";
                            echo "<td>" . $riwayat['number'] . "</td>";
                            echo "<td>" . $riwayat['message'] . "</td>";
                            echo "<td>" . $riwayat['tanggal'] . "</td>";
                            echo "<td><a href='riwayat.php?id=" . $riwayat['id'] . "' class='btn btn-danger'>Hapus</a></td>";
                            echo "</tr>";
                        }
                    } else {
                        echo "<tr><td colspan='5'>Tidak ada data riwayat pesan.</td></tr>";
                    }
                    ?>
                </tbody>
            </table>
        </div>
    </div>
</div>

</body>
<script>
    // Tambahkan fungsi untuk mengaktifkan dan menonaktifkan sidebar
    function toggleSidebar() {
        const sidebar = document.getElementById("sidebar");
        const hamburger = document.getElementById("hamburger");

        sidebar.classList.toggle("active");

        // Periksa apakah sidebar sedang aktif
        if (sidebar.classList.contains("active")) {
            hamburger.style.display = "none"; // Sembunyikan hamburger
        } else {
            hamburger.style.display = "block"; // Tampilkan hamburger
        }
    }

    // Tambahkan event listener untuk hamburger
    document.getElementById("hamburger").addEventListener("click", toggleSidebar);

    // Tambahkan event listener untuk klik di luar sidebar
    document.addEventListener("click", (event) => {
        const sidebar = document.getElementById("sidebar");
        const hamburger = document.getElementById("hamburger");

        // Periksa apakah sidebar sedang aktif
        if (sidebar.classList.contains("active")) {
            const isClickInsideSidebar = sidebar.contains(event.target);
            const isClickHamburger = hamburger.contains(event.target);

            // Jika klik di luar sidebar dan bukan di hamburger, tutup sidebar
            if (!isClickInsideSidebar && !isClickHamburger) {
                sidebar.classList.remove("active");
                hamburger.style.display = "block"; // Tampilkan kembali hamburger
            }
        }
    });
</script>

</html>