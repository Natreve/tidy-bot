import firebase from "firebase-admin";
import { InlineKeyboard } from "grammy";
import { logger } from "firebase-functions";
import { DateTime } from "luxon";
import { Context } from "grammy";

/**
 *
 * @param {Context} ctx
 * @returns
 */
export async function start(ctx) {
  ctx.replyWithChatAction("typing");
  const { WEBAPP_URL } = process.env;
  const firestore = firebase.firestore();
  const db = firestore.collection("users");
  const uid = ctx.from.id.toString();
  const claims = ctx.session.claims;
  const group = ctx.session.group;
  const snapshot = await db.doc(uid).get();

  if (!snapshot.exists) {
    return ctx.reply(
      `🤔 Looks like you don't belong to a *Group* using *Tidy*\\. You will need to join or get invited to one in order to use *Tidy*\\.`,
      { parse_mode: "MarkdownV2" }
    );
  }
  const user = snapshot.data();
  if (!group) ctx.session.group = user.group;
  if (claims.length) {
    const keyboard = new InlineKeyboard();
    claims.forEach((claim) => {
      const { displayName } = claim;
      const u = new URLSearchParams(claim).toString();

      keyboard.webApp(`${displayName}`, `${WEBAPP_URL}/?${u}`).row();
    });
    return ctx.reply(`*Let's get started 🧼*\n\nChoose a Job to checkin\\!`, {
      parse_mode: "MarkdownV2",
      reply_markup: keyboard,
    });
  }
  ctx.reply(
    `You will need to claim a job before you are able to start *Tidy*\\.`,
    {
      parse_mode: "MarkdownV2",
    }
  );
}
/**
 *
 * @param {Context} ctx
 * @returns
 */
export async function claim(ctx) {
  const firestore = firebase.firestore();
  const db = firestore.collection("tasks");
  const uid = ctx.from.id.toString();
  const id = ctx.match;
  const mode = { parse_mode: "MarkdownV2" };
  ctx.replyWithChatAction("typing");

  if (!id) return ctx.reply(`*❌ JOB ID REQUIRED\\!*`, mode);

  if (ctx.session.claims.length === 2) {
    return ctx.reply(`❌ You can't claim more than *2* jobs`, mode);
  }

  try {
    const snapshot = await db.doc(id).get();
    const { exists } = snapshot;
    if (!exists) return ctx.reply(`🤔 Job *${id}* does not exists`, mode);
    const task = snapshot.data();
    const date = DateTime.fromJSDate(task.date.toDate()).toFormat("DD");

    if (task.options.claimed) {
      return ctx.reply(`🫠 Job *${id}* already claimed\\.`, mode);
    }

    await db.doc(id).update({ "options.claimed": uid });
    ctx.session.claims.push({
      id: task.id,
      date: task.date.toDate(),
      displayName: `${task.options.name} - ${date}`,
    });
    ctx.reply(`✅ You have claimed *${id}*`, mode);
  } catch (error) {
    logger.error(error);
    ctx.reply(`😔 *${id}* was unable to be claimed`, mode);
  }
}
/**
 *
 * @param {Context} ctx
 * @returns
 */
export async function claimed(ctx) {
  const firestore = firebase.firestore();
  const db = firestore.collection("tasks");
  const uid = ctx.from.id.toString();
  const mode = { parse_mode: "MarkdownV2" };
  ctx.replyWithChatAction("typing");

  try {
    const snapshots = await db.where("options.claimed", "==", uid).get();
    if (snapshots.empty)
      return ctx.reply(`🤔 You have *no* claimed jobs`, mode);
    let message = `🗒️ *Your claimed Jobs*\\.\n\n`;
    snapshots.forEach((snapshot) => {
      let task = snapshot.data();

      const date = DateTime.fromJSDate(task.date.toDate()).toFormat("DD");
      message += `*\`/unclaim ${task.id}\`*\n*${task.options.name}* \\- _${date}_\n\n`;
    });
    ctx.reply(message, mode);
  } catch (error) {
    logger.error(error);
    ctx.reply(`😔 *${id}* was unable to be claimed`, mode);
  }
}
/**
 *
 * @param {Context} ctx
 * @returns
 */
export async function unclaimed(ctx) {
  const firestore = firebase.firestore();
  const db = firestore.collection("tasks");
  const mode = { parse_mode: "MarkdownV2" };

  ctx.replyWithChatAction("typing");

  const snapshot = await db.where("options.claimed", "==", null).get();
  let message = `🗒️ *Unlclaimed Jobs*\nYou can claim a job by typing or copying the first line of any jobs listed\\.\n\n`;

  if (snapshot.empty) {
    return ctx.reply(`🫠 No Jobs currently available\\.`, mode);
  }
  snapshot.forEach((doc) => {
    const task = doc.data();

    const date = DateTime.fromJSDate(task.date.toDate()).toFormat("DD");
    message += `*\`/claim ${task.id}\`*\n*${task.options.name}* \\- _${date}_\n\n`;
  });

  ctx.reply(message, mode);
}
/**
 *
 * @param {Context} ctx
 * @returns
 */
export async function unclaim(ctx) {
  const firestore = firebase.firestore();
  const db = firestore.collection("tasks");
  const uid = ctx.from.id.toString();
  const id = ctx.match;
  const mode = { parse_mode: "MarkdownV2" };

  ctx.replyWithChatAction("typing");

  if (!id) return ctx.reply(`*❌ JOB ID REQUIRED\\!*`, mode);
  let claims = ctx.session.claims;

  try {
    const snapshot = await db.doc(id).get();
    const { exists } = snapshot;
    if (!exists) return ctx.reply(`🤔 Jobs *${id}* does not exists`, mode);
    const task = snapshot.data();

    if (task.options.claimed === uid) {
      await db.doc(id).update({ "options.claimed": null });
      ctx.session.claims = claims.filter((obj) => obj.id !== task.id);
      return ctx.reply(`✅ You have unclaimed *${id}*`, mode);
    }
    return ctx.reply(`🫠 Job *${id}* is not yours to unclaimed\\.`, mode);
  } catch (error) {
    logger.error(error);
    ctx.reply(`😔 *${id}* was unable to be unclaimed`, mode);
  }
}
/**
 *
 * @param {Context} ctx
 * @returns
 */
export async function settings(ctx) {}
/**
 *
 * @param {Context} ctx
 * @returns
 */
export async function notify(ctx) {
  if (!ctx.message.is_topic_message) return;
  console.log(ctx.chat.id);
}
