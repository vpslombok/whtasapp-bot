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


<?php include 'layout/header.php'; ?>
<?php include 'layout/sidebar.php'; ?>

<div class="content">
  <div class="form webhook">
    <h1>Update Webhook URL</h1>
    <input
      type="url"
      id="webhook-url-input"
      placeholder="Enter new webhook URL"
      class="form-control" style="margin-top: 10px;"/>
    <button id="update-webhook-url-btn" class="btn btn-primary" style="margin-top: 10px;">
      Update URL
    </button>
  </div>
</div>

<div class="content">
  <div class="form web">
    <h1>Perbarui Link Website</h1>
    <form method="POST" action="setting.php">
      <input
        type="url"
        name="web-url-input"
        id="web-url-input"
        placeholder="Masukkan URL web baru"
        class="form-control" style="margin-top: 10px;"/>
      <button type="submit" id="update-web-url-btn" class="btn btn-danger" style="margin-top: 10px;">Perbarui</button>
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