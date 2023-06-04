import { Response } from "express";
import { IMongoError } from "../interfaces/mongoerror";

export const handleAPIError = function (error: IMongoError, res: Response) {
  if (isValidationError(error)) {
    const validationErrors = getValidationErrors(error);
    sendValidationErrorsResponse(res, validationErrors);
    return;
  }

  if (isDuplicateKeyError(error)) {
    sendDuplicateKeyErrorResponse(res, error);
    return;
  }

  if (isMongoDBDeploymentError(error)) {
    handleMongoDBDeploymentError();
    return;
  }

  if (isPaystackError(error)) {
    sendPaystackErrorResponse(res, error);
    return;
  }

  sendInternalErrorResponse(res);
};

function isValidationError(error: IMongoError): boolean {
  return error.name === "ValidationError";
}

function getValidationErrors(error: IMongoError): string[] {
  return Object.values(error.errors).map((err) => {
    if (err.name === "CastError") {
      return parseCastErrorMessage(err.stringValue.toString());
    }
    return err.message.toString();
  });
}

function parseCastErrorMessage(value: string): string {
  return `The value ${value.replace(/\"/g, "'")} doesn't match the required type for that field`;
}

function sendValidationErrorsResponse(res: Response, errors: string[]): void {
  res.status(400).json({
    message: "Bad Request",
    errors,
  });
}

function isDuplicateKeyError(error: IMongoError): boolean {
  return error.code === 11000;
}

function sendDuplicateKeyErrorResponse(res: Response, error: IMongoError): void {
  const duplicateField = Object.keys(error.keyPattern)[0];

  if (duplicateField === "ref") {
    res.status(400).json({ message: `Transaction has already been verified` });
  } else {
    res.status(400).json({ message: `${duplicateField} already exists` });
  }
}

function isMongoDBDeploymentError(error: IMongoError): boolean {
  return error.toString() === "MongoServerError: Transaction numbers are only allowed on a replica set member or mongos";
}

function handleMongoDBDeploymentError(): void {
  console.log(
    "\x1b[31m%s\x1b[0m",
    "Attention Please!!! the last request failed because you are running this application with a standalone mongoDB deployment, please switch to a replica set"
  );
}

function isPaystackError(error: IMongoError): boolean {
  return error.name === "PaystackError";
}

function sendPaystackErrorResponse(res: Response, error: IMongoError): void {
  res.status(400).json({ message: error.message });
}

function sendInternalErrorResponse(res: Response): void {
  res.status(500).json({ message: "Internal Server Error" });
}
