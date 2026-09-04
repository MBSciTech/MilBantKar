const mongoose = require('mongoose');

const fundingRecordSchema = new mongoose.Schema(
  {
    ipoApplicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'IPOApplication',
      required: true
    },
    financierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    applicantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amountFunded: {
      type: Number,
      required: true
    },
    fundingDate: {
      type: Date,
      default: Date.now
    },
    fundingProofScreenshot: {
      type: String,
      required: true
    },
    allotmentStatus: {
      type: String,
      enum: ['pending', 'not_allotted', 'fully_allotted', 'partially_allotted'],
      default: 'pending'
    },
    allotedAmount: {
      type: Number,
      default: 0
    },
    refundAmount: {
      type: Number,
      default: 0
    },
    refundStatus: {
      type: String,
      enum: ['not_applicable', 'pending', 'settled'],
      default: 'not_applicable'
    },
    refundProofScreenshot: {
      type: String,
      default: null
    },
    refundSettledDate: {
      type: Date,
      default: null
    },
    holdingStatus: {
      type: String,
      enum: ['not_applicable', 'holding', 'sold'],
      default: 'not_applicable'
    },
    saleProceeds: {
      type: Number,
      default: 0
    },
    saleDate: {
      type: Date,
      default: null
    },
    settlementStatus: {
      type: String,
      enum: ['not_applicable', 'pending', 'settled'],
      default: 'not_applicable'
    },
    settlementProofScreenshot: {
      type: String,
      default: null
    },
    settledDate: {
      type: Date,
      default: null
    },
    overallStatus: {
      type: String,
      default: 'Funded'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('FundingRecord', fundingRecordSchema);
