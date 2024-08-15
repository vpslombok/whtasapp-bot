<?php
include 'db.php';

if (isset($_POST['web-url-input'])) {
  $webUrl = $_POST['web-url-input'];
  if (!empty($webUrl)) {
    $query = "UPDATE webhook_urls SET web_url='$webUrl', updated_at=NOW() ORDER BY updated_at DESC LIMIT 1";
    if ($conn->query($query) === TRUE) {
    } else {
      echo "Error updating web URL: " . $conn->error;
    }
  } else {
    echo "URL tidak valid.";
  }
}

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
  <title>Settings</title>
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
      margin: 39px auto;
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

    .form input[type="url"] {
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

    .form input[type="url"]:focus {
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
    <div class="form webhook">
      <h1>Update Webhook URL</h1>
      <input
        type="url"
        id="webhook-url-input"
        placeholder="Enter new webhook URL"
        class="form-control" />
      <button id="update-webhook-url-btn" class="btn btn-primary">
        Update URL
      </button>
    </div>
  </div>

  <div class="content">
    <div class="form web">
      <h1>Perbarui Link Website</h1>
      <form method="POST" action="setting.php">
        <input
          type="text"
          name="web-url-input"
          id="web-url-input"
          placeholder="Masukkan URL web baru"
          class="form-control" />
        <button type="submit" id="update-web-url-btn" class="btn btn-info">Perbarui</button>
      </form>
    </div>
  </div>
  <script>
    const apiUrl = "<?php echo $apiUrl; ?>"; // Gunakan URL API yang diambil dari database
    // Ambil data webhook dari API
    fetch(apiUrl + "/webhook-url")
      .then((response) => response.json())
      .then((data) => {
        document.getElementById("webhook-url-input").value = data.url;
        document.getElementById("web-url-input").value = data.web_url;
      })
      .catch((error) => console.error("Error fetching webhook data:", error));

    document
      .getElementById("update-webhook-url-btn")
      .addEventListener("click", () => {
        const webhookUrl = document.getElementById("webhook-url-input").value;
        if (webhookUrl) {
          fetch(apiUrl + "/update-webhook-url", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                url: webhookUrl
              }),
            })
            .then((response) => response.json())
            .then((data) => {
              if (data.status) {
                Swal.fire({
                  icon: "success",
                  title: "Berhasil",
                  text: "URL webhook berhasil diperbarui.",
                });
              } else {
                Swal.fire({
                  icon: "error",
                  title: "Gagal",
                  text: data.message,
                });
              }
            })
            .catch((error) => {
              console.error("Error updating webhook URL:", error);
              Swal.fire({
                icon: "error",
                title: "Gagal",
                text: "Terjadi kesalahan saat memperbarui URL webhook.",
              });
            });
        } else {
          Swal.fire({
            icon: "error",
            title: "Gagal",
            text: "URL tidak valid.",
          });
        }
      });

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