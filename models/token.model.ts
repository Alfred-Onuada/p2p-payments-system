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
      expires: "7d", // this creates a ttl (Time To Live) on this field
    },
  },
  { timestamps: true }
);

const tokenModel = mongoose.model("token", tokenSchema);

export default tokenModel;
