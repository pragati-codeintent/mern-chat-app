const http = require("http");
const { Server } = require("socket.io");

const app = require("./app");
const mongoose = require("mongoose");

require("dotenv").config();

const PORT = 5000;

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error);
  });

// Socket.IO connection
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join user's room
  socket.on("join", (userId) => {
    socket.join(userId);

    console.log(`User ${userId} joined room`);
  });

  // Receive and send message
socket.on("sendMessage", (message) => {
  console.log("Message received:", message);

  // Send message to receiver
  io.to(message.receiverId).emit(
    "receiveMessage",
    message
  );

  // Send message to sender
  io.to(message.senderId).emit(
    "receiveMessage",
    message
  );
});

  // Disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});