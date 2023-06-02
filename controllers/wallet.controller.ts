import { Response } from "express";
import { IExtendedRequest } from "../interfaces/extendedRequest";
import { handleAPIError } from "../utils/handleError";
import mongoose, { isValidObjectId } from "mongoose";
import transactionModel from "../models/transaction.model";
import userModel from "../models/users.model";

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

    res.status(200).json({ message: "Topup verified and saved" });
  } catch (error) {
    handleAPIError(error, res);
  }
}