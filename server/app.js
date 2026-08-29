const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");

const User = require("./models/user");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Home route
app.get("/", (req, res) => {
  res.json({
    message: "Chat App Backend is running!",
  });
});

// Get all users
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find();

    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);

    res.status(500).json({
      message: "Failed to fetch users",
    });
  }
});

// Temporary route to create test users
app.post("/api/users/seed", async (req, res) => {
  try {
    await User.deleteMany();

    const users = await User.insertMany([
      { name: "Pragati", email: "pragati@test.com", password: "test123" },
      { name: "Rahul", email: "rahul@test.com", password: "test123" },
      { name: "Aman", email: "aman@test.com", password: "test123" },
    ]);

    res.status(201).json(users);
  } catch (error) {
    console.error("Error seeding users:", error);

    res.status(500).json({
      message: "Failed to seed users",
    });
  }
});

// Register user
app.post("/api/users/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        message: "Email already registered",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    res.status(500).json({
      message: "Registration failed",
    });
  }
});

// Register user
app.post("/api/users/register", async (req, res) => {
  // your existing register code...
});


// Login user
app.post("/api/users/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check required fields
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Compare password with hashed password
    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Login successful
    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      message: "Login failed",
    });
  }
});




module.exports = app;