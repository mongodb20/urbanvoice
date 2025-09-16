const mongoose = require('mongoose');

// This schema is identical to the main complaint schema
const backupComplaintSchema = new mongoose.Schema({
    originalId: { type: mongoose.Schema.Types.ObjectId, required: true },
    complaintNumber: { type: String, required: true },
    citizenId: { type: mongoose.Schema.Types.ObjectId, ref: 'Citizen', required: true },
    citizenName: { type: String, required: true },
    citizenPhone: { type: String, required: true },
    complaintName: { type: String, required: true },
    complaintType: { 
        type: String, 
        required: true,
        enum: ['Electricity', 'Water', 'Road', 'Garbage']
    },
    address: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String },
    status: { 
        type: String, 
        enum: ['Sent', 'Viewed', 'On Progress', 'Resolved']
    },
    originalCreatedAt: { type: Date }
}, { timestamps: true }); // timestamps will record when it was backed up

module.exports = mongoose.model('BackupComplaint', backupComplaintSchema);