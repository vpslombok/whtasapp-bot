const {
  default: makeWASocket, // Menggunakan library baileys untuk WhatsApp
  fetchLatestBaileysVersion,
  isJidBroadcast,
  makeInMemoryStore,
  useMultiFileAuthState,
  DisconnectReason,
} = require("@whiskeysockets/baileys"); // Menggunakan library baileys untuk WhatsApp

const pino = require("pino"); // Menggunakan library pino untuk logging
const { Boom } = require("@hapi/boom"); // Menggunakan library boom untuk error handling
const path = require("path"); // Menggunakan library path untuk mengatur path
const fs = require("fs"); // Menggunakan library fs untuk mengatur file
const http = require("http"); // Menggunakan library http untuk mengatur server
const express = require("express"); // Menggunakan library express untuk mengatur server
const fileUpload = require("express-fileupload");
const cors = require("cors"); // Menggunakan library cors untuk mengatur permintaan
const bodyParser = require("body-parser"); // Menggunakan library body-parser untuk mengatur permintaan
const qrcode = require("qrcode"); // Menggunakan library qrcode untuk mengatur QR
const moment = require("moment-timezone"); // Menggunakan library moment-timezone untuk mengatur waktu
const axios = require("axios"); // Menggunakan library axios untuk mengirim permintaan HTTP
const db = require("./db"); // Import koneksi database

const app = express();
app.use(bodyParser.json()); // Menggunakan library body-parser untuk mengatur permintaan
const server = http.createServer(app); // Membuat server
const io = require("socket.io")(server); // Menggunakan library socket.io untuk mengatur socket

const port = process.env.PORT || 3100;
const session = "./session"; // Menggunakan library session untuk mengatur session
const store = makeInMemoryStore({
  logger: pino().child({ level: "silent", stream: "store" }),
}); // Menggunakan library pino untuk logging

// Variabel untuk menyimpan data
let sock, qr, soket, info_device, info_device_profilePicUrl, wa_nama;

// Middleware untuk mengatur permintaan
app.use(fileUpload({ createParentPath: true })); // Menggunakan library fileUpload untuk mengatur file
app.use(cors()); // Menggunakan library cors untuk mengatur permintaan
app.use(bodyParser.json()); // Menggunakan library body-parser untuk mengatur permintaan
app.use(bodyParser.urlencoded({ extended: true })); // Menggunakan library body-parser untuk mengatur permintaan
app.use("/assets", express.static(__dirname + "/client/assets")); // Menggunakan library express untuk mengatur server

// // Endpoint untuk halaman scan
// app.get("/scan", (req, res) => {
//   res.sendFile("./client/server.html", { root: __dirname }); // Menggunakan library express untuk mengatur server
// });

// // Endpoint untuk halaman utama
// app.get("/", (req, res) => {
//   res.sendFile("./client/index.html", { root: __dirname }); // Menggunakan library express untuk mengatur server
// });

// // Endpoint untuk profile
// app.get("/profile", (req, res) => {
//   res.sendFile("./client/profile.html", { root: __dirname }); // Menggunakan library express untuk mengatur server
// });

// // endpoint untuk setting
// app.get("/setting", (req, res) => {
//   res.sendFile("./client/setting.html", { root: __dirname }); // Menggunakan library express untuk mengatur server
// });

// // endpoint untuk kirim pesan
// app.get("/kirim_pesan", (req, res) => {
//   res.sendFile("./client/kirim_pesan.html", { root: __dirname }); // Menggunakan library express untuk mengatur server
// });

// Fungsi untuk mendapatkan pesan selamat yang lebih realistis
function getGreeting() {
  const currentHour = moment().tz("Asia/Singapore").hour();
  const currentDay = moment().tz("Asia/Singapore").format("dddd");

  let greeting;
  if (currentHour >= 1 && currentHour < 12) {
    greeting = "Selamat Pagi";
  } else if (currentHour >= 12 && currentHour < 15) {
    greeting = "Selamat Siang";
  } else if (currentHour >= 15 && currentHour < 18) {
    greeting = "Selamat Sore";
  } else if (currentHour >= 18 && currentHour < 23) {
    greeting = "Selamat Malam";
  }
}

