import * as dotenv from "dotenv";
import { Bot, webhookCallback } from "grammy";
import * as commands from "./commands.js";
import * as actions from "./actions.js";
dotenv.config();
const bot = new Bot(process.env.BOT_TOKEN);
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

await bot.api.setMyCommands([{ command: "start", description: "Start Tidy" }]);

bot.command("start", commands.start);
// pm.command("claim", commands.claim);
// pm.command("claimed", commands.claimed);
// pm.command("jobs", commands.unclaimed);
// pm.command("unclaim", commands.unclaim);

bot.on(":new_chat_members", actions.join);
bot.on(":left_chat_member", actions.leave);

export { bot, webhookCallback };
