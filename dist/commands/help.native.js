import * as app from "../app.js";
var help_native_default = new app.Command({
  name: "help",
  description: "Help menu",
  longDescription: "Display all commands of bot or detail a target command.",
  channelType: "all",
  aliases: ["h", "usage"],
  botPermissions: ["SEND_MESSAGES"],
  positional: [
    {
      name: "command",
      description: "The target command name."
    }
  ],
  async run(message) {
    if (message.args.command) {
      const cmd = app.commands.resolve(message.args.command);
      if (cmd) {
        return app.sendCommandDetails(message, cmd);
      } else {
        await message.channel.send({
          embeds: [
            new app.MessageEmbed().setColor("RED").setAuthor(`Unknown command "${message.args.command}"`, message.client.user?.displayAvatarURL())
          ]
        });
      }
    } else {
      new app.Paginator({
        pages: await app.Paginator.divider((await Promise.all(app.commands.map(async (cmd) => {
          const prepared = await app.prepareCommand(message, cmd);
          if (prepared !== true)
            return "";
          return app.commandToListItem(message, cmd);
        }))).filter((line) => line.length > 0), 10, (page) => {
          return new app.MessageEmbed().setColor("BLURPLE").setAuthor("Command list", message.client.user?.displayAvatarURL()).setDescription(page.join("\n")).setFooter(`${message.usedPrefix}help <command>`);
        }),
        filter: (reaction, user) => user.id === message.author.id,
        channel: message.channel
      });
    }
  }
});
export {
  help_native_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2NvbW1hbmRzL2hlbHAubmF0aXZlLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgKiBhcyBhcHAgZnJvbSBcIi4uL2FwcC5qc1wiXHJcblxyXG5leHBvcnQgZGVmYXVsdCBuZXcgYXBwLkNvbW1hbmQoe1xyXG4gIG5hbWU6IFwiaGVscFwiLFxyXG4gIGRlc2NyaXB0aW9uOiBcIkhlbHAgbWVudVwiLFxyXG4gIGxvbmdEZXNjcmlwdGlvbjogXCJEaXNwbGF5IGFsbCBjb21tYW5kcyBvZiBib3Qgb3IgZGV0YWlsIGEgdGFyZ2V0IGNvbW1hbmQuXCIsXHJcbiAgY2hhbm5lbFR5cGU6IFwiYWxsXCIsXHJcbiAgYWxpYXNlczogW1wiaFwiLCBcInVzYWdlXCJdLFxyXG4gIGJvdFBlcm1pc3Npb25zOiBbXCJTRU5EX01FU1NBR0VTXCJdLFxyXG4gIHBvc2l0aW9uYWw6IFtcclxuICAgIHtcclxuICAgICAgbmFtZTogXCJjb21tYW5kXCIsXHJcbiAgICAgIGRlc2NyaXB0aW9uOiBcIlRoZSB0YXJnZXQgY29tbWFuZCBuYW1lLlwiLFxyXG4gICAgfSxcclxuICBdLFxyXG4gIGFzeW5jIHJ1bihtZXNzYWdlKSB7XHJcbiAgICBpZiAobWVzc2FnZS5hcmdzLmNvbW1hbmQpIHtcclxuICAgICAgY29uc3QgY21kID0gYXBwLmNvbW1hbmRzLnJlc29sdmUobWVzc2FnZS5hcmdzLmNvbW1hbmQpXHJcblxyXG4gICAgICBpZiAoY21kKSB7XHJcbiAgICAgICAgcmV0dXJuIGFwcC5zZW5kQ29tbWFuZERldGFpbHMobWVzc2FnZSwgY21kKVxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGF3YWl0IG1lc3NhZ2UuY2hhbm5lbC5zZW5kKHtcclxuICAgICAgICAgIGVtYmVkczogW1xyXG4gICAgICAgICAgICBuZXcgYXBwLk1lc3NhZ2VFbWJlZCgpXHJcbiAgICAgICAgICAgICAgLnNldENvbG9yKFwiUkVEXCIpXHJcbiAgICAgICAgICAgICAgLnNldEF1dGhvcihcclxuICAgICAgICAgICAgICAgIGBVbmtub3duIGNvbW1hbmQgXCIke21lc3NhZ2UuYXJncy5jb21tYW5kfVwiYCxcclxuICAgICAgICAgICAgICAgIG1lc3NhZ2UuY2xpZW50LnVzZXI/LmRpc3BsYXlBdmF0YXJVUkwoKVxyXG4gICAgICAgICAgICAgICksXHJcbiAgICAgICAgICBdLFxyXG4gICAgICAgIH0pXHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIG5ldyBhcHAuUGFnaW5hdG9yKHtcclxuICAgICAgICBwYWdlczogYXdhaXQgYXBwLlBhZ2luYXRvci5kaXZpZGVyKFxyXG4gICAgICAgICAgKFxyXG4gICAgICAgICAgICBhd2FpdCBQcm9taXNlLmFsbChcclxuICAgICAgICAgICAgICBhcHAuY29tbWFuZHMubWFwKGFzeW5jIChjbWQpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHByZXBhcmVkID0gYXdhaXQgYXBwLnByZXBhcmVDb21tYW5kKG1lc3NhZ2UsIGNtZClcclxuICAgICAgICAgICAgICAgIGlmIChwcmVwYXJlZCAhPT0gdHJ1ZSkgcmV0dXJuIFwiXCJcclxuICAgICAgICAgICAgICAgIHJldHVybiBhcHAuY29tbWFuZFRvTGlzdEl0ZW0obWVzc2FnZSwgY21kKVxyXG4gICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgICkuZmlsdGVyKChsaW5lKSA9PiBsaW5lLmxlbmd0aCA+IDApLFxyXG4gICAgICAgICAgMTAsXHJcbiAgICAgICAgICAocGFnZSkgPT4ge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IGFwcC5NZXNzYWdlRW1iZWQoKVxyXG4gICAgICAgICAgICAgIC5zZXRDb2xvcihcIkJMVVJQTEVcIilcclxuICAgICAgICAgICAgICAuc2V0QXV0aG9yKFxyXG4gICAgICAgICAgICAgICAgXCJDb21tYW5kIGxpc3RcIixcclxuICAgICAgICAgICAgICAgIG1lc3NhZ2UuY2xpZW50LnVzZXI/LmRpc3BsYXlBdmF0YXJVUkwoKVxyXG4gICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAuc2V0RGVzY3JpcHRpb24ocGFnZS5qb2luKFwiXFxuXCIpKVxyXG4gICAgICAgICAgICAgIC5zZXRGb290ZXIoYCR7bWVzc2FnZS51c2VkUHJlZml4fWhlbHAgPGNvbW1hbmQ+YClcclxuICAgICAgICAgIH1cclxuICAgICAgICApLFxyXG4gICAgICAgIGZpbHRlcjogKHJlYWN0aW9uLCB1c2VyKSA9PiB1c2VyLmlkID09PSBtZXNzYWdlLmF1dGhvci5pZCxcclxuICAgICAgICBjaGFubmVsOiBtZXNzYWdlLmNoYW5uZWwsXHJcbiAgICAgIH0pXHJcbiAgICB9XHJcbiAgfSxcclxufSlcclxuIl0sCiAgIm1hcHBpbmdzIjogIkFBQUE7QUFFQSxJQUFPLHNCQUFRLElBQUksSUFBSSxRQUFRO0FBQUEsRUFDN0IsTUFBTTtBQUFBLEVBQ04sYUFBYTtBQUFBLEVBQ2IsaUJBQWlCO0FBQUEsRUFDakIsYUFBYTtBQUFBLEVBQ2IsU0FBUyxDQUFDLEtBQUs7QUFBQSxFQUNmLGdCQUFnQixDQUFDO0FBQUEsRUFDakIsWUFBWTtBQUFBLElBQ1Y7QUFBQSxNQUNFLE1BQU07QUFBQSxNQUNOLGFBQWE7QUFBQTtBQUFBO0FBQUEsUUFHWCxJQUFJLFNBQVM7QUFDakIsUUFBSSxRQUFRLEtBQUssU0FBUztBQUN4QixZQUFNLE1BQU0sSUFBSSxTQUFTLFFBQVEsUUFBUSxLQUFLO0FBRTlDLFVBQUksS0FBSztBQUNQLGVBQU8sSUFBSSxtQkFBbUIsU0FBUztBQUFBLGFBQ2xDO0FBQ0wsY0FBTSxRQUFRLFFBQVEsS0FBSztBQUFBLFVBQ3pCLFFBQVE7QUFBQSxZQUNOLElBQUksSUFBSSxlQUNMLFNBQVMsT0FDVCxVQUNDLG9CQUFvQixRQUFRLEtBQUssWUFDakMsUUFBUSxPQUFPLE1BQU07QUFBQTtBQUFBO0FBQUE7QUFBQSxXQUsxQjtBQUNMLFVBQUksSUFBSSxVQUFVO0FBQUEsUUFDaEIsT0FBTyxNQUFNLElBQUksVUFBVSxRQUV2QixPQUFNLFFBQVEsSUFDWixJQUFJLFNBQVMsSUFBSSxPQUFPLFFBQVE7QUFDOUIsZ0JBQU0sV0FBVyxNQUFNLElBQUksZUFBZSxTQUFTO0FBQ25ELGNBQUksYUFBYTtBQUFNLG1CQUFPO0FBQzlCLGlCQUFPLElBQUksa0JBQWtCLFNBQVM7QUFBQSxhQUcxQyxPQUFPLENBQUMsU0FBUyxLQUFLLFNBQVMsSUFDakMsSUFDQSxDQUFDLFNBQVM7QUFDUixpQkFBTyxJQUFJLElBQUksZUFDWixTQUFTLFdBQ1QsVUFDQyxnQkFDQSxRQUFRLE9BQU8sTUFBTSxvQkFFdEIsZUFBZSxLQUFLLEtBQUssT0FDekIsVUFBVSxHQUFHLFFBQVE7QUFBQTtBQUFBLFFBRzVCLFFBQVEsQ0FBQyxVQUFVLFNBQVMsS0FBSyxPQUFPLFFBQVEsT0FBTztBQUFBLFFBQ3ZELFNBQVMsUUFBUTtBQUFBO0FBQUE7QUFBQTtBQUFBOyIsCiAgIm5hbWVzIjogW10KfQo=
