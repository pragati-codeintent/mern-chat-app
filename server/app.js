const express = require("express");
const cors = require("cors");

const User = require("./models/user");
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
// TEST PROFILE ROUTE
// =====================================================

app.get("/api/test-profile", (req, res) => {
  res.status(200).json({
    message: "Profile route system is working",
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
      const users = await User.find()
        .select("-password");

      res.status(200).json(users);

    } catch (error) {
      console.error(
        "Error fetching users:",
        error
      );

      res.status(500).json({
        message: "Failed to fetch users",
      });
    }
  }
);


// =====================================================
// GET USER PROFILE
// =====================================================

// GET /api/profile/:id

app.get(
  "/api/profile/:id",
  authMiddleware,
  async (req, res) => {
    try {
      const user = await User.findById(
        req.params.id
      ).select("-password");

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      res.status(200).json(user);

    } catch (error) {
      console.error(
        "Error fetching profile:",
        error
      );

      res.status(500).json({
        message: "Failed to fetch profile",
      });
    }
  }
);


// =====================================================
// UPDATE USER PROFILE
// =====================================================

// PUT /api/profile/:id

app.put(
  "/api/profile/:id",
  authMiddleware,
  async (req, res) => {
    try {

      const {
        name,
        username,
        bio,
        profilePicture,
      } = req.body;


      const user = await User.findById(
        req.params.id
      );


      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }


      // -----------------------------------------------
      // NAME
      // -----------------------------------------------

      if (name !== undefined) {
        user.name = name.trim();
      }


      // -----------------------------------------------
      // USERNAME
      // -----------------------------------------------

      if (username !== undefined) {
        user.username = username.trim();
      }


      // -----------------------------------------------
      // BIO
      // -----------------------------------------------

      if (bio !== undefined) {
        user.bio = bio.trim();
      }


      // -----------------------------------------------
      // PROFILE PICTURE
      // -----------------------------------------------

      if (profilePicture !== undefined) {
        user.profilePicture = profilePicture;
      }


      // -----------------------------------------------
      // SAVE
      // -----------------------------------------------

      await user.save();


      const updatedUser =
        await User.findById(
          req.params.id
        ).select("-password");


      res.status(200).json({
        message: "Profile updated successfully",
        user: updatedUser,
      });


    } catch (error) {

      console.error(
        "Error updating profile:",
        error
      );


      // Duplicate username

      if (error.code === 11000) {
        return res.status(400).json({
          message: "Username already exists",
        });
      }


      res.status(500).json({
        message: "Failed to update profile",
      });
    }
  }
);


// =====================================================
// TEMPORARY SEED USERS
// =====================================================

app.post(
  "/api/users/seed",
  async (req, res) => {
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

      console.error(
        "Error seeding users:",
        error
      );


      res.status(500).json({
        message: "Failed to seed users",
      });
    }
  }
);


// =====================================================
// SEND MESSAGE
// =====================================================

// POST /api/messages

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


      const newMessage =
        await Message.create({
          senderId,
          receiverId,
          text: text.trim(),
        });


      console.log(
        "MESSAGE SAVED TO MONGODB:"
      );

      console.log(newMessage);


      res.status(201).json({
        message: "Message sent successfully",
        data: newMessage,
      });


    } catch (error) {

      console.error(
        "Message save error:",
        error
      );


      res.status(500).json({
        message: "Failed to save message",
      });
    }
  }
);


// =====================================================
// GET CONVERSATION
// =====================================================

// GET /api/messages/:userId/:otherUserId

app.get(
  "/api/messages/:userId/:otherUserId",
  authMiddleware,
  async (req, res) => {
    try {

      const {
        userId,
        otherUserId,
      } = req.params;


      const messages =
        await Message.find({
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

// =====================================================
// DELETE MESSAGE
// =====================================================

// DELETE /api/messages/:id

app.delete(
  "/api/messages/:id",
  authMiddleware,
  async (req, res) => {
    try {

      const { id } = req.params;

      const deletedMessage =
        await Message.findByIdAndDelete(id);

      if (!deletedMessage) {
        return res.status(404).json({
          message: "Message not found",
        });
      }

      console.log(
        "MESSAGE DELETED FROM MONGODB:",
        id
      );

      res.status(200).json({
        message: "Message deleted successfully",
      });

    } catch (error) {

      console.error(
        "Error deleting message:",
        error
      );

      res.status(500).json({
        message: "Failed to delete message",
      });
    }
  }
);