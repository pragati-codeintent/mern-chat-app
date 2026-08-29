const http = require("http");
const { Server } = require("socket.io");

const app = require("./app");
const mongoose = require("mongoose");

require("dotenv").config();

const PORT = 5000;

// =====================================================
// CREATE HTTP SERVER
// =====================================================

const server = http.createServer(app);


// =====================================================
// CREATE SOCKET.IO SERVER
// =====================================================

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});


// =====================================================
// MONGODB CONNECTION
// =====================================================

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error);
  });


// =====================================================
// ONLINE USERS
// =====================================================

// Store userId -> number of active sockets
//
// Example:
//
// {
//   "user123": 1,
//   "user456": 2
// }
//
// If a user has 2 tabs open,
// their socket count will be 2.

const onlineUsers = new Map();


// =====================================================
// SOCKET.IO
// =====================================================

io.on("connection", (socket) => {

  console.log("User connected:", socket.id);


  // ===================================================
  // USER JOIN
  // ===================================================

socket.on("join", (userId) => {

  if (!userId) {
    return;
  }

  socket.userId = userId;

  socket.join(userId);

  const currentCount = onlineUsers.get(userId) || 0;

  onlineUsers.set(
    userId,
    currentCount + 1
  );

  console.log(
    `User ${userId} joined room`
  );

  console.log(
    "Online users:",
    Array.from(onlineUsers.keys())
  );

  // Tell everyone this user is online
  if (currentCount === 0) {

    io.emit(
      "userOnline",
      userId
    );

  }

  // IMPORTANT:
  // Send current online users to this socket
  socket.emit(
    "onlineUsers",
    Array.from(onlineUsers.keys())
  );

});


  // ===================================================
  // SEND MESSAGE
  // ===================================================

  socket.on("sendMessage", (message) => {

    console.log(
      "Message received:",
      message
    );


    // -----------------------------------------------
    // SEND TO RECEIVER
    // -----------------------------------------------

    io.to(message.receiverId).emit(
      "receiveMessage",
      message
    );


    // -----------------------------------------------
    // SEND TO SENDER
    // -----------------------------------------------

    io.to(message.senderId).emit(
      "receiveMessage",
      message
    );

  });


  // ===================================================
  // DISCONNECT
  // ===================================================

  socket.on("disconnect", () => {

    console.log(
      "User disconnected:",
      socket.id
    );


    if (!socket.userId) {
      return;
    }


    const userId = socket.userId;

    const currentCount =
      onlineUsers.get(userId) || 0;


    // -----------------------------------------------
    // DECREASE SOCKET COUNT
    // -----------------------------------------------

    if (currentCount > 1) {

      onlineUsers.set(
        userId,
        currentCount - 1
      );

      console.log(
        `User ${userId} still has ${
          currentCount - 1
        } connection(s)`
      );

    } else {

      // ---------------------------------------------
      // NO CONNECTIONS LEFT
      // ---------------------------------------------

      onlineUsers.delete(userId);

      console.log(
        `User ${userId} is offline`
      );


      // Tell everyone user is offline
      io.emit(
        "userOffline",
        userId
      );

    }


    console.log(
      "Online users:",
      Array.from(onlineUsers.keys())
    );

  });

});


// =====================================================
// START SERVER
// =====================================================

server.listen(PORT, () => {

  console.log(
    `Backend running on port ${PORT}`
  );

});