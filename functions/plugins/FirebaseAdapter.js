import firebase from "firebase-admin";

function FirebaseAdapter(collection) {
  const db = firebase.firestore();

  return {
    read: async (key) => {
      const snapshot = await db.collection(collection).doc(key).get();
      return snapshot.data();
    },
    write: async (key, value) => {
      await db.collection(collection).doc(key).set(value);
    },
    delete: async (key) => {
      await db.collection(collection).doc(key).delete();
    },
    update: async (key) => {},
  };
}
export default FirebaseAdapter;
