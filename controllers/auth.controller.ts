import { Request, Response } from "express";
import userModel from "../models/users.model";
import { handleAPIError } from "../utils/handleError";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import tokenModel from "../models/token.model";
import isEmail from "validator/lib/isEmail";
import { compareSync } from "bcrypt";

const createAPITokens = function (
  userId: mongoose.Types.ObjectId,
  tokenId: mongoose.Types.ObjectId
) {
  return new Promise(async (resolve, reject) => {
    try {
      const accessToken = jwt.sign(
        { userId },
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: "15m",
        }
      );

      const refreshToken = jwt.sign(
        {
          userId,
          tokenId,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
          expiresIn: "7d",
        }
      );

      resolve({ accessToken, refreshToken });
    } catch (error) {
      reject(error);
    }
  });
};

export const register = async function (req: Request, res: Response) {
  const userInfo = req.body;

  try {
    if (typeof userInfo !== "object" || Object.keys(userInfo).length === 0) {
      res.status(400).json({ message: "Please fill all required fields" });
      return;
    }

    if (userInfo.hasOwnProperty("walletBalance")) {
      delete userInfo.walletBalance;
    }

    const { _id: userId } = await userModel.create(userInfo);

    // this will be used to invalidate refresh tokens
    const { _id: tokenId } = await tokenModel.create({ userId });

    const tokens = await createAPITokens(userId, tokenId);

    res.status(201).json({ message: "Registration successful", data: tokens });
  } catch (error) {
    handleAPIError(error, res);
  }
};

export const login = async function (req: Request, res: Response) {
  const { email, password } = req.body;

  try {
    if (typeof email === "undefined" || isEmail(email) === false) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    if (typeof password === "undefined") {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    const userInfo = await userModel.findOne({ email });

    if (userInfo === null) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    const hasCorrectPassword = compareSync(password, userInfo.password);

    if (hasCorrectPassword == false) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    // this will be used to invalidate refresh tokens
    const { _id: tokenId } = await tokenModel.create({ userId: userInfo._id });

    const tokens = await createAPITokens(userInfo._id, tokenId);

    res.status(200).json({ message: "Login successful", data: tokens });
  } catch (error) {
    handleAPIError(error, res);
  }
};

export const logout = async function (req: Request, res: Response) {
  try {
    if (typeof req.headers.authorization === "undefined") {
      res
        .status(400)
        .json({ message: "You must specify a refresh token when logging out" });
      return;
    }

    const token = req.headers.authorization.split(" ")[1];

    const tokenInfo: any = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

    // remove the token, making it invalid for reuse
    await tokenModel.deleteOne({
      _id: new mongoose.Types.ObjectId(tokenInfo.tokenId),
    });

    res.status(200).json({ message: "Success" });
  } catch (error) {
    // ignore JWT error messages
    res.status(400).json({ message: "Invalid request" });
  }
};

export const rotateTokens = async function (req: Request, res: Response) {
  try {
    if (req.headers.authorization === "undefined") {
      res.status(401).json({ message: "Access Denied" });
      return;
    }

    const token: string = req.headers.authorization.split(" ")[1];

    // confirm token status
    const tokenInfo: any = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

    // check if token has not already been used
    const tokenFromDB = await tokenModel.findOne({ _id: tokenInfo.tokenId });

    if (tokenFromDB === null) {
      res
        .status(401)
        .json({ message: "This refresh token is no longer valid" });
      return;
    }

    // run multiple writes as a transaction
    const session = await mongoose.startSession({
      defaultTransactionOptions: {
        readPreference: "primary",
        readConcern: { level: "local" },
        writeConcern: { w: "majority" },
      },
    });

    let tokens = null;
    await session.withTransaction(async function () {
      try {
        // invalidate previous refresh tokens
        await tokenModel.deleteOne(
          { _id: new mongoose.Types.ObjectId(tokenInfo.tokenId) },
          { session }
        );

        const resp = await tokenModel.create([{ userId: tokenInfo.userId }], {
          session,
        });

        tokens = await createAPITokens(tokenInfo.userId, resp[0]._id);
      } catch (error) {
        await session.abortTransaction();

        throw error;
      } finally {
        await session.commitTransaction();
      }
    });

    res.status(200).json({ message: "Rotation successful", data: tokens });
  } catch (error) {
    handleAPIError(error, res);
  }
};
