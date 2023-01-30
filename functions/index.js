import dotenv from "dotenv";
import firebase from "firebase-admin";
import functions from "firebase-functions";
import express from "express";
import Bot from "./services/Bot.js";
import fs from "fs-extra";
import * as taskRunner from "./services/TaskRunner.js";

dotenv.config({ path: "../.env" });

const serviceAccount = fs.readJSONSync("../service-account.json");
firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
});

// const credential = firebase.credential.applicationDefault();
// firebase.initializeApp({ credential });

const app = express();
const bot = await Bot();

app.use(bot.webhookCallback(bot.tidy));
//Run this function every minute to perform a number of tasks
export const ticker = functions
  .runWith({ memory: "2GB" })
  .pubsub.schedule("* * * * *")
  .onRun(async (ctx) => {
    taskRunner.syncWithCalendars("Harbour Drive", process.env.HARBOURDRIVE);
    taskRunner.syncWithCalendars("Coral Way", process.env.CORLWAY);
  });

export const TidyBot = functions.https.onRequest(app);
// export const codesbyTidyBot = functions.https.onRequest(
//   async (request, response) => {
//     // taskRunner.syncWithCalendars("Harbour Drive", process.env.HARBOURDRIVE);
//     // taskRunner.syncWithCalendars("Coral Way", process.env.CORLWAY);
//     // taskRunner.sendReminders();
//     return response.send("Hello from Firebase!");
//   }
// );
