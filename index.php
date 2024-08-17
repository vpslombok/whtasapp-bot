<?php
include 'db.php';
// Ambil URL API dari database
$query = "SELECT web_url FROM webhook_urls ORDER BY updated_at DESC LIMIT 1";
$result = $conn->query($query);

$apiUrl = "";
if ($result && $result->num_rows > 0) {
  $row = $result->fetch_assoc();
  $apiUrl = $row['web_url'];

  // Simpan IP dan lokasi user yang mengakses ke database jika belum ada
  $userIP = $_SERVER['REMOTE_ADDR'];
  $location = json_decode(file_get_contents("http://ipinfo.io/" . $userIP . "/json"), true);
  $query = "SELECT * FROM user_access WHERE ip = '$userIP' AND location = '" . json_encode($location) . "'";
  $result = $conn->query($query);
  if (!$result || $result->num_rows == 0) {
    $query = "INSERT INTO user_access (ip, location) VALUES ('$userIP', '" . json_encode($location) . "')";
    $conn->query($query);
  }
}
?>
<?php include 'layout/header.php'; ?>
<?php include 'layout/sidebar.php'; ?>


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
    <button id="logout-btn" class="btn btn-danger">Logout</button>
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