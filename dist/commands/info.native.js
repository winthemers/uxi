import * as app from "../app.js";
import tims from "tims";
const conf = app.fetchPackageJson();
var info_native_default = new app.Command({
  name: "info",
  description: "Get information about bot",
  flags: [
    {
      name: "dependencies",
      description: "Show dependencies",
      aliases: ["deps", "all"],
      flag: "d"
    }
  ],
  async run(message) {
    const embed = new app.MessageEmbed().setColor("BLURPLE").setAuthor(`Information about ${message.client.user.tag}`, message.client.user?.displayAvatarURL({ dynamic: true })).setDescription(conf.description).setTimestamp().addField(conf.name, app.code.stringify({
      lang: "yml",
      content: [
        `author: ${message.client.users.cache.get(process.env.BOT_OWNER)?.tag}`,
        `uptime: ${tims.duration(app.uptime(), {
          format: "second",
          maxPartCount: 2
        })}`,
        `memory: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}mb`,
        `ping: ${message.client.ws.ping}ms`,
        `database: ${app.db.client.constructor.name}`
      ].join("\n")
    }), true).addField("Cache", app.code.stringify({
      lang: "yml",
      content: [
        `guilds: ${message.client.guilds.cache.size}`,
        `users: ${message.client.users.cache.size}`,
        `channels: ${message.client.channels.cache.size}`,
        `roles: ${message.client.guilds.cache.reduce((acc, guild) => {
          return acc + guild.roles.cache.size;
        }, 0)}`,
        `messages: ${message.client.channels.cache.reduce((acc, channel) => {
          return acc + (channel.isText() ? channel.messages.cache.size : 0);
        }, 0)}`
      ].join("\n")
    }), true);
    return message.channel.send({
      embeds: [
        !message.args.dependencies ? embed : embed.addField("\u200B", "\u200B", false).addField("Dependencies", app.code.stringify({
          lang: "yml",
          content: Object.entries(conf.dependencies).map(([name, version]) => {
            return `${name.replace(/@/g, "")}: ${version}`;
          }).join("\n")
        }), true).addField("Dev dependencies", app.code.stringify({
          lang: "yml",
          content: Object.entries(conf.devDependencies).map(([name, version]) => {
            return `${name.replace(/@/g, "")}: ${version}`;
          }).join("\n")
        }), true)
      ]
    });
  }
});
export {
  info_native_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2NvbW1hbmRzL2luZm8ubmF0aXZlLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgKiBhcyBhcHAgZnJvbSBcIi4uL2FwcC5qc1wiXHJcblxyXG5pbXBvcnQgdGltcyBmcm9tIFwidGltc1wiXHJcblxyXG5jb25zdCBjb25mID0gYXBwLmZldGNoUGFja2FnZUpzb24oKVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgbmV3IGFwcC5Db21tYW5kKHtcclxuICBuYW1lOiBcImluZm9cIixcclxuICBkZXNjcmlwdGlvbjogXCJHZXQgaW5mb3JtYXRpb24gYWJvdXQgYm90XCIsXHJcbiAgZmxhZ3M6IFtcclxuICAgIHtcclxuICAgICAgbmFtZTogXCJkZXBlbmRlbmNpZXNcIixcclxuICAgICAgZGVzY3JpcHRpb246IFwiU2hvdyBkZXBlbmRlbmNpZXNcIixcclxuICAgICAgYWxpYXNlczogW1wiZGVwc1wiLCBcImFsbFwiXSxcclxuICAgICAgZmxhZzogXCJkXCIsXHJcbiAgICB9LFxyXG4gIF0sXHJcbiAgYXN5bmMgcnVuKG1lc3NhZ2UpIHtcclxuICAgIGNvbnN0IGVtYmVkID0gbmV3IGFwcC5NZXNzYWdlRW1iZWQoKVxyXG4gICAgICAuc2V0Q29sb3IoXCJCTFVSUExFXCIpXHJcbiAgICAgIC5zZXRBdXRob3IoXHJcbiAgICAgICAgYEluZm9ybWF0aW9uIGFib3V0ICR7bWVzc2FnZS5jbGllbnQudXNlci50YWd9YCxcclxuICAgICAgICBtZXNzYWdlLmNsaWVudC51c2VyPy5kaXNwbGF5QXZhdGFyVVJMKHsgZHluYW1pYzogdHJ1ZSB9KVxyXG4gICAgICApXHJcbiAgICAgIC5zZXREZXNjcmlwdGlvbihjb25mLmRlc2NyaXB0aW9uKVxyXG4gICAgICAuc2V0VGltZXN0YW1wKClcclxuICAgICAgLmFkZEZpZWxkKFxyXG4gICAgICAgIGNvbmYubmFtZSxcclxuICAgICAgICBhcHAuY29kZS5zdHJpbmdpZnkoe1xyXG4gICAgICAgICAgbGFuZzogXCJ5bWxcIixcclxuICAgICAgICAgIGNvbnRlbnQ6IFtcclxuICAgICAgICAgICAgYGF1dGhvcjogJHtcclxuICAgICAgICAgICAgICBtZXNzYWdlLmNsaWVudC51c2Vycy5jYWNoZS5nZXQocHJvY2Vzcy5lbnYuQk9UX09XTkVSIGFzIHN0cmluZylcclxuICAgICAgICAgICAgICAgID8udGFnXHJcbiAgICAgICAgICAgIH1gLFxyXG4gICAgICAgICAgICBgdXB0aW1lOiAke3RpbXMuZHVyYXRpb24oYXBwLnVwdGltZSgpLCB7XHJcbiAgICAgICAgICAgICAgZm9ybWF0OiBcInNlY29uZFwiLFxyXG4gICAgICAgICAgICAgIG1heFBhcnRDb3VudDogMixcclxuICAgICAgICAgICAgfSl9YCxcclxuICAgICAgICAgICAgYG1lbW9yeTogJHsocHJvY2Vzcy5tZW1vcnlVc2FnZSgpLmhlYXBVc2VkIC8gMTAyNCAvIDEwMjQpLnRvRml4ZWQoXHJcbiAgICAgICAgICAgICAgMlxyXG4gICAgICAgICAgICApfW1iYCxcclxuICAgICAgICAgICAgYHBpbmc6ICR7bWVzc2FnZS5jbGllbnQud3MucGluZ31tc2AsXHJcbiAgICAgICAgICAgIGBkYXRhYmFzZTogJHthcHAuZGIuY2xpZW50LmNvbnN0cnVjdG9yLm5hbWV9YCxcclxuICAgICAgICAgIF0uam9pbihcIlxcblwiKSxcclxuICAgICAgICB9KSxcclxuICAgICAgICB0cnVlXHJcbiAgICAgIClcclxuICAgICAgLmFkZEZpZWxkKFxyXG4gICAgICAgIFwiQ2FjaGVcIixcclxuICAgICAgICBhcHAuY29kZS5zdHJpbmdpZnkoe1xyXG4gICAgICAgICAgbGFuZzogXCJ5bWxcIixcclxuICAgICAgICAgIGNvbnRlbnQ6IFtcclxuICAgICAgICAgICAgYGd1aWxkczogJHttZXNzYWdlLmNsaWVudC5ndWlsZHMuY2FjaGUuc2l6ZX1gLFxyXG4gICAgICAgICAgICBgdXNlcnM6ICR7bWVzc2FnZS5jbGllbnQudXNlcnMuY2FjaGUuc2l6ZX1gLFxyXG4gICAgICAgICAgICBgY2hhbm5lbHM6ICR7bWVzc2FnZS5jbGllbnQuY2hhbm5lbHMuY2FjaGUuc2l6ZX1gLFxyXG4gICAgICAgICAgICBgcm9sZXM6ICR7bWVzc2FnZS5jbGllbnQuZ3VpbGRzLmNhY2hlLnJlZHVjZSgoYWNjLCBndWlsZCkgPT4ge1xyXG4gICAgICAgICAgICAgIHJldHVybiBhY2MgKyBndWlsZC5yb2xlcy5jYWNoZS5zaXplXHJcbiAgICAgICAgICAgIH0sIDApfWAsXHJcbiAgICAgICAgICAgIGBtZXNzYWdlczogJHttZXNzYWdlLmNsaWVudC5jaGFubmVscy5jYWNoZS5yZWR1Y2UoXHJcbiAgICAgICAgICAgICAgKGFjYywgY2hhbm5lbCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgICAgICAgYWNjICsgKGNoYW5uZWwuaXNUZXh0KCkgPyBjaGFubmVsLm1lc3NhZ2VzLmNhY2hlLnNpemUgOiAwKVxyXG4gICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgMFxyXG4gICAgICAgICAgICApfWAsXHJcbiAgICAgICAgICBdLmpvaW4oXCJcXG5cIiksXHJcbiAgICAgICAgfSksXHJcbiAgICAgICAgdHJ1ZVxyXG4gICAgICApXHJcbiAgICByZXR1cm4gbWVzc2FnZS5jaGFubmVsLnNlbmQoe1xyXG4gICAgICBlbWJlZHM6IFtcclxuICAgICAgICAhbWVzc2FnZS5hcmdzLmRlcGVuZGVuY2llc1xyXG4gICAgICAgICAgPyBlbWJlZFxyXG4gICAgICAgICAgOiBlbWJlZFxyXG4gICAgICAgICAgICAgIC5hZGRGaWVsZChcIlxcdTIwMEJcIiwgXCJcXHUyMDBCXCIsIGZhbHNlKVxyXG4gICAgICAgICAgICAgIC5hZGRGaWVsZChcclxuICAgICAgICAgICAgICAgIFwiRGVwZW5kZW5jaWVzXCIsXHJcbiAgICAgICAgICAgICAgICBhcHAuY29kZS5zdHJpbmdpZnkoe1xyXG4gICAgICAgICAgICAgICAgICBsYW5nOiBcInltbFwiLFxyXG4gICAgICAgICAgICAgICAgICBjb250ZW50OiBPYmplY3QuZW50cmllcyhjb25mLmRlcGVuZGVuY2llcylcclxuICAgICAgICAgICAgICAgICAgICAubWFwKChbbmFtZSwgdmVyc2lvbl0pID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBgJHtuYW1lLnJlcGxhY2UoL0AvZywgXCJcIil9OiAke3ZlcnNpb259YFxyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgLmpvaW4oXCJcXG5cIiksXHJcbiAgICAgICAgICAgICAgICB9KSxcclxuICAgICAgICAgICAgICAgIHRydWVcclxuICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgLmFkZEZpZWxkKFxyXG4gICAgICAgICAgICAgICAgXCJEZXYgZGVwZW5kZW5jaWVzXCIsXHJcbiAgICAgICAgICAgICAgICBhcHAuY29kZS5zdHJpbmdpZnkoe1xyXG4gICAgICAgICAgICAgICAgICBsYW5nOiBcInltbFwiLFxyXG4gICAgICAgICAgICAgICAgICBjb250ZW50OiBPYmplY3QuZW50cmllcyhjb25mLmRldkRlcGVuZGVuY2llcylcclxuICAgICAgICAgICAgICAgICAgICAubWFwKChbbmFtZSwgdmVyc2lvbl0pID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBgJHtuYW1lLnJlcGxhY2UoL0AvZywgXCJcIil9OiAke3ZlcnNpb259YFxyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgLmpvaW4oXCJcXG5cIiksXHJcbiAgICAgICAgICAgICAgICB9KSxcclxuICAgICAgICAgICAgICAgIHRydWVcclxuICAgICAgICAgICAgICApLFxyXG4gICAgICBdLFxyXG4gICAgfSlcclxuICB9LFxyXG59KVxyXG4iXSwKICAibWFwcGluZ3MiOiAiQUFBQTtBQUVBO0FBRUEsTUFBTSxPQUFPLElBQUk7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
