import * as app from "../app.js";
import cp from "child_process";
var terminal_native_default = new app.Command({
  name: "terminal",
  description: "Run shell command from Discord",
  aliases: ["term", "cmd", "command", "exec", ">", "process", "shell"],
  channelType: "all",
  botOwnerOnly: true,
  coolDown: 5e3,
  rest: {
    all: true,
    name: "cmd",
    description: "The cmd to run",
    required: true
  },
  async run(message) {
    message.triggerCoolDown();
    const toEdit = await message.channel.send({
      embeds: [new app.MessageEmbed().setTitle("The process is running...")]
    });
    cp.exec(message.rest, { cwd: process.cwd() }, (err, stdout, stderr) => {
      const output = err ? err.stack ?? err.message : stderr.trim() || stdout || null;
      const embed = new app.MessageEmbed().setTitle(err ? "\\\u274C An error has occurred." : "\\\u2714 Successfully executed.");
      if (output)
        embed.setDescription(app.code.stringify({
          content: output.split("").reverse().slice(0, 2e3).reverse().join("")
        }));
      toEdit.edit({ embeds: [embed] }).catch(() => {
        message.channel.send({ embeds: [embed] }).catch();
      });
    });
  }
});
export {
  terminal_native_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2NvbW1hbmRzL3Rlcm1pbmFsLm5hdGl2ZS50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0ICogYXMgYXBwIGZyb20gXCIuLi9hcHAuanNcIlxyXG5pbXBvcnQgY3AgZnJvbSBcImNoaWxkX3Byb2Nlc3NcIlxyXG5cclxuZXhwb3J0IGRlZmF1bHQgbmV3IGFwcC5Db21tYW5kKHtcclxuICBuYW1lOiBcInRlcm1pbmFsXCIsXHJcbiAgZGVzY3JpcHRpb246IFwiUnVuIHNoZWxsIGNvbW1hbmQgZnJvbSBEaXNjb3JkXCIsXHJcbiAgYWxpYXNlczogW1widGVybVwiLCBcImNtZFwiLCBcImNvbW1hbmRcIiwgXCJleGVjXCIsIFwiPlwiLCBcInByb2Nlc3NcIiwgXCJzaGVsbFwiXSxcclxuICBjaGFubmVsVHlwZTogXCJhbGxcIixcclxuICBib3RPd25lck9ubHk6IHRydWUsXHJcbiAgY29vbERvd246IDUwMDAsXHJcbiAgcmVzdDoge1xyXG4gICAgYWxsOiB0cnVlLFxyXG4gICAgbmFtZTogXCJjbWRcIixcclxuICAgIGRlc2NyaXB0aW9uOiBcIlRoZSBjbWQgdG8gcnVuXCIsXHJcbiAgICByZXF1aXJlZDogdHJ1ZSxcclxuICB9LFxyXG4gIGFzeW5jIHJ1bihtZXNzYWdlKSB7XHJcbiAgICBtZXNzYWdlLnRyaWdnZXJDb29sRG93bigpXHJcblxyXG4gICAgY29uc3QgdG9FZGl0ID0gYXdhaXQgbWVzc2FnZS5jaGFubmVsLnNlbmQoe1xyXG4gICAgICBlbWJlZHM6IFtuZXcgYXBwLk1lc3NhZ2VFbWJlZCgpLnNldFRpdGxlKFwiVGhlIHByb2Nlc3MgaXMgcnVubmluZy4uLlwiKV0sXHJcbiAgICB9KVxyXG5cclxuICAgIGNwLmV4ZWMobWVzc2FnZS5yZXN0LCB7IGN3ZDogcHJvY2Vzcy5jd2QoKSB9LCAoZXJyLCBzdGRvdXQsIHN0ZGVycikgPT4ge1xyXG4gICAgICBjb25zdCBvdXRwdXQgPSBlcnJcclxuICAgICAgICA/IGVyci5zdGFjayA/PyBlcnIubWVzc2FnZVxyXG4gICAgICAgIDogc3RkZXJyLnRyaW0oKSB8fCBzdGRvdXQgfHwgbnVsbFxyXG5cclxuICAgICAgY29uc3QgZW1iZWQgPSBuZXcgYXBwLk1lc3NhZ2VFbWJlZCgpLnNldFRpdGxlKFxyXG4gICAgICAgIGVyciA/IFwiXFxcXFx1Mjc0QyBBbiBlcnJvciBoYXMgb2NjdXJyZWQuXCIgOiBcIlxcXFxcdTI3MTQgU3VjY2Vzc2Z1bGx5IGV4ZWN1dGVkLlwiXHJcbiAgICAgIClcclxuXHJcbiAgICAgIGlmIChvdXRwdXQpXHJcbiAgICAgICAgZW1iZWQuc2V0RGVzY3JpcHRpb24oXHJcbiAgICAgICAgICBhcHAuY29kZS5zdHJpbmdpZnkoe1xyXG4gICAgICAgICAgICBjb250ZW50OiBvdXRwdXRcclxuICAgICAgICAgICAgICAuc3BsaXQoXCJcIilcclxuICAgICAgICAgICAgICAucmV2ZXJzZSgpXHJcbiAgICAgICAgICAgICAgLnNsaWNlKDAsIDIwMDApXHJcbiAgICAgICAgICAgICAgLnJldmVyc2UoKVxyXG4gICAgICAgICAgICAgIC5qb2luKFwiXCIpLFxyXG4gICAgICAgICAgfSlcclxuICAgICAgICApXHJcblxyXG4gICAgICB0b0VkaXQuZWRpdCh7IGVtYmVkczogW2VtYmVkXSB9KS5jYXRjaCgoKSA9PiB7XHJcbiAgICAgICAgbWVzc2FnZS5jaGFubmVsLnNlbmQoeyBlbWJlZHM6IFtlbWJlZF0gfSkuY2F0Y2goKVxyXG4gICAgICB9KVxyXG4gICAgfSlcclxuICB9LFxyXG59KVxyXG4iXSwKICAibWFwcGluZ3MiOiAiQUFBQTtBQUNBO0FBRUEsSUFBTywwQkFBUSxJQUFJLElBQUksUUFBUTtBQUFBLEVBQzdCLE1BQU07QUFBQSxFQUNOLGFBQWE7QUFBQSxFQUNiLFNBQVMsQ0FBQyxRQUFRLE9BQU8sV0FBVyxRQUFRLEtBQUssV0FBVztBQUFBLEVBQzVELGFBQWE7QUFBQSxFQUNiLGNBQWM7QUFBQSxFQUNkLFVBQVU7QUFBQSxFQUNWLE1BQU07QUFBQSxJQUNKLEtBQUs7QUFBQSxJQUNMLE1BQU07QUFBQSxJQUNOLGFBQWE7QUFBQSxJQUNiLFVBQVU7QUFBQTtBQUFBLFFBRU4sSUFBSSxTQUFTO0FBQ2pCLFlBQVE7QUFFUixVQUFNLFNBQVMsTUFBTSxRQUFRLFFBQVEsS0FBSztBQUFBLE1BQ3hDLFFBQVEsQ0FBQyxJQUFJLElBQUksZUFBZSxTQUFTO0FBQUE7QUFHM0MsT0FBRyxLQUFLLFFBQVEsTUFBTSxFQUFFLEtBQUssUUFBUSxTQUFTLENBQUMsS0FBSyxRQUFRLFdBQVc7QUFDckUsWUFBTSxTQUFTLE1BQ1gsSUFBSSxTQUFTLElBQUksVUFDakIsT0FBTyxVQUFVLFVBQVU7QUFFL0IsWUFBTSxRQUFRLElBQUksSUFBSSxlQUFlLFNBQ25DLE1BQU0sb0NBQStCO0FBR3ZDLFVBQUk7QUFDRixjQUFNLGVBQ0osSUFBSSxLQUFLLFVBQVU7QUFBQSxVQUNqQixTQUFTLE9BQ04sTUFBTSxJQUNOLFVBQ0EsTUFBTSxHQUFHLEtBQ1QsVUFDQSxLQUFLO0FBQUE7QUFJZCxhQUFPLEtBQUssRUFBRSxRQUFRLENBQUMsVUFBVSxNQUFNLE1BQU07QUFDM0MsZ0JBQVEsUUFBUSxLQUFLLEVBQUUsUUFBUSxDQUFDLFVBQVU7QUFBQTtBQUFBO0FBQUE7QUFBQTsiLAogICJuYW1lcyI6IFtdCn0K
