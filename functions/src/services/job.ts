import admin from "firebase-admin";
import * as ical from "node-ical";
import Sugar from "sugar";
import { Timestamp } from "firebase-admin/firestore";
import { DateTime } from "luxon";
import * as Task from "./task.js";
type status = "claimed" | "unclaimed" | "completed";
type CalendarType = { name: string; url: string };
export interface FirebaseJob {
  id: string;
  group: string | null;
  name: string;
  date: Timestamp;
  status: status;
  assigned?: string;
  options?: { [key: string]: any };
}
export interface Job {
  id: string;
  group: string | null;
  name: string;
  date: Date;
  status: status;
  assigned?: string;
  options?: { [key: string]: any };
}
interface Booking {
  [key: string]: {
    id: string;
    date: Date;
  };
}
type WebEvent = {
  summary: string;
  end: Date;
  description: string;
};
type JobUpdate = {
  name?: string;
  date?: Timestamp;
  status?: status;
  options?: { [key: string]: any };
  assigned?: string;
};
export const get = async (id: string | string[]) => {
  const firestore = admin.firestore();
  const db = firestore.collection("jobs");
  const jobs: Job[] = [];
  try {
    if (typeof id === "string") {
      const snapshot = await db.doc(id).get();
      const data = snapshot.data() as Job;
      if (data) jobs.push(data);
      return jobs;
    }

    const querySnapshots = await db.where("id", "in", id).get();

    querySnapshots.forEach((querySnapshot) => {
      if (querySnapshot.exists) jobs.push(querySnapshot.data() as Job);
    });

    return jobs;
  } catch (error) {
    throw Error("Error getting job/jobs", { cause: error });
  }
};
export const add = async (jobs: Job | Job[]) => {
  const firestore = admin.firestore();
  const db = firestore.collection("jobs");
  const batch = firestore.batch();
  try {
    if (Array.isArray(jobs)) {
      jobs.forEach((job) => batch.set(firestore.doc(job.id), job));
      await batch.commit();
      return;
    }
    await db.doc(jobs.id).set(jobs);
  } catch (error) {
    throw Error("Error adding job/tasks", { cause: error });
  }
};
export const update = async (id: string | string[], update: JobUpdate) => {
  const firestore = admin.firestore();
  const db = firestore.collection("tasks");
  const batch = firestore.batch();
  try {
    if (Array.isArray(id)) {
      id.forEach((id) => batch.update(firestore.doc(id), update));
      await batch.commit();
      return;
    }
    await db.doc(id).update(update);
  } catch (error) {
    throw Error("Error updating job/tasks", { cause: error });
  }
};
export const syncCalendar = async (calendar: CalendarType) => {
  const firestore = admin.firestore();
  const jobsDB = firestore.collection("jobs");
  const bookings: Booking = {};
  const bookingIDs: string[] = [];
  const jobs: Job[] = [];

  try {
    const webEvents = await ical.fromURL(calendar.url);

    for (const key in webEvents) {
      const { end, summary, description } = webEvents[key] as WebEvent;
      if (!summary) continue;
      if (summary.includes("Reserved")) {
        const id = description.match(/reservations\/details\/([A-Z0-9]+)/)![1];

        const date = Sugar.Date.create(
          DateTime.fromJSDate(new Date(end.toString())).toFormat(
            "LLL dd yyyy 11:00a"
          )
        );
        bookings[id] = { id, date };
        bookingIDs.push(id);
      }
    }
    if (!Object.keys(bookings).length) return;

    const querySnapshots = await jobsDB
      .where(
        "id",
        "in",
        bookingIDs.map((id) => id)
      )
      .get();
    //if the query turns up empty add all bookings as new jobs
    if (querySnapshots.empty) {
      const tasks: Task.Task[] = [];
      for (const key in bookings) {
        const { id, date } = bookings[key];
        tasks.push({ id, name: calendar.name, date, status: "scheduled" });
        jobs.push({
          id,
          date,
          name: calendar.name,
          status: "unclaimed",
          group: null,
        });
      }
      //add new jobs and tasks
      //   await add(jobs);
      //   await Task.add(tasks);
      return;
    }

    querySnapshots.forEach((querySnapshot) => {
      if (!querySnapshot.exists) {
        console.log("Dones't exists", querySnapshot.id);

        //Create new job & task if this booking does not exists. Send a notification
        return;
      }
      const job = querySnapshot.data() as FirebaseJob;
      const booking = bookings[job.id];
      const d1 = DateTime.fromJSDate(booking.date);
      const d2 = DateTime.fromJSDate(job.date.toDate());
      //if dates are not equal update the job and task date. Send a notification
      if (d1 !== d2) {
        return;
      }
      //   const d2 =
    });
  } catch (error) {
    throw Error("Error syncing calendar", { cause: error });
  }
};
