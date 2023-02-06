import { CommandContext, Context } from "grammy";
import { DateTime } from "luxon";
import * as User from "./user.js";
import * as Job from "./job.js";
// const { WEBAPP_URL } = process.env;
async function verify(uid: string | undefined) {
  if (!uid) return null;
  const user = await User.get(uid);
  if (!user || !user?.group) return null;
  else return user;
}
export async function start(ctx: CommandContext<Context>) {
  ctx.replyWithChatAction("typing");

  const uid = ctx.from?.id.toString();
  const user = await verify(uid);

  if (user) {
    return ctx.reply(
      `🤔 Looks like you don't belong to a *Group* using *Tidy*\\. You will need to join, create or get invited to one in order to use *Tidy*\\.`,
      {
        parse_mode: "MarkdownV2",
      }
    );
  }
  return ctx.reply(
    `🎉 Welcome to *Tidy*\\. To get started you can use the menu button or do */help* to get a list of commands\\. Happy *Tidying*\\!`,
    { parse_mode: "MarkdownV2" }
  );

  // if (claims.length) {
  //   const keyboard = new InlineKeyboard();
  //   claims.forEach((claim) => {
  //     const { displayName } = claim;
  //     const u = new URLSearchParams(claim).toString();

  //     keyboard.webApp(`${displayName}`, `${WEBAPP_URL}/?${u}`).row();
  //   });
  //   return ctx.reply(`*Let's get started 🧼*\n\nChoose a Job to checkin\\!`, {
  //     parse_mode: "MarkdownV2",
  //     reply_markup: keyboard,
  //   });
  // }
}

export async function claim(ctx: CommandContext<Context>) {
  ctx.replyWithChatAction("typing");

  const uid = ctx.from?.id.toString();
  const id = ctx.match;
  try {
    const user = await verify(uid);
    if (!user) return;
    if (!id)
      return ctx.reply(`*❌ JOB ID REQUIRED\\!*`, { parse_mode: "MarkdownV2" });

    const job = await Job.claim(user.uid, id);
    if (!job) {
      return ctx.reply(`🫠 You are unable to claim Job *${id}*\\.`, {
        parse_mode: "MarkdownV2",
      });
    }
    return ctx.reply(`✅ You have claimed *${id}*\\.`, {
      parse_mode: "MarkdownV2",
    });
  } catch (error) {
    ctx.reply(`😔 *${id}* was unable to be claimed due to an error\\.`, {
      parse_mode: "MarkdownV2",
    });
    throw new Error("Error claiming job", { cause: error });
  }
}

export async function claimed(ctx: CommandContext<Context>) {
  ctx.replyWithChatAction("typing");
  const uid = ctx.from?.id.toString();

  try {
    const user = await verify(uid);
    if (!user) return;
    const jobs = await Job.claimed(user.uid);
    if (!jobs) {
      return ctx.reply(`🤔 You have *no* claimed jobs`, {
        parse_mode: "MarkdownV2",
      });
    }
    let message = `🗒️ *Your claimed Jobs*\\.\n\n`;
    jobs.forEach((job) => {
      const date = DateTime.fromJSDate(job.date.toDate()).toFormat("DDD");
      message += `*\`/unclaim ${job.id}\`*\n*${job.name}* \\- _${date}_\n\n`;
    });
    return ctx.reply(message, {
      parse_mode: "MarkdownV2",
    });
  } catch (error) {
    ctx.reply(`😔 Unable to get *claimed* jobs due to an error\\.`, {
      parse_mode: "MarkdownV2",
    });
    throw new Error("Error getting claimed jobs", { cause: error });
  }
}

export async function unclaimed(ctx: CommandContext<Context>) {
  ctx.replyWithChatAction("typing");

  const uid = ctx.from?.id.toString();
  try {
    const user = await verify(uid);
    if (!user) return;
    let message = `🗒️ *Unlclaimed Jobs*\nYou can claim a job by typing or copying the first line of any jobs listed\\.\n\n`;
    const jobs = await Job.unclaimed();
    if (!jobs) {
      return ctx.reply(`🫠 No Jobs currently available\\.`, {
        parse_mode: "MarkdownV2",
      });
    }
    jobs.forEach((job) => {
      const date = DateTime.fromJSDate(job.date.toDate()).toFormat("DDD");
      message += `*\`/claim ${job.id}\`*\n*${job.name}* \\- _${date}_\n\n`;
    });

    return ctx.reply(message, { parse_mode: "MarkdownV2" });
  } catch (error) {
    ctx.reply(`😔 Unable to get *unclaimed* jobs due to an error\\.`, {
      parse_mode: "MarkdownV2",
    });
    throw new Error("Error getting unclaimed jobs", { cause: error });
  }
}

export async function unclaim(ctx: CommandContext<Context>) {
  ctx.replyWithChatAction("typing");
  const uid = ctx.from?.id.toString();
  const id = ctx.match;

  ctx.replyWithChatAction("typing");

  if (!id) {
    return ctx.reply(`*❌ JOB ID REQUIRED\\!*`, { parse_mode: "MarkdownV2" });
  }

  try {
    const user = await verify(uid);
    if (!user) return;

    const jobs = await Job.unclaim(user.uid, id);
    if (!jobs) {
      return ctx.reply(`🫠 Job *${id}* can not be unclaimed\\.`, {
        parse_mode: "MarkdownV2",
      });
    }

    return ctx.reply(`✅ You have unclaimed *${id}*`, {
      parse_mode: "MarkdownV2",
    });
  } catch (error) {
    ctx.reply(`😔 Unable to *unclaimed* jobs due to an error\\.`, {
      parse_mode: "MarkdownV2",
    });
    throw new Error("Error getting unclaimed jobs", { cause: error });
  }
}
