<?php
include 'db.php';

// Tambah data reply
if (isset($_POST['submit_tambah'])) {
    $pesan_masuk = $_POST['pesan_masuk'];
    $pesan_keluar = $_POST['pesan_keluar'];
    $query = "SELECT * FROM reply WHERE pesan_masuk = '$pesan_masuk' AND pesan_keluar = '$pesan_keluar'";
    $result = mysqli_query($conn, $query);
    if (mysqli_num_rows($result) > 0) {
        echo "Data sudah ada, tidak dapat disimpan.";
    } else {
        $query = "INSERT INTO reply (pesan_masuk, pesan_keluar, update_at) VALUES ('$pesan_masuk', '$pesan_keluar', now())";
        mysqli_query($conn, $query);
        header('Location: reply.php');
    }
}

// Edit data reply
if (isset($_POST['submit_edit'])) {
    $id = $_POST['id'];
    $pesan_masuk = $_POST['pesan_masuk'];
    $pesan_keluar = $_POST['pesan_keluar'];
    $query = "SELECT * FROM reply WHERE id != $id AND pesan_masuk = '$pesan_masuk' AND pesan_keluar = '$pesan_keluar'";
    $result = mysqli_query($conn, $query);
    if (mysqli_num_rows($result) > 0) {
        echo "Data sudah ada, tidak dapat disimpan.";
    } else {
        $query = "UPDATE reply SET pesan_masuk = '$pesan_masuk', pesan_keluar = '$pesan_keluar', update_at = now() WHERE id = $id";
        mysqli_query($conn, $query);
        header('Location: reply.php');
    }
}

// hapus data reply
if (isset($_GET['id'])) {
    $id = $_GET['id'];
    $query = "DELETE FROM reply WHERE id = $id";
    mysqli_query($conn, $query);
    header('Location: reply.php');
}

// Tampil data reply
$query = "SELECT * FROM reply";
$result = mysqli_query($conn, $query);
?>

<!-- header -->
<?php
include 'layout/header.php';
?>

<!-- sidebar -->
<?php
include 'layout/sidebar.php';
?>

