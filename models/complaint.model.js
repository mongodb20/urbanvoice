const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
    complaintNumber: { type: String, required: true, unique: true },
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
    imageUrl: { type: String }, // Path to the uploaded image
    status: { 
        type: String, 
        default: 'Sent',
        enum: ['Sent', 'Viewed', 'On Progress', 'Resolved']
    },
}, { timestamps: true });

module.exports = mongoose.model('Complaint', complaintSchema);