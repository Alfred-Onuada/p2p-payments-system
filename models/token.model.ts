import mongoose from "mongoose";

const tokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      required: [true, "The user id must be specified"],
    },
    createdAt: {
      type: Date,
      default: new Date(),
      expires: "7d",
    },
  },
  { timestamps: true }
);

const tokenModel = mongoose.model("token", tokenSchema);

export default tokenModel;
