import { Context, NextFunction } from "grammy";
import * as User from "./user.js";
export type AuthContext = Context & {
  user: User.UserType | null;
};
export default async function auth(ctx: AuthContext, next: NextFunction) {
  if (!ctx.from) return;
  const uid = ctx.from.id.toString();
  const user = await User.get(uid);
  ctx.user = user;
  await next();
}
// let onAdded = {
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
//   date: 1676415125,
//   old_chat_member: {
//     user: {
//       id: 6012062485,
//       is_bot: true,
//       first_name: "Tidy",
//       username: "TidyupBot",
//     },
//     status: "kicked",
//     until_date: 0,
//   },
//   new_chat_member: {
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
// };
