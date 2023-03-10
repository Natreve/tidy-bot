import admin from "firebase-admin";
import functions, { logger } from "firebase-functions";
import express from "express";
import { bot, webhookCallback } from "./services/bot.js";
// import fs from "fs-extra";
import * as dotenv from "dotenv";
import { syncCalendar } from "./services/job.js";
import { execute, FirebaseTask } from "./services/task.js";
dotenv.config();

// const serviceAccount = fs.readJSONSync("../service-account.json");
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

const credential = admin.credential.applicationDefault();
admin.initializeApp({ credential });

const app = express();
app.use(express.json());
app.use(webhookCallback(bot));


// bot.start()

function onJobs(message: string) {
  logger.log(message);
}
function onTask(task: FirebaseTask) {
  logger.log(`Send reminder for ${task.id} - ${task.name}`);
}
//Run this function every minute to perform a number of tasks
export const Ticker = functions
  .runWith({ memory: "2GB" })
  .pubsub.schedule("every 1 minutes")
  .onRun(async (ctx) => {
    const c1 = {
      name: "Harbour Drive",
      url: process.env.HARBOURDRIVE,
      options: { background: "#5a9ab2" },
    };
    const c2 = {
      name: "Coralway",
      url: process.env.CORLWAY,
      options: { background: "#91c33b" },
    };

    syncCalendar(c1, (jobs, message) =>
      onJobs(`${jobs.length} ${message}`)
    ).catch((err) => logger.error(err));
    syncCalendar(c2, (jobs, message) =>
      onJobs(`${jobs.length} ${message}`)
    ).catch((err) => logger.error(err));
    execute(onTask);
  });

export const TidyBot = functions.https.onRequest(app);
