import * as app from "../app.js";
import { resolveEmoji } from "../namespaces/utils.js";
var clear_default = new app.Command({
  name: "clear",
  description: "The clear command",
  channelType: "guild",
  positional: [
    {
      name: "amount",
      required: true,
      description: "Amount of messages to be deleted (max 99)",
      castValue: "number"
    }
  ],
  async run(message) {
    if (Number(message.args.amount) + 1 > 100 || message.args.amount < 1) {
      const embed2 = new app.MessageEmbed();
      embed2.setTitle(`${await resolveEmoji(message.guild, "no")} Please select a number *between* 1 and 99`);
      embed2.setColor("RED");
      message.send({ embeds: [embed2] });
      return;
    }
    await message.channel.bulkDelete(Number(message.args.amount) + 1).catch(async (err) => {
      message.send(`${await resolveEmoji(message.guild, "no")} I cannot delete messages older than 14 days`);
    });
    const embed = new app.MessageEmbed().setTitle(`${await resolveEmoji(message.guild, "check")} Cleared \`${message.args.amount + 1}\` messages.`).setColor("GREEN");
    const log = await message.send({ embeds: [embed] });
    setInterval(() => {
      if (log && !log.deleted) {
        log.delete().catch(() => {
        });
      }
    }, 1e3 * 10);
  }
});
export {
  clear_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2NvbW1hbmRzL2NsZWFyLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgKiBhcyBhcHAgZnJvbSBcIi4uL2FwcC5qc1wiXHJcbmltcG9ydCB7cmVzb2x2ZUVtb2ppfSBmcm9tICcuLi9uYW1lc3BhY2VzL3V0aWxzLmpzJ1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgbmV3IGFwcC5Db21tYW5kKHtcclxuICBuYW1lOiBcImNsZWFyXCIsXHJcbiAgZGVzY3JpcHRpb246IFwiVGhlIGNsZWFyIGNvbW1hbmRcIixcclxuICBjaGFubmVsVHlwZTogXCJndWlsZFwiLFxyXG4gIHBvc2l0aW9uYWw6IFtcclxuICAgIHtcclxuICAgICAgbmFtZTogXCJhbW91bnRcIixcclxuICAgICAgcmVxdWlyZWQ6IHRydWUsXHJcbiAgICAgIGRlc2NyaXB0aW9uOiBcIkFtb3VudCBvZiBtZXNzYWdlcyB0byBiZSBkZWxldGVkIChtYXggOTkpXCIsXHJcbiAgICAgIGNhc3RWYWx1ZTogXCJudW1iZXJcIlxyXG4gICAgfVxyXG4gIF0sXHJcbiAgYXN5bmMgcnVuKG1lc3NhZ2UpIHtcclxuICAgIGlmIChOdW1iZXIobWVzc2FnZS5hcmdzLmFtb3VudCkgKyAxID4gMTAwIHx8IG1lc3NhZ2UuYXJncy5hbW91bnQgPCAxKSB7XHJcbiAgICAgIGNvbnN0IGVtYmVkID0gbmV3IGFwcC5NZXNzYWdlRW1iZWQoKVxyXG4gICAgICBlbWJlZC5zZXRUaXRsZShgJHthd2FpdCByZXNvbHZlRW1vamkobWVzc2FnZS5ndWlsZCwgXCJub1wiKX0gUGxlYXNlIHNlbGVjdCBhIG51bWJlciAqYmV0d2VlbiogMSBhbmQgOTlgKVxyXG4gICAgICBlbWJlZC5zZXRDb2xvcihcIlJFRFwiKVxyXG5cclxuICAgICAgbWVzc2FnZS5zZW5kKHtlbWJlZHM6W2VtYmVkXX0pXHJcbiAgICAgIHJldHVybiBcclxuICAgIH1cclxuXHJcbiAgICBhd2FpdCBtZXNzYWdlLmNoYW5uZWwuYnVsa0RlbGV0ZShOdW1iZXIobWVzc2FnZS5hcmdzLmFtb3VudCkgKyAxKVxyXG4gICAgICAuY2F0Y2goYXN5bmMgZXJyID0+IHtcclxuICAgICAgICBtZXNzYWdlLnNlbmQoYCR7YXdhaXQgcmVzb2x2ZUVtb2ppKG1lc3NhZ2UuZ3VpbGQsIFwibm9cIil9IEkgY2Fubm90IGRlbGV0ZSBtZXNzYWdlcyBvbGRlciB0aGFuIDE0IGRheXNgKSBcclxuICAgICAgfSlcclxuXHJcbiAgICBjb25zdCBlbWJlZCA9IG5ldyBhcHAuTWVzc2FnZUVtYmVkKClcclxuICAgIC5zZXRUaXRsZShgJHthd2FpdCByZXNvbHZlRW1vamkobWVzc2FnZS5ndWlsZCwgXCJjaGVja1wiKX0gQ2xlYXJlZCBcXGAke21lc3NhZ2UuYXJncy5hbW91bnQgKyAxfVxcYCBtZXNzYWdlcy5gKVxyXG4gICAgLnNldENvbG9yKFwiR1JFRU5cIilcclxuXHJcbiAgICBjb25zdCBsb2cgPSBhd2FpdCBtZXNzYWdlLnNlbmQoe2VtYmVkczpbZW1iZWRdfSlcclxuXHJcbiAgICBzZXRJbnRlcnZhbCggKCk9PiB7XHJcbiAgICAgIGlmIChsb2cgJiYgIWxvZy5kZWxldGVkKSB7XHJcbiAgICAgICAgbG9nLmRlbGV0ZSgpXHJcbiAgICAgICAgLmNhdGNoKCgpPT57fSlcclxuICAgICAgfVxyXG4gICAgfSwgMTAwMCAqIDEwKVxyXG4gIH1cclxufSkiXSwKICAibWFwcGluZ3MiOiAiQUFBQTtBQUNBO0FBRUEsSUFBTyxnQkFBUSxJQUFJLElBQUksUUFBUTtBQUFBLEVBQzdCLE1BQU07QUFBQSxFQUNOLGFBQWE7QUFBQSxFQUNiLGFBQWE7QUFBQSxFQUNiLFlBQVk7QUFBQSxJQUNWO0FBQUEsTUFDRSxNQUFNO0FBQUEsTUFDTixVQUFVO0FBQUEsTUFDVixhQUFhO0FBQUEsTUFDYixXQUFXO0FBQUE7QUFBQTtBQUFBLFFBR1QsSUFBSSxTQUFTO0FBQ2pCLFFBQUksT0FBTyxRQUFRLEtBQUssVUFBVSxJQUFJLE9BQU8sUUFBUSxLQUFLLFNBQVMsR0FBRztBQUNwRSxZQUFNLFNBQVEsSUFBSSxJQUFJO0FBQ3RCLGFBQU0sU0FBUyxHQUFHLE1BQU0sYUFBYSxRQUFRLE9BQU87QUFDcEQsYUFBTSxTQUFTO0FBRWYsY0FBUSxLQUFLLEVBQUMsUUFBTyxDQUFDO0FBQ3RCO0FBQUE7QUFHRixVQUFNLFFBQVEsUUFBUSxXQUFXLE9BQU8sUUFBUSxLQUFLLFVBQVUsR0FDNUQsTUFBTSxPQUFNLFFBQU87QUFDbEIsY0FBUSxLQUFLLEdBQUcsTUFBTSxhQUFhLFFBQVEsT0FBTztBQUFBO0FBR3RELFVBQU0sUUFBUSxJQUFJLElBQUksZUFDckIsU0FBUyxHQUFHLE1BQU0sYUFBYSxRQUFRLE9BQU8sc0JBQXNCLFFBQVEsS0FBSyxTQUFTLGlCQUMxRixTQUFTO0FBRVYsVUFBTSxNQUFNLE1BQU0sUUFBUSxLQUFLLEVBQUMsUUFBTyxDQUFDO0FBRXhDLGdCQUFhLE1BQUs7QUFDaEIsVUFBSSxPQUFPLENBQUMsSUFBSSxTQUFTO0FBQ3ZCLFlBQUksU0FDSCxNQUFNLE1BQUk7QUFBQTtBQUFBO0FBQUEsT0FFWixNQUFPO0FBQUE7QUFBQTsiLAogICJuYW1lcyI6IFtdCn0K
