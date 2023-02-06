import { logger } from "firebase-functions";

export async function setup(conversation, ctx) {
  await ctx.reply("Text me your listing calendars. Separated by commas!");
  ctx = await conversation.waitFor("message:text");
  const calendars = ctx.message.text.split(",");
  await ctx.reply("Got it!, now provide the names for the calendars");
  ctx = await conversation.waitFor("message:text");
  const names = ctx.message.text.split(",");
  console.log(calendars);
  console.log(names);
  ctx.reply(
    `${calendars.length} calendars: ${names.join(
      ", "
    )} have been saved to your account`
  );

  return;
}
