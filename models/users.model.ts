import mongoose from "mongoose";
import isEmail from 'validator/es/lib/isEmail'

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    require: [true, "Please enter your first name"],
    lowercase: true
  },
  lastName: {
    type: String,
    require: [true, "Please enter your last name"],
    lowercase: true
  },
  username: {
    type: String,
    require: [true, "Please choose a username"],
    lowercase: true,
    unique: true
  },
  email: {
    type: String,
    require: [true, "Please enter your email address"],
    lowercase: true,
    unique: true,
    validator: [isEmail, "Please enter a valid email address"]
  },
  password: {
    type: String,
    require: [true, "Please enter a password"],
    minLength: [8, "Password must be at least 8 characters long"],
    maxLength: [32, "Password can not be longer than 32 characters"]
  },
  walletBalance: {
    type: Number,
    min: [0, "Account balance can not go lower than 0 naira"],
    default: 0
  }
}, { timestamps: true });

const userModel = mongoose.model('user', userSchema);

export default userModel;