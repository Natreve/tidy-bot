import admin from "firebase-admin";
import * as ical from "node-ical";
import Sugar from "sugar";
import { Timestamp } from "firebase-admin/firestore";
import { DateTime } from "luxon";
import * as Task from "./task.js";
export type status = "scheduled" | "completed";
export type CalendarType = {
  name: string;
  url: string;
  options?: { [key: string]: any };
};
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
  assigned?: string | null;
  options?: { [key: string]: any };
}
export interface Booking {
  [key: string]: {
    id: string;
    name: string;
    date: Date;
  };
}
export type WebEvent = {
  summary: string;
  end: Date;
  description: string;
};
export type JobUpdate = {
  name?: string;
  date?: Date;
  status?: status;
  options?: { [key: string]: any };
  assigned?: string;
};
export const get = async (id: string | string[]) => {
  const firestore = admin.firestore();
  const db = firestore.collection("jobs");
  const jobs: FirebaseJob[] = [];
  try {
    if (typeof id === "string") {
      const snapshot = await db.doc(id).get();
      const data = snapshot.data() as FirebaseJob;
      if (data) jobs.push(data);
      return jobs;
    }

    const querySnapshots = await db.where("id", "in", id).get();

    querySnapshots.forEach((querySnapshot) => {
      if (querySnapshot.exists) jobs.push(querySnapshot.data() as FirebaseJob);
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
export const fetchBookings = async (name: string, url: string) => {
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
        bookings[id] = { id, name, date };
        bookingIDs.push(id);
      }
    }
    if (!Object.keys(bookings).length) return null;
    return bookings;
  } catch (error) {
    throw new Error("There was a issue getting the bookings", { cause: error });
  }
};
export const createJobsAndTasksFrom = (
  bookings: Booking,
  options: { [key: string]: any }
): [Job[], Task.Task[]] => {
  const jobs: Job[] = [];
  const tasks: Task.Task[] = [];
  for (const key in bookings) {
    const { id, name, date } = bookings[key];
    const t1 = DateTime.fromJSDate(date).minus({ hour: 1 }).toJSDate();
    const t2 = DateTime.fromJSDate(date).minus({ hour: 14 }).toJSDate();
    tasks.push({ id, name, date: t1, status: "scheduled" });
    tasks.push({ id, name, date: t2, status: "scheduled" });
    jobs.push({
      id,
      date,
      name,
      status: "scheduled",
      group: null,
      assigned: null,
      options,
    });
  }
  return [jobs, tasks];
};
type SyncCF = (x: Job[], message: string) => void;
export const syncCalendar = async (calendar: CalendarType, cb?: SyncCF) => {
  const firestore = admin.firestore();
  const db = firestore.collection("jobs");
  const { name, url, options } = calendar;
  try {
    const bookings = await fetchBookings(name, url);
    if (!bookings) return;

    const ids = Object.keys(bookings).map((id) => id);
    const querySnapshots = await db.where("id", "in", ids).get();

    //if the query turns up empty add all bookings as new jobs with their tasks
    if (querySnapshots.empty) {
      const [jobs, tasks] = createJobsAndTasksFrom(bookings, options || {});

      // add new jobs and tasks
      await add(jobs);
      await Task.add(tasks);
      if (cb) cb(jobs, `New Jobs Added to ${name}`);
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

      //if day is not equal update the job and tasks date. Send a notification
      if (!d1.hasSame(d2, "day")) {
        const t1 = DateTime.fromJSDate(date).minus({ hour: 1 }).toJSDate();
        const t2 = DateTime.fromJSDate(date).minus({ hour: 14 }).toJSDate();
        taskUpdates.push({ date: t1 }, { date: t2 });
        jobUpdates.push({ date });
        let data = job as unknown as Job; //case the FirebaseJob interface to a Job
        data.date = date; //replace the FirebaseJob inteface date from Timestamp to Date
        if (cb) cb([data], `Jobs Updated at ${name}`);
        return;
      }
    });
    //if there are bookings remaining, it indicates new bookings and should be added to jobs & tasks
    if (Object.keys(bookings).length) {
      const [jobs, tasks] = createJobsAndTasksFrom(bookings, options || {});
      // // send notification of the newly added jobs
      await add(jobs);
      await Task.add(tasks);
      if (cb) cb(jobs, `New Jobs Added at ${name}`);
    }
  } catch (error) {
    throw Error("Error syncing calendar", { cause: error });
  }
};
export const claim = async (uid: string, id: string | string[]) => {
  try {
    const claims: FirebaseJob[] = [];
    if (Array.isArray(id)) {
      const jobs: FirebaseJob[] = await get(id);
      jobs.forEach((job) => {
        if (!job?.assigned) claims.push(job);
      });
      if (claims.length) {
        let ids = claims.map(({ id }) => id);
        await update(ids, { assigned: uid });
        return claims;
      }
      return null;
    }
    const job = await get(id);
    if (!job[0]?.assigned) {
      await update(job[0].id, { assigned: uid });
      return job;
    }
    return null;
  } catch (error) {
    throw new Error("Error claiming job", { cause: error });
  }
};
export const claimed = async (uid: string) => {
  try {
    const firestore = admin.firestore();
    const db = firestore.collection("jobs");
    const jobs: FirebaseJob[] = [];
    const querySnapshots = await db.where("assigned", "==", uid).get();
    if (querySnapshots.empty) return null;

    querySnapshots.forEach((querySnapshot) => {
      jobs.push(querySnapshot.data() as FirebaseJob);
    });
    return jobs;
  } catch (error) {
    throw new Error("Error getting claims", { cause: error });
  }
};
export const unclaim = async (uid: string, id: string | string[]) => {
  try {
    const firestore = admin.firestore();
    const db = firestore.collection("jobs");
    const jobs: FirebaseJob[] = [];
    if (Array.isArray(id)) {
      const snapshots = await db
        .where("id", "in", id)
        .where("assigned", "==", uid)
        .get();
      if (snapshots.empty) return null;
      snapshots.forEach((snapshot) =>
        jobs.push(snapshot.data() as FirebaseJob)
      );
      return jobs;
    }
    const snapshot = await db
      .where("id", "==", id)
      .where("assigned", "==", uid)
      .limit(1)
      .get();
    if (snapshot.empty) return null;
    jobs.push(snapshot.docs[0].data() as FirebaseJob);
    return jobs;
  } catch (error) {
    throw new Error("Error unclaiming jobs", { cause: error });
  }
};
export const unclaimed = async () => {
  try {
    const firestore = admin.firestore();
    const db = firestore.collection("jobs");
    const jobs: FirebaseJob[] = [];
    const snapshots = await db.where("assigned", "==", null).get();

    if (snapshots.empty) return null;

    snapshots.forEach((snapshot) => jobs.push(snapshot.data() as FirebaseJob));
    return jobs;
  } catch (error) {
    throw new Error("Error getting jobs", { cause: error });
  }
};
