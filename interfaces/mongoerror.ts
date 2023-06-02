interface IValidationErrors {
  name: String,
  stringValue: String,
  message: String
}

export interface IMongoError {
  name: String,
  code: Number,
  errors: IValidationErrors[],
  keyPattern: Object
}