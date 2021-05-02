var mongoose = require("mongoose");

var optionsHistorySchema = new mongoose.Schema({
    tradeType: String,
    optionName: {
        type: String,
    },
    levelValue: Number,
    callOrPut: String,
    weekDate: String,
    entry: Number,
    stopLoss: Number,
    target: Number,
    createdAt: Date,
    updatedAt: Date
});

module.exports = mongoose.model("OptionsHistory", optionsHistorySchema);