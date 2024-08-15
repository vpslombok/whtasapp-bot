<?php
include 'db.php';
// Ambil URL API dari database
$query = "SELECT web_url FROM webhook_urls ORDER BY updated_at DESC LIMIT 1";
$result = $conn->query($query);

$apiUrl = "";
if ($result && $result->num_rows > 0) {
  $row = $result->fetch_assoc();
  $apiUrl = $row['web_url'];
}
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
      max-width: 400px;
      margin: 10px auto;
      text-align: center;
      padding: 12px;
      background: #ffffff;
      border-radius: 8px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .form h1 {
      background: #03773f;
      padding: 12px 0;
      font-weight: 300;
      text-align: center;
      color: #fff;
      margin: 0;
      /* Hilangkan margin */
      font-size: 22px;
      border-radius: 8px 8px 0 0;
      width: 100%;
      /* Pastikan lebar h1 mengikuti elemen parent-nya */
      box-sizing: border-box;
      /* Pastikan padding dihitung dalam lebar */
    }

    .form img {
      width: 250px;
      height: 250px;
      object-fit: cover;
      margin-top: 20px;
      display: block;
      /* Tampilkan gambar QR code secara default */
    }

    .form .loading {
      width: 250px;
      height: 250px;
      background: url("./assets/loader.gif") no-repeat center;
      background-size: contain;
      margin-top: 20px;
    }

    .user-info-container {
      margin-top: 20px;
    }

    .qrcode-container {
      display: none;
    }
  </style>
</head>

<body>
  <div class="hamburger" id="hamburger">
    <i class="fas fa-bars"></i>
  </div>

  <div class="sidebar" id="sidebar">
    <h2>API GATEWAY <i class="fas fa-arrow-left"></i></h2>
    <ul>
      <li><a href="/"><i class="fas fa-home"></i> Beranda</a></li>
      <li><a href="kirim_pesan.php"><i class="fas fa-envelope"></i> Kirim Pesan</a></li>
      <li><a href="setting.php"><i class="fas fa-cog"></i> Server Setting</a></li>
      <li><a href="folder.php"><i class="fas fa-folder"></i> Folder</a></li> <!-- Menu baru -->
    </ul>

    <br>
    <button id="logout-btn" class="btn btn-primary">Logout</button>
    <br>
    <p style="text-align: center; font-size: 12px; margin-top: 10px;">Copyright © 2024 API GATEWAY</p>
    <p style="text-align: center; font-size: 12px; margin-top: 10px;">Version 24.08.15</p>
  </div>


  <div class="content">
    <div class="form">
      <h1>WhatsApp API QR</h1>
      <div id="connection-status" style="font-size: 18px; color: #000; margin-top: 10px;">Checking connection...</div>
      <div id="signal-bar" style="display: flex; gap: 2px; margin-top: 10px;">
        <div class="signal-bar" id="bar1" style="width: 8px; height: 20px; background-color: gray;"></div>
        <div class="signal-bar" id="bar2" style="width: 8px; height: 20px; background-color: gray;"></div>
        <div class="signal-bar" id="bar3" style="width: 8px; height: 20px; background-color: gray;"></div>
        <div class="signal-bar" id="bar4" style="width: 8px; height: 20px; background-color: gray;"></div>
        <div class="signal-bar" id="bar5" style="width: 8px; height: 20px; background-color: gray;"></div>
      </div>
      <div id="loading" style="display: none"></div>
      <img id="profile-pic" style="display: none" alt="Profile Picture" src="./assets/loader.gif" style="display: block;" />
      <img id="qrcode" alt="QR Code" src="./assets/loader.gif" style="display: block;" />
      <div class="user-info-container">
        <div id="user-info"></div>
        <p id="user-number" style="font-size: 18px; color: rgb(0, 0, 0); margin-top: 10px"></p>
      </div>
      <button id="logout-btn" class="btn btn-primary">Logout</button>
    </div>
  </div>


  <script>
    const apiUrl = "<?php echo $apiUrl; ?>";

    function updateSignalBar(status) {
      const bars = Array.from(document.getElementsByClassName("signal-bar"));
      bars.forEach((bar, index) => {
        if (index < status) {
          bar.style.backgroundColor = "green";
        } else {
          bar.style.backgroundColor = "gray";
        }
      });
    }

    setInterval(() => {
      fetch(apiUrl + "/api/qr-code")
        .then((response) => {
          if (response.ok) {
            document.getElementById("connection-status").textContent = "Status: Online";
            document.getElementById("connection-status").style.color = "green";
            updateSignalBar(5); // Set bar sinyal ke 5 jika koneksi berhasil
          } else {
            throw new Error("API not reachable");
          }
          return response.json();
        })
        .then((data) => {
          const profilePic = document.getElementById("profile-pic");
          const loading = document.getElementById("loading");
          const userInfo = document.getElementById("user-info");
          const userNumber = document.getElementById("user-number");
          const qrCodeImg = document.getElementById("qrcode");

          if (data.qrCodeUrl) {
            qrCodeImg.src = data.qrCodeUrl;
            qrCodeImg.style.display = "block";
          } else {
            qrCodeImg.style.display = "none";
          }

          if (data.user) {
            loading.style.display = "none";
            profilePic.src = data.profilePicUrl;
            profilePic.style.display = "block";
            userInfo.textContent = `Name: ${data.nama}`;
            userNumber.textContent = `Number: ${data.user}`;
          } else {
            profilePic.style.display = "none";
            userInfo.textContent = "";
            userNumber.textContent = "";
          }
        })
        .catch((error) => {
          console.error("Error fetching data:", error);
          document.getElementById("connection-status").textContent = "Status: Offline";
          document.getElementById("connection-status").style.color = "red";
          updateSignalBar(0); // Set bar sinyal ke 0 jika tidak ada koneksi
        });
    }, 1000); // Memanggil API setiap 1 detik




    // Event listener untuk tombol logout
    document.getElementById("logout-btn").addEventListener("click", () => {
      fetch(apiUrl + "/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        })
        .then((response) => response.json())
        .then((data) => {
          if (data.status) {
            console.log(data.message);
            // Tambahkan kode untuk mengarahkan ke halaman login atau tindakan lain setelah logout
          } else {
            console.error(data.message);
          }
        })
        .catch((error) => {
          console.error("Error logging out:", error);
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
  <script src="https://unpkg.com/htmx.org@2.0.2/dist/htmx.js" integrity="sha384-yZq+5izaUBKcRgFbxgkRYwpHhHHCpp5nseXp0MEQ1A4MTWVMnqkmcuFez8x5qfxr" crossorigin="anonymous"></script>
</body>

</html>