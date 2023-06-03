import { Response } from "express";
import { IExtendedRequest } from "../interfaces/extendedRequest";
import { handleAPIError } from "../utils/handleError";
import mongoose, { isValidObjectId, mongo } from "mongoose";
import transactionModel from "../models/transaction.model";
import userModel from "../models/users.model";
import { v4 as uuidv4 } from 'uuid';

const PAYSTACK_BASE_API = "https://api.paystack.co";
const PAYSTACK_KEY = process.env.PAYSTACK_SECRET_KEY;

export const verifyTopup = async function (req: IExtendedRequest, res: Response) {
  const { ref } = req.params;
  const { userId } = req;

  try {
    if (typeof ref === "undefined" || ref.length === 0) {
      res.status(400).json({ message: "Please specify a transaction ID" });
      return;
    }

    if (isValidObjectId(userId) === false) {
      res.status(401).json({ message: "Invalid request" });
      return;
    }

    const resp = await fetch(
      `${PAYSTACK_BASE_API}/transaction/verify/${ref}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PAYSTACK_KEY}`,
        },
      }
    );

    const data = await resp.json();

    // This status is the status of the API request not the actual transaction
    if (data.status != true) {
      throw { name: "PaystackError", message: data.message };
    }

    // This is the status of the actual transaction
    if (data.data.status !== "success") {
      throw {
        name: "PaystackError",
        message: `Paystack returned the following message '${data.data.gateway_response}'`,
      };
    }

    const amount = data.data.amount / 100; // note paystack returns the amount in Kobo

    // multiple writes as a transaction
    const session = await mongoose.startSession({
      defaultTransactionOptions: {
        readPreference: "primary",
        readConcern: { level: "local" },
        writeConcern: { w: "majority" },
      },
    });

    await session.withTransaction(async function () {
      try {
        await transactionModel.create(
          [
            {
              ref: ref,
              sender: userId,
              transactionType: "topup",
              amount,
              status: "success",
            },
          ],
          { session }
        );

        const updateInfo = await userModel.updateOne(
          { _id: new mongoose.Types.ObjectId(userId) },
          { $inc: { walletBalance: amount } },
          { runValidators: true, session }
        );

        if (
          updateInfo.acknowledged === false ||
          updateInfo.modifiedCount === 0
        ) {
          throw { name: "PaystackError", message: "Could not complete the transaction verification" };
        }

        await session.commitTransaction();
      } catch (error) {
        await session.abortTransaction();

        throw error;
      } finally {
        await session.endSession();
      }
    });

    // to return new balance to frontend
    const userInfo = await userModel.findOne({ _id: new mongoose.Types.ObjectId(userId) });

    res.status(200).json({ message: "Topup verified and saved", data: userInfo.walletBalance });
  } catch (error) {
    handleAPIError(error, res);
  }
}

export const transferFunds = async function (req: IExtendedRequest, res: Response) {
  const { userId } = req;
  const { receiver, note } = req.body;
  let amount = parseInt(req.body.amount);
  const ref = uuidv4();
  const transactionType = "transfer";

  try {
    if (isValidObjectId(userId) === false) {
      res.status(401).json({ message: "Invalid request" });
      return;
    }

    if (typeof receiver !== 'string' || receiver.length === 0) {
      res.status(400).json({ message: "Please specify a receiver" });
      return;
    }

    if (amount.toString() === 'NaN' || amount <= 0) {
      res.status(400).json({ message: "Please specify a valid amount to transfer" });
      return;
    }

    // confirm the user has enough money
    const user = await userModel.findOne({ _id: new mongoose.Types.ObjectId(userId) });

    if (user === null) {
      res.status(400).json({ message: "Invalid user" });
      return;
    }

    if (user.walletBalance < amount) {
      res.status(400).json({ message: "Insufficient funds" });
      return;
    }

    // get receiver
    const receiverDoc = await userModel.findOne({ username: receiver });

    if (receiverDoc === null) {
      res.status(400).json({ message: "Couldn't find the user specified as recipient" })
      return;
    }
    
    if (receiverDoc._id.equals(user._id)) {
      res.status(400).json({ message: "You cannot send money to yourself" });
      return;
    }

    // send money to receiver and deduct from sender

    const session = await mongoose.startSession({
      defaultTransactionOptions: {
        readPreference: "primary",
        readConcern: { level: "local" },
        writeConcern: { w: "majority" },
      },
    });

    await session.withTransaction(async function () {
      try {
        await transactionModel.create(
          [{
            ref,
            transactionType,
            amount: amount,
            note,
            status: 'success',
            receiver: receiverDoc._id,
            sender: userId,
          }],
          { session }
        )

        await userModel.updateOne(
          { _id: new mongoose.Types.ObjectId(userId) },
          { $inc: { walletBalance: (-1 * amount) } },
          { session }
        );

        await userModel.updateOne(
          { _id: receiverDoc._id },
          { $inc: { walletBalance: amount } },
          { session }
        )

        await session.commitTransaction();
      } catch (error) {
        await session.abortTransaction();

        throw error;
      } finally {
        await session.endSession();
      }
    });

    const { walletBalance } = await userModel.findOne({ _id: new mongoose.Types.ObjectId(userId) });

    res.status(200).json({ message: "Transfer successful", data: { ref, walletBalance } });
  } catch (error) {
    handleAPIError(error, res);
  }
}