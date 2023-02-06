import admin from "firebase-admin";
// import functions, { logger } from "firebase-functions";
// import express from "express";
// import { bot, webhookCallback } from "./src/services/Bot.js";
import fs from "fs-extra";
import * as dotenv from "dotenv";
// import { bot } from "./services/bot.js";
import * as jobs from "./services/job.js";
dotenv.config();
const serviceAccount = fs.readJSONSync("../service-account.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

jobs.syncCalendar({ name: "Harbour Drive", url: process.env.HARBOURDRIVE });
// const credential = admin.credential.applicationDefault();
// admin.initializeApp({ credential });

// const app = express();

// app.use(webhookCallback(bot));

//Run this function every minute to perform a number of tasks
// export const ticker = functions
//   .runWith({ memory: "2GB" })
//   .pubsub.schedule("every 1 minutes")
//   .onRun(async (ctx) => {

//   });

// // export const TidyBot = functions.https.onRequest(app);
