import admin from "firebase-admin";

type GroupType = "supergroup" | "group";
export interface Group {
  id: string;
  title: string;
  type: GroupType;
}
export const get = async (id: string) => {
  const firestore = admin.firestore();
  const db = firestore.collection("groups");
  try {
    const snapshot = await db.doc(id).get();
    const group: Group = snapshot.data() as Group;
    if (snapshot.exists) return group;
    return null;
  } catch (error) {
    throw Error("Error getting group", { cause: error });
  }
};
export const add = async (group: Group) => {
  const firestore = admin.firestore();
  const db = firestore.collection("groups");
  try {
    await db.doc(group.id).set(group);
  } catch (error) {
    throw Error("Error adding group", { cause: error });
  }
};
export const remove = async (id: string) => {
  const firestore = admin.firestore();
  const db = firestore.collection("groups");
  try {
    await db.doc(id).delete();
  } catch (error) {
    throw Error("Error delete group", { cause: error });
  }
};
