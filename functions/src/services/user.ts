import admin from "firebase-admin";

export type usertype = "creator" | "administrator" | "memeber";

export interface UserType {
  uid: string;
  first_name?: string;
  last_name?: string;
  group?: string;
  type?: usertype;
  username?: string;
}
export const get = async (id: string) => {
  const firestore = admin.firestore();
  const db = firestore.collection("users");
  try {
    const snapshot = await db.doc(id).get();
    if (snapshot.exists) return snapshot.data() as UserType;
    return null;
  } catch (error) {
    throw new Error("Error getting user", { cause: error });
  }
};
export const add = async (users: UserType | UserType[]) => {
  const firestore = admin.firestore();
  const db = firestore.collection("users");
  const batch = firestore.batch();
  try {
    if (Array.isArray(users)) {
      users.forEach((user) => batch.set(db.doc(user.uid), user));
      await batch.commit();
      return;
    }
    await db.doc(users.uid).set(users);
  } catch (error) {
    throw new Error("Error adding user", { cause: error });
  }
};
