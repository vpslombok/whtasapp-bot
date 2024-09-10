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
const axios = require("axios"); // Menggunakan library axios untuk mengirim permintaan
// const db = require("./db"); // Import koneksi database
const fetch = require("node-fetch");
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
let sock, qr, soket, info_device, info_device_profilePicUrl, wa_nama, url_api;
// Middleware untuk mengatur permintaan
app.use(fileUpload({ createParentPath: true })); // Menggunakan library fileUpload untuk mengatur file
app.use(cors()); // Menggunakan library cors untuk mengatur permintaan
app.use(bodyParser.json()); // Menggunakan library body-parser untuk mengatur permintaan
app.use(bodyParser.urlencoded({ extended: true })); // Menggunakan library body-parser untuk mengatur permintaan
app.use("/assets", express.static(__dirname + "/client/assets")); // Menggunakan library express untuk mengatur server
// Fungsi untuk mendapatkan pesan selamat yang lebih realistis
function getGreeting() {
  const currentHour = moment().tz("Asia/Singapore").hour();
  const currentDay = moment().tz("Asia/Singapore").format("dddd");
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
          console.log("Koneksi Hilang dari Server, menghubungkan kembali...");
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
          // Membuat folder session baru
          fs.mkdirSync(session, { recursive: true });
          console.log(`Folder ${session} telah dibuat.`);
          await sock.logout();
          await connectToWhatsApp(); // Tambahkan ini untuk restart otomatis
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
  // // Fungsi untuk mengirim data ke webhook
  // async function sendToWebhook(data) {
  //   try {
  //     const webhookUrl = await getWebhookUrl(); // Ambil URL webhook dari server
  //     const response = await axios.post(webhookUrl, data);
  //     // console.log("Webhook response:", response.data);
  //   } catch (error) {
  //     // console.error("Error sending to webhook:", error);
  //   }
  // }
  // Fungsi untuk mengambil data dari API
  function fetchLatestUrl() {
    fetch("https://wa.sasak.xyz/api/url.php")
      .then((response) => response.json())
      .then((data) => {
        // Pastikan data adalah array dan memiliki setidaknya satu elemen
        if (Array.isArray(data) && data.length > 0) {
          url_api = data[0].url_api; // Ambil url_api dari elemen pertama
          soket?.emit("url_api", url_api);
        } else {
          console.error("Tidak ditemukan url_api dalam basis data");
        }
      })
      .catch((err) => {
        console.error("Error mengambil URL:", err);
      });
  }
  // Jalankan polling setiap 10 detik (30000 milidetik)
  setInterval(fetchLatestUrl, 10000);
  // Panggil sekali saat halaman dimuat
  fetchLatestUrl();
  // // Fungsi untuk mendapatkan URL webhook
  // async function getWebhookUrl() {
  //   try {
  //     const response = await fetch(`${weburl}/webhook-url`);
  //     const result = await response.json();
  //     if (result.url) {
  //       return result.url;
  //     } else {
  //       throw new Error("No webhook URL found");
  //     }
  //   } catch (error) {
  //     console.error("Error fetching webhook URL:", error);
  //     // Restart server jika terjadi error
  //     process.exit(1);
  //   }
  // }
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
        const waktuSekarang = moment().tz("Asia/Singapore").format("HH:mm:ss");
        const tanggalSekarang = moment()
          .tz("Asia/Singapore")
          .format("DD-MM-YYYY");
        console.log(`Pesan Masuk dari ${namaPengirim}: ${pesan}`); // Log pesan masuk untuk debugging
        await sock.readMessages([message.key]);
        let balasan = "";
        const greeting = getGreeting();
        if (noWa.endsWith("@g.us")) {
          console.log(`Pesan dari grup ${noWa}: ${pesan}`);
          balasan = `${greeting} *${namaPengirim}*, Mohon Maaf, Fitur Bot Belum Tersedia di Grup`;
        } else {
          // Deklarasi variabel 'ditemukan' di luar
          let ditemukan = false;
          // Ambil data dari API
          fetch(`${url_api}/api/reply.php`)
            .then((response) => response.json())
            .then((results) => {
              // Cek setiap pesan dalam data yang diterima
              results.forEach((result) => {
                if (pesanMasuk.includes(result.pesan_masuk)) {
                  // Gantikan placeholder dalam balasan
                  balasan = result.pesan_keluar
                    .replace("${namaPengirim}", namaPengirim)
                    .replace("${noWa}", noWa)
                    .replace("${tanggalSekarang}", tanggalSekarang)
                    .replace("${waktuSekarang}", waktuSekarang);
                  ditemukan = true;
                }
              });
              // Jika pesan tidak ditemukan dalam data
              if (!ditemukan) {
                balasan = `${greeting} *${namaPengirim}*, di WhatsApp Bot Pintar ketik *INFO* untuk Menggunakan Fitur Bot`;
              }
              console.log("balasan: " + balasan);
              // Kirim balasan setelah loop selesai
              sock.sendMessage(noWa, { text: balasan });
              const noWhatsapp = noWa.replace("@s.whatsapp.net", "");
              // Simpan balasan ke database send_messages menggunakan API
              const data = {
                number: noWhatsapp,
                message_in: pesanMasuk,
                message: balasan,
              };

              fetch(`${url_api}/api/send_message.php`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
              })
                .then((response) => {
                  if (!response.ok) {
                    throw new Error('Network response was not ok');
                  }
                  return response.text();  // Ubah ke response.text() untuk sementara
                })
                .then((text) => {
                  try {
                    const data = JSON.parse(text);  // Coba parse JSON secara manual
                    console.log("Balasan berhasil disimpan ke database send_messages.");
                  } catch (err) {
                    console.error("Error parsing JSON:", err);
                    console.error("Response text was:", text);
                  }
                })
                .catch((error) => {
                  console.error("Error saving message to send_messages:", error);
                });
              
            })
            .catch((err) => {
              console.error("Error mengambil data dari API:", err);
            });
        }
        // // Data yang dikirim ke webhook
        // const dataToSend = {
        //   number: noWa,
        //   name: namaPengirim,
        //   message: pesan,
        //   timestamp: moment().tz("Asia/Singapore").format(),
        // };
        // // Kirim data ke webhook
        // await sendToWebhook(dataToSend);
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
app.post("/send-button-message", async (req, res) => {
  const { number, message, buttonText, buttonId } = req.body;
  if (!number || !message || !buttonText || !buttonId) {
    return res.status(400).json({
      status: false,
      response:
        "Semua parameter diperlukan: number, message, buttonText, buttonId",
    });
  }
  const numberWA = "62" + number.substring(1) + "@s.whatsapp.net";
  try {
    const exists = await sock.onWhatsApp(numberWA);
    if (exists?.jid || (exists && exists[0]?.jid)) {
      await sock.sendMessage(exists.jid || exists[0].jid, {
        text: message,
        footer: "Klik tombol di bawah ini:",
        buttons: [
          {
            buttonId: buttonId,
            buttonText: { displayText: buttonText },
            type: 1,
          },
        ],
        headerType: 1,
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
        // Simpan pesan ke database menggunakan API
        const data = {
          number: number,
          message_in: "Dikirim via Web",
          message: pesankirim,
        };
        //simpan pesan ke database via rest api
        fetch(`${url_api}/api/send_message.php`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.status) {
              console.info("Pesan berhasil disimpan ke database.");
            } else {
              console.error(
                "Terjadi kesalahan saat menyimpan pesan:",
                data.message
              );
            }
          })
          .catch((error) => {
            console.error("Error saving message to database:", error);
          });
        res.status(200).json({
          status: true,
          response: "Pesan Berhasil Dikirim ke " + number,
        });
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
            .json({ status: false, response: "Gagal Menyimpan File" });
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
                console.error("Gagal menghapus file:", unlinkErr);
              } else {
                console.info("File berhasil dihapus.");
              }
            });
            // Simpan pesan ke database jika berhasil terkirim melalui API
            const data = {
              number: number,
              message_in: "Dikirim via Web",
              message: pesankirim,
            };
            fetch(`${url_api}/api/send_message.php`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(data),
            })
              .then((response) => response.json())
              .then((data) => {
                console.info("Pesan berhasil disimpan ke database.");
              })
              .catch((error) => {
                console.error("Terjadi kesalahan saat menyimpan pesan:", error);
              });
            res
              .status(200)
              .json({ status: true, message: "Image Berhasil Dikirim" });
          } else {
            fs.unlink(filePath, () => {}); // Delete the file if not valid
            res
              .status(500)
              .json({ status: false, response: "Tipe File Tidak Valid" });
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