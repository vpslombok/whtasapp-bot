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

const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server);

const port = process.env.PORT || 8000;
const session = "./session";
const store = makeInMemoryStore({
  logger: pino().child({ level: "silent", stream: "store" }),
});

let sock, qr, soket, info_device, info_device_profilePicUrl, wa_nama;

app.use(fileUpload({ createParentPath: true }));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/assets", express.static(__dirname + "/client/assets"));

app.get("/scan", (req, res) => {
  res.sendFile("./client/server.html", { root: __dirname });
});

app.get("/", (req, res) => {
  res.sendFile("./client/index.html", { root: __dirname });
});

function getGreeting() {
  const currentHour = new Date().getHours();
  if (currentHour >= 4 && currentHour < 12) {
    return "Selamat Pagi Kak";
  } else if (currentHour >= 12 && currentHour < 18) {
    return "Selamat Siang Kak";
  } else if (currentHour >= 18 && currentHour < 22) {
    return "Selamat Sore Kak";
  } else {
    return "Selamat Malam Kak";
  }
}

async function getProfilePicture(jid) {
  try {
    const url = await sock.profilePictureUrl(jid, "image"); // 'image' untuk foto profil
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
    // printQRInTerminal: true,
    browser: ["LOMBOK", "NTB", "04-08-2024"],
    auth: state,
    logger: pino({ level: "silent" }),
    version,
    shouldIgnoreJid: (jid) => isJidBroadcast(jid),
  });
  store.bind(sock.ev);
  sock.multi = true;

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;
    console.log("Connection update:", update);

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
      info_device = sock.user.id.split(":")[0].replace("@s.whatsapp.net", "");
      console.log(
        "Whatsapp terhubung ke " +
          info_device +
          " dengan nama " +
          sock.user.name
      );
      // Ambil URL foto profil
      const profilePicUrl = await getProfilePicture(
        info_device + "@s.whatsapp.net"
      );
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

  sock.ev.on("creds.update", saveCreds);
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

        const noWa = message.key.remoteJid;
        const namaPengirim = message.pushName;
        const pesanMasuk = pesan ? pesan.toLowerCase() : ""; // Mengubah pesan menjadi huruf kecil
        const tanggalSekarang = new Date().toLocaleDateString();
        const waktuSekarang = new Date().toLocaleTimeString();
        
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
      soket?.emit("qrstatus", "./assets/check.svg");
      soket?.emit("log", "WhatsApp terhubung!");
      soket?.emit("user", info_device + "/" + wa_nama);
      soket?.emit("profilePicUrl", info_device_profilePicUrl);
      break;
    case "qrscanned":
      soket?.emit("qrstatus", "./assets/check.svg");
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

app.get("/get-user", async (req, res) => {
  res.status(200).json({ status: true, nomor: info_device, nama: wa_nama });
});

connectToWhatsApp().catch((err) => console.log("unexpected error: " + err));
server.listen(port, () => {
  console.log("Server Berjalan pada Port : " + port);
});
