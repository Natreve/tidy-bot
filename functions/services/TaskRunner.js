import firebase from "firebase-admin";
import axios from "axios";
import ical from "node-ical";
import * as workers from "./Workers.js";
import { DateTime } from "luxon";
import { logger } from "firebase-functions";

async function sendReminders(cb = () => {}) {
  const db = firebase.firestore();
  const now = firebase.firestore.Timestamp.now();

  // Query all documents ready to perform
  const tasksQuery = db
    .collection("tasks")
    .where("date", "<=", now)
    .where("status", "==", "scheduled");

  const tasks = await tasksQuery.get();
  const jobs = [];
  tasks.forEach((snapshot) => {
    const task = snapshot.data();
    // The runner function can update the task based on it's ref
    const job = workers[task.worker]({ ...task, ref: snapshot.ref });
    jobs.push(job);
  });
  // Execute all jobs concurrently
  return await Promise.all(jobs);
}
async function syncWithCalendars(name, url) {
  try {
    const firestore = firebase.firestore();
    const db = firestore.collection("tasks");
    const batch = firestore.batch();
    const { data } = await axios.get(url);
    const webEvents = ical.parseICS(data);
    const events = [];
    for (const key in webEvents) {
      if (Object.hasOwnProperty.call(webEvents, key)) {
        const { end, summary, description } = webEvents[key];

        if (end && summary.includes("Reserved")) {
          const id = description.match(/reservations\/details\/([A-Z0-9]+)/)[1];
          const date = new Date(end.toString());

          const reminders = [
            {
              time: DateTime.fromJSDate(date).set({ hour: 10 }).toJSDate(),
              sent: false,
            },
            {
              time: DateTime.fromJSDate(date).set({ hour: 14 }).toJSDate(),
              sent: false,
            },
          ];

          events.push({
            id,
            date,
            reminders,
            status: "scheduled",
            worker: "reminder",
            options: {
              name,
              gid: null,
              claimed: null,
            },
          });
        }
      }
    }

    //if there are no tasks no action needs to be taken
    if (!events.length) return null;
    const tasks = await db
      .where(
        "id",
        "in",
        events.map(({ id }) => id)
      )
      .get();
    if (tasks.empty) {
      events.forEach((event) => batch.set(db.doc(event.id), event));
      await batch.commit();
      return events;
    }

    const newEvents = [];
    events.filter(
      (event) =>
        !tasks.docs.some((task) => {
          if (event.id === task.data().id) {
            batch.set(db.doc(event.id), event);
            return event;
          }
        })
    );

    if (newEvents.length) batch.commit();
  } catch (error) {
    logger.error(error);
  }
}
async function all() {
  return Promise.all([sendReminders(), syncWithCalendars()]);
}

export { sendReminders, syncWithCalendars, all };
