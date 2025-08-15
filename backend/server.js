const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const User = require('./models/User');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection (MilBantKar database)
const MONGO_URI = "mongodb+srv://maharshibhattisro:HrWtuS7vTSHI4rf9@milbantkar.jswsezd.mongodb.net/MilBantKar?retryWrites=true&w=majority&appName=MilBantKar";

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB connected successfully to MilBantKar DB"))
.catch(err => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
});

// Default route
app.get("/", (req, res) => {
    res.send("🚀 Mil Bant Kar API is running...");
});

// Signup route
app.post('/api/auth/signup', async (req, res) => {
    const { username, email, phone, password } = req.body;

    try {
        const user = new User({
            isAdmin : username == 'Maharshi',
            username,
            email,
            phone,
            passwordHash: password
        });

        await user.save();
        res.status(201).json({ message: 'User registered successfully' });

    } catch (error) {
        console.error("❌ Signup error:", error);

        if (error.code === 11000) {
            // Duplicate key error
            const field = Object.keys(error.keyPattern)[0];
            if(field=='username'){
                res.status(400).json({
                    message : `${username} is already taken !`
                })
            }else if(field=='email'){
                res.status(400).json({
                    message:`${email} is already taken !`
                })
            }else if(field=='phone'){
                res.status(400).json({
                    message:`${phone} is already taken !`
                })
            }else if(field=='passwordHash'){
                res.status(400).json({
                    message:`${password} is already taken !`
                })
            }
        }

        if (error.name === "ValidationError") {
            // Schema validation error
            return res.status(400).json({
                message: "Validation Error",
                details: error.message
            });
        }

        // Default catch-all
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

//login route
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if both fields are provided
        if (!username || !password) {
            return res.status(400).json({ error: "Username and password are required" });
        }

        // Find the user
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({ error: "User not found" });   
        }

        // Compare plain text passwords (⚠️ not secure — only because you don't want hashing)
        if (user.passwordHash !== password) {
            return res.status(401).json({ error: "Invalid password" });
        }

        // Success
        res.status(200).json({ 
            message: "Login successful", 
            user: {
                id: user._id,
                username: user.username
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// Get user by ID
app.get('/api/user/:username', async (req, res) => {
    try {
        const { username } = req.params;

        const user = await User.find({username})
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user);

    } catch (error) {
        console.error("❌ Fetch user error:", error);
        res.status(500).json({ message: "Server error" });
    }
});


// Start server
app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
});
