import firebase from "firebase-admin";
import { DateTime } from "luxon";

async function reminder(task, cb = () => {}) {
  const now = firebase.firestore.Timestamp.now().toDate();
  const { ref, reminders, options } = task;
  let remindersLeft = 0;
  let sendReminder = [];
  let msg = `Reminder to perform tasks at ${options.name}`;
  reminders.forEach(({ time, sent }) => {
    let d1 = DateTime.fromJSDate(time.toDate());
    let d2 = DateTime.fromJSDate(now);

    if (sent) return;
    if (d2 < d1) return remindersLeft++;

    //send reminder to individual who claimed the task
    if (options.claimed) {
      cb(options.claimed, msg);
      sendReminder.push(task);
    }
  });
  // if no reminders are left mark status completed
  // if (!remindersLeft) return ref.update({ status: "completed" });

  return sendReminder;
}

export { reminder };