// Fungsi untuk mendapatkan foto profil
async function getProfilePicture(jid) {
  try {
    const url = await sock.profilePictureUrl(jid, "image"); // 'image' untuk foto profil
    return url;
  } catch (error) {
    console.error("Error mendapatkan foto profil:", error);
    return null;
  }
}

// Fungsi untuk mengkoneksi ke WhatsApp
async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(session);
  let { version } = await fetchLatestBaileysVersion();
  sock = makeWASocket({
    // printQRInTerminal: true,
    browser: ["LOMBOK", "NTB", "2024"],
    auth: state,
    logger: pino({ level: "silent" }),
    version,
    shouldIgnoreJid: (jid) => isJidBroadcast(jid),
  });
  store.bind(sock.ev);
  sock.multi = true;

  // Event untuk mengupdate koneksi
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      const reason = lastDisconnect.error?.output?.statusCode || "Unknown";
      console.log(`Connection closed with reason: ${reason}`);

      switch (reason) {
        case DisconnectReason.badSession:
          console.log(
            `Bad Session File, Please Delete ${session} and Scan Again`
          );
          await sock.logout();
          break;
        case DisconnectReason.connectionClosed:
          console.log("Connection closed, reconnecting...");
          await connectToWhatsApp();
          break;
        case DisconnectReason.connectionLost:
          console.log("Connection Lost from Server, reconnecting...");
          await connectToWhatsApp();
          break;
        case DisconnectReason.connectionReplaced:
          console.log(
            "Connection Replaced, Another New Session Opened, Please Close Current Session First"
          );
          await sock.logout();
          break;
        case DisconnectReason.loggedOut:
          console.log(
            `Device Logged Out, Please Delete ${session} and Scan Again.`
          );
          if (fs.existsSync(session)) {
            fs.rmSync(session, { recursive: true });
            console.log(`${session} has been deleted.`);
          }
          await sock.logout();
          break;
        case DisconnectReason.restartRequired:
          console.log("Restart Required, Restarting...");
          await connectToWhatsApp();
          break;
        case DisconnectReason.timedOut:
          console.log("Connection TimedOut, Reconnecting...");
          await connectToWhatsApp();
          break;
        default:
          console.log(
            `Unknown DisconnectReason: ${reason}|${lastDisconnect.error}`
          );
          sock.end(
            `Unknown DisconnectReason: ${reason}|${lastDisconnect.error}`
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
      // Ambil URL foto profil
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

  // Fungsi untuk mengirim data ke webhook
  async function sendToWebhook(data) {
    try {
      const webhookUrl = await getWebhookUrl(); // Ambil URL webhook dari server
      const response = await axios.post(webhookUrl, data);
      console.log("Webhook response:", response.data);
    } catch (error) {
      console.error("Error sending to webhook:", error);
    }
  }

  // Fungsi untuk mendapatkan URL webhook
  async function getWebhookUrl() {
    try {
      const response = await fetch(`http://localhost:${port}/webhook-url`);
      const result = await response.json();
      if (result.url) {
        return result.url;
      } else {
        throw new Error("No webhook URL found");
      }
    } catch (error) {
      console.error("Error fetching webhook URL:", error);
      throw error;
    }
  }

  // Event untuk mengupdate creds
  sock.ev.on("creds.update", saveCreds);
  // Menangani pesan masuk dan mengirimkan data ke webhook
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type === "notify") {
      const message = messages[0];
      const isFromMe = message.key.fromMe;

      if (!isFromMe) {
        let pesan = "[Jenis pesan tidak dikenal]"; // Default message
        if (message.message) {
          if (message.message.conversation) {
            pesan = message.message.conversation; // Plain text message
          } else if (message.message.extendedTextMessage) {
            pesan = message.message.extendedTextMessage.text; // Extended text message
          } else if (message.message.imageMessage) {
            pesan = "[Gambar diterima]"; // Image message
          } else if (message.message.videoMessage) {
            pesan = "[Video diterima]"; // Video message
          } else if (message.message.documentMessage) {
            pesan = "[Dokumen diterima]"; // Document message
          } else if (message.message.audioMessage) {
            pesan = "[Audio diterima]"; // Audio message
          } else if (message.message.contactMessage) {
            pesan = "[Kontak diterima]"; // Contact message
          } else if (message.message.locationMessage) {
            pesan = "[Lokasi diterima]"; // Location message
          } else if (message.message.stickerMessage) {
            pesan = "[Stiker diterima]"; // Sticker message
          } else if (message.message.templateButtonReplyMessage) {
            pesan = message.message.templateButtonReplyMessage.selectedId; // Template button reply message
          }
        }

        // Mendapatkan nomor WhatsApp pengirim dan nama pengirim
        const noWa = message.key.remoteJid;
        const namaPengirim = message.pushName;
        const pesanMasuk = pesan ? pesan.toLowerCase() : ""; // Mengubah pesan menjadi huruf kecil
        const waktuSekarang = moment().tz("Asia/Jakarta").format("HH:mm:ss");
        const tanggalSekarang = moment()
          .tz("Asia/Jakarta")
          .format("DD-MM-YYYY");

        console.log(`Pesan Masuk dari ${namaPengirim}: ${pesan}`); // Log pesan masuk untuk debugging

        // Menandai pesan sebagai telah dibaca
        await sock.readMessages([message.key]);

        let balasan = "";
        const greeting = getGreeting();

        // Cek jika pesan berasal dari grup
        if (noWa.endsWith("@g.us")) {
          // Pesan dari grup
          console.log(`Pesan dari grup ${noWa}: ${pesan}`);
          balasan = `${greeting} *${namaPengirim}*, Mohon Maaf, Fitur Bot Belum Tersedia di Grup`;
        } else {
          // Pesan dari individu
          if (pesanMasuk.includes("jam")) {
            balasan = `Jam sekarang ${waktuSekarang} dan tanggal sekarang ${tanggalSekarang}`;
          } else if (pesanMasuk.includes("info")) {
            balasan = `Berikut informasi yang dapat dikirim:\n- *jam*\n- *tanggal*\n- *halo*`;
          } else if (pesanMasuk.includes("tanggal")) {
            balasan = `Tanggal sekarang ${tanggalSekarang}`;
          } else if (pesanMasuk.includes("halo")) {
            balasan = `Halo *${namaPengirim}*, Selamat Datang di WhatsApp Bot Pintar`;
          } else {
            balasan = `${greeting} *${namaPengirim}*, di WhatsApp Bot Pintar ketik *INFO* untuk Menggunakan Fitur Bot`;
          }
        }

        await sock.sendMessage(noWa, { text: balasan }); // Mengirim balasan

        // Data yang dikirim ke webhook
        const dataToSend = {
          number: noWa,
          name: namaPengirim,
          message: pesan,
          timestamp: moment().tz("Asia/Jakarta").format(),
        };

        // Kirim data ke webhook
        await sendToWebhook(dataToSend);
      }
    }
  });
}

