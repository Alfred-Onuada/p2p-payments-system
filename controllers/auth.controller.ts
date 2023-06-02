import { Request, Response } from 'express';
import userModel from '../models/users.model';
import { handleAPIError } from '../utils/handleError';
import mongoose from 'mongoose';
import jwt, { JwtPayload } from 'jsonwebtoken';
import tokenModel from '../models/token.model';
import isEmail from 'validator/lib/isEmail';
import { compareSync } from 'bcrypt';

const createAPITokens = function (userId: mongoose.Types.ObjectId) {
  return new Promise(async (resolve, reject) => {
    try {
      // this will be used to invalidate refresh tokens
      const { _id: tokenId } = await tokenModel.create({ userId });

      const accessToken = jwt.sign(
        { userId },
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: '15m'
        }
      )
  
      const refreshToken = jwt.sign(
        { 
          userId,
          tokenId
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
          expiresIn: '7d'
        }
      )
  
      resolve({ accessToken, refreshToken });
    } catch (error) {
      reject(error);
    }
  })
}

export const register = async function (req: Request, res: Response) {
  const userInfo = req.body;

  try {
    if (typeof userInfo !== 'object' || Object.keys(userInfo).length === 0) {
      res.status(400).json({ message: "Please fill all required fields" })
      return;
    }

    if (userInfo.hasOwnProperty('walletBalance')) {
      delete userInfo.walletBalance;
    }

    const { _id: userId } = await userModel.create(userInfo);

    const tokens = await createAPITokens(userId)

    res.status(201).json({ message: "Registration successful", data: tokens });
  } catch (error) {
    handleAPIError(error, res);
  }
}

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

    const hasCorrectPassword = compareSync(
      password,
      userInfo.password
    );

    if (hasCorrectPassword == false) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    const tokens = await createAPITokens(userInfo._id);

    res.status(200).json({ message: "Login successful", data: tokens });
  } catch (error) {
    handleAPIError(error, res);
  }
}

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
    await tokenModel.deleteOne({ _id: new mongoose.Types.ObjectId(tokenInfo.tokenId) });

    res.status(200).json({ message: "Success" });
  } catch (error) {
    // ignore JWT error messages
    res.status(400).json({ message: "Invalid request" });
  }
}