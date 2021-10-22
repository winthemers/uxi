import * as app from "../app.js";
import yargsParser from "yargs-parser";
const listener = {
  event: "messageCreate",
  description: "Handle message for commands",
  async run(message) {
    if (!app.isNormalMessage(message))
      return;
    const prefix = await app.prefix(message.guild ?? void 0);
    if (new RegExp(`^<@!?${message.client.user.id}>$`).test(message.content))
      return message.channel.send({
        embeds: [
          new app.MessageEmbed().setColor("BLURPLE").setDescription(`My prefix is \`${prefix}\``)
        ]
      });
    message.usedAsDefault = false;
    message.send = async function(sent) {
      return this.channel.send(sent);
    }.bind(message);
    message.sendTimeout = async function(timeout, sent) {
      const m = await this.channel.send(sent);
      setTimeout(function() {
        if (!this.deleted)
          this.delete().catch();
      }.bind(this), timeout);
      return m;
    }.bind(message);
    message.isFromBotOwner = message.author.id === process.env.BOT_OWNER;
    app.emitMessage(message.channel, message);
    app.emitMessage(message.author, message);
    if (app.isGuildMessage(message)) {
      message.isFromGuildOwner = message.isFromBotOwner || message.guild.ownerId === message.author.id;
      app.emitMessage(message.guild, message);
      app.emitMessage(message.member, message);
    }
    let dynamicContent = message.content;
    const cut = function(key2) {
      dynamicContent = dynamicContent.slice(key2.length).trim();
    };
    const mentionRegex = new RegExp(`^(<@!?${message.client.user.id}>) ?`);
    if (dynamicContent.startsWith(prefix)) {
      message.usedPrefix = prefix;
      cut(prefix);
    } else if (mentionRegex.test(dynamicContent)) {
      const [match, used] = mentionRegex.exec(dynamicContent);
      message.usedPrefix = `${used} `;
      cut(match);
    } else
      return;
    let key = dynamicContent.split(/\s+/)[0];
    if (key !== "turn" && !app.cache.ensure("turn", true))
      return;
    let cmd = app.commands.resolve(key);
    if (!cmd) {
      if (app.defaultCommand) {
        key = "";
        cmd = app.defaultCommand;
        message.usedAsDefault = true;
      } else
        return null;
    }
    {
      let cursor = 0;
      let depth = 0;
      while (cmd.options.subs && cursor < cmd.options.subs.length) {
        const subKey = dynamicContent.split(/\s+/)[depth + 1];
        for (const sub of cmd.options.subs) {
          if (sub.options.name === subKey) {
            key += ` ${subKey}`;
            cursor = 0;
            cmd = sub;
            depth++;
            break;
          } else if (sub.options.aliases) {
            for (const alias of sub.options.aliases) {
              if (alias === subKey) {
                key += ` ${subKey}`;
                cursor = 0;
                cmd = sub;
                depth++;
              }
            }
          }
          cursor++;
        }
      }
    }
    cut(key.trim());
    const baseContent = dynamicContent;
    const parsedArgs = yargsParser(dynamicContent);
    const restPositional = parsedArgs._.slice() ?? [];
    message.args = (parsedArgs._?.slice(0) ?? []).map((positional) => {
      if (/^(?:".+"|'.+')$/.test(positional))
        return positional.slice(1, positional.length - 1);
      return positional;
    });
    if (parsedArgs.help || parsedArgs.h)
      return app.sendCommandDetails(message, cmd);
    const prepared = await app.prepareCommand(message, cmd, {
      restPositional,
      baseContent,
      parsedArgs,
      key
    });
    if (typeof prepared !== "boolean")
      return message.channel.send({ embeds: [prepared] });
    if (!prepared)
      return;
    try {
      await cmd.options.run.bind(cmd)(message);
    } catch (error) {
      app.error(error, "messageCreate.native", true);
      message.channel.send(app.code.stringify({
        content: `Error: ${error.message?.replace(/\x1b\[\d+m/g, "") ?? "unknown"}`,
        lang: "js"
      })).catch((error2) => {
        app.error(error2, "messageCreate.native");
      });
    }
  }
};
var messageCreate_native_default = listener;
export {
  messageCreate_native_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2xpc3RlbmVycy9tZXNzYWdlQ3JlYXRlLm5hdGl2ZS50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0ICogYXMgYXBwIGZyb20gXCIuLi9hcHAuanNcIlxyXG5pbXBvcnQgeWFyZ3NQYXJzZXIgZnJvbSBcInlhcmdzLXBhcnNlclwiXHJcblxyXG5jb25zdCBsaXN0ZW5lcjogYXBwLkxpc3RlbmVyPFwibWVzc2FnZUNyZWF0ZVwiPiA9IHtcclxuICBldmVudDogXCJtZXNzYWdlQ3JlYXRlXCIsXHJcbiAgZGVzY3JpcHRpb246IFwiSGFuZGxlIG1lc3NhZ2UgZm9yIGNvbW1hbmRzXCIsXHJcbiAgYXN5bmMgcnVuKG1lc3NhZ2UpIHtcclxuICAgIGlmICghYXBwLmlzTm9ybWFsTWVzc2FnZShtZXNzYWdlKSkgcmV0dXJuXHJcblxyXG4gICAgY29uc3QgcHJlZml4ID0gYXdhaXQgYXBwLnByZWZpeChtZXNzYWdlLmd1aWxkID8/IHVuZGVmaW5lZClcclxuXHJcbiAgICBpZiAobmV3IFJlZ0V4cChgXjxAIT8ke21lc3NhZ2UuY2xpZW50LnVzZXIuaWR9PiRgKS50ZXN0KG1lc3NhZ2UuY29udGVudCkpXHJcbiAgICAgIHJldHVybiBtZXNzYWdlLmNoYW5uZWwuc2VuZCh7XHJcbiAgICAgICAgZW1iZWRzOiBbXHJcbiAgICAgICAgICBuZXcgYXBwLk1lc3NhZ2VFbWJlZCgpXHJcbiAgICAgICAgICAgIC5zZXRDb2xvcihcIkJMVVJQTEVcIilcclxuICAgICAgICAgICAgLnNldERlc2NyaXB0aW9uKGBNeSBwcmVmaXggaXMgXFxgJHtwcmVmaXh9XFxgYCksXHJcbiAgICAgICAgXSxcclxuICAgICAgfSlcclxuXHJcbiAgICBtZXNzYWdlLnVzZWRBc0RlZmF1bHQgPSBmYWxzZVxyXG5cclxuICAgIG1lc3NhZ2Uuc2VuZCA9IGFzeW5jIGZ1bmN0aW9uIChcclxuICAgICAgdGhpczogYXBwLk5vcm1hbE1lc3NhZ2UsXHJcbiAgICAgIHNlbnQ6IGFwcC5TZW50SXRlbVxyXG4gICAgKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmNoYW5uZWwuc2VuZChzZW50KVxyXG4gICAgfS5iaW5kKG1lc3NhZ2UpXHJcblxyXG4gICAgbWVzc2FnZS5zZW5kVGltZW91dCA9IGFzeW5jIGZ1bmN0aW9uIChcclxuICAgICAgdGhpczogYXBwLk5vcm1hbE1lc3NhZ2UsXHJcbiAgICAgIHRpbWVvdXQ6IG51bWJlcixcclxuICAgICAgc2VudDogYXBwLlNlbnRJdGVtXHJcbiAgICApIHtcclxuICAgICAgY29uc3QgbSA9IGF3YWl0IHRoaXMuY2hhbm5lbC5zZW5kKHNlbnQpXHJcbiAgICAgIHNldFRpbWVvdXQoXHJcbiAgICAgICAgZnVuY3Rpb24gKHRoaXM6IGFwcC5Ob3JtYWxNZXNzYWdlKSB7XHJcbiAgICAgICAgICBpZiAoIXRoaXMuZGVsZXRlZCkgdGhpcy5kZWxldGUoKS5jYXRjaCgpXHJcbiAgICAgICAgfS5iaW5kKHRoaXMpLFxyXG4gICAgICAgIHRpbWVvdXRcclxuICAgICAgKVxyXG4gICAgICByZXR1cm4gbVxyXG4gICAgfS5iaW5kKG1lc3NhZ2UpXHJcblxyXG4gICAgbWVzc2FnZS5pc0Zyb21Cb3RPd25lciA9IG1lc3NhZ2UuYXV0aG9yLmlkID09PSBwcm9jZXNzLmVudi5CT1RfT1dORVJcclxuXHJcbiAgICBhcHAuZW1pdE1lc3NhZ2UobWVzc2FnZS5jaGFubmVsLCBtZXNzYWdlKVxyXG4gICAgYXBwLmVtaXRNZXNzYWdlKG1lc3NhZ2UuYXV0aG9yLCBtZXNzYWdlKVxyXG5cclxuICAgIGlmIChhcHAuaXNHdWlsZE1lc3NhZ2UobWVzc2FnZSkpIHtcclxuICAgICAgbWVzc2FnZS5pc0Zyb21HdWlsZE93bmVyID1cclxuICAgICAgICBtZXNzYWdlLmlzRnJvbUJvdE93bmVyIHx8IG1lc3NhZ2UuZ3VpbGQub3duZXJJZCA9PT0gbWVzc2FnZS5hdXRob3IuaWRcclxuXHJcbiAgICAgIGFwcC5lbWl0TWVzc2FnZShtZXNzYWdlLmd1aWxkLCBtZXNzYWdlKVxyXG4gICAgICBhcHAuZW1pdE1lc3NhZ2UobWVzc2FnZS5tZW1iZXIsIG1lc3NhZ2UpXHJcbiAgICB9XHJcblxyXG4gICAgbGV0IGR5bmFtaWNDb250ZW50ID0gbWVzc2FnZS5jb250ZW50XHJcblxyXG4gICAgY29uc3QgY3V0ID0gZnVuY3Rpb24gKGtleTogc3RyaW5nKSB7XHJcbiAgICAgIGR5bmFtaWNDb250ZW50ID0gZHluYW1pY0NvbnRlbnQuc2xpY2Uoa2V5Lmxlbmd0aCkudHJpbSgpXHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgbWVudGlvblJlZ2V4ID0gbmV3IFJlZ0V4cChgXig8QCE/JHttZXNzYWdlLmNsaWVudC51c2VyLmlkfT4pID9gKVxyXG5cclxuICAgIGlmIChkeW5hbWljQ29udGVudC5zdGFydHNXaXRoKHByZWZpeCkpIHtcclxuICAgICAgbWVzc2FnZS51c2VkUHJlZml4ID0gcHJlZml4XHJcbiAgICAgIGN1dChwcmVmaXgpXHJcbiAgICB9IGVsc2UgaWYgKG1lbnRpb25SZWdleC50ZXN0KGR5bmFtaWNDb250ZW50KSkge1xyXG4gICAgICBjb25zdCBbbWF0Y2gsIHVzZWRdID0gbWVudGlvblJlZ2V4LmV4ZWMoZHluYW1pY0NvbnRlbnQpIGFzIFJlZ0V4cEV4ZWNBcnJheVxyXG4gICAgICBtZXNzYWdlLnVzZWRQcmVmaXggPSBgJHt1c2VkfSBgXHJcbiAgICAgIGN1dChtYXRjaClcclxuICAgIH0gZWxzZSByZXR1cm5cclxuXHJcbiAgICBsZXQga2V5ID0gZHluYW1pY0NvbnRlbnQuc3BsaXQoL1xccysvKVswXVxyXG5cclxuICAgIC8vIHR1cm4gT04vT0ZGXHJcbiAgICBpZiAoa2V5ICE9PSBcInR1cm5cIiAmJiAhYXBwLmNhY2hlLmVuc3VyZTxib29sZWFuPihcInR1cm5cIiwgdHJ1ZSkpIHJldHVyblxyXG5cclxuICAgIGxldCBjbWQ6IGFwcC5Db21tYW5kPGFueT4gPSBhcHAuY29tbWFuZHMucmVzb2x2ZShrZXkpIGFzIGFwcC5Db21tYW5kPGFueT5cclxuXHJcbiAgICBpZiAoIWNtZCkge1xyXG4gICAgICBpZiAoYXBwLmRlZmF1bHRDb21tYW5kKSB7XHJcbiAgICAgICAga2V5ID0gXCJcIlxyXG4gICAgICAgIGNtZCA9IGFwcC5kZWZhdWx0Q29tbWFuZFxyXG4gICAgICAgIG1lc3NhZ2UudXNlZEFzRGVmYXVsdCA9IHRydWVcclxuICAgICAgfSBlbHNlIHJldHVybiBudWxsXHJcbiAgICB9XHJcblxyXG4gICAgLy8gY2hlY2sgc3ViIGNvbW1hbmRzXHJcbiAgICB7XHJcbiAgICAgIGxldCBjdXJzb3IgPSAwXHJcbiAgICAgIGxldCBkZXB0aCA9IDBcclxuXHJcbiAgICAgIHdoaWxlIChjbWQub3B0aW9ucy5zdWJzICYmIGN1cnNvciA8IGNtZC5vcHRpb25zLnN1YnMubGVuZ3RoKSB7XHJcbiAgICAgICAgY29uc3Qgc3ViS2V5ID0gZHluYW1pY0NvbnRlbnQuc3BsaXQoL1xccysvKVtkZXB0aCArIDFdXHJcblxyXG4gICAgICAgIGZvciAoY29uc3Qgc3ViIG9mIGNtZC5vcHRpb25zLnN1YnMpIHtcclxuICAgICAgICAgIGlmIChzdWIub3B0aW9ucy5uYW1lID09PSBzdWJLZXkpIHtcclxuICAgICAgICAgICAga2V5ICs9IGAgJHtzdWJLZXl9YFxyXG4gICAgICAgICAgICBjdXJzb3IgPSAwXHJcbiAgICAgICAgICAgIGNtZCA9IHN1YlxyXG4gICAgICAgICAgICBkZXB0aCsrXHJcbiAgICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgICB9IGVsc2UgaWYgKHN1Yi5vcHRpb25zLmFsaWFzZXMpIHtcclxuICAgICAgICAgICAgZm9yIChjb25zdCBhbGlhcyBvZiBzdWIub3B0aW9ucy5hbGlhc2VzKSB7XHJcbiAgICAgICAgICAgICAgaWYgKGFsaWFzID09PSBzdWJLZXkpIHtcclxuICAgICAgICAgICAgICAgIGtleSArPSBgICR7c3ViS2V5fWBcclxuICAgICAgICAgICAgICAgIGN1cnNvciA9IDBcclxuICAgICAgICAgICAgICAgIGNtZCA9IHN1YlxyXG4gICAgICAgICAgICAgICAgZGVwdGgrK1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgY3Vyc29yKytcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjdXQoa2V5LnRyaW0oKSlcclxuXHJcbiAgICBjb25zdCBiYXNlQ29udGVudCA9IGR5bmFtaWNDb250ZW50XHJcblxyXG4gICAgLy8gcGFyc2UgQ29tbWFuZE1lc3NhZ2UgYXJndW1lbnRzXHJcbiAgICBjb25zdCBwYXJzZWRBcmdzID0geWFyZ3NQYXJzZXIoZHluYW1pY0NvbnRlbnQpXHJcbiAgICBjb25zdCByZXN0UG9zaXRpb25hbCA9IHBhcnNlZEFyZ3MuXy5zbGljZSgpID8/IFtdXHJcblxyXG4gICAgbWVzc2FnZS5hcmdzID0gKHBhcnNlZEFyZ3MuXz8uc2xpY2UoMCkgPz8gW10pLm1hcCgocG9zaXRpb25hbCkgPT4ge1xyXG4gICAgICBpZiAoL14oPzpcIi4rXCJ8Jy4rJykkLy50ZXN0KHBvc2l0aW9uYWwpKVxyXG4gICAgICAgIHJldHVybiBwb3NpdGlvbmFsLnNsaWNlKDEsIHBvc2l0aW9uYWwubGVuZ3RoIC0gMSlcclxuICAgICAgcmV0dXJuIHBvc2l0aW9uYWxcclxuICAgIH0pXHJcblxyXG4gICAgLy8gaGFuZGxlIGhlbHAgYXJndW1lbnRcclxuICAgIGlmIChwYXJzZWRBcmdzLmhlbHAgfHwgcGFyc2VkQXJncy5oKVxyXG4gICAgICByZXR1cm4gYXBwLnNlbmRDb21tYW5kRGV0YWlscyhtZXNzYWdlLCBjbWQpXHJcblxyXG4gICAgLy8gcHJlcGFyZSBjb21tYW5kXHJcbiAgICBjb25zdCBwcmVwYXJlZCA9IGF3YWl0IGFwcC5wcmVwYXJlQ29tbWFuZChtZXNzYWdlLCBjbWQsIHtcclxuICAgICAgcmVzdFBvc2l0aW9uYWwsXHJcbiAgICAgIGJhc2VDb250ZW50LFxyXG4gICAgICBwYXJzZWRBcmdzLFxyXG4gICAgICBrZXksXHJcbiAgICB9KVxyXG5cclxuICAgIGlmICh0eXBlb2YgcHJlcGFyZWQgIT09IFwiYm9vbGVhblwiKVxyXG4gICAgICByZXR1cm4gbWVzc2FnZS5jaGFubmVsLnNlbmQoeyBlbWJlZHM6IFtwcmVwYXJlZF0gfSlcclxuXHJcbiAgICBpZiAoIXByZXBhcmVkKSByZXR1cm5cclxuXHJcbiAgICB0cnkge1xyXG4gICAgICBhd2FpdCBjbWQub3B0aW9ucy5ydW4uYmluZChjbWQpKG1lc3NhZ2UpXHJcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XHJcbiAgICAgIGFwcC5lcnJvcihlcnJvciwgXCJtZXNzYWdlQ3JlYXRlLm5hdGl2ZVwiLCB0cnVlKVxyXG4gICAgICBtZXNzYWdlLmNoYW5uZWxcclxuICAgICAgICAuc2VuZChcclxuICAgICAgICAgIGFwcC5jb2RlLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgICAgIGNvbnRlbnQ6IGBFcnJvcjogJHtcclxuICAgICAgICAgICAgICBlcnJvci5tZXNzYWdlPy5yZXBsYWNlKC9cXHgxYlxcW1xcZCttL2csIFwiXCIpID8/IFwidW5rbm93blwiXHJcbiAgICAgICAgICAgIH1gLFxyXG4gICAgICAgICAgICBsYW5nOiBcImpzXCIsXHJcbiAgICAgICAgICB9KVxyXG4gICAgICAgIClcclxuICAgICAgICAuY2F0Y2goKGVycm9yKSA9PiB7XHJcbiAgICAgICAgICBhcHAuZXJyb3IoZXJyb3IsIFwibWVzc2FnZUNyZWF0ZS5uYXRpdmVcIilcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG4gIH0sXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGxpc3RlbmVyXHJcbiJdLAogICJtYXBwaW5ncyI6ICJBQUFBO0FBQ0E7QUFFQSxNQUFNLFdBQTBDO0FBQUEsRUFDOUMsT0FBTztBQUFBLEVBQ1AsYUFBYTtBQUFBLFFBQ1AsSUFBSSxTQUFTO0FBQ2pCLFFBQUksQ0FBQyxJQUFJLGdCQUFnQjtBQUFVO0FBRW5DLFVBQU0sU0FBUyxNQUFNLElBQUksT0FBTyxRQUFRLFNBQVM7QUFF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