// Event untuk mengupdate QR
io.on("connection", (socket) => {
  soket = socket;
  if (isConnected()) {
    updateQR("connected");
  } else if (qr) {
    updateQR("qr");
  }
});

// Fungsi untuk mengecek apakah WhatsApp terhubung
const isConnected = () => !!sock?.user;

// Fungsi untuk mengupdate QR
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

// Endpoint untuk mendapatkan QR code
app.get("/api/qr-code", (req, res) => {
  if (isConnected()) {
    res.status(200).json({
      message: "User sudah terhubung",
      user: info_device,
      nama: wa_nama,
      profilePicUrl: info_device_profilePicUrl,
      // qrCodeUrl: url
    });
  } else {
    if (qr) {
      qrcode.toDataURL(qr, (err, url) => {
        if (err) {
          console.error("Error generating QR code:", err);
          res.status(500).json({ error: "Gagal menghasilkan QR code" });
        } else {
          res.status(200).json({ qrCodeUrl: url }); // Pastikan field name cocok dengan klien
        }
      });
    } else {
      res.status(404).json({ error: "QR code tidak tersedia" });
    }
  }
});

// Endpoint untuk mengirim pesan
app.post("/send-message", async (req, res) => {
  const { message: pesankirim, number } = req.body;
  const { file_dikirim: fileDikirim } = req.files || {};

  if (!number) {
    return res
      .status(500)
      .json({ status: false, response: "Nomor WA tidak disertakan!" });
  }

  const numberWA = "62" + number.substring(1) + "@s.whatsapp.net";

  try {
    if (!fileDikirim) {
      const exists = await sock.onWhatsApp(numberWA);
      if (exists?.jid || (exists && exists[0]?.jid)) {
        await sock.sendMessage(exists.jid || exists[0].jid, {
          text: pesankirim,
        });
        res
          .status(200)
          .json({ status: true, response: "Message sent successfully!" });
      } else {
        res.status(500).json({
          status: false,
          response: `Nomor ${number} tidak terdaftar.`,
        });
      }
    } else {
      const file = req.files.file_dikirim;
      const file_ubah_nama = new Date().getTime() + "_" + file.name;
      const filePath = path.join(__dirname, "uploads", file_ubah_nama);

      file.mv(filePath, async (err) => {
        if (err) {
          return res
            .status(500)
            .json({ status: false, response: "Failed to save file." });
        }

        const exists = await sock.onWhatsApp(numberWA);
        if (exists?.jid || (exists && exists[0]?.jid)) {
          const extensionName = path.extname(filePath);
          if ([".jpeg", ".jpg", ".png", ".gif"].includes(extensionName)) {
            await sock.sendMessage(exists.jid || exists[0].jid, {
              image: { url: filePath },
              caption: pesankirim,
            });

            fs.unlink(filePath, (unlinkErr) => {
              if (unlinkErr) {
                console.error("Error deleting file:", unlinkErr);
              } else {
                console.info("File deleted successfully.");
              }
            });

            res
              .status(200)
              .json({ status: true, message: "Image sent successfully!" });
          } else {
            fs.unlink(filePath, () => {}); // Delete the file if not valid
            res
              .status(500)
              .json({ status: false, response: "Invalid file type." });
          }
        } else {
          res.status(500).json({
            status: false,
            response: `Nomor ${number} tidak terdaftar.`,
          });
        }
      });
    }
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
  res
    .status(200)
    .json({
      status: true,
      nomor: info_device,
      nama: wa_nama,
      profilePicUrl: info_device_profilePicUrl,
    });
});

// Endpoint untuk mendapatkan URL webhook
app.get("/webhook-url", (req, res) => {
  db.query(
    "SELECT url, web_url FROM webhook_urls ORDER BY updated_at DESC LIMIT 1",
    (err, results) => {
      if (err) {
        console.error("Terjadi kesalahan saat mengambil URL webhook:", err);
        return res
          .status(500)
          .json({
            status: false,
            message: "Terjadi kesalahan saat mengambil URL webhook",
          });
      }
      res.json({
        url: results[0] ? results[0].url : null,
        web_url: results[0] ? results[0].web_url : null,
      });
    }
  );
});

// Endpoint untuk memperbarui URL webhook
app.post("/update-webhook-url", (req, res) => {
  const { url } = req.body;
  if (url) {
    db.query(
      "UPDATE webhook_urls SET url=?, updated_at=NOW() ORDER BY updated_at DESC LIMIT 1",
      [url],
      (err) => {
        if (err) {
          console.error("Terjadi kesalahan saat memperbarui URL webhook:", err);
          return res
            .status(500)
            .json({
              status: false,
              message: "Terjadi kesalahan saat memperbarui URL webhook",
            });
        }
        res
          .status(200)
          .json({ status: true, message: "Webhook URL updated successfully." });
      }
    );
  } else {
    res.status(400).json({ status: false, message: "URL tidak valid." });
  }
});

// Endpoint untuk webhook
app.post("/webhook", (req, res) => {
  db.query(
    "SELECT url FROM webhook_urls ORDER BY updated_at DESC LIMIT 1",
    (err, results) => {
      if (err) {
        console.error("Terjadi kesalahan saat mengambil URL webhook:", err);
        return res
          .status(500)
          .send("Terjadi kesalahan saat mengambil URL webhook");
      }
      const webhookUrl = results[0] ? results[0].url : null;
      if (webhookUrl) {
        fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(req.body),
        })
          .then((response) => response.json())
          .then((data) => {
            console.log("Data sent to webhook:", data);
            res.status(200).send("Data sent to webhook");
          })
          .catch((error) => {
            console.error(
              "Terjadi kesalahan saat mengirim data ke webhook:",
              error
            );
            res
              .status(500)
              .send("Terjadi kesalahan saat mengirim data ke webhook");
          });
      } else {
        res.status(400).send("Webhook URL is not set");
      }
    }
  );
});
// Memulai server
connectToWhatsApp().catch((err) => console.log("unexpected error: " + err));
server.listen(port, () => {
  console.log("Server Berjalan pada Port : " + port);
});