<div class="content">
    <div class="form-reply">
        <div class="table-responsive">
            <button type="button" class="btn btn-danger" data-bs-toggle="modal" data-bs-target="#modalTambah" style="margin-bottom: 10px; margin-top: 10px; margin-right: 85%; font-size: 15px;">
                <i class="fas fa-plus"></i> Tambah Data
            </button>
            <table class="table table-striped table-bordered">
                <thead>
                    <tr>
                        <th scope="col" class="text-center">No</th>
                        <th scope="col" class="text-center">Pesan Masuk</th>
                        <th scope="col" class="text-center">Pesan Keluar</th>
                        <th scope="col" class="text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    <?php
                    $no = 1;
                    if (mysqli_num_rows($result) > 0) {
                        while ($reply = mysqli_fetch_array($result)) {
                            echo "<tr>";
                            echo "<td>" . $no++ . "</td>";
                            echo "<td>" . $reply['pesan_masuk'] . "</td>";
                            echo "<td>" . $reply['pesan_keluar'] . "</td>";
                            echo "<td>
                                <button type='button' class='btn btn-primary' data-bs-toggle='modal' data-bs-target='#modalEdit' 
                                data-id='" . $reply['id'] . "' 
                                data-pesan_masuk='" . $reply['pesan_masuk'] . "' 
                                data-pesan_keluar='" . $reply['pesan_keluar'] . "'>
                                <i class='fas fa-edit' style='font-size: 10px;'></i>
                                </button> 
                                <a href='reply.php?id=" . $reply['id'] . "&aksi=hapus' class='btn btn-danger'>
                                <i class='fas fa-trash' style='font-size: 10px;'></i>
                                </a>
                              </td>";
                            echo "</tr>";
                        }
                    } else {
                        echo "<tr><td colspan='5'>Tidak ada data reply.</td></tr>";
                    }
                    ?>
                </tbody>
            </table>
        </div>
    </div>

    <!-- Modal Tambah Data -->
    <div class="modal fade" id="modalTambah" tabindex="-1" aria-labelledby="modalTambahLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="modalTambahLabel">Tambah Data</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form method="POST" action="reply.php">
                        <div class="mb-3">
                            <label for="pesan_masuk" class="form-label">Pesan Masuk</label>
                            <input type="text" class="form-control" id="pesan_masuk" name="pesan_masuk" placeholder="Masukkan pesan masuk">
                        </div>
                        <div class="mb-3">
                            <label for="pesan_keluar" class="form-label">Pesan Keluar</label>
                            <textarea class="form-control" id="pesan_keluar" name="pesan_keluar" rows="4" placeholder="Masukkan pesan keluar"></textarea>
                            <br>
                            <div class="alert alert-info" role="alert">
                                Catatan: Variabel yang dapat digunakan :
                                <br>
                                - ${namaPengirim}
                                <br>
                                - ${waktuSekarang}
                                <br>
                                - ${tanggalSekarang}
                            </div>
                        </div>
                        <button type="submit" class="btn btn-primary" name="submit_tambah">Simpan</button>
                    </form>
                </div>
            </div>
        </div>
    </div>


    <!-- Modal Edit Data -->
    <div class="modal fade" id="modalEdit" tabindex="-1" aria-labelledby="modalEditLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="modalEditLabel">Edit Data</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form method="POST" action="reply.php">
                        <input type="hidden" id="edit_id" name="id">
                        <div class="mb-3">
                            <label for="edit_pesan_masuk" class="form-label">Pesan Masuk</label>
                            <input type="text" class="form-control" id="edit_pesan_masuk" name="pesan_masuk" placeholder="Masukkan pesan masuk">
                        </div>
                        <div class="mb-3">
                            <label for="edit_pesan_keluar" class="form-label">Pesan Keluar</label>
                            <textarea class="form-control" id="edit_pesan_keluar" name="pesan_keluar" rows="4" placeholder="Masukkan pesan keluar"></textarea>
                            <br>
                            <div class="alert alert-info" role="alert">
                                Catatan: Variabel yang dapat digunakan :
                                <br>
                                - ${namaPengirim}
                                <br>
                                - ${waktuSekarang}
                                <br>
                                - ${tanggalSekarang}
                            </div>
                        </div>
                        <button type="submit" class="btn btn-primary" name="submit_edit">Update</button>
                    </form>
                </div>
            </div>
        </div>
    </div>


    <script>
        // Isi modal edit dengan data yang diambil dari tombol edit
        document.addEventListener('DOMContentLoaded', function() {
            var modalEdit = document.getElementById('modalEdit');
            modalEdit.addEventListener('show.bs.modal', function(event) {
                var button = event.relatedTarget;
                var id = button.getAttribute('data-id');
                var pesan_masuk = button.getAttribute('data-pesan_masuk');
                var pesan_keluar = button.getAttribute('data-pesan_keluar');

                var modalTitle = modalEdit.querySelector('.modal-title');
                var modalBodyInputId = modalEdit.querySelector('#edit_id');
                var modalBodyInputPesanMasuk = modalEdit.querySelector('#edit_pesan_masuk');
                var modalBodyInputPesanKeluar = modalEdit.querySelector('#edit_pesan_keluar');

                modalTitle.textContent = 'Edit Data';
                modalBodyInputId.value = id;
                modalBodyInputPesanMasuk.value = pesan_masuk;
                modalBodyInputPesanKeluar.value = pesan_keluar;
            });
        });

        // Event listener untuk hamburger
        document.getElementById("hamburger").addEventListener("click", () => {
            const sidebar = document.getElementById("sidebar");
            const hamburger = document.getElementById("hamburger");

            sidebar.classList.toggle("active");

            // Periksa apakah sidebar sedang aktif
            if (sidebar.classList.contains("active")) {
                hamburger.style.display = "none"; // Sembunyikan hamburger
            } else {
                hamburger.style.display = "block"; // Tampilkan hamburger
            }
        });

        // Event listener untuk klik di luar sidebar
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
    </body>

    </html>