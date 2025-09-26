const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const User = require('./models/User');
const ExpenseLog = require('./models/expenceLog');
const expenceLog = require('./models/expenceLog');
const Event = require('./models/Event');
const Alert = require('./models/Alert');
const nm = require("nodemailer");

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

// Get user by username
app.get('/api/user/:username', async (req, res) => {
    try {
        const { username } = req.params;

        const user = await User.find({username})
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // console.log(user)
        res.status(200).json(user);

    } catch (error) {
        console.error("❌ Fetch user error:", error);
        res.status(500).json({ message: "Server error" });
    }   
});

// Fetch list of all users
app.get('/api/users', async (req, res) => {
    try {
        let users = await User.find();
        res.json(users);  
    } catch (error) {
        console.error('Failed to fetch all users', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user profile
app.put('/api/user/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, phone, profilePic } = req.body;
        // Only allow updating these fields
        const updateFields = {};
        if (username !== undefined) updateFields.username = username;
        if (email !== undefined) updateFields.email = email;
        if (phone !== undefined) updateFields.phone = phone;
        if (profilePic !== undefined) updateFields.profilePic = profilePic;

        const updatedUser = await User.findByIdAndUpdate(
            id,
            { $set: updateFields },
            { new: true, runValidators: true }
        );
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(updatedUser);
    } catch (error) {
        console.error('❌ Error updating user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


//Expence rounts 
// Add an expense log
app.post('/api/expense/add', async (req, res) => {
    try {
        const { paidBy, paidTo, amount, description, date, eventId } = req.body;
        // Basic validation
        if (!paidBy || !paidTo || !amount) {
            return res.status(400).json({ message: "Fill required fields" });
        }

        // Create a new expense log entry
        const newExpense = new ExpenseLog({
            paidBy,
            paidTo,
            amount,
            description,
            date,
            status:false,
        });

        // Save to DB
        const savedExpense = await newExpense.save();

        // If eventId provided, push this expense into the event's expenses array
        if (eventId) {
            try {
                const event = await Event.findById(eventId);
                if (event) {
                    event.expenses.push(savedExpense._id);
                    await event.save();
                }
            } catch (linkError) {
                console.error("❌ Error linking expense to event:", linkError);
                // Do not fail the whole request if linking fails; expense is already created
            }
        }

        res.status(201).json({
            message: "Expense added successfully",
            data: savedExpense
        });

    } catch (error) {
        console.error("❌ Error adding expense:", error);
        res.status(500).json({ message: "Server error" });
    }
});


// Fetch all expenses with usernames populated
app.get("/api/expense", async (req, res) => {
    try {
      const expenses = await expenceLog.find()
        .populate("paidBy", "username _id")
        .populate("paidTo", "username _id");

    //   console.log(expenses)
  
      res.status(200).json(expenses);
    } catch (error) {
      console.error("❌ Error fetching expenses:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

app.put('/api/expense/status/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const expense = await expenceLog.findById(id);
        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        // Toggle
        expense.status = !expense.status;
        await expense.save();

        res.json(expense);
    } catch (error) {
        console.error('Error ' + error);
        res.status(500).json({ message: 'Server error' });
    }
});

// -------------------- EVENT ROUTES -------------------- //

// Create Event
app.post('/api/events/create', async (req, res) => {
    try {
        const { name, description, createdBy } = req.body;

        if (!name || !createdBy) {
            return res.status(400).json({ message: "Name and createdBy are required" });
        }

        // generate random event code
        const code = Math.random().toString(36).substr(2, 8).toUpperCase();

        const newEvent = new Event({
            name,
            description,
            createdBy,
            code,
            participants: [createdBy]
        });

        await newEvent.save();
        res.status(201).json({ message: "Event created successfully", event: newEvent });

    } catch (error) {
        console.error("❌ Error creating event:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Join Event by code
app.post('/api/events/join/:code', async (req, res) => {
    try {
        const { userId } = req.body;
        const { code } = req.params;

        const event = await Event.findOne({ code });
        if (!event) return res.status(404).json({ message: "Event not found" });

        // Prevent duplicates
        if (!event.participants.includes(userId)) {
            event.participants.push(userId);
            await event.save();
        }

        res.status(200).json({ message: "Joined event successfully", event });
    } catch (error) {
        console.error("❌ Error joining event:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Get event details with populated users & expenses
app.get('/api/events/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const event = await Event.findById(id)
            .populate("participants", "username email profilePic")
            .populate({
                path: "expenses",
                populate: { path: "paidBy paidTo", select: "username" }
            });

        if (!event) return res.status(404).json({ message: "Event not found" });

        res.status(200).json(event);
    } catch (error) {
        console.error("❌ Error fetching event:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Conclude/close event (only creator can conclude)
app.put('/api/events/:id/conclude', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ message: 'userId is required' });
        }

        const event = await Event.findById(id);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        if (event.createdBy.toString() !== userId) {
            return res.status(403).json({ message: 'Only the creator can conclude this event' });
        }

        event.isClosed = true;
        await event.save();

        const populated = await Event.findById(id)
            .populate('participants', 'username email profilePic')
            .populate({
                path: 'expenses',
                populate: { path: 'paidBy paidTo', select: 'username' }
            });

        res.status(200).json({ message: 'Event concluded successfully', event: populated });
    } catch (error) {
        console.error('❌ Error concluding event:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all events for a user
app.get('/api/events/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const events = await Event.find({ participants: userId });
        res.status(200).json(events);
    } catch (error) {
        console.error("❌ Error fetching user events:", error);
        res.status(500).json({ message: "Server error" });
    }
});

//------------------------ alerts ---------------------------
// Create a new alert (message or poll)
app.post('/api/alerts/create', async (req, res) => {
    try {
        const { sender, receiver, message, type, expenseDetails, pollOptions } = req.body;

        if (!sender || !message) {
            return res.status(400).json({ message: "Sender, message are required" });
        }

        const newAlert = new Alert({
            sender,
            receiver,
            message,
            type,
            expenseDetails,
            pollOptions
        });

        await newAlert.save();

        res.status(201).json({ message: "Alert created successfully", alert: newAlert });

    } catch (error) {
        console.error("❌ Error creating alert:", error);
        res.status(500).json({ message: "Server error" });
    }
});

app.post('/api/email/reminder', async(req,res) => {
    try{
        const {sender, receiver, amount, expense} = req.body;
        
        // Validate required fields
        if (!sender || !receiver || !amount || !expense) {
            return res.status(400).json({ message: "sender, receiver, amount, and expense are required" });
        }
        
        if (!sender.username || !sender.email) {
            return res.status(400).json({ message: "sender must have username and email" });
        }
        
        if (!receiver.username || !receiver.email) {
            return res.status(400).json({ message: "receiver must have username and email" });
        }

        // Try multiple SMTP configurations for better reliability
        const smtpConfigs = [
            {
                host: "smtp.gmail.com",
                port: 587,
                secure: false,
                auth: {
                    user: "maharshibhattstar@gmail.com",
                    pass: "pzxe mxpj gzts uyja"
                },
                tls: {
                    rejectUnauthorized: false
                },
                connectionTimeout: 30000,
                greetingTimeout: 15000,
                socketTimeout: 30000
            },
            {
                host: "smtp.gmail.com",
                port: 465,
                secure: true,
                auth: {
                    user: "maharshibhattstar@gmail.com",
                    pass: "pzxe mxpj gzts uyja"
                },
                tls: {
                    rejectUnauthorized: false
                },
                connectionTimeout: 30000,
                greetingTimeout: 15000,
                socketTimeout: 30000
            }
        ];

        let lastError = null;
        let info = null;

        for (let i = 0; i < smtpConfigs.length; i++) {
            try {
                console.log(`🔄 Trying SMTP config ${i + 1}/${smtpConfigs.length}...`);
                const transporter = nm.createTransport(smtpConfigs[i]);
                
                // Test connection first
                await transporter.verify();
                console.log(`✅ SMTP connection verified with config ${i + 1}`);
                
                info = await transporter.sendMail({
                    from: "maharshibhattstar@gmail.com", // Use fixed sender
                    to: receiver.email,
                    subject: `You owe ₹${amount} to ${sender.username}`,
                    html: `
  <div style="font-family: Arial, sans-serif; background:#f9f9f9; padding:20px;">
    <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
      
      <!-- Header -->
      <div style="background:#4CAF50; padding:15px; text-align:center; color:#fff;">
        <h2 style="margin:0;">💸 Expense Reminder</h2>
      </div>

      <!-- Body -->
      <div style="padding:20px; color:#333;">
        <p style="font-size:16px;">
          Hi <b>${receiver.username}</b>,
        </p>

        <p style="font-size:16px;">
          You owe <b>₹${amount}</b> to <b>${sender.username}</b>.
        </p>

        <table style="width:100%; margin-top:20px; border-collapse:collapse;">
          <tr>
            <td style="padding:10px; border:1px solid #ddd;"><b>Description</b></td>
            <td style="padding:10px; border:1px solid #ddd;">${expense.description}</td>
          </tr>
          <tr>
            <td style="padding:10px; border:1px solid #ddd;"><b>Date</b></td>
            <td style="padding:10px; border:1px solid #ddd;">${new Date(expense.date).toLocaleDateString()}</td>
          </tr>
          <tr>
            <td style="padding:10px; border:1px solid #ddd;"><b>Status</b></td>
            <td style="padding:10px; border:1px solid #ddd; color:${expense.status ? 'green' : 'red'};">
              ${expense.status ? "✅ Paid" : "❌ Pending"}
            </td>
          </tr>
        </table>

        <p style="margin-top:20px; font-size:14px; color:#555;">
          Please settle this amount as soon as possible.
        </p>
      </div>

      <!-- Footer -->
      <div style="background:#f1f1f1; padding:15px; text-align:center; font-size:12px; color:#777;">
        <p style="margin:0;">This email was sent by <b>Mil Baat Kar</b> Expense Tracker.</p>
      </div>
    </div>
  </div>
`
                });
                
                console.log("✅ Email sent successfully:", info.messageId);
                break; // Success, exit the loop
                
            } catch (error) {
                console.log(`❌ SMTP config ${i + 1} failed:`, error.message);
                lastError = error;
                continue; // Try next config
            }
        }

        if (!info) {
            throw lastError || new Error("All SMTP configurations failed");
        }
        
        res.status(200).json({ message: "Email sent successfully", messageId: info.messageId });
        
    }catch(error){
        console.error("❌ Error sending email:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
})

// Get all alerts
app.get('/api/alerts', async (req, res) => {
    try {
        const alerts = await Alert.find()
            .populate("sender", "username")
            .populate("receiver", "username")
            .populate({
                path: "expenseDetails",
                populate: [
                    { path: "paidBy", select: "username" },
                    { path: "paidTo", select: "username" }
                ]
            });

        res.status(200).json(alerts);
    } catch (error) {
        console.error("❌ Error fetching alerts:", error);
        res.status(500).json({ message: "Server error" });
    }
});


// Vote in a poll
app.post('/api/alerts/vote/:alertId', async (req, res) => {
    try {
        const { alertId } = req.params;
        const { userId, optionIndex } = req.body;

        const alert = await Alert.findById(alertId);
        if (!alert) return res.status(404).json({ message: "Alert not found" });
        if (alert.type !== "poll") return res.status(400).json({ message: "Not a poll" });

        // Remove user vote from all options first
        alert.pollOptions.forEach(opt => {
            opt.votes = opt.votes.filter(v => v.toString() !== userId);
        });

        // Add vote to selected option
        if (alert.pollOptions[optionIndex]) {
            alert.pollOptions[optionIndex].votes.push(userId);
        } else {
            return res.status(400).json({ message: "Invalid option index" });
        }

        await alert.save();
        res.status(200).json({ message: "Vote recorded", alert });

    } catch (error) {
        console.error("❌ Error voting in poll:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Delete an alert
app.delete('/api/alerts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Alert.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ message: "Alert not found" });
        res.status(200).json({ message: "Alert deleted successfully" });
    } catch (error) {
        console.error("❌ Error deleting alert:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// -------------------- ADMIN ROUTES -------------------- //

// Admin middleware (basic check - in production, use proper JWT auth)
const isAdmin = async (req, res, next) => {
    try {
        // Headers are case-insensitive; use Express getter to read safely
        const adminUsername = req.get('adminUsername');
        if (!adminUsername) {
            return res.status(401).json({ message: "Admin username required" });
        }
        
        const user = await User.findOne({ username: adminUsername, isAdmin: true });
        if (!user) {
            return res.status(403).json({ message: "Admin access required" });
        }
        
        req.adminUser = user;
        next();
    } catch (error) {
        console.error("❌ Admin auth error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Admin: Get all events with populated data
app.get('/api/admin/events', isAdmin, async (req, res) => {
    try {
        const events = await Event.find()
            .populate("participants", "username email")
            .populate("createdBy", "username")
            .sort({ createdAt: -1 });
        res.status(200).json(events);
    } catch (error) {
        console.error("❌ Error fetching admin events:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Admin: Get all expenses with populated data
app.get('/api/admin/expenses', isAdmin, async (req, res) => {
    try {
        const expenses = await ExpenseLog.find()
            .populate("paidBy", "username")
            .populate("paidTo", "username")
            .sort({ createdAt: -1 });
        res.status(200).json(expenses);
    } catch (error) {
        console.error("❌ Error fetching admin expenses:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Admin: Create user
app.post('/api/admin/users', isAdmin, async (req, res) => {
    try {
        const { username, email, phone, password, isAdmin: adminStatus, profilePic } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = new User({
            username,
            email,
            phone,
            passwordHash: password,
            isAdmin: adminStatus || false,
            profilePic: profilePic || ''
        });

        await user.save();
        res.status(201).json({ message: "User created successfully", user });
    } catch (error) {
        console.error("❌ Error creating user:", error);
        
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                message: `${field} already exists`
            });
        }
        
        res.status(500).json({ message: "Server error" });
    }
});

// Admin: Update user
app.put('/api/admin/users/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, phone, password, isAdmin: adminStatus, profilePic } = req.body;
        
        const updateFields = {};
        if (username !== undefined) updateFields.username = username;
        if (email !== undefined) updateFields.email = email;
        if (phone !== undefined) updateFields.phone = phone;
        if (password !== undefined && password.trim()) updateFields.passwordHash = password;
        if (adminStatus !== undefined) updateFields.isAdmin = adminStatus;
        if (profilePic !== undefined) updateFields.profilePic = profilePic;

        const updatedUser = await User.findByIdAndUpdate(
            id,
            { $set: updateFields },
            { new: true, runValidators: true }
        );
        
        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }
        
        res.status(200).json({ message: "User updated successfully", user: updatedUser });
    } catch (error) {
        console.error("❌ Error updating user:", error);
        
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                message: `${field} already exists`
            });
        }
        
        res.status(500).json({ message: "Server error" });
    }
});

// Admin: Delete user
app.delete('/api/admin/users/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if user exists
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        // Prevent deleting the current admin
        if (user._id.toString() === req.adminUser._id.toString()) {
            return res.status(400).json({ message: "Cannot delete your own account" });
        }
        
        await User.findByIdAndDelete(id);
        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("❌ Error deleting user:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Admin: Create event
app.post('/api/admin/events', isAdmin, async (req, res) => {
    try {
        const { name, description, createdBy, isClosed } = req.body;
        
        if (!name || !createdBy) {
            return res.status(400).json({ message: "Name and createdBy are required" });
        }

        // Generate random event code
        const code = Math.random().toString(36).substr(2, 8).toUpperCase();

        const newEvent = new Event({
            name,
            description,
            createdBy,
            code,
            participants: [createdBy],
            isClosed: isClosed || false
        });

        await newEvent.save();
        res.status(201).json({ message: "Event created successfully", event: newEvent });
    } catch (error) {
        console.error("❌ Error creating event:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Admin: Update event
app.put('/api/admin/events/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, isClosed } = req.body;
        
        const updateFields = {};
        if (name !== undefined) updateFields.name = name;
        if (description !== undefined) updateFields.description = description;
        if (isClosed !== undefined) updateFields.isClosed = isClosed;

        const updatedEvent = await Event.findByIdAndUpdate(
            id,
            { $set: updateFields },
            { new: true, runValidators: true }
        );
        
        if (!updatedEvent) {
            return res.status(404).json({ message: "Event not found" });
        }
        
        res.status(200).json({ message: "Event updated successfully", event: updatedEvent });
    } catch (error) {
        console.error("❌ Error updating event:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Admin: Delete event
app.delete('/api/admin/events/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        const deletedEvent = await Event.findByIdAndDelete(id);
        if (!deletedEvent) {
            return res.status(404).json({ message: "Event not found" });
        }
        
        res.status(200).json({ message: "Event deleted successfully" });
    } catch (error) {
        console.error("❌ Error deleting event:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Admin: Delete expense
app.delete('/api/admin/expenses/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        const deletedExpense = await ExpenseLog.findByIdAndDelete(id);
        if (!deletedExpense) {
            return res.status(404).json({ message: "Expense not found" });
        }
        
        res.status(200).json({ message: "Expense deleted successfully" });
    } catch (error) {
        console.error("❌ Error deleting expense:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Admin: Delete alert
app.delete('/api/admin/alerts/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        const deletedAlert = await Alert.findByIdAndDelete(id);
        if (!deletedAlert) {
            return res.status(404).json({ message: "Alert not found" });
        }
        
        res.status(200).json({ message: "Alert deleted successfully" });
    } catch (error) {
        console.error("❌ Error deleting alert:", error);
        res.status(500).json({ message: "Server error" });
    }
});
  
// Start server
app.listen(PORT,'0.0.0.0', () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
});
