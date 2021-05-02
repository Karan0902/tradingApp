var mongoose = require("mongoose");

// SCHEMA SETUP
var deliverySchema = new mongoose.Schema({
    scrip: {
        type: String,
        unique: true
    },
    price: Number,
    indicator: String
    }, {  timestamps: true  });

module.exports = mongoose.model("Delivery", deliverySchema);