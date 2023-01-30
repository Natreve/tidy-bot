import firebase from "firebase-admin";
import { Context } from "grammy";
import { logger } from "firebase-functions";
/**
 *
 * @param {Context} ctx
 * @returns
 */
export async function join(ctx) {
  const firestore = firebase.firestore();
  const db = firestore.collection("users");
  const { id, first_name, last_name, username } = ctx.from;
  const uid = id.toString();
  const group = ctx.chat.id;
  const user = { uid, first_name, last_name, username, group, type: "member" };

  await db.doc(uid).set(user);
}
/**
 *
 * @param {Context} ctx
 * @returns
 */
export async function leave(ctx) {
  const firestore = firebase.firestore();
  const db = firestore.collection("users");
  const uid = ctx.from.id.toString();
  console.log({ uid });
  //to do remove all assigned task when user leaves the group
}
/**
 *
 * @param {Context} ctx
 * @returns
 */
export async function removed(ctx) {
  console.log(ctx.message.from);
}
