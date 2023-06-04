import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { IExtendedRequest } from "../interfaces/extendedRequest";

export const isLoggedIn = function (
  req: IExtendedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (req.headers.authorization === "undefined") {
      res.status(401).json({ message: "Access Denied" });
      return;
    }

    const token: string = req.headers.authorization.split(" ")[1];

    // confirm token status
    const tokenInfo: any = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // set the userId into the request object
    req.userId = tokenInfo.userId;

    next();
  } catch (error) {
    res.status(401).json({ message: "Access Denied" });
  }
};
