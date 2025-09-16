const jwt = require('jsonwebtoken');
const Citizen = require('../models/citizen.model');
const Admin = require('../models/admin.model');

const protectCitizen = async (req, res, next) => {
    let token;
    if (req.cookies.token) {
        try {
            token = req.cookies.token;
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await Citizen.findById(decoded.id).select('-password');
            next();
        } catch (error) {
            res.status(401).redirect('/');
        }
    }
    if (!token) {
        res.status(401).redirect('/');
    }
};

const protectAdmin = async (req, res, next) => {
    let token;
    if (req.cookies.admin_token) {
        try {
            token = req.cookies.admin_token;
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.admin = await Admin.findById(decoded.id).select('-password');
            next();
        } catch (error) {
            res.status(401).redirect('/admin/login');
        }
    }
     if (!token) {
        res.status(401).redirect('/admin/login');
    }
};

module.exports = { protectCitizen, protectAdmin };