const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    message: { type: String, required: true },
    type: { type: String, enum: ["warning", "info", "success", "poll"], required: true },
    expenseDetails: { type: mongoose.Schema.Types.ObjectId, ref: "ExpenceLog" },
    seen :{type : Boolean},
    // Poll support
    pollOptions: [
      {
        option: String,
        votes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
      }
    ],
  }, { timestamps: true });
  
module.exports = mongoose.model('Alert', alertSchema);
