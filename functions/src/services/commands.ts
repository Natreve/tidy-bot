import { Filter } from "grammy";
import { AuthContext } from "./auth.js";

export async function start(ctx: Filter<AuthContext, "message">) {
  const group = ctx.match;
  //if user is apart of a group and used the group link but account was not created, create a account and walk then through
  if (group && !ctx.user) {
    return;
  }
  //if the user account is available business as usual
  if (ctx.user) {
    return;
  }
  //user is neither apart of a group or has an account created.

  return await ctx.reply(
    `It looks like you're not apart of a group using *This Bot*\\. In order to get started you need to either create a group and add *This Bot* or join a group that's already using *This Bot*\\.`,
    { parse_mode: "MarkdownV2" }
  );
}
