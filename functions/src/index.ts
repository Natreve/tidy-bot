import admin from "firebase-admin";
import functions, { logger } from "firebase-functions";
import express from "express";
import { bot, webhookCallback } from "./services/bot.js";
// import fs from "fs-extra";
import * as dotenv from "dotenv";
import * as jobs from "./services/job.js";
dotenv.config();

// const serviceAccount = fs.readJSONSync("../service-account.json");
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });
// jobs.syncCalendar({ name: "Harbour Drive", url: process.env.HARBOURDRIVE });
const credential = admin.credential.applicationDefault();
admin.initializeApp({ credential });

const app = express();

app.use(webhookCallback(bot));
function onJobs(message: string) {
  logger.log(message);
}
//Run this function every minute to perform a number of tasks
export const ticker = functions
  .runWith({ memory: "2GB" })
  .pubsub.schedule("every 1 minutes")
  .onRun(async (ctx) => {
    const c1 = { name: "Harbour Drive", url: process.env.HARBOURDRIVE };
    const c2 = { name: "Coralway", url: process.env.CORLWAY };
    
    jobs
      .syncCalendar(c1, (jobs, message) => onJobs(`${jobs.length} ${message}`))
      .catch((err) => logger.error(err));
    jobs
      .syncCalendar(c2, (jobs, message) => onJobs(`${jobs.length} ${message}`))
      .catch((err) => logger.error(err));
  });

export const TidyBot = functions.https.onRequest(app);
