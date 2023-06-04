import { Request } from "express";

export interface IExtendedRequest extends Request {
  userId: string;
}
