import * as admin from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { DateTime } from "luxon";
import * as Sugar from "sugar";
type status = "scheduled" | "completed" | "error";
export interface FirebaseTask {
  id: string;
  name: string;
  date: Timestamp;
  status: status;
  options?: { [key: string]: any };
}
export interface Task {
  id: string;
  name: string;
  date: Date;
  status: status;
  options?: { [key: string]: any };
}
type TaskUpdate = {
  name?: string;
  date?: Date;
  status?: status;
  options?: { [key: string]: any };
};
export const get = async (id: string | string[]) => {
  const firestore = admin.firestore();
  const db = firestore.collection("tasks");
  const tasks: FirebaseTask[] = [];
  try {
    if (typeof id === "string") {
      const snapshot = await db.doc(id).get();
      const data = snapshot.data() as FirebaseTask;
      if (data) tasks.push(data);
      return tasks;
    }

    const querySnapshots = await db.where("id", "in", id).get();

    querySnapshots.forEach((querySnapshot) => {
      if (querySnapshot.exists) tasks.push(querySnapshot.data() as FirebaseTask);
    });

    return tasks;
  } catch (error) {
    throw Error("Error getting task/tasks", { cause: error });
  }
};
export const add = async (tasks: Task | Task[]) => {
  const firestore = admin.firestore();
  const db = firestore.collection("tasks");
  const batch = firestore.batch();
  try {
    if (Array.isArray(tasks)) {
      tasks.forEach((task) => batch.set(firestore.doc(task.id), task));
      await batch.commit();
      return;
    }
    await db.doc(tasks.id).set(tasks);
  } catch (error) {
    throw Error("Error adding task/tasks", { cause: error });
  }
};
export const update = async (id: string | string[], update: TaskUpdate) => {
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
    throw Error("Error updating task/tasks", { cause: error });
  }
};
export const execute = async (cb: (task: FirebaseTask) => void) => {
  const firestore = admin.firestore();
  const db = firestore.collection("tasks");
  const now = admin.firestore.Timestamp.now().toDate();
  // Query all tasks ready to be performed
  const querySnapshots = await db
    .where("date", "<=", now)
    .where("status", "==", "scheduled")
    .get();
  querySnapshots.forEach((querySnapshot) => {
    if (!querySnapshot.exists) return;
    const task = querySnapshot.data() as FirebaseTask;
    const nowdate = Sugar.Date.create(
      DateTime.fromJSDate(now).toFormat("LLL dd yyyy hh:mma")
    );
    const date = Sugar.Date.create(
      DateTime.fromJSDate(task.date.toDate()).toFormat("LLL dd yyyy hh:mma")
    );
    const dateDiff = DateTime.fromJSDate(nowdate).diff(
      DateTime.fromJSDate(date),
      "minute"
    );
    //if there is a difference of 5 mins or less to the time, execute
    if (dateDiff.as("minute") <= 5) {
      cb(task);
      return;
    }
  });
};
