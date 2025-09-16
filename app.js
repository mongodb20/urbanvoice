require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');

// Import routes
const authRoutes = require('./routes/auth.routes');
const citizenRoutes = require('./routes/citizen.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
}));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files (CSS, JS, Uploaded Images)
app.use(express.static(path.join(__dirname, 'public')));

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.error(err));

// --- Manually insert Admin user if not exists ---
const Admin = require('./models/admin.model');
const bcrypt = require('bcryptjs');

async function createDefaultAdmin() {
    try {
        const adminExists = await Admin.findOne({ adminId: 'admin' });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const newAdmin = new Admin({
                adminId: 'admin',
                password: hashedPassword
            });
            await newAdmin.save();
            console.log('Default admin created. ID: admin, Pass: admin123');
        }
    } catch (error) {
        console.error('Error creating default admin:', error);
    }
}
createDefaultAdmin();
// -------------------------------------------------

// Routes
app.use('/', authRoutes);
app.use('/citizen', citizenRoutes);
app.use('/admin', adminRoutes);

// Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));