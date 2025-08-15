const mongoose = require('mongoose');

const expenseLogSchema = new mongoose.Schema(
  {
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    paidTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      required: true
    }
  }
);

module.exports = mongoose.model('ExpenseLog', expenseLogSchema);
