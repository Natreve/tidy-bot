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
  date?: Date;
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
      jobs.forEach((job) => batch.set(db.doc(job.id), job));
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
      id.forEach((id) => batch.update(db.doc(id), update));
      await batch.commit();
      return;
    }
    await db.doc(id).update(update);
  } catch (error) {
    throw Error("Error updating job/tasks", { cause: error });
  }
};
export const fetchBookings = async (url: string) => {
  try {
    const bookingIDs: string[] = [];
    const bookings: Booking = {};
    const webEvents = await ical.fromURL(url);

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
    if (!Object.keys(bookings).length) return null;
    return bookings;
  } catch (error) {
    throw new Error("There was a issue getting the bookings", { cause: error });
  }
};
export const syncCalendar = async ({ name, url }: CalendarType) => {
  const firestore = admin.firestore();
  const db = firestore.collection("jobs");

  try {
    const bookings = await fetchBookings(url);
    const jobs: Job[] = [];
    const tasks: Task.Task[] = [];

    if (!bookings) return;
    bookings["testID"] = { id: "testID", date: new Date() };
    const ids = Object.keys(bookings).map((id) => id);
    const querySnapshots = await db.where("id", "in", ids).get();

    //if the query turns up empty add all bookings as new jobs with their tasks
    if (querySnapshots.empty) {
      for (const key in bookings) {
        const { id, date } = bookings[key];
        const t1 = DateTime.fromJSDate(date).minus({ hour: 1 }).toJSDate();
        const t2 = DateTime.fromJSDate(date).minus({ hour: 14 }).toJSDate();
        tasks.push({ id, name, date: t1, status: "scheduled" });
        tasks.push({ id, name, date: t2, status: "scheduled" });
        jobs.push({
          id,
          date,
          name,
          status: "unclaimed",
          group: null,
        });
      }

      //add new jobs and tasks
      await add(jobs);
      //   await Task.add(tasks);

      return;
    }
    const taskUpdates: Task.TaskUpdate[] = [];
    const jobUpdates: JobUpdate[] = [];
    querySnapshots.forEach((querySnapshot) => {
      const job = querySnapshot.data() as FirebaseJob;
      const booking = bookings[job.id];
      const date = booking.date;
      const d1 = DateTime.fromJSDate(date);
      const d2 = DateTime.fromJSDate(job.date.toDate());
      //remove the booking, will check bookings to see if new ones where added
      delete bookings[job.id];

      //if dates are not equal update the job and tasks date. Send a notification
      if (!d1.equals(d2)) {
        const t1 = DateTime.fromJSDate(date).minus({ hour: 1 }).toJSDate();
        const t2 = DateTime.fromJSDate(date).minus({ hour: 14 }).toJSDate();
        taskUpdates.push({ date: t1 }, { date: t2 });
        jobUpdates.push({ date });
        return;
      }
    });
    //if there are bookings remaining, it indicates new bookings and should be added to jobs & tasks
    if (Object.keys(bookings).length) {
      console.log("Most be called");
    }
  } catch (error) {
    throw Error("Error syncing calendar", { cause: error });
  }
};
