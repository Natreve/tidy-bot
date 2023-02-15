import { Bot, webhookCallback, Filter } from "grammy";
import dotenv from "dotenv";
import auth, { AuthContext } from "./auth.js";

import * as commands from "./commands.js";
import * as actions from "./actions.js";
dotenv.config();

const bot = new Bot<Filter<AuthContext, "message">>(process.env.BOT_TOKEN);
bot.use(auth);

bot.command("start", commands.start);

bot.on("my_chat_member", actions.onGroup);
export { bot, webhookCallback };
// const pm = bot.filter((ctx) => ctx.chat?.type === "private");
//https://stackoverflow.com/questions/32571919/how-to-hide-telegram-bot-commands-when-it-is-part-of-a-group
// bot.api.setMyCommands(
//   [
//     { command: "start", description: "Start Tidy" },
//     { command: "claimed", description: "My jobs" },
//     { command: "jobs", description: "Available jobs" },
//     { command: "claim", description: "Claim jobs" },
//     { command: "unclaim", description: "Unclaim jobs" },
//   ],
//   { scope: { type: "all_private_chats" } }
// );
// bot.api.setMyCommands(
//   [{ command: "notify", description: "Add notification" }],
//   { scope: { type: "all_chat_administrators" } }
// );

// await bot.api.setMyCommands(
//   [
//     { command: "start", description: "Start Tidy" },
//     { command: "help", description: "help" },
//   ],
//   { scope: { type: "default" } }
// );

// bot.on("message", async (ctx) => {
//   console.log("message received");
// });

// pm.command("claim", commands.claim);
// pm.command("claimed", commands.claimed);
// pm.command("jobs", commands.unclaimed);
// pm.command("unclaim", commands.unclaim);

// bot.on(":new_chat_members", actions.join);
// bot.on(":left_chat_member", actions.leave);
// bot.on("my_chat_member", actions.onGroup);
