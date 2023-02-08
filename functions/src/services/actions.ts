import { CommandContext, Context } from "grammy";

export async function join(ctx: Context) {
  const from = ctx.message?.from;
  console.log(from);
}
/**
 *
 * @param {Context} ctx
 * @returns
 */
export async function leave(ctx: Context) {
  const from = ctx.message?.from;
  console.log(from);

  //to do remove all assigned task when user leaves the group
}

export async function removed(ctx: CommandContext<Context>) {}
