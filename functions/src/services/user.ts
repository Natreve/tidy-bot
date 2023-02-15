import admin from "firebase-admin";

export type usertype = "owner" | "admin" | "memeber";

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
export const add = async (user: UserType) => {
  try {
    const firestore = admin.firestore();
    const db = firestore.collection("users");
    await db.doc(user.uid).set(user);
  } catch (error) {
    throw new Error("Error adding user", { cause: error });
  }
};
