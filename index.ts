// Initialize ENV variables
import { config } from "dotenv";
config();

import express from 'express';
import cors from 'cors';
import mongoose from "mongoose";
import compression from "compression";
import apiRoutes from "./routes/app.routes"

const app = express();

// allows request from all origin for purpose of this demo
app.use(cors());
// minifies server responses to improve latency
app.use(compression());

const PORT = process.env.PORT || 3111;

const startApp = async function () {
  try {
    await mongoose.connect(process.env.DB_URI);

    app.use('/api', apiRoutes);

    app.listen(PORT, function () {
      console.log(`App is live at port ${PORT}`);
    })
  } catch (error) {
    console.log("Failed to start app");
    
    console.log(error);
  }
}

startApp();