<?php
include 'db.php';
session_start(); // Mulai session

// Ambil URL API dari database
$query = "SELECT web_url FROM webhook_urls ORDER BY updated_at DESC LIMIT 1";
$result = $conn->query($query);

$apiUrl = "";
if ($result && $result->num_rows > 0) {
    $row = $result->fetch_assoc();
    $apiUrl = $row['web_url'];
}

// Fungsi untuk mendapatkan file dalam folder upload
function getUploadedFiles() {
    $folderPath = './uploads/';
    $files = scandir($folderPath);
    $files = array_diff($files, array('.', '..'));
    return $files;
}

// Fungsi untuk mengupload file ke folder upload
function uploadFile($file) {
    $targetDir = './uploads/';
    $file_name = $file['name'];
    $temp_name = $file['tmp_name'];
    $file_size = $file['size'];
    $file_type = $file['type'];
    $file_error = $file['error'];

    // Cek apakah file berhasil diupload
    if ($file_error === 0) {
        // Cek ukuran file 1MB
        if ($file_size > 1000000) {
            $_SESSION['message'] = "Maaf, ukuran file Anda terlalu besar.";
            $_SESSION['message_type'] = 'error';
            return false;
        } else {
            // Cek tipe file
            $fileExt = strtolower(pathinfo($file_name, PATHINFO_EXTENSION));
            $allowedExt = array('jpg', 'jpeg', 'png', 'gif');
            if (in_array($fileExt, $allowedExt)) {
                $newFileName = uniqid() . "." . $fileExt;
                $fileDestination = $targetDir . $newFileName;
                move_uploaded_file($temp_name, $fileDestination);
                $_SESSION['message'] = "File berhasil diupload!";
                $_SESSION['message_type'] = 'success';
                return $newFileName; // Mengembalikan nama file yang baru diupload
            } else {
                $_SESSION['message'] = "Maaf, tipe file Anda tidak diizinkan.";
                $_SESSION['message_type'] = 'error';
                return false;
            }
        }
    } else {
        $_SESSION['message'] = "Maaf, terjadi kesalahan saat mengupload file.";
        $_SESSION['message_type'] = 'error';
        return false;
    }
}

// Fungsi untuk menghapus file dari folder upload
function deleteFile($file) {
    $filePath = './uploads/' . $file;
    if (file_exists($filePath)) {
        unlink($filePath);
        $_SESSION['message'] = "File berhasil dihapus!";
        $_SESSION['message_type'] = 'success';
        return true;
    } else {
        $_SESSION['message'] = "Maaf, file tidak ditemukan.";
        $_SESSION['message_type'] = 'error';
        return false;
    }
}

// Cek apakah form di-submit dan panggil fungsi upload
$newFileName = "";
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    if (isset($_FILES['fileToUpload'])) {
        $newFileName = uploadFile($_FILES['fileToUpload']);
    }
    if (isset($_POST['deleteFile'])) {
        $deleteResult = deleteFile($_POST['deleteFile']);
    }
    // Redirect untuk menghindari resubmission
    header("Location: " . $_SERVER['PHP_SELF']);
    exit();
}

$uploadedFiles = getUploadedFiles();
?>

<!DOCTYPE html>
<html lang="en">

