const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const svgCaptcha = require('svg-captcha');
const otpGenerator = require('otp-generator');
const Citizen = require('../models/citizen.model');
const Admin = require('../models/admin.model');

// --- Helper function to generate token ---
const generateToken = (res, id, tokenName) => {
    const token = jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.cookie(tokenName, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000,
    });
};

// --- Routes ---

// @desc    Show Index/Login page
// @route   GET /
router.get('/', (req, res) => {
    res.render('index', { message: null });
});

// @desc    Show Admin Login page
// @route   GET /admin/login
router.get('/admin/login', (req, res) => {
    res.render('admin_login', { message: null });
});

// @desc    Generate CAPTCHA
// @route   GET /captcha
router.get('/captcha', (req, res) => {
    const captcha = svgCaptcha.create();
    req.session.captcha = captcha.text;
    res.type('svg');
    res.status(200).send(captcha.data);
});

// @desc    Citizen Registration
// @route   POST /register
router.post('/register', async (req, res) => {
    const { name, phone, password, confirmPassword, captcha } = req.body;
    
    if (req.session.captcha !== captcha) {
        return res.render('index', { message: 'Invalid CAPTCHA' });
    }
    if (password !== confirmPassword) {
        return res.render('index', { message: 'Passwords do not match' });
    }

    const citizenExists = await Citizen.findOne({ phone });
    if (citizenExists) {
        return res.render('index', { message: 'Citizen already exists' });
    }

    const citizen = await Citizen.create({ name, phone, password });
    if (citizen) {
        generateToken(res, citizen._id, 'token');
        res.redirect('/citizen/dashboard');
    } else {
        res.render('index', { message: 'Invalid user data' });
    }
});

// @desc    Citizen Login
// @route   POST /login
router.post('/login', async (req, res) => {
    const { phone, password, captcha } = req.body;
     if (req.session.captcha !== captcha) {
        return res.render('index', { message: 'Invalid CAPTCHA' });
    }
    const citizen = await Citizen.findOne({ phone });
    if (citizen && (await citizen.matchPassword(password))) {
        generateToken(res, citizen._id, 'token');
        res.redirect('/citizen/dashboard');
    } else {
        res.render('index', { message: 'Invalid phone or password' });
    }
});

// @desc    Admin Login
// @route   POST /admin/login
router.post('/admin/login', async (req, res) => {
    const { adminId, password, captcha } = req.body;
    if (req.session.captcha !== captcha) {
        return res.render('admin_login', { message: 'Invalid CAPTCHA' });
    }
    const admin = await Admin.findOne({ adminId });
    if (admin && (await admin.matchPassword(password))) {
        generateToken(res, admin._id, 'admin_token');
        res.redirect('/admin/dashboard');
    } else {
        res.render('admin_login', { message: 'Invalid Admin ID or password' });
    }
});

// @desc    Logout
// @route   GET /logout
router.get('/logout', (req, res) => {
    res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
    res.cookie('admin_token', '', { httpOnly: true, expires: new Date(0) });
    res.redirect('/');
});


// @desc    Forgot Password - Step 1: Send OTP
// @route   POST /forgot-password
router.post('/forgot-password', async (req, res) => {
    const { phone } = req.body;
    const citizen = await Citizen.findOne({ phone });
    if (!citizen) {
        // Still send success response to prevent user enumeration
        return res.json({ success: true, message: 'If a user exists, an OTP has been sent.' });
    }

    const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false });
    req.session.otp = {
        code: otp,
        phone: phone,
        expires: Date.now() + 10 * 60 * 1000 // 10 minutes
    };

    // --- SIMULATION ---
    // In a real app, you would use Twilio or a similar service to send the SMS here.
    // For this project, we'll log it to the console.
    console.log(`OTP for ${phone}: ${otp}`);
    
    res.json({ success: true, message: `OTP sent successfully (check console).` });
});


// @desc    Forgot Password - Step 2: Verify OTP and Reset Password
// @route   POST /reset-password
router.post('/reset-password', async (req, res) => {
    const { phone, otp, newPassword, confirmNewPassword } = req.body;

    if (!req.session.otp || req.session.otp.phone !== phone || req.session.otp.expires < Date.now()) {
        return res.status(400).json({ success: false, message: 'OTP is invalid or has expired.' });
    }
    if (req.session.otp.code !== otp) {
        return res.status(400).json({ success: false, message: 'Incorrect OTP.' });
    }
    if (newPassword !== confirmNewPassword) {
        return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    const citizen = await Citizen.findOne({ phone });
    if (!citizen) {
         return res.status(404).json({ success: false, message: 'User not found.' });
    }
    
    citizen.password = newPassword; // The pre-save hook will hash it
    await citizen.save();

    delete req.session.otp; // Clear the OTP from session

    res.json({ success: true, message: 'Password has been reset successfully.' });
});


module.exports = router;