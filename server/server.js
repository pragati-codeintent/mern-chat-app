const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
require("dotenv").config();

const app = require("./app");
const Message = require("./models/message");

const PORT = process.env.PORT || 5000;


// =====================================================
// HTTP SERVER
// =====================================================

const server = http.createServer(app);


// =====================================================
// SOCKET.IO
// =====================================================

const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_URL
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
});


// =====================================================
// MONGODB
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

const onlineUsers = new Map();


// =====================================================
// SOCKET CONNECTION
// =====================================================

io.on("connection", (socket) => {

  console.log("User connected:", socket.id);


  // ===================================================
  // JOIN
  // ===================================================

  socket.on("join", (userId) => {

    if (!userId) {
      return;
    }

    socket.userId = userId;

    socket.join(userId);

    const currentCount =
      onlineUsers.get(userId) || 0;

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


    // User became online
    if (currentCount === 0) {

      io.emit(
        "userOnline",
        userId
      );

    }


    // Send current online users
    socket.emit(
      "onlineUsers",
      Array.from(onlineUsers.keys())
    );

  });


  // ===================================================
  // SEND MESSAGE
  // ===================================================

  socket.on(
    "sendMessage",
    async (message) => {

      try {

        console.log(
          "Message received:",
          message
        );


        // Validate
        if (
          !message ||
          !message.senderId ||
          !message.receiverId ||
          !message.text ||
          !message.text.trim()
        ) {

          console.log(
            "Invalid message"
          );

          return;
        }


        // ---------------------------------------------
        // SAVE TO MONGODB
        // ---------------------------------------------

        const savedMessage =
          await Message.create({

            senderId:
              message.senderId,

            receiverId:
              message.receiverId,

            text:
              message.text.trim(),

          });


        console.log(
          "MESSAGE SAVED TO MONGODB:"
        );

        console.log(
          savedMessage
        );


        // ---------------------------------------------
        // MESSAGE FOR FRONTEND
        // ---------------------------------------------

        const messageToSend = {

          id:
            savedMessage._id.toString(),

          _id:
            savedMessage._id,

          senderId:
            savedMessage.senderId,

          receiverId:
            savedMessage.receiverId,

          text:
            savedMessage.text,

          sender:
            message.sender,

          time:
            message.time,

          createdAt:
            savedMessage.createdAt,

        };


        // ---------------------------------------------
        // SEND TO RECEIVER
        // ---------------------------------------------

        io.to(
          message.receiverId
        ).emit(
          "receiveMessage",
          messageToSend
        );


        // ---------------------------------------------
        // SEND TO SENDER
        // ---------------------------------------------

        io.to(
          message.senderId
        ).emit(
          "receiveMessage",
          messageToSend
        );


      } catch (error) {

        console.error(
          "Socket message save error:",
          error
        );

      }

    }
  );


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


    const userId =
      socket.userId;

    const currentCount =
      onlineUsers.get(userId) || 0;


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

      onlineUsers.delete(
        userId
      );


      console.log(
        `User ${userId} is offline`
      );


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

server.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(`Backend running on port ${PORT}`);
  }
);