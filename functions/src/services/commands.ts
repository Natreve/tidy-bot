import { Filter, InlineKeyboard } from "grammy";
import { AuthContext } from "./auth.js";

export async function start(ctx: Filter<AuthContext, "message">) {
  const { WEBAPP_URL } = process.env;
  const group = ctx.match;
  //if the user account is available business as usual, different views admin/members
  if (ctx.user) {
    const keyboard = new InlineKeyboard();
    keyboard.webApp("Let's start 🧼 Tidying!", WEBAPP_URL);
    await ctx.reply(
      `Welcome to *Tidy\\!* the bot that helps you manage your cleaning\\. To get started you can use the menu button at the bottom left to quickly get started or you can launch the webapp using the link below\\.`,
      { parse_mode: "MarkdownV2", reply_markup: keyboard }
    );
    return;
  }
  //if user is apart of a group and used the group link but account was not created, create a account and walk then through
  //there is no real way to know if the person is actually apart of the group because once they have access to the link they are still created
  if (group && !ctx.user) {
    return;
  }

  //user is neither apart of a group or has an account created.

  return await ctx.reply(
    `It looks like you're not apart of a group using *Tidy*\\. In order to get started you need to either create a group and add *Tidy* or join a group that's already using *Tidy*\\.`,
    { parse_mode: "MarkdownV2" }
  );
}
