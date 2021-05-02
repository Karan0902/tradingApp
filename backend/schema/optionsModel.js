var mongoose = require("mongoose");

var optionsSchema = new mongoose.Schema({
    tradeType: String,
    optionName: {
        type: String,
        unique: true
    },
    levelValue: Number,
    callOrPut: String,
    weekDate: String,
    entry: Number,
    stopLoss: Number,
    target: Number,
    notification: String
}, {timestamps: true});

module.exports = mongoose.model("Options", optionsSchema);