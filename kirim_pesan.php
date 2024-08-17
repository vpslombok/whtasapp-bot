<?php include 'layout/header.php'; ?>
<?php include 'layout/sidebar.php'; ?>

<div class="content">
  <div class="form">
    <h1>Kirim Pesan</h1>
    <input
      type="text"
      id="pesan-input"
      placeholder="Masukkan pesan"
      class="form-control" style="margin-top: 20px;" />
    <input
      type="number"
      id="nomor-input"
      placeholder="Masukkan nomor tujuan"
      class="form-control" style="margin-top: 20px;" />
    <input
      type="file"
      id="file-input"
      class="form-control" style="margin-top: 20px;" />
    <button id="kirim-pesan-btn" class="btn btn-danger" style="margin-top: 20px;">
      Kirim Pesan
    </button>
  </div>
</div>

<script>
  const pesanInput = document.getElementById("pesan-input");
  const nomorInput = document.getElementById("nomor-input");
  const fileInput = document.getElementById("file-input");
  const kirimPesanBtn = document.getElementById("kirim-pesan-btn");

  async function kirimPesan() {
    const pesan = pesanInput.value;
    const nomor = nomorInput.value;
    const file = fileInput.files[0];
    if (!pesan || !nomor || !file) {
      alert("Mohon isi pesan, nomor tujuan, dan pilih file.");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("message", pesan);
      formData.append("number", nomor);
      formData.append("file_dikirim", file, file.name);

      const response = await fetch("http://localhost:3100/send-message", {
        method: "POST",
        body: formData,
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