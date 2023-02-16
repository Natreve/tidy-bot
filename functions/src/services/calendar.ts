import admin from "firebase-admin";
import * as ical from "node-ical";
import { DateTime } from "luxon";
import Sugar from "sugar";
export type CalendarType = {
  id: string;
  name: string;
  url: string;
  group: string;
  options?: { [key: string]: any };
};
type WebEvent = {
  summary: string;
  end: Date;
  description: string;
};

export const get = async (id?: string) => {
  const firestore = admin.firestore();
  const db = firestore.collection("calendars");
  const calendars: CalendarType[] = [];
  const documents = await db.listDocuments();

  if (id) {
    const snapshot = await db.doc(id).get();
    if (snapshot.exists) {
      const data = snapshot.data() as CalendarType;
      calendars.push({ ...data, id: snapshot.id });
    }
    return calendars;
  }
  await Promise.all(
    documents.map(async (document) => {
      const snapshot = await document.get();
      const data = snapshot.data() as CalendarType;
      if (snapshot.exists) calendars.push({ ...data, id: snapshot.id });
    })
  );

  return calendars;
};
//gets the airbnb bookings
const fetchBookings = async (calendar: CalendarType) => {
  try {
    const { name, url, options, group } = calendar;
    const bookings = [];
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

        bookings.push({ id, name, date, group, options });
      }
    }

    return bookings;
  } catch (error) {
    throw new Error("There was a issue getting the bookings", { cause: error });
  }
};
//sync all calendars in the database
export const sync = async (id?: string) => {
  try {
    // const firestore = admin.firestore();
    // const db = firestore.collection("jobs");

    const calendars = await get();

    calendars.forEach(async (calendar) => {
      //   const bookings =
      await fetchBookings(calendar);
    });
  } catch (error) {}

  //   const events = result.reduce((acc, val) => {
  //     return acc.concat(val);
  //   }, []);
  //   console.log(events);
};
