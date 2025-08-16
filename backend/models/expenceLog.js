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
      required: true,
      default : ''
    },
    date: {
      type: Date,
      required: true,
      default : new Date()

    }
  }
);

module.exports = mongoose.model('ExpenseLog', expenseLogSchema);
