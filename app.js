require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const flash = require('connect-flash');
const app = express();


// Middleware
const createSession = require('./middleware/session');
const loginFlag = require('./middleware/loginFlag');
const protectUserRoutes = require('./middleware/protectUserRoutes');

// Routes
const userRouter = require('./routes/user');
const authRouter = require('./routes/auth');

// ENV variables
const dbPath = process.env.MONGO_URI;
const sessionSecret = process.env.SESSION_SECRET;
const PORT = process.env.PORT || 3407;

// Set view engine
app.set('view engine', 'ejs');
app.set('views', 'views');

// Middleware setup
app.use(flash());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(createSession(dbPath, sessionSecret));
app.use(loginFlag);

// 🔒 Protected user routes
app.use(['/user/saved_news', '/user/liked_news'], protectUserRoutes);

// Routes
app.use(userRouter);
app.use(authRouter);

// 404 handler
app.use((req, res) => {
    res.status(404).render('error', {
        title: "Error - Page Not Found",
        isLogedIn: req.isLogedIn
    });
});

// MongoDB connection and TTL setup
mongoose.connect(dbPath).then(async () => {
    console.log('✅ Connected to MongoDB');

    // TTL for sessions collection
    try {
        await mongoose.connection.db.collection('sessions').createIndex(
            { expiresAt: 1 },
            { expireAfterSeconds: 0 }
        );
        console.log('TTL index ensured on sessions collection.');
    } catch (err) {
        console.error('❌ TTL index failed for sessions:', err.message);
    }

    // Start server
    app.listen(PORT, () => {
        console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('❌ Failed to connect to MongoDB:', err);
});