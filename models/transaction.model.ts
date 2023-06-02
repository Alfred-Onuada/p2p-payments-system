import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Types.ObjectId,
    required: [true, "Please specify a 'sender' for this transaction"]
  },
  receiver: {
    type: mongoose.Types.ObjectId,
    required: [true, "Please specify a 'receiver' for this transaction"]
  },
  amount: {
    type: Number,
    min: [0, "A transaction amount can not be less than 0"],
    requiredd: [true, "Please specify the transaction amount"],
  },
  ref: {
    type: String,
    required: [true, "Please specify the transaction refrence"],
    unique: true,
  },
  status: {
    type: String,
    enum: ["pending", "success", "failed"],
    default: "pending",
  },
  note: {
    type: String
  }
}, { timestamps: true });

const transactionModel = mongoose.model('transaction', transactionSchema);

export default transactionModel;