import { Filter } from "grammy";
import { AuthContext } from "./auth.js";
// import * as group from "./group.js";
// import * as user from "./user.js";
//https://grammy.dev/guide/filter-queries.html#chat-member-updates
export async function join(ctx: Filter<AuthContext, "message">) {
  const from = ctx.message.from;
  console.log(from);
}

export async function onGroup(ctx: Filter<AuthContext, "message">) {
  const { BOT_URL } = process.env;
  if (!["supergroup", "group"].includes(ctx.chat.type)) return;
  
  switch (ctx.myChatMember?.new_chat_member.status) {
    case "administrator":
      ctx.reply(
        `Nice\\!, Now that I'm apart of your group, current members can follow the link *🧼[Tidy](${BOT_URL}?start=${ctx.chat.id})* to gain access to my functions\\. New members will automatically have access granded as well\\.`,
        { parse_mode: "MarkdownV2" }
      );

      // group.add({ id: ctx.chat.id.toString(),title:ctx.myChatMember.chat.title });

      break;
    case "kicked":
      break;

    default:
      break;
  }
}

// let onKicked = {
//   chat: {
//     id: -1001557447942,
//     title: "STR",
//     is_forum: true,
//     type: "supergroup",
//   },
//   from: {
//     id: 1765549693,
//     is_bot: false,
//     first_name: "Andrew",
//     last_name: "Gray",
//     username: "natreve",
//     language_code: "en",
//     is_premium: true,
//   },
//   date: 1676415175,
//   old_chat_member: {
//     user: {
//       id: 6012062485,
//       is_bot: true,
//       first_name: "Tidy",
//       username: "TidyupBot",
//     },
//     status: "administrator",
//     can_be_edited: false,
//     can_manage_chat: true,
//     can_change_info: true,
//     can_delete_messages: true,
//     can_invite_users: true,
//     can_restrict_members: true,
//     can_pin_messages: true,
//     can_manage_topics: true,
//     can_promote_members: false,
//     can_manage_video_chats: true,
//     is_anonymous: false,
//     can_manage_voice_chats: true,
//   },
//   new_chat_member: {
//     user: {
//       id: 6012062485,
//       is_bot: true,
//       first_name: "Tidy",
//       username: "TidyupBot",
//     },
//     status: "kicked",
//     until_date: 0,
//   },
// };
