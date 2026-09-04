const mongoose = require('mongoose');

const ipoApplicationSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true
    },
    companyName: {
      type: String,
      required: true
    },
    applicationDate: {
      type: Date,
      default: Date.now
    },
    allotmentResultDate: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['open', 'result_declared', 'closed'],
      default: 'open'
    },
    notes: {
      type: String,
      default: ''
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('IPOApplication', ipoApplicationSchema);
