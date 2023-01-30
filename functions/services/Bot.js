import { Bot, session } from "grammy";
import { freeStorage } from "@grammyjs/storage-free";
import { logger } from "firebase-functions";
import { InlineKeyboard } from "grammy";
import * as commands from "./Commands.js";
import * as actions from "./Actions.js";

export default async () => {
  const bot = new Bot(process.env.BOT_TOKEN);
  const pm = bot.filter((ctx) => ctx.chat?.type === "private");
  //https://stackoverflow.com/questions/32571919/how-to-hide-telegram-bot-commands-when-it-is-part-of-a-group
  bot.api.setMyCommands(
    [
      { command: "start", description: "Start Tidy" },
      { command: "claimed", description: "My jobs" },
      { command: "jobs", description: "Available jobs" },
      { command: "claim", description: "Claim jobs" },
      { command: "unclaim", description: "Unclaim jobs" },
    ],
    { scope: { type: "all_private_chats" } }
  );
  bot.api.setMyCommands(
    [{ command: "notify", description: "Add notification" }],
    { scope: { type: "all_chat_administrators" } }
  );
  pm.use(
    session({
      initial: () => ({ claims: [], group: null }),
      storage: freeStorage(bot.token),
    })
  );

  //Only perform this actions in private chat
  pm.command("start", commands.start);
  pm.command("claim", commands.claim);
  pm.command("claimed", commands.claimed);
  pm.command("jobs", commands.unclaimed);
  pm.command("unclaim", commands.unclaim);
  pm.command("settings", commands.settings);

  bot.on(":new_chat_members", actions.join);
  bot.on(":left_chat_member", actions.leave);

  bot.catch((err) => {
    err.ctx.reply("Something went wrong... please contact support");
    logger.error(err.message);
  });
  await bot.start({ allowed_updates: true });

  return bot;
};
