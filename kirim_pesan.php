<!DOCTYPE html>
<html lang="en">

<head>
  <title>Kirim Pesan</title>
  <meta name="description" content="Settings for WhatsApp API." />
  <meta charset="UTF-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta
    name="viewport"
    content="width=device-width, minimum-scale=1.0, initial-scale=1.0, user-scalable=yes" />
  <!-- logo  -->
  <link rel="icon" href="./assets/icon.svg" />
  <link
    rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" />
  <!-- bootstrap -->
  <link
    rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" />
  <!-- sweetalert -->
  <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
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
      margin: 50px auto;
      text-align: center;
      padding: 12px;
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
      margin: -12px -12px 16px -12px;
      font-size: 22px;
      border-radius: 8px 8px 0 0;
    }

    .form input[type="text"],
    .form input[type="number"] {
      box-sizing: border-box;
      width: 100%;
      background: #fff;
      margin-bottom: 2%;
      border: 1px solid #ccc;
      padding: 3%;
      font-size: 16px;
      color: rgb(9, 61, 125);
      border-radius: 4px;
    }

    .form input[type="text"]:focus,
    .form input[type="number"]:focus {
      box-shadow: 0 0 5px #5868bf;
      padding: 3%;
      border: 1px solid #5868bf;
    }

    .form button {
      width: 160px;
      margin: 0 auto;
      padding: 2%;
      background: #0853b6;
      border: none;
      border-radius: 3px;
      font-size: 16px;
      color: #fff;
      cursor: pointer;
    }

    .form button:hover {
      background: rgba(88, 104, 191, 0.7);
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
      <li><a href="folder.php"><i class="fas fa-folder"></i> Folder</a></li>
      <li><a href="setting.php"><i class="fas fa-cog"></i> Server Setting</a></li>
    </ul>
    <br>
    <button id="logout-btn" class="btn btn-primary">Logout</button>
    <br>
    <p style="text-align: center; font-size: 12px; margin-top: 10px;">Copyright © 2024 API GATEWAY</p>
    <p style="text-align: center; font-size: 12px; margin-top: 10px;">Version 24.08.15</p>
  </div>

  <div class="content">
    <div class="form">
      <h1>Kirim Pesan</h1>
      <input
        type="text"
        id="pesan-input"
        placeholder="Masukkan pesan"
        class="form-control" />
      <input
        type="number"
        id="nomor-input"
        placeholder="Masukkan nomor tujuan"
        class="form-control" />
      <button id="kirim-pesan-btn" class="btn btn-primary">
        Kirim Pesan
      </button>
    </div>
  </div>

  <script>
    const pesanInput = document.getElementById("pesan-input");
    const nomorInput = document.getElementById("nomor-input");
    const kirimPesanBtn = document.getElementById("kirim-pesan-btn");

    async function kirimPesan() {
      const pesan = pesanInput.value;
      const nomor = nomorInput.value;
      if (!pesan || !nomor) {
        alert("Mohon isi pesan dan nomor tujuan.");
        return;
      }
      try {
        const response = await fetch("http://localhost:3100/send-message", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: pesan,
            number: nomor
          }),
        });
        const result = await response.json();
        if (result.status) {
          Swal.fire({
            title: "Kirim Pesan",
            text: `Berhasil terkirim ke: ${nomor}`,
            icon: "success",
          });
        } else {
          Swal.fire({
            title: "Kirim Pesan",
            text: "Tidak ada pesan.",
            icon: "error",
          });
        }
      } catch (error) {
        console.error("Error sending message:", error);
        alert("Error sending message.");
      }
    }

    kirimPesanBtn.addEventListener("click", kirimPesan);

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