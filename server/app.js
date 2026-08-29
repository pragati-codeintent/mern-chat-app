const express = require("express");
const cors = require("cors");

const User = require("./models/User");
const Message = require("./models/message");

const authRoutes = require("./routes/authRoutes");
const authMiddleware = require("./middleware/middleware");

const app = express();


// =====================================================
// MIDDLEWARE
// =====================================================

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.use(express.json());


// =====================================================
// AUTH ROUTES
// =====================================================

// POST /api/auth/register
// POST /api/auth/login

app.use("/api/auth", authRoutes);


// =====================================================
// HOME ROUTE
// =====================================================

app.get("/", (req, res) => {
  res.json({
    message: "Chat App Backend is running!",
  });
});


// =====================================================
// GET ALL USERS
// =====================================================

app.get(
  "/api/users",
  authMiddleware,
  async (req, res) => {
  try {
    const users = await User.find().select("-password");

    res.status(200).json(users);

  } catch (error) {
    console.error("Error fetching users:", error);

    res.status(500).json({
      message: "Failed to fetch users",
    });
  }
});


// =====================================================
// TEMPORARY SEED USERS
// =====================================================

app.post("/api/users/seed", async (req, res) => {
  try {
    await User.deleteMany();

    const users = await User.insertMany([
      {
        name: "Pragati",
        email: "pragati@test.com",
        password: "test123",
      },
      {
        name: "Rahul",
        email: "rahul@test.com",
        password: "test123",
      },
      {
        name: "Aman",
        email: "aman@test.com",
        password: "test123",
      },
    ]);

    res.status(201).json({
      message: "Test users created",
      users,
    });

  } catch (error) {
    console.error("Error seeding users:", error);

    res.status(500).json({
      message: "Failed to seed users",
    });
  }
});


// =====================================================
// SEND MESSAGE
// =====================================================

app.post(
  "/api/messages",
  authMiddleware,
  async (req, res) => {
  try {
    const {
      senderId,
      receiverId,
      text,
    } = req.body;

    if (
      !senderId ||
      !receiverId ||
      !text ||
      !text.trim()
    ) {
      return res.status(400).json({
        message:
          "senderId, receiverId and text are required",
      });
    }

    const newMessage = await Message.create({
      senderId,
      receiverId,
      text: text.trim(),
    });

    console.log("MESSAGE SAVED TO MONGODB:");
console.log(newMessage);

    res.status(201).json({
      message: "Message sent successfully",
      data: newMessage,
    });

  } catch (error) {
    console.error("Message save error:", error);

    res.status(500).json({
      message: "Failed to save message",
    });
  }
});


// =====================================================
// GET CONVERSATION
// =====================================================

app.get(
  "/api/messages/:userId/:otherUserId",
  authMiddleware,
  async (req, res) => {
    try {
      const {
        userId,
        otherUserId,
      } = req.params;

      const messages = await Message.find({
        $or: [
          {
            senderId: userId,
            receiverId: otherUserId,
          },
          {
            senderId: otherUserId,
            receiverId: userId,
          },
        ],
      }).sort({
        createdAt: 1,
      });

      res.status(200).json(messages);

    } catch (error) {
      console.error(
        "Error fetching messages:",
        error
      );

      res.status(500).json({
        message: "Failed to fetch messages",
      });
    }
  }
);


// =====================================================
// EXPORT
// =====================================================

module.exports = app;