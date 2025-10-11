// server/test-socket.js
const { io } = require("socket.io-client");

const SOCKET_URL = "http://localhost:5000";
const TOKEN = process.env.TOKEN || ""; // exporte TOKEN=... avant

if (!TOKEN) {
  console.error("⚠️  Fournis un token JWT: TOKEN=xyz node server/test-socket.js");
  process.exit(1);
}

const socket = io(SOCKET_URL, {
  auth: { token: TOKEN },
  transports: ["websocket"],
});

socket.on("connect", () => {
  console.log("✅ Connecté avec id:", socket.id);

  // envoyer un message
  socket.emit("message", { message: "Hello via Socket.io client 👋" });

  // simuler la frappe
  socket.emit("typing", { isTyping: true });
  setTimeout(() => socket.emit("typing", { isTyping: false }), 1500);
});

socket.on("messageHistory", (history) => {
  console.log("📜 Historique reçu:", history.length, "messages");
});

socket.on("message", (msg) => {
  console.log("💬 Nouveau message:", msg);
});

socket.on("userJoined", (n) => console.log("🔔 Join:", n));
socket.on("userLeft", (n) => console.log("🔕 Left:", n));
socket.on("usersList", (list) => console.log("👥 Users:", list));

socket.on("connect_error", (err) => console.error("❌ connect_error:", err.message));
socket.on("error", (e) => console.error("❌ error:", e));
socket.on("disconnect", (r) => console.log("⛔ disconnect:", r));
