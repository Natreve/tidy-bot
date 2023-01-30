import firebase from "firebase-admin";
import { logger } from "firebase-functions/v1";
async function task() {
  try {
    const firestore = firebase.firestore();
    const db = firestore.collection("tasks");
    const snapshot = await db.where("options.claimed", "==", null).get();

    if (snapshot.empty) return null;

    return snapshot.docs.map((doc) => doc.data());
  } catch (error) {
    logger.error(error);
  }
}
