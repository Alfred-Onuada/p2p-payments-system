import { Response } from "express";
import { IMongoError } from "../interfaces/mongoerror";

export const handleAPIError = function (error: IMongoError, res: Response) {
  // process error from mongodb schema validation
  if (error.name === "ValidationError") {
    // get all validation errors
    const validationErrors = Object.values(error.errors).map((err) => {
      // identify and parse cast errors
      if (err.name === "CastError") {
        return `The value ${err.stringValue.replace(
          /\"/g,
          "'"
        )} doesn't match the required type for that field`;
      }

      return err.message;
    });

    // send error to client
    res.status(400).json({
      message: "Bad Request",
      errors: validationErrors,
    });
    return;
  }

  // process error from mongodb duplicate key
  if (error.code === 11000) {
    let duplicateField = Object.keys(error.keyPattern)[0];

    // when a user tries to verify a transaction multiple times
    if (duplicateField === "ref") {
      res
        .status(400)
        .json({ message: `Transaction has already been verified` });
      return;
    }

    res.status(400).json({ message: `${duplicateField} already exists` });
    return;
  }

  res.status(500).json({ message: "Internal Server Error" });
};