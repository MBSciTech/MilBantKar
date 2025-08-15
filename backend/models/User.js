const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  { 
    isAdmin:{
     type : Boolean,
     default : false
    },
    username: {
      type: String,
      trim: true,
      unique: true,
      sparse: true // allows null but keeps uniqueness if set
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[0-9]{7,15}$/, 'Invalid phone number']
    },
    passwordHash: {
      type: String,
      required: true,
    },
    profilePic: {
      type: String,
      default: '',
    },

    balances: {
      owedToOthers: { type: Number, default: 0 }, // Positive → owes others
      owedByOthers: { type: Number, default: 0 }  // Positive → others owe them
    },
    
  },
  {
    timestamps: true // auto adds createdAt & updatedAt
  }
);

module.exports = mongoose.model('User', userSchema);
