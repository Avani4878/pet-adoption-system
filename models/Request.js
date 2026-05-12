const mongoose = require("mongoose");
const requestSchema=new mongoose.Schema({
    petName: {
        type: String,
        required: true
    },
    userEmail: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["Pending", "Approved", "Rejected"],
        default: "Pending"
    }
});

module.exports = mongoose.model("Request", requestSchema);