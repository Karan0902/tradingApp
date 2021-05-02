var mongoose = require("mongoose");

// SCHEMA SETUP
var historySchema = new mongoose.Schema({
    scrip: {
        type: String,
    },
    price: Number,
    indicator: String,
    createdAt: Date,
    updatedAt: Date
    });

module.exports = mongoose.model("History", historySchema);