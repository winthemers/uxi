import evaluate from "ghom-eval";
import cp from "child_process";
import util from "util";
import * as app from "../app.js";
const exec = util.promisify(cp.exec);
const packageJson = app.fetchPackageJson();
const alreadyInstalled = (pack) => packageJson.dependencies.hasOwnProperty(pack) || packageJson.devDependencies.hasOwnProperty(pack);
var eval_native_default = new app.Command({
  name: "eval",
  description: "JS code evaluator",
  channelType: "all",
  botOwnerOnly: true,
  aliases: ["js", "code", "run", "="],
  rest: {
    name: "code",
    description: "The evaluated code",
    required: true
  },
  options: [
    {
      name: "packages",
      aliases: ["use", "u", "req", "require", "import", "i"],
      castValue: "array",
      description: "NPM packages I want to includes in my code"
    }
  ],
  flags: [
    {
      name: "muted",
      aliases: ["mute", "silent"],
      flag: "m",
      description: "Disable message feedback"
    },
    {
      name: "information",
      aliases: ["info", "detail", "more"],
      flag: "i",
      description: "Information about output"
    }
  ],
  async run(message) {
    const installed = new Set();
    let code = message.args.code;
    if (message.args.packages.length > 0) {
      const given = new Set(message.args.packages.filter((p) => p));
      for (const pack of given) {
        if (alreadyInstalled(pack)) {
          await message.channel.send(`\\\u2714 **${pack}** - installed`);
          installed.add(pack);
        } else {
          let log;
          try {
            log = await message.channel.send(`\\\u23F3 **${pack}** - install...`);
            await exec(`npm i ${pack}@latest`);
            await log.edit(`\\\u2714 **${pack}** - installed`);
            installed.add(pack);
          } catch (error) {
            if (log)
              await log.edit(`\\\u274C **${pack}** - error`);
            else
              await message.channel.send(`\\\u274C **${pack}** - error`);
          }
        }
      }
    }
    if (app.code.pattern.test(code))
      code = code.replace(app.code.pattern, "$2");
    if (code.split("\n").length === 1 && !/const|let|return/.test(code)) {
      code = "return " + code;
    }
    const req = Object.fromEntries(await Promise.all([...installed].map(async (pack) => [pack, await import(pack)])));
    const evaluated = await evaluate(code, { message, app, req }, "{ message, app, req }");
    if (message.args.muted) {
      await message.channel.send(`\\\u2714 successfully evaluated in ${evaluated.duration}ms`);
    } else {
      const embed = new app.MessageEmbed().setColor(evaluated.failed ? "RED" : "BLURPLE").setTitle(`${evaluated.failed ? "\\\u274C" : "\\\u2714"} Result of JS evaluation ${evaluated.failed ? "(failed)" : ""}`).setDescription(app.code.stringify({
        content: evaluated.output.slice(0, 2e3).replace(/```/g, "\\`\\`\\`"),
        lang: "js"
      }));
      if (message.args.information)
        embed.addField("Information", app.code.stringify({
          content: `type: ${evaluated.type}
class: ${evaluated.class}
duration: ${evaluated.duration}ms`,
          lang: "yaml"
        }));
      await message.channel.send({ embeds: [embed] });
    }
    let somePackagesRemoved = false;
    for (const pack of installed) {
      if (alreadyInstalled(pack))
        continue;
      somePackagesRemoved = true;
      let log;
      try {
        log = await message.channel.send(`\\\u23F3 **${pack}** - uninstall...`);
        await exec(`npm remove --purge ${pack}`);
        await log.edit(`\\\u2714 **${pack}** - uninstalled`);
      } catch (error) {
        if (log)
          await log.edit(`\\\u274C **${pack}** - error`);
        else
          await message.channel.send(`\\\u274C **${pack}** - error`);
      }
    }
    if (somePackagesRemoved)
      return message.channel.send(`\\\u2714 process completed`);
  }
});
export {
  eval_native_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2NvbW1hbmRzL2V2YWwubmF0aXZlLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgZXZhbHVhdGUgZnJvbSBcImdob20tZXZhbFwiXHJcbmltcG9ydCBjcCBmcm9tIFwiY2hpbGRfcHJvY2Vzc1wiXHJcbmltcG9ydCB1dGlsIGZyb20gXCJ1dGlsXCJcclxuaW1wb3J0ICogYXMgYXBwIGZyb20gXCIuLi9hcHAuanNcIlxyXG5cclxuY29uc3QgZXhlYyA9IHV0aWwucHJvbWlzaWZ5KGNwLmV4ZWMpXHJcblxyXG5jb25zdCBwYWNrYWdlSnNvbiA9IGFwcC5mZXRjaFBhY2thZ2VKc29uKClcclxuXHJcbmNvbnN0IGFscmVhZHlJbnN0YWxsZWQgPSAocGFjazogc3RyaW5nKTogYm9vbGVhbiA9PlxyXG4gIHBhY2thZ2VKc29uLmRlcGVuZGVuY2llcy5oYXNPd25Qcm9wZXJ0eShwYWNrKSB8fFxyXG4gIHBhY2thZ2VKc29uLmRldkRlcGVuZGVuY2llcy5oYXNPd25Qcm9wZXJ0eShwYWNrKVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgbmV3IGFwcC5Db21tYW5kKHtcclxuICBuYW1lOiBcImV2YWxcIixcclxuICBkZXNjcmlwdGlvbjogXCJKUyBjb2RlIGV2YWx1YXRvclwiLFxyXG4gIGNoYW5uZWxUeXBlOiBcImFsbFwiLFxyXG4gIGJvdE93bmVyT25seTogdHJ1ZSxcclxuICBhbGlhc2VzOiBbXCJqc1wiLCBcImNvZGVcIiwgXCJydW5cIiwgXCI9XCJdLFxyXG4gIHJlc3Q6IHtcclxuICAgIG5hbWU6IFwiY29kZVwiLFxyXG4gICAgZGVzY3JpcHRpb246IFwiVGhlIGV2YWx1YXRlZCBjb2RlXCIsXHJcbiAgICByZXF1aXJlZDogdHJ1ZSxcclxuICB9LFxyXG4gIG9wdGlvbnM6IFtcclxuICAgIHtcclxuICAgICAgbmFtZTogXCJwYWNrYWdlc1wiLFxyXG4gICAgICBhbGlhc2VzOiBbXCJ1c2VcIiwgXCJ1XCIsIFwicmVxXCIsIFwicmVxdWlyZVwiLCBcImltcG9ydFwiLCBcImlcIl0sXHJcbiAgICAgIGNhc3RWYWx1ZTogXCJhcnJheVwiLFxyXG4gICAgICBkZXNjcmlwdGlvbjogXCJOUE0gcGFja2FnZXMgSSB3YW50IHRvIGluY2x1ZGVzIGluIG15IGNvZGVcIixcclxuICAgIH0sXHJcbiAgXSxcclxuICBmbGFnczogW1xyXG4gICAge1xyXG4gICAgICBuYW1lOiBcIm11dGVkXCIsXHJcbiAgICAgIGFsaWFzZXM6IFtcIm11dGVcIiwgXCJzaWxlbnRcIl0sXHJcbiAgICAgIGZsYWc6IFwibVwiLFxyXG4gICAgICBkZXNjcmlwdGlvbjogXCJEaXNhYmxlIG1lc3NhZ2UgZmVlZGJhY2tcIixcclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgIG5hbWU6IFwiaW5mb3JtYXRpb25cIixcclxuICAgICAgYWxpYXNlczogW1wiaW5mb1wiLCBcImRldGFpbFwiLCBcIm1vcmVcIl0sXHJcbiAgICAgIGZsYWc6IFwiaVwiLFxyXG4gICAgICBkZXNjcmlwdGlvbjogXCJJbmZvcm1hdGlvbiBhYm91dCBvdXRwdXRcIixcclxuICAgIH0sXHJcbiAgXSxcclxuICBhc3luYyBydW4obWVzc2FnZSkge1xyXG4gICAgY29uc3QgaW5zdGFsbGVkID0gbmV3IFNldDxzdHJpbmc+KClcclxuXHJcbiAgICBsZXQgY29kZSA9IG1lc3NhZ2UuYXJncy5jb2RlXHJcblxyXG4gICAgaWYgKG1lc3NhZ2UuYXJncy5wYWNrYWdlcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgIGNvbnN0IGdpdmVuID0gbmV3IFNldDxzdHJpbmc+KFxyXG4gICAgICAgIG1lc3NhZ2UuYXJncy5wYWNrYWdlcy5maWx0ZXIoKHA6IHN0cmluZykgPT4gcClcclxuICAgICAgKVxyXG5cclxuICAgICAgZm9yIChjb25zdCBwYWNrIG9mIGdpdmVuKSB7XHJcbiAgICAgICAgaWYgKGFscmVhZHlJbnN0YWxsZWQocGFjaykpIHtcclxuICAgICAgICAgIGF3YWl0IG1lc3NhZ2UuY2hhbm5lbC5zZW5kKGBcXFxcXHUyNzE0ICoqJHtwYWNrfSoqIC0gaW5zdGFsbGVkYClcclxuXHJcbiAgICAgICAgICBpbnN0YWxsZWQuYWRkKHBhY2spXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGxldCBsb2dcclxuXHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBsb2cgPSBhd2FpdCBtZXNzYWdlLmNoYW5uZWwuc2VuZChgXFxcXFx1MjNGMyAqKiR7cGFja30qKiAtIGluc3RhbGwuLi5gKVxyXG4gICAgICAgICAgICBhd2FpdCBleGVjKGBucG0gaSAke3BhY2t9QGxhdGVzdGApXHJcbiAgICAgICAgICAgIGF3YWl0IGxvZy5lZGl0KGBcXFxcXHUyNzE0ICoqJHtwYWNrfSoqIC0gaW5zdGFsbGVkYClcclxuICAgICAgICAgICAgaW5zdGFsbGVkLmFkZChwYWNrKVxyXG4gICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgaWYgKGxvZykgYXdhaXQgbG9nLmVkaXQoYFxcXFxcdTI3NEMgKioke3BhY2t9KiogLSBlcnJvcmApXHJcbiAgICAgICAgICAgIGVsc2UgYXdhaXQgbWVzc2FnZS5jaGFubmVsLnNlbmQoYFxcXFxcdTI3NEMgKioke3BhY2t9KiogLSBlcnJvcmApXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGFwcC5jb2RlLnBhdHRlcm4udGVzdChjb2RlKSkgY29kZSA9IGNvZGUucmVwbGFjZShhcHAuY29kZS5wYXR0ZXJuLCBcIiQyXCIpXHJcblxyXG4gICAgaWYgKGNvZGUuc3BsaXQoXCJcXG5cIikubGVuZ3RoID09PSAxICYmICEvY29uc3R8bGV0fHJldHVybi8udGVzdChjb2RlKSkge1xyXG4gICAgICBjb2RlID0gXCJyZXR1cm4gXCIgKyBjb2RlXHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgcmVxID0gT2JqZWN0LmZyb21FbnRyaWVzKFxyXG4gICAgICBhd2FpdCBQcm9taXNlLmFsbChcclxuICAgICAgICBbLi4uaW5zdGFsbGVkXS5tYXAoYXN5bmMgKHBhY2spID0+IFtwYWNrLCBhd2FpdCBpbXBvcnQocGFjayldKVxyXG4gICAgICApXHJcbiAgICApXHJcblxyXG4gICAgY29uc3QgZXZhbHVhdGVkID0gYXdhaXQgZXZhbHVhdGUoXHJcbiAgICAgIGNvZGUsXHJcbiAgICAgIHsgbWVzc2FnZSwgYXBwLCByZXEgfSxcclxuICAgICAgXCJ7IG1lc3NhZ2UsIGFwcCwgcmVxIH1cIlxyXG4gICAgKVxyXG5cclxuICAgIGlmIChtZXNzYWdlLmFyZ3MubXV0ZWQpIHtcclxuICAgICAgYXdhaXQgbWVzc2FnZS5jaGFubmVsLnNlbmQoXHJcbiAgICAgICAgYFxcXFxcdTI3MTQgc3VjY2Vzc2Z1bGx5IGV2YWx1YXRlZCBpbiAke2V2YWx1YXRlZC5kdXJhdGlvbn1tc2BcclxuICAgICAgKVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY29uc3QgZW1iZWQgPSBuZXcgYXBwLk1lc3NhZ2VFbWJlZCgpXHJcbiAgICAgICAgLnNldENvbG9yKGV2YWx1YXRlZC5mYWlsZWQgPyBcIlJFRFwiIDogXCJCTFVSUExFXCIpXHJcbiAgICAgICAgLnNldFRpdGxlKFxyXG4gICAgICAgICAgYCR7ZXZhbHVhdGVkLmZhaWxlZCA/IFwiXFxcXFx1Mjc0Q1wiIDogXCJcXFxcXHUyNzE0XCJ9IFJlc3VsdCBvZiBKUyBldmFsdWF0aW9uICR7XHJcbiAgICAgICAgICAgIGV2YWx1YXRlZC5mYWlsZWQgPyBcIihmYWlsZWQpXCIgOiBcIlwiXHJcbiAgICAgICAgICB9YFxyXG4gICAgICAgIClcclxuICAgICAgICAuc2V0RGVzY3JpcHRpb24oXHJcbiAgICAgICAgICBhcHAuY29kZS5zdHJpbmdpZnkoe1xyXG4gICAgICAgICAgICBjb250ZW50OiBldmFsdWF0ZWQub3V0cHV0XHJcbiAgICAgICAgICAgICAgLnNsaWNlKDAsIDIwMDApXHJcbiAgICAgICAgICAgICAgLnJlcGxhY2UoL2BgYC9nLCBcIlxcXFxgXFxcXGBcXFxcYFwiKSxcclxuICAgICAgICAgICAgbGFuZzogXCJqc1wiLFxyXG4gICAgICAgICAgfSlcclxuICAgICAgICApXHJcblxyXG4gICAgICBpZiAobWVzc2FnZS5hcmdzLmluZm9ybWF0aW9uKVxyXG4gICAgICAgIGVtYmVkLmFkZEZpZWxkKFxyXG4gICAgICAgICAgXCJJbmZvcm1hdGlvblwiLFxyXG4gICAgICAgICAgYXBwLmNvZGUuc3RyaW5naWZ5KHtcclxuICAgICAgICAgICAgY29udGVudDogYHR5cGU6ICR7ZXZhbHVhdGVkLnR5cGV9XFxuY2xhc3M6ICR7ZXZhbHVhdGVkLmNsYXNzfVxcbmR1cmF0aW9uOiAke2V2YWx1YXRlZC5kdXJhdGlvbn1tc2AsXHJcbiAgICAgICAgICAgIGxhbmc6IFwieWFtbFwiLFxyXG4gICAgICAgICAgfSlcclxuICAgICAgICApXHJcbiAgICAgIGF3YWl0IG1lc3NhZ2UuY2hhbm5lbC5zZW5kKHsgZW1iZWRzOiBbZW1iZWRdIH0pXHJcbiAgICB9XHJcblxyXG4gICAgbGV0IHNvbWVQYWNrYWdlc1JlbW92ZWQgPSBmYWxzZVxyXG5cclxuICAgIGZvciAoY29uc3QgcGFjayBvZiBpbnN0YWxsZWQpIHtcclxuICAgICAgaWYgKGFscmVhZHlJbnN0YWxsZWQocGFjaykpIGNvbnRpbnVlXHJcblxyXG4gICAgICBzb21lUGFja2FnZXNSZW1vdmVkID0gdHJ1ZVxyXG5cclxuICAgICAgbGV0IGxvZ1xyXG5cclxuICAgICAgdHJ5IHtcclxuICAgICAgICBsb2cgPSBhd2FpdCBtZXNzYWdlLmNoYW5uZWwuc2VuZChgXFxcXFx1MjNGMyAqKiR7cGFja30qKiAtIHVuaW5zdGFsbC4uLmApXHJcbiAgICAgICAgYXdhaXQgZXhlYyhgbnBtIHJlbW92ZSAtLXB1cmdlICR7cGFja31gKVxyXG4gICAgICAgIGF3YWl0IGxvZy5lZGl0KGBcXFxcXHUyNzE0ICoqJHtwYWNrfSoqIC0gdW5pbnN0YWxsZWRgKVxyXG4gICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIGlmIChsb2cpIGF3YWl0IGxvZy5lZGl0KGBcXFxcXHUyNzRDICoqJHtwYWNrfSoqIC0gZXJyb3JgKVxyXG4gICAgICAgIGVsc2UgYXdhaXQgbWVzc2FnZS5jaGFubmVsLnNlbmQoYFxcXFxcdTI3NEMgKioke3BhY2t9KiogLSBlcnJvcmApXHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoc29tZVBhY2thZ2VzUmVtb3ZlZClcclxuICAgICAgcmV0dXJuIG1lc3NhZ2UuY2hhbm5lbC5zZW5kKGBcXFxcXHUyNzE0IHByb2Nlc3MgY29tcGxldGVkYClcclxuICB9LFxyXG59KVxyXG4iXSwKICAibWFwcGluZ3MiOiAiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUVBLE1BQU0sT0FBTyxLQUFLLFVBQVUsR0FBRztBQUUvQixNQUFNLGNBQWMsSUFBSTtBQUV4QixNQUFNLG1CQUFtQixDQUFDLFNBQ3hCLFlBQVksYUFBYSxlQUFlLFNBQ3hDLFlBQVksZ0JBQWdCLGVBQWU7QUFFN0MsSUFBTyxzQkFBUSxJQUFJLElBQUksUUFBUTtBQUFBLEVBQzdCLE1BQU07QUFBQSxFQUNOLGFBQWE7QUFBQSxFQUNiLGFBQWE7QUFBQSxFQUNiLGNBQWM7QUFBQSxFQUNkLFNBQVMsQ0FBQyxNQUFNLFFBQVEsT0FBTztBQUFBLEVBQy9CLE1BQU07QUFBQSxJQUNKLE1BQU07QUFBQSxJQUNOLGFBQWE7QUFBQSxJQUNiLFVBQVU7QUFBQTtBQUFBLEVBRVosU0FBUztBQUFBLElBQ1A7QUFBQSxNQUNFLE1BQU07QUFBQSxNQUNOLFNBQVMsQ0FBQyxPQUFPLEtBQUssT0FBTyxXQUFXLFVBQVU7QUFBQSxNQUNsRCxXQUFXO0FBQUEsTUFDWCxhQUFhO0FBQUE7QUFBQTtBQUFBLEVBR2pCLE9BQU87QUFBQSxJQUNMO0FBQUEsTUFDRSxNQUFNO0FBQUEsTUFDTixTQUFTLENBQUMsUUFBUTtBQUFBLE1BQ2xCLE1BQU07QUFBQSxNQUNOLGFBQWE7QUFBQTtBQUFBLElBRWY7QUFBQSxNQUNFLE1BQU07QUFBQSxNQUNOLFNBQVMsQ0FBQyxR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
