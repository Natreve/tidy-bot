import { Filter } from "grammy";
import { AuthContext } from "./auth.js";
import * as Group from "./group.js";
import * as User from "./user.js";
//https://grammy.dev/guide/filter-queries.html#chat-member-updates

export async function onGroup(ctx: Filter<AuthContext, "message">) {
  const { BOT_URL } = process.env;
  if (!ctx.hasChatType(["supergroup", "group"])) return;

  switch (ctx.myChatMember?.new_chat_member.status) {
    case "administrator":
      ctx.reply(
        `Nice\\!, Now that I'm apart of your group, current members can follow the link *🧼[Tidy](${BOT_URL}?start=${ctx.chat.id})* to gain access to my functions\\. New members will automatically have access granded as well\\.`,
        { parse_mode: "MarkdownV2" }
      );

      const admins = await ctx.getChatAdministrators();
      const users: User.UserType[] = [];
      admins.forEach((admin) => {
        if (admin.user.is_bot) return;
        const user = admin.user;
        users.push({
          uid: user.id.toString(),
          first_name: user.first_name,
          last_name: user.last_name,
          username: user.username,
          type: admin.status,
          group: ctx.chat.id.toString(),
        });
      });
      User.add(users);
      Group.add({
        id: ctx.chat.id.toString(),
        title: ctx.myChatMember.chat.title,
        type: ctx.myChatMember.chat.type,
      });

      break;
    case "kicked":
      break;

    default:
      break;
  }
}
