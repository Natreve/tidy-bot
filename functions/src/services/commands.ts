import { Filter } from "grammy";
import { AuthContext } from "./auth.js";
// const { WEBAPP_URL } = process.env;

export async function start(ctx: Filter<AuthContext, "message">) {
  ctx.reply(
    `Thanks for choosing *Tidy* your go to bot for managing your staff schedules\\.`,
    { parse_mode: "MarkdownV2" }
  );
  if (!ctx.user) {
    ctx.reply(
      `It looks like you're not apart of a group using *Tidy*\\. In order to get started you need to either create a group and add *Tidy* or join a group that's already using *Tidy*\\.`,
      { parse_mode: "MarkdownV2" }
    );
  }
}
