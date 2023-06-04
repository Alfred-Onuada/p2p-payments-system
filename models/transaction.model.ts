import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Please specify a 'sender' for this transaction"],
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
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
    transactionType: {
      type: String,
      enum: ["topup", "transfer"],
      required: [true, "Please specify a transaction type"],
    },
    note: {
      type: String,
    },
  },
  { timestamps: true }
);

const transactionModel = mongoose.model("transaction", transactionSchema);

export default transactionModel;
