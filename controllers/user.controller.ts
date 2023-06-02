import { Response } from "express"
import { IExtendedRequest } from "../interfaces/extendedRequest";
import { handleAPIError } from "../utils/handleError";
import mongoose, { isValidObjectId } from "mongoose";
import userModel from "../models/users.model";

export const getProfileInfo = async function (req: IExtendedRequest, res: Response) {
  const { userId } = req;
  
  try {
    if (isValidObjectId(userId) === false) {
      res.status(400).json({ message: "Invalid request" });
      return;
    }

    const user = await userModel.findOne(
      { _id: new mongoose.Types.ObjectId(userId) },
      { password: 0, createdAt: 0, updatedAt: 0, __v: 0 }
    )

    if (user === null) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({ message: "Profile retrieved successfully", data: user });
  } catch (error) {
    handleAPIError(error, res);
  }
}