const makeWASocket = require("baileys").default;
const { useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require("baileys");
const { Boom } = require("@hapi/boom");
const fs = require("fs");

// Fungsi untuk mulai koneksi ke WhatsApp
async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("./auth");
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: true, // QR Code muncul di terminal
    });

    // Simpan sesi login
    sock.ev.on("creds.update", saveCreds);

    // Cek status koneksi
    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === "open") {
            console.log("✅ Bot WhatsApp Terhubung!");
        } else if (connection === "close") {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log("❌ Bot terputus. Reconnecting:", shouldReconnect);
            if (shouldReconnect) {
                startBot();
            }
        }
    });

    // Handle pesan masuk
    sock.ev.on("messages.upsert", async (message) => {
        const msg = message.messages[0];

        if (!msg.message || msg.key.fromMe) return; // Abaikan pesan kosong atau dari bot sendiri

        const senderNumber = msg.key.remoteJid;
        const messageContent = msg.message.conversation || msg.message.extendedTextMessage?.text;

        console.log(`📩 Pesan dari ${senderNumber}: ${messageContent}`);

        let replyText = "🤖 haloo cuyy! ini bot masih uji coba.\n\nKetik *menu* untuk melihat daftar perintah.";

        if (messageContent?.toLowerCase() === "menu") {
            replyText = "📌 *Menu Bot:*\n1️⃣ *info* - Info tentang bot\n2️⃣ *ping* - Cek respons bot";
        } else if (messageContent?.toLowerCase() === "info") {
            replyText = "ℹ️ *Bot WhatsApp dengan Baileys*\n\nDibuat menggunakan Node.js & Baileys.";
        } else if (messageContent?.toLowerCase() === "ping") {
            replyText = "🏓 Pong! Bot sedang aktif.";
        }

        // Kirim balasan
        await sock.sendMessage(senderNumber, { text: replyText });
    });
}

// Jalankan bot
startBot();
console.log("🚀 Bot WhatsApp siap dijalankan!");
