import firebase from "firebase-admin";

async function reminder(task, cb = () => {}) {
  const now = firebase.firestore.Timestamp.now().toDate();
  const { ref, reminders, options } = task;
  let remindersLeft = 0;
  let sendReminder = [];
  let msg = `Reminder to perform tasks at ${options.name}`;
  reminders.forEach(({ time, sent }) => {
    if (sent) return;
    if (now < time.toDate()) return remainingReminders++;

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
