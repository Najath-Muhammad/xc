const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User",
      required: true,
    },
    balance: {
      type: Number,
      required: true,
      default: 0, 
    },
    transactions: [
      {
        transactionType: {
          type: String,
          enum: ["Credit", "Debit"], 
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
        date: {
          type: Date,
          default: Date.now, 
        },
        status: {
          type: String,
          enum: ["Success", "Pending", "Failed"], 
          default: "Success",
        },
        orderId: {
          type: String,
          
        },
        remarks:{
          type:String
        }
      },
    ],
  },
  { timestamps: true }
);


const Wallet = mongoose.model('Wallet',walletSchema);

module.exports = Wallet;