<head>
  <title>WA API GATEWAY</title>
  <meta name="description" content="WhatsApp API otomatis." />
  <meta charset="UTF-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta
    name="viewport"
    content="width=device-width, minimum-scale=1.0, initial-scale=1.0, user-scalable=yes" />
    <link rel="icon" href="./assets/icon.svg" />
  <link
    rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" />
  <link
    rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" />
  <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
  <script src="https://unpkg.com/htmx.org@1.9.19"></script>
  <style>
    body {
      background: rgb(200, 220, 224);
      font-family: Arial, sans-serif;
    }

    .sidebar {
      width: 250px;
      height: 100vh;
      position: fixed;
      left: 0;
      top: 0;
      background: #03773f;
      color: #fff;
      padding: 20px;
      display: none;
      flex-direction: column;
    }

    .sidebar.active {
      display: flex;
    }

    .sidebar h2 {
      margin-bottom: 20px;
      font-size: 24px;
    }

    .sidebar ul {
      list-style: none;
      padding: 0;
    }

    .sidebar ul li {
      margin-bottom: 10px;
    }

    .sidebar ul li a {
      color: #fff;
      text-decoration: none;
      font-size: 18px;
    }

    .sidebar ul li a:hover {
      color: #000;
    }

    .hamburger {
      display: none;
      font-size: 30px;
      cursor: pointer;
      position: fixed;
      top: 20px;
      left: 20px;
      z-index: 100;
    }

    .content {
      margin-left: 0;
      padding: 20px;
      transition: margin-left 0.3s;
    }

    @media (min-width: 768px) {
      .sidebar {
        display: flex;
      }

      .hamburger {
        display: none;
      }

      .content {
        margin-left: 250px;
      }
    }

    @media (max-width: 767px) {
      .hamburger {
        display: block;
      }

      .sidebar {
        display: none;
      }

      .sidebar.active {
        display: flex;
        position: fixed;
        top: 0;
        left: 0;
        width: 250px;
        height: 100vh;
        background: #03773f;
        z-index: 99;
      }

      .content {
        margin-left: 0;
      }
    }

    .form {
      max-width: 600px;
      margin: 50px auto;
      padding: 20px;
      background: #ffffff;
      border-radius: 8px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    .form h1 {
      background: #03773f;
      padding: 12px 0;
      font-weight: 300;
      text-align: center;
      color: #fff;
      margin: 0;
      font-size: 24px;
      border-radius: 8px 8px 0 0;
      width: 100%;
      box-sizing: border-box;
    }

    .form .loading {
      width: 250px;
      height: 250px;
      background: url("./assets/loader.gif") no-repeat center;
      background-size: contain;
      margin-top: 20px;
    }

    .folder-container {
      margin-top: 20px;
    }

    .folder-container table {
      width: 100%;
      border-collapse: collapse;
    }

    .folder-container th, .folder-container td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }

    .folder-container th {
      background-color: #f4f4f4;
    }

    .folder-container tr:hover {
      background-color: #f1f1f1;
    }

    .form input[type="submit"] {
      background-color: #007bff;
      color: #fff;
      border: none;
      padding: 12px 20px;
      border-radius: 5px;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }

    .form input[type="submit"]:hover {
      background-color: #0056b3;
    }

    .form input[type="file"] {
      border: 1px solid #ddd;
      padding: 10px;
      border-radius: 5px;
    }

    .folder-container img {
      width: 100px;
      height: 100px;
      object-fit: cover;
    }

    .folder-container a {
      color: #007bff;
      text-decoration: none;
    }

    .folder-container a:hover {
      text-decoration: underline;
    }

    .btn-danger {
      background-color: #dc3545;
      border: none;
      color: #fff;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }

    .btn-danger:hover {
      background-color: #c82333;
    }
  </style>
</head>

<body>
  <div id="hamburger" class="hamburger">
    <i class="fas fa-bars"></i>
  </div>
  <div id="sidebar" class="sidebar">
    <h2>Menu</h2>
    <ul>
      <li><a href="index.php"><i class="fas fa-home"></i> Beranda</a></li>
      <li><a href="kirim_pesan.php"><i class="fas fa-envelope"></i> Kirim Pesan</a></li>
      <li><a href="setting.php"><i class="fas fa-cog"></i> Server Setting</a></li>
      <li><a href="folder.php"><i class="fas fa-folder"></i> Folder</a></li>
    </ul>
    <br>
    <button id="logout-btn" class="btn btn-primary">Logout</button>
    <br>
    <p style="text-align: center; font-size: 12px; margin-top: 10px;">Copyright © 2024 API GATEWAY</p>
    <p style="text-align: center; font-size: 12px; margin-top: 10px;">Version 24.08.15</p>
  </div>

  <div class="content">
    <div class="form">
      <h1>Folder Upload</h1>
      <div class="folder-container">
        <table class="table table-striped">
          <thead>
            <tr>
              <th>Nama File</th>
              <th>Preview</th>
              <th>Hapus</th>
            </tr>
          </thead>
          <tbody>
            <?php foreach ($uploadedFiles as $file): ?>
              <tr>
                <td><a href="uploads/<?php echo $file; ?>" target="_blank"><?php echo $file; ?></a></td>
                <td><img src="uploads/<?php echo $file; ?>" alt="<?php echo $file; ?>"></td>
                <td>
                  <form action="folder.php" method="post" style="display:inline;">
                    <input type="hidden" name="deleteFile" value="<?php echo $file; ?>">
                    <button type="submit" class="btn btn-danger btn-sm">Hapus</button>
                  </form>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    </div>
    <div class="form">
      <h1>Upload Gambar</h1>
      <form action="folder.php" method="post" enctype="multipart/form-data">
        <input type="file" name="fileToUpload" id="fileToUpload" accept="image/*">
        <input type="submit" value="Upload Image" name="submit">
      </form>
      <?php if ($newFileName): ?>
        <div class="mt-3">
          <h3>Gambar Baru:</h3>
          <img src="uploads/<?php echo $newFileName; ?>" alt="<?php echo $newFileName; ?>" style="width: 100%; max-width: 300px; border: 1px solid #ddd;">
        </div>
      <?php endif; ?>
    </div>
  </div>

  <!-- SweetAlert Script -->
  <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
  <script>
      document.addEventListener("DOMContentLoaded", function() {
          <?php if (isset($_SESSION['message'])): ?>
              Swal.fire({
                  icon: '<?php echo $_SESSION['message_type']; ?>',
                  title: '<?php echo $_SESSION['message']; ?>',
                  showConfirmButton: true
              });
              <?php unset($_SESSION['message']); unset($_SESSION['message_type']); ?>
          <?php endif; ?>
      });
  </script>

  <script>
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
