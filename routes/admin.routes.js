const express = require('express');
const router = express.Router();
const { protectAdmin } = require('../middleware/auth.middleware');
const Complaint = require('../models/complaint.model');

// @desc    Show Admin Dashboard with all non-resolved complaints
// @route   GET /admin/dashboard
router.get('/dashboard', protectAdmin, async (req, res) => {
    try {
        let query = { status: { $ne: 'Resolved' } };

        // Search functionality
        if (req.query.searchPhone) {
            query.citizenPhone = { $regex: req.query.searchPhone, $options: 'i' };
        }
        if (req.query.status && req.query.status !== 'All') {
            query.status = req.query.status;
        }

        const complaints = await Complaint.find(query).sort({ createdAt: -1 });
        
        // Stats
        const totalComplaints = await Complaint.countDocuments();
        const resolvedComplaints = await Complaint.countDocuments({ status: 'Resolved' });
        const onProgressComplaints = await Complaint.countDocuments({ status: 'On Progress' });

        res.render('admin_dashboard', {
            admin: req.admin,
            complaints,
            stats: {
                total: totalComplaints,
                resolved: resolvedComplaints,
                inProgress: onProgressComplaints
            },
            filters: { // To retain filter values in the UI
                searchPhone: req.query.searchPhone || '',
                status: req.query.status || 'All'
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
});

// @desc    Update complaint status
// @route   POST /admin/complaint/:id/status
router.post('/complaint/:id/status', protectAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        await Complaint.findByIdAndUpdate(req.params.id, { status });
        res.redirect('/admin/dashboard');
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
});

// @desc    Fetch resolved complaints (for AJAX call)
// @route   GET /admin/resolved-complaints
router.get('/resolved-complaints', protectAdmin, async (req, res) => {
    try {
        const resolved = await Complaint.find({ status: 'Resolved' }).sort({ updatedAt: -1 });
        res.json(resolved);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching resolved complaints' });
    }
});

module.exports = router;