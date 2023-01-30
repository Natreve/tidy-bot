import dotenv from "dotenv";
import firebase from "firebase-admin";
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

const bot = await Bot();

//Run this function every minute to perform a number of tasks
export const ticker = functions
  .runWith({ memory: "2GB" })
  .pubsub.schedule("* * * * *")
  .onRun(async (ctx) => {
    let reminders = taskRunner.sendReminders();
    console.log(reminders);
  });

// export const codesbyTidyBot = functions.https.onRequest(
//   async (request, response) => {
//     return response.send("Hello from Firebase!");
//   }
// );
