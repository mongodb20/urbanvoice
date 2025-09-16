const express = require('express');
const router = express.Router();
const { protectCitizen } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const Complaint = require('../models/complaint.model');
const BackupComplaint = require('../models/backupComplaint.model');

// @desc    Show Citizen Dashboard
// @route   GET /citizen/dashboard
router.get('/dashboard', protectCitizen, async (req, res) => {
    try {
        const complaints = await Complaint.find({ citizenId: req.user._id }).sort({ createdAt: -1 });
        res.render('citizen_dashboard', {
            user: req.user,
            complaints: complaints,
            message: null
        });
    } catch (error) {
        res.render('citizen_dashboard', {
            user: req.user,
            complaints: [],
            message: 'Error fetching complaints.'
        });
    }
});


// @desc    Submit a new complaint
// @route   POST /citizen/complaint
router.post('/complaint', protectCitizen, upload.single('complaintImage'), async (req, res) => {
    const { complaintName, complaintType, address, description } = req.body;

    if (!complaintName || !complaintType || !address || !description) {
        // This is a server-side check; frontend should validate first.
        return res.status(400).redirect('/citizen/dashboard'); 
    }

    try {
        const newComplaint = new Complaint({
            complaintNumber: `UV-${Date.now()}`,
            citizenId: req.user._id,
            citizenName: req.user.name,
            citizenPhone: req.user.phone,
            complaintName,
            complaintType,
            address,
            description,
            imageUrl: req.file ? `/uploads/${req.file.filename}` : null
        });
        await newComplaint.save();
        res.redirect('/citizen/dashboard');
    } catch (error) {
        console.error(error);
        // A more robust error handling would be to render the page again with an error message
        res.status(500).redirect('/citizen/dashboard');
    }
});


// @desc    Delete a complaint
// @route   DELETE /citizen/complaint/:id
router.delete('/complaint/:id', protectCitizen, async (req, res) => {
    try {
        const complaint = await Complaint.findOne({ _id: req.params.id, citizenId: req.user._id });
        
        if (!complaint) {
            return res.status(404).json({ success: false, message: 'Complaint not found or you are not authorized.' });
        }
        
        // Create backup
        const backup = new BackupComplaint({
            originalId: complaint._id,
            complaintNumber: complaint.complaintNumber,
            citizenId: complaint.citizenId,
            citizenName: complaint.citizenName,
            citizenPhone: complaint.citizenPhone,
            complaintName: complaint.complaintName,
            complaintType: complaint.complaintType,
            address: complaint.address,
            description: complaint.description,
            imageUrl: complaint.imageUrl,
            status: complaint.status,
            originalCreatedAt: complaint.createdAt,
        });

        await backup.save();
        await Complaint.findByIdAndDelete(req.params.id);

        res.json({ success: true, message: 'Complaint deleted successfully.' });

    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ success: false, message: 'Server error while deleting.' });
    }
});


module.exports = router;