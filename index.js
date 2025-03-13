process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const {
  default: makeWASocket,
  fetchLatestBaileysVersion,
  isJidBroadcast,
  makeInMemoryStore,
  useMultiFileAuthState,
  DisconnectReason,
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const { Boom } = require("@hapi/boom");
const path = require("path");
const fs = require("fs");
const http = require("http");
const express = require("express");
const fileUpload = require("express-fileupload");
const cors = require("cors");
const bodyParser = require("body-parser");
const qrcode = require("qrcode");
const moment = require("moment-timezone");
const axios = require("axios");
const fetch = require("node-fetch");

const app = express();
app.use(bodyParser.json());
const server = http.createServer(app);
const io = require("socket.io")(server);
const port = process.env.PORT || 3100;
const session = "./localhost";
const store = makeInMemoryStore({
  logger: pino().child({ level: "silent", stream: "store" }),
});

let sock, qr, soket, info_device, info_device_profilePicUrl, wa_nama, url_api;

app.use(fileUpload({ createParentPath: true }));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

function getGreeting() {
  const currentHour = moment().tz("Asia/Singapore").hour();
  let greeting;
  if (currentHour >= 0 && currentHour < 12) {
    greeting = "Selamat Pagi";
  } else if (currentHour >= 12 && currentHour < 15) {
    greeting = "Selamat Siang";
  } else if (currentHour >= 15 && currentHour < 18) {
    greeting = "Selamat Sore";
  } else if (currentHour >= 18 && currentHour < 24) {
    greeting = "Selamat Malam";
  }
  return greeting;
}

async function getProfilePicture(jid) {
  try {
    const url = await sock.profilePictureUrl(jid, "image");
    return url;
  } catch (error) {
    console.error("Error mendapatkan foto profil:", error);
    return null;
  }
}

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(session);
  let { version } = await fetchLatestBaileysVersion();
  sock = makeWASocket({
    browser: ["LOMBOK", "NTB", "2024"],
    auth: state,
    logger: pino({ level: "silent" }),
    version,
    shouldIgnoreJid: (jid) => isJidBroadcast(jid),
  });
  store.bind(sock.ev);
  sock.multi = true;

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      const reason =
        lastDisconnect.error?.output?.statusCode || "Tidak Diketahui";
      console.log(`Koneksi ditutup dengan alasan: ${reason}`);
      switch (reason) {
        case DisconnectReason.badSession:
          console.log(`File Sesi , Silakan Hapus ${session} dan Scan Lagi`);
          await sock.logout();
          break;
        case DisconnectReason.connectionClosed:
          console.log("Koneksi ditutup, menghubungkan kembali...");
          await connectToWhatsApp();
          break;
        case DisconnectReason.connectionLost:
          console.log(
            "Koneksi Hilang dari Server, menghubungkan kembali dalam beberapa detik..."
          );
          await new Promise((resolve) => setTimeout(resolve, 5000));
          await connectToWhatsApp();
          break;
        case DisconnectReason.connectionReplaced:
          console.log(
            "Koneksi Digantikan, Sesi Baru Lain Dibuka, Silakan Tutup Sesi Saat Ini Terlebih Dahulu"
          );
          await sock.logout();
          break;
        case DisconnectReason.loggedOut:
          console.log(
            `Perangkat Keluar, Silakan Hapus ${session} dan Scan Lagi.`
          );
          if (fs.existsSync(session)) {
            fs.rmSync(session, { recursive: true });
            console.log(`${session} telah dihapus.`);
          }
          fs.mkdirSync(session, { recursive: true });
          console.log(`Folder ${session} telah dibuat.`);
          await sock.logout();
          await connectToWhatsApp();
          break;
        case DisconnectReason.restartRequired:
          console.log("Restart Diperlukan, Mengulang...");
          await connectToWhatsApp();
          break;
        case DisconnectReason.timedOut:
          console.log("Koneksi Kedaluwarsa, Menghubungkan kembali...");
          await connectToWhatsApp();
          break;
        default:
          console.log(
            `Alasan DisconnectReason Tidak Diketahui: ${reason}|${lastDisconnect.error}`
          );
          sock.end(
            `Alasan DisconnectReason Tidak Diketahui: ${reason}|${lastDisconnect.error}`
          );
          await connectToWhatsApp();
          break;
      }
    } else if (connection === "open") {
      info_device = sock.user.id
        .split(":")[0]
        .replace("@s.whatsapp.net", "")
        .replace("62", "0");
      console.log(+info_device + " / " + sock.user.name);
      const profilePicUrl = await getProfilePicture(sock.user.id);
      info_device_profilePicUrl = profilePicUrl;
      wa_nama = sock.user.name;
      const groups = Object.values(await sock.groupFetchAllParticipating());
      for (const group of groups) {
        // console.log(`id_group: ${group.id} || Nama Group: ${group.subject}`);
      }
    }
    if (update.qr) {
      qr = update.qr;
      updateQR("qr");
    } else if (!update.qr) {
      updateQR("loading");
    } else if (update.connection === "open") {
      updateQR("qrscanned");
    }
  });

  function fetchLatestUrl() {
    const db = require("./db");
    db.query(
      "SELECT url_api, url FROM webhook_urls ORDER BY id DESC LIMIT 1",
      (error, results, fields) => {
        if (error) {
          console.error("Error mengambil URL:", error);
        } else if (results.length > 0) {
          url_api = results[0].url_api;
          url = results[0].url;
          soket?.emit("url_api", url_api);
          soket?.emit("url", url);
        } else {
          console.error("Tidak ditemukan url_api dalam basis data");
        }
      }
    );
  }

  setInterval(fetchLatestUrl, 10000);
  fetchLatestUrl();

  sock.ev.on("creds.update", saveCreds);

  async function sendTyping(jid) {
    // Menampilkan status "typing..." (sedang mengetik)
    await sock.sendPresenceUpdate("composing", jid); // Set status ke 'composing' (sedang mengetik)

    // Durasi ketik sebelum mengirimkan balasan (misalnya 2 detik)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Set status kembali ke 'available' (online) setelah selesai mengetik
    await sock.sendPresenceUpdate("available", jid);
  }

  async function setOnlineStatus(jid) {
    // Mengubah status bot menjadi "online" (tersedia)
    await sock.presenceSubscribe(jid); // Subscribe ke presence pengguna
    await sock.sendPresenceUpdate("available", jid); // Set status ke 'available' (online)
  }

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type === "notify") {
      const message = messages[0];
      const isFromMe = message.key.fromMe;

      // Hanya proses pesan yang bukan dari bot sendiri
      if (!isFromMe) {
        const noWa = message.key.remoteJid;

        // Menampilkan status "online" saat bot menerima pesan
        await setOnlineStatus(noWa);

        // Ekstrak pesan dari berbagai jenis pesan WhatsApp
        let pesan = "[Jenis pesan tidak dikenal]";
        if (message.message) {
          if (message.message.conversation) {
            pesan = message.message.conversation;
          } else if (message.message.extendedTextMessage) {
            pesan = message.message.extendedTextMessage.text;
          } else if (message.message.imageMessage) {
            pesan = "[Gambar diterima]";
          } else if (message.message.videoMessage) {
            pesan = "[Video diterima]";
          } else if (message.message.documentMessage) {
            pesan = "[Dokumen diterima]";
          } else if (message.message.audioMessage) {
            pesan = "[Audio diterima]";
          } else if (message.message.contactMessage) {
            pesan = "[Kontak diterima]";
          } else if (message.message.locationMessage) {
            pesan = "[Lokasi diterima]";
          } else if (message.message.stickerMessage) {
            pesan = "[Stiker diterima]";
          } else if (message.message.templateButtonReplyMessage) {
            pesan = message.message.templateButtonReplyMessage.selectedId;
          }
        }

        const namaPengirim = message.pushName;
        const pesanMasuk = pesan ? pesan.toLowerCase() : "";
        const waktuSekarang = moment().tz("Asia/Singapore").format("HH:mm:ss");
        const tanggalSekarang = moment()
          .tz("Asia/Singapore")
          .format("DD-MM-YYYY");

        console.log(`Pesan Masuk dari ${namaPengirim}: ${pesan}`);
        await sock.readMessages([message.key]);

        let balasan = "";
        const greeting = getGreeting();

        // Fitur untuk pesan dari grup
        if (noWa.endsWith("@g.us")) {
          console.log(`Pesan dari grup ${noWa}: ${pesan}`);
          balasan = `${greeting} *${namaPengirim}*, Mohon Maaf, Fitur Bot Belum Tersedia di Grup`;

          // Kirim balasan ke pengguna
          await sock.sendMessage(noWa, { text: balasan });
        } else {
          // Proses pesan dari pengguna perorangan
          let ditemukan = false;

          try {
            // Fetch data dari API
            const response = await fetch(`${url}`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                message: pesanMasuk,
                from: noWa.replace("@s.whatsapp.net", ""),
              }),
            });

            // Cek jika response tidak OK (status code bukan 2xx)
            if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
            }

            // Parse response JSON
            const results = await response.json();
            console.log("Response dari API:", results);

            // Periksa status dan text dari response
            if (results && results.status && results.text) {
              balasan = results.text;
              ditemukan = true;
            } else {
              console.log("Response dari API kosong atau tidak valid.");
            }
          } catch (error) {
            console.error("Error fetching data dari API:", error);
          }

          // Jika tidak ditemukan, kirim pesan default
          if (!ditemukan) {
            balasan = `${greeting} *${namaPengirim}*, untuk mengetahui laundry yang sedang dalam proses, silakan ketik *list laundry*. Jika ingin detail status laundry, silakan ketik *cek status*.`;
          }

          console.log("Balasan yang akan dikirim:", balasan);

          // Menunggu beberapa detik untuk efek mengetik
          await sendTyping(noWa);

          // Kirim balasan ke pengguna
          try {
            await sock.sendMessage(noWa, { text: balasan });
            console.log("Balasan berhasil dikirim ke pengguna.");
          } catch (error) {
            console.error("Gagal mengirim balasan ke pengguna:", error);
          }

          // Simpan pesan ke database
          const noWhatsapp = noWa.replace("@s.whatsapp.net", "");
          const data = {
            number: noWhatsapp,
            message_in: pesanMasuk,
            message: balasan,
          };

          try {
            const saveResponse = await fetch(
              `${url_api}/api/send_message.php`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
              }
            );

            if (!saveResponse.ok) {
              throw new Error("Gagal menyimpan pesan ke database");
            }

            const saveResult = await saveResponse.text();
            console.log("Balasan berhasil disimpan ke database send_messages.");
          } catch (error) {
            console.error("Error saving message to database:", error);
          }
        }
      }
    }
  });
}

io.on("connection", (socket) => {
  soket = socket;
  if (isConnected()) {
    updateQR("connected");
  } else if (qr) {
    updateQR("qr");
  }
});

const isConnected = () => !!sock?.user;

const updateQR = (data) => {
  switch (data) {
    case "qr":
      qrcode.toDataURL(qr, (err, url) => {
        if (err) {
          console.error("Error generating QR code:", err);
        } else {
          soket?.emit("qr", url);
          soket?.emit("log", "QR Code received, please scan!");
        }
      });
      break;
    case "connected":
      soket?.emit("qrstatus", info_device_profilePicUrl);
      soket?.emit("log", "WhatsApp terhubung!");
      soket?.emit("user", info_device);
      soket?.emit("nama", wa_nama);
      soket?.emit("profilePicUrl", info_device_profilePicUrl);
      break;
    case "qrscanned":
      soket?.emit("qrstatus", info_device_profilePicUrl);
      soket?.emit("log", "QR Code Telah discan!");
      break;
    case "loading":
      soket?.emit("qrstatus", "./assets/loader.gif");
      soket?.emit("log", "Registering QR Code, please wait!");
      break;
    default:
      break;
  }
};

app.get("/api/qr-code", (req, res) => {
  if (isConnected()) {
    res.status(200).json({
      message: "User sudah terhubung",
      user: info_device,
      nama: wa_nama,
      profilePicUrl: info_device_profilePicUrl,
    });
  } else {
    if (qr) {
      qrcode.toDataURL(qr, (err, url) => {
        if (err) {
          console.error("Error generating QR code:", err);
          res.status(500).json({ error: "Gagal menghasilkan QR code" });
        } else {
          res.status(200).json({ qrCodeUrl: url });
        }
      });
    } else {
      res.status(404).json({ error: "QR code tidak tersedia" });
    }
  }
});

app.post("/send-button-message", async (req, res) => {
  const { number, message, buttonText, buttonId } = req.body;

  // Validasi input
  if (!number || !message || !buttonText || !buttonId) {
    return res.status(400).json({
      status: false,
      response:
        "Semua parameter diperlukan: number, message, buttonText, buttonId",
    });
  }

  // Format nomor WhatsApp
  const numberWA = "62" + number.substring(1) + "@s.whatsapp.net";

  try {
    // Cek apakah nomor terdaftar di WhatsApp
    const exists = await sock.onWhatsApp(numberWA);
    if (exists?.jid || (exists && exists[0]?.jid)) {
      const jid = exists.jid || exists[0].jid;

      // Kirim pesan dengan tombol
      await sock.sendMessage(jid, {
        text: message,
        footer: "Klik tombol di bawah ini:", // Footer opsional
        buttons: [
          {
            buttonId: buttonId,
            buttonText: { displayText: buttonText },
            type: 1,
          },
        ],
        headerType: 1, // Opsional
      });

      console.log(`Pesan button berhasil dikirim ke ${number}`);
      return res.status(200).json({
        status: true,
        response: `Pesan button berhasil dikirim ke ${number}`,
      });
    } else {
      console.log(`Nomor ${number} tidak terdaftar di WhatsApp`);
      return res.status(404).json({
        status: false,
        response: `Nomor ${number} tidak terdaftar di WhatsApp`,
      });
    }
  } catch (error) {
    console.error("Error saat mengirim pesan button:", error);
    return res.status(500).json({
      status: false,
      response: "Terjadi kesalahan saat mengirim pesan button",
    });
  }
});
// Endpoint untuk mengirim pesan teks
app.post("/send-message", async (req, res) => {
  const { message: pesankirim, number } = req.body;
  if (!number) {
    return res
      .status(500)
      .json({ status: false, response: "Nomor WA tidak disertakan!" });
  }
  const numberWA = "62" + number.substring(1) + "@s.whatsapp.net";
  try {
    const exists = await sock.onWhatsApp(numberWA);
    if (exists?.jid || (exists && exists[0]?.jid)) {
      await sock.sendMessage(exists.jid || exists[0].jid, { text: pesankirim });

      // Simpan pesan ke database
      const data = {
        number,
        message_in: "Dikirim via API",
        message: pesankirim,
      };
      fetch(`${url_api}/api/send_message.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
        .then((response) => response.json())
        .then((data) => console.info("Pesan berhasil disimpan ke database."))
        .catch((error) =>
          console.error("Error saving message to database:", error)
        );

      res.status(200).json({
        status: true,
        response: "Pesan Berhasil Dikirim ke " + number,
      });
    } else {
      res
        .status(500)
        .json({ status: false, response: `Nomor ${number} tidak terdaftar.` });
    }
  } catch (err) {
    res.status(500).send(err);
  }
});

app.post("/send-media", async (req, res) => {
  const { message: pesankirim, number, file_url } = req.body;
  const { file_dikirim: fileDikirim } = req.files || {};

  if (!number || (!fileDikirim && !file_url)) {
    return res.status(500).json({
      status: false,
      response: "Nomor WA atau file tidak disertakan!",
    });
  }

  const numberWA = "62" + number.substring(1) + "@s.whatsapp.net";

  try {
    const exists = await sock.onWhatsApp(numberWA);
    if (!exists?.jid && !(exists && exists[0]?.jid)) {
      return res.status(500).json({
        status: false,
        response: `Nomor ${number} tidak terdaftar.`,
      });
    }

    const jid = exists.jid || exists[0].jid;

    if (file_url) {
      // Kirim gambar langsung dari URL
      await sock.sendMessage(jid, {
        image: { url: file_url },
        caption: pesankirim,
      });

      // Simpan pesan ke database dengan file_url
      const data = {
        number,
        message_in: "Dikirim via URL",
        message: file_url,
      };
      fetch(`${url_api}/api/send_message.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
        .then((response) => response.json())
        .then(() => console.info("Pesan berhasil disimpan ke database."))
        .catch((error) =>
          console.error("Terjadi kesalahan saat menyimpan pesan:", error)
        );

      return res
        .status(200)
        .json({ status: true, message: "Gambar dari URL berhasil dikirim" });
    }

    // Jika file dikirim melalui upload
    const file = req.files.file_dikirim;
    const file_ubah_nama = new Date().getTime() + "_" + file.name;
    const filePath = path.join(__dirname, "uploads", file_ubah_nama);

    file.mv(filePath, async (err) => {
      if (err) {
        return res
          .status(500)
          .json({ status: false, response: "Gagal Menyimpan File" });
      }

      const extensionName = path.extname(filePath);
      if ([".jpeg", ".jpg", ".png", ".gif"].includes(extensionName)) {
        await sock.sendMessage(jid, {
          image: { url: filePath },
          caption: pesankirim,
        });

        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) {
            console.error("Gagal menghapus file:", unlinkErr);
          } else {
            console.info("File berhasil dihapus.");
          }
        });

        // Simpan pesan ke database dengan file_url kosong karena file dihapus setelah dikirim
        const data = {
          number,
          message_in: "Dikirim via Web",
          message: pesankirim,
          file_url: "", // Pastikan file_url kosong karena file telah dihapus
        };
        fetch(`${url_api}/api/send_message.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
          .then((response) => response.json())
          .then(() => console.info("Pesan berhasil disimpan ke database."))
          .catch((error) =>
            console.error("Terjadi kesalahan saat menyimpan pesan:", error)
          );

        res.status(200).json({
          status: true,
          message: "Gambar dari upload berhasil dikirim",
        });
      } else {
        fs.unlink(filePath, () => {});
        res
          .status(500)
          .json({ status: false, response: "Tipe File Tidak Valid" });
      }
    });
  } catch (err) {
    res.status(500).send(err);
  }
});

// Endpoint untuk logout
app.post("/logout", async (req, res) => {
  try {
    if (isConnected()) {
      await sock.logout();
      sock = null;
      qr = null;
      info_device = null;
      res.status(200).json({
        status: true,
        message: "Logout berhasil. Sesi WhatsApp telah terputus.",
      });
    } else {
      res.status(400).json({
        status: false,
        message: "Tidak ada sesi WhatsApp yang terhubung.",
      });
    }
  } catch (err) {
    res.status(500).json({
      status: false,
      message: "Terjadi kesalahan saat logout.",
      error: err.message,
    });
  }
});
// Endpoint untuk mendapatkan informasi user
app.get("/get-user", async (req, res) => {
  res.status(200).json({
    status: true,
    nomor: info_device,
    nama: wa_nama,
    profilePicUrl: info_device_profilePicUrl,
  });
});
// Memulai server
connectToWhatsApp().catch((err) => console.log("unexpected error: " + err));
server.listen(port, () => {
  console.log(`Server Berjalan Di Port : ${port}`);
});
