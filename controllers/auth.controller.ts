import { Request, Response } from 'express';
import userModel from '../models/users.model';
import { handleAPIError } from '../utils/handleError';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import tokenModel from '../models/token.model';

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

export const login = function (req: Request, res: Response) {
  try {
    
  } catch (error) {
    
  }
}

export const logout = function (req: Request, res: Response) {
  try {
    
  } catch (error) {
    
  }
}