import discord from "discord.js";
import regexParser from "regex-parser";
import * as core from "./core.js";
import * as command from "./command.js";
function resolveGivenArgument(parsedArgs, arg) {
  let usedName = arg.name;
  let nameIsGiven = parsedArgs.hasOwnProperty(arg.name);
  let given = parsedArgs[arg.name] !== void 0 && parsedArgs[arg.name] !== null;
  let value = parsedArgs[arg.name];
  if (!given && arg.aliases) {
    for (const alias of arg.aliases) {
      if (parsedArgs.hasOwnProperty(alias)) {
        usedName = alias;
        nameIsGiven = true;
        given = true;
        value = parsedArgs[alias];
        break;
      }
    }
  }
  if (!given && isFlag(arg)) {
    given = parsedArgs.hasOwnProperty(arg.flag);
    value = parsedArgs[arg.flag];
    usedName = arg.flag;
  }
  return { given, usedName, value, nameIsGiven };
}
async function checkValue(subject, subjectType, value, message) {
  if (!subject.checkValue)
    return true;
  if (Array.isArray(subject.checkValue)) {
    if (subject.checkValue.includes(value)) {
      return new discord.MessageEmbed().setColor("RED").setAuthor(`Bad ${subjectType} pattern "${subject.name}".`, message.client.user?.displayAvatarURL()).setDescription(`Expected choice list: \`${subject.checkValue.join(" | ")}\``);
    } else
      return true;
  }
  const checkResult = await core.scrap(subject.checkValue, value, message);
  if (typeof checkResult === "string") {
    return new discord.MessageEmbed().setColor("RED").setAuthor(`Bad ${subjectType} tested "${subject.name}".`, message.client.user?.displayAvatarURL()).setDescription(checkResult);
  }
  if (typeof checkResult === "boolean") {
    if (!checkResult) {
      return new discord.MessageEmbed().setColor("RED").setAuthor(`Bad ${subjectType} tested "${subject.name}".`, message.client.user?.displayAvatarURL()).setDescription(typeof subject.checkValue === "function" ? core.code.stringify({
        content: subject.checkValue.toString(),
        format: true,
        lang: "js"
      }) : subject.checkValue instanceof RegExp ? `Expected pattern: \`${subject.checkValue.source}\`` : "Please use the `--help` flag for more information.");
    }
    return true;
  }
  if (!checkResult.test(value)) {
    return new discord.MessageEmbed().setColor("RED").setAuthor(`Bad ${subjectType} pattern "${subject.name}".`, message.client.user?.displayAvatarURL()).setDescription(`Expected pattern: \`${checkResult.source}\``);
  }
  return true;
}
async function checkCastedValue(subject, subjectType, castedValue, message) {
  if (!subject.checkCastedValue)
    return true;
  console.log("castedValue:", castedValue);
  const checkResult = await core.scrap(subject.checkCastedValue, castedValue, message);
  const errorEmbed = (errorMessage) => {
    const embed = new discord.MessageEmbed().setColor("RED").setAuthor(`Bad ${subjectType} tested "${subject.name}".`, message.client.user?.displayAvatarURL()).setDescription(errorMessage);
    if (subject.checkingErrorMessage) {
      if (typeof subject.checkingErrorMessage === "string") {
        return embed.setDescription(subject.checkingErrorMessage);
      } else {
        return subject.checkingErrorMessage;
      }
    }
    return embed;
  };
  if (typeof checkResult === "string")
    return errorEmbed(checkResult);
  if (!checkResult)
    return errorEmbed(typeof subject.checkCastedValue === "function" ? core.code.stringify({
      content: subject.checkCastedValue.toString(),
      format: true,
      lang: "js"
    }) : "Please use the `--help` flag for more information.");
  return true;
}
async function castValue(subject, subjectType, baseValue, message, setValue) {
  const empty = new Error("The value is empty!");
  const cast = async () => {
    if (!subject.castValue)
      return;
    switch (subject.castValue) {
      case "boolean":
        if (baseValue === void 0)
          throw empty;
        else
          setValue(/^(?:true|1|oui|on|o|y|yes)$/i.test(baseValue));
        break;
      case "date":
        if (!baseValue) {
          throw empty;
        } else if (baseValue === "now") {
          setValue(new Date());
        } else if (/^[1-9]\d*$/.test(baseValue)) {
          setValue(Number(baseValue));
        } else {
          setValue(new Date(baseValue));
        }
        break;
      case "json":
        if (baseValue)
          setValue(JSON.parse(baseValue));
        else
          throw empty;
        break;
      case "number":
        setValue(Number(baseValue));
        if (!/^-?(?:0|[1-9]\d*)$/.test(baseValue ?? ""))
          throw new Error("The value is not a Number!");
        break;
      case "regex":
        if (baseValue)
          setValue(regexParser(baseValue));
        else
          throw empty;
        break;
      case "array":
        if (baseValue === void 0)
          setValue([]);
        else
          setValue(baseValue.split(/[,;|]/));
        break;
      case "channel":
      case "channel+":
        if (baseValue) {
          const match = /^(?:<#(\d+)>|(\d+))$/.exec(baseValue);
          if (match) {
            const id = match[1] ?? match[2];
            const channel = message.client.channels.cache.get(id);
            if (channel)
              setValue(channel);
            else
              throw new Error("Unknown channel!");
          } else if (subject.castValue === "channel+") {
            const search = (channel2) => {
              return "name" in channel2 && channel2.name.toLowerCase().includes(baseValue.toLowerCase());
            };
            let channel;
            if (command.isGuildMessage(message))
              channel = message.guild.channels.cache.find(search);
            channel ??= message.client.channels.cache.find(search);
            if (channel)
              setValue(channel);
            else
              throw new Error("Channel not found!");
          } else
            throw new Error("Invalid channel value!");
        } else
          throw empty;
        break;
      case "member":
      case "member+":
        if (baseValue) {
          if (command.isGuildMessage(message)) {
            const match = /^(?:<@!?(\d+)>|(\d+))$/.exec(baseValue);
            if (match) {
              const id = match[1] ?? match[2];
              const member = message.guild.members.cache.get(id);
              if (member)
                setValue(member);
              else
                throw new Error("Unknown member!");
            } else if (subject.castValue === "member+") {
              const member = message.guild.members.cache.find((member2) => {
                return member2.displayName.toLowerCase().includes(baseValue.toLowerCase()) || member2.user.username.toLowerCase().includes(baseValue.toLowerCase());
              });
              if (member)
                setValue(member);
              else
                throw new Error("Member not found!");
            } else
              throw new Error("Invalid member value!");
          } else
            throw new Error('The "GuildMember" casting is only available in a guild!');
        } else
          throw empty;
        break;
      case "message":
        if (baseValue) {
          const match = /^https?:\/\/discord\.com\/channels\/\d+\/(\d+)\/(\d+)$/.exec(baseValue);
          if (match) {
            const [, channelID, messageID] = match;
            const channel = message.client.channels.cache.get(channelID);
            if (channel) {
              if (channel.isText()) {
                setValue(await channel.messages.fetch(messageID, {
                  force: false,
                  cache: false
                }));
              } else
                throw new Error("Invalid channel type!");
            } else
              throw new Error("Unknown channel!");
          } else
            throw new Error("Invalid message link!");
        } else
          throw empty;
        break;
      case "user":
      case "user+":
        if (baseValue) {
          const match = /^(?:<@!?(\d+)>|(\d+))$/.exec(baseValue);
          if (match) {
            const id = match[1] ?? match[2];
            const user = await message.client.users.fetch(id, {
              force: false,
              cache: false
            });
            if (user)
              setValue(user);
            else
              throw new Error("Unknown user!");
          } else if (subject.castValue === "user+") {
            const user = message.client.users.cache.find((user2) => {
              return user2.username.toLowerCase().includes(baseValue.toLowerCase());
            });
            if (user)
              setValue(user);
            else
              throw new Error("User not found!");
          } else
            throw new Error("Invalid user value!");
        } else
          throw empty;
        break;
      case "role":
      case "role+":
        if (baseValue) {
          if (command.isGuildMessage(message)) {
            const match = /^(?:<@&?(\d+)>|(\d+))$/.exec(baseValue);
            if (match) {
              const id = match[1] ?? match[2];
              const role = message.guild.roles.cache.get(id);
              if (role)
                setValue(role);
              else
                throw new Error("Unknown role!");
            } else if (subject.castValue === "role+") {
              const role = message.guild.roles.cache.find((role2) => {
                return role2.name.toLowerCase().includes(baseValue.toLowerCase());
              });
              if (role)
                setValue(role);
              else
                throw new Error("Role not found!");
            } else
              throw new Error("Invalid role value!");
          } else
            throw new Error('The "GuildRole" casting is only available in a guild!');
        } else
          throw empty;
        break;
      case "emote":
        if (baseValue) {
          const match = /^(?:<a?:.+:(\d+)>|(\d+))$/.exec(baseValue);
          if (match) {
            const id = match[1] ?? match[2];
            const emote = message.client.emojis.cache.get(id);
            if (emote)
              setValue(emote);
            else
              throw new Error("Unknown emote!");
          } else {
            const emojiMatch = core.emojiRegex.exec(baseValue);
            if (emojiMatch)
              setValue(emojiMatch[0]);
            else
              throw new Error("Invalid emote value!");
          }
        } else
          throw empty;
        break;
      case "invite":
        if (baseValue) {
          if (command.isGuildMessage(message)) {
            const invites = await message.guild.invites.fetch();
            const invite = invites.find((invite2) => invite2.code === baseValue || invite2.url === baseValue);
            if (invite)
              setValue(invite);
            else
              throw new Error("Unknown invite!");
          } else
            throw new Error('The "Invite" casting is only available in a guild!');
        } else
          throw empty;
        break;
      default:
        if (baseValue === void 0)
          throw empty;
        else
          setValue(await subject.castValue(baseValue, message));
        break;
    }
  };
  try {
    await cast();
    return true;
  } catch (error) {
    const errorCode = core.code.stringify({
      content: `${error.name}: ${error.message}`,
      lang: "js"
    });
    if (subject.castingErrorMessage) {
      if (typeof subject.castingErrorMessage === "string") {
        return new discord.MessageEmbed().setColor("RED").setAuthor(`Bad ${subjectType} type "${subject.name}".`, message.client.user?.displayAvatarURL()).setDescription(subject.castingErrorMessage.replace(/@error/g, errorCode));
      } else {
        return subject.castingErrorMessage;
      }
    }
    return new discord.MessageEmbed().setColor("RED").setAuthor(`Bad ${subjectType} type "${subject.name}".`, message.client.user?.displayAvatarURL()).setDescription(`Cannot cast the value of the "${subject.name}" ${subjectType} to ${typeof subject.castValue === "function" ? "{*custom type*}" : "`" + subject.castValue + "`"}
${errorCode}`);
  }
}
function getTypeDescriptionOf(arg) {
  if (arg.typeDescription)
    return arg.typeDescription;
  if (!arg.castValue)
    return "string";
  if (typeof arg.castValue === "string") {
    if (arg.castValue === "array")
      return "Array<string>";
    return arg.castValue;
  }
  return "any";
}
function isFlag(arg) {
  return arg.hasOwnProperty("flag");
}
function trimArgumentValue(value) {
  const match = /^(?:"(.+)"|'(.+)'|(.+))$/s.exec(value);
  if (match)
    return match[1] ?? match[2] ?? match[3];
  return value;
}
export {
  castValue,
  checkCastedValue,
  checkValue,
  getTypeDescriptionOf,
  isFlag,
  resolveGivenArgument,
  trimArgumentValue
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2FwcC9hcmd1bWVudC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IGRpc2NvcmQgZnJvbSBcImRpc2NvcmQuanNcIlxyXG5pbXBvcnQgeWFyZ3NQYXJzZXIgZnJvbSBcInlhcmdzLXBhcnNlclwiXHJcbmltcG9ydCByZWdleFBhcnNlciBmcm9tIFwicmVnZXgtcGFyc2VyXCJcclxuXHJcbmltcG9ydCAqIGFzIGNvcmUgZnJvbSBcIi4vY29yZS5qc1wiXHJcbmltcG9ydCAqIGFzIGNvbW1hbmQgZnJvbSBcIi4vY29tbWFuZC5qc1wiXHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEFyZ3VtZW50IHtcclxuICBuYW1lOiBzdHJpbmdcclxuICBkZXNjcmlwdGlvbjogc3RyaW5nXHJcbiAgY2FzdGluZ0Vycm9yTWVzc2FnZT86IHN0cmluZyB8IGRpc2NvcmQuTWVzc2FnZUVtYmVkXHJcbiAgY2hlY2tpbmdFcnJvck1lc3NhZ2U/OiBzdHJpbmcgfCBkaXNjb3JkLk1lc3NhZ2VFbWJlZFxyXG4gIG1pc3NpbmdFcnJvck1lc3NhZ2U/OiBzdHJpbmcgfCBkaXNjb3JkLk1lc3NhZ2VFbWJlZFxyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFJlc3Q8TWVzc2FnZSBleHRlbmRzIGNvbW1hbmQuTm9ybWFsTWVzc2FnZT4gZXh0ZW5kcyBBcmd1bWVudCB7XHJcbiAgcmVxdWlyZWQ/OiBjb3JlLlNjcmFwPGJvb2xlYW4sIFttZXNzYWdlPzogTWVzc2FnZV0+XHJcbiAgZGVmYXVsdD86IGNvcmUuU2NyYXA8c3RyaW5nLCBbbWVzc2FnZT86IE1lc3NhZ2VdPlxyXG4gIGFsbD86IGJvb2xlYW5cclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBPcHRpb248TWVzc2FnZSBleHRlbmRzIGNvbW1hbmQuTm9ybWFsTWVzc2FnZT5cclxuICBleHRlbmRzIEFyZ3VtZW50IHtcclxuICBhbGlhc2VzPzogc3RyaW5nW11cclxuICBkZWZhdWx0PzogY29yZS5TY3JhcDxzdHJpbmcsIFttZXNzYWdlPzogTWVzc2FnZV0+XHJcbiAgcmVxdWlyZWQ/OiBjb3JlLlNjcmFwPGJvb2xlYW4sIFttZXNzYWdlPzogTWVzc2FnZV0+XHJcbiAgY2FzdFZhbHVlPzpcclxuICAgIHwgXCJudW1iZXJcIlxyXG4gICAgfCBcImRhdGVcIlxyXG4gICAgfCBcImpzb25cIlxyXG4gICAgfCBcImJvb2xlYW5cIlxyXG4gICAgfCBcInJlZ2V4XCJcclxuICAgIHwgXCJhcnJheVwiXHJcbiAgICB8IFwidXNlclwiXHJcbiAgICB8IFwidXNlcitcIlxyXG4gICAgfCBcIm1lbWJlclwiXHJcbiAgICB8IFwibWVtYmVyK1wiXHJcbiAgICB8IFwiY2hhbm5lbFwiXHJcbiAgICB8IFwiY2hhbm5lbCtcIlxyXG4gICAgfCBcIm1lc3NhZ2VcIlxyXG4gICAgfCBcInJvbGVcIlxyXG4gICAgfCBcInJvbGUrXCJcclxuICAgIHwgXCJlbW90ZVwiXHJcbiAgICB8IFwiaW52aXRlXCJcclxuICAgIHwgKCh2YWx1ZTogc3RyaW5nLCBtZXNzYWdlOiBNZXNzYWdlKSA9PiBhbnkpXHJcbiAgLyoqXHJcbiAgICogSWYgcmV0dXJucyBzdHJpbmcsIGl0IHVzZWQgYXMgZXJyb3IgbWVzc2FnZVxyXG4gICAqL1xyXG4gIGNoZWNrVmFsdWU/OlxyXG4gICAgfCBSZWdFeHBcclxuICAgIHwgc3RyaW5nW11cclxuICAgIHwgY29yZS5TY3JhcDxib29sZWFuIHwgUmVnRXhwIHwgc3RyaW5nLCBbdmFsdWU6IHN0cmluZywgbWVzc2FnZT86IE1lc3NhZ2VdPlxyXG4gIGNoZWNrQ2FzdGVkVmFsdWU/OiBjb3JlLlNjcmFwPFxyXG4gICAgYm9vbGVhbiB8IHN0cmluZyxcclxuICAgIFt2YWx1ZTogYW55LCBtZXNzYWdlPzogTWVzc2FnZV1cclxuICA+XHJcbiAgdHlwZURlc2NyaXB0aW9uPzogY29yZS5TY3JhcDxzdHJpbmcsIFt2YWx1ZTogc3RyaW5nLCBtZXNzYWdlPzogTWVzc2FnZV0+XHJcbn1cclxuXHJcbmV4cG9ydCB0eXBlIFBvc2l0aW9uYWw8TWVzc2FnZSBleHRlbmRzIGNvbW1hbmQuTm9ybWFsTWVzc2FnZT4gPSBPbWl0PFxyXG4gIE9wdGlvbjxNZXNzYWdlPixcclxuICBcImFsaWFzZXNcIlxyXG4+XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEZsYWc8TWVzc2FnZSBleHRlbmRzIGNvbW1hbmQuTm9ybWFsTWVzc2FnZT5cclxuICBleHRlbmRzIFBpY2s8XHJcbiAgICBPcHRpb248TWVzc2FnZT4sXHJcbiAgICBcIm5hbWVcIiB8IFwiYWxpYXNlc1wiIHwgXCJkZXNjcmlwdGlvblwiIHwgXCJjYXN0aW5nRXJyb3JNZXNzYWdlXCJcclxuICA+IHtcclxuICBmbGFnOiBzdHJpbmdcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVHaXZlbkFyZ3VtZW50PE1lc3NhZ2UgZXh0ZW5kcyBjb21tYW5kLk5vcm1hbE1lc3NhZ2U+KFxyXG4gIHBhcnNlZEFyZ3M6IHlhcmdzUGFyc2VyLkFyZ3VtZW50cyxcclxuICBhcmc6IE9wdGlvbjxNZXNzYWdlPiB8IEZsYWc8TWVzc2FnZT5cclxuKToge1xyXG4gIGdpdmVuOiBib29sZWFuXHJcbiAgbmFtZUlzR2l2ZW46IGJvb2xlYW5cclxuICB1c2VkTmFtZTogc3RyaW5nXHJcbiAgdmFsdWU6IGFueVxyXG59IHtcclxuICBsZXQgdXNlZE5hbWUgPSBhcmcubmFtZVxyXG4gIGxldCBuYW1lSXNHaXZlbiA9IHBhcnNlZEFyZ3MuaGFzT3duUHJvcGVydHkoYXJnLm5hbWUpXHJcbiAgbGV0IGdpdmVuID1cclxuICAgIHBhcnNlZEFyZ3NbYXJnLm5hbWVdICE9PSB1bmRlZmluZWQgJiYgcGFyc2VkQXJnc1thcmcubmFtZV0gIT09IG51bGxcclxuICBsZXQgdmFsdWUgPSBwYXJzZWRBcmdzW2FyZy5uYW1lXVxyXG5cclxuICBpZiAoIWdpdmVuICYmIGFyZy5hbGlhc2VzKSB7XHJcbiAgICBmb3IgKGNvbnN0IGFsaWFzIG9mIGFyZy5hbGlhc2VzKSB7XHJcbiAgICAgIGlmIChwYXJzZWRBcmdzLmhhc093blByb3BlcnR5KGFsaWFzKSkge1xyXG4gICAgICAgIHVzZWROYW1lID0gYWxpYXNcclxuICAgICAgICBuYW1lSXNHaXZlbiA9IHRydWVcclxuICAgICAgICBnaXZlbiA9IHRydWVcclxuICAgICAgICB2YWx1ZSA9IHBhcnNlZEFyZ3NbYWxpYXNdXHJcbiAgICAgICAgYnJlYWtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgaWYgKCFnaXZlbiAmJiBpc0ZsYWcoYXJnKSkge1xyXG4gICAgZ2l2ZW4gPSBwYXJzZWRBcmdzLmhhc093blByb3BlcnR5KGFyZy5mbGFnKVxyXG4gICAgdmFsdWUgPSBwYXJzZWRBcmdzW2FyZy5mbGFnXVxyXG4gICAgdXNlZE5hbWUgPSBhcmcuZmxhZ1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHsgZ2l2ZW4sIHVzZWROYW1lLCB2YWx1ZSwgbmFtZUlzR2l2ZW4gfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY2hlY2tWYWx1ZTxNZXNzYWdlIGV4dGVuZHMgY29tbWFuZC5Ob3JtYWxNZXNzYWdlPihcclxuICBzdWJqZWN0OiBQaWNrPE9wdGlvbjxNZXNzYWdlPiwgXCJjaGVja1ZhbHVlXCIgfCBcIm5hbWVcIj4sXHJcbiAgc3ViamVjdFR5cGU6IFwicG9zaXRpb25hbFwiIHwgXCJhcmd1bWVudFwiLFxyXG4gIHZhbHVlOiBzdHJpbmcsXHJcbiAgbWVzc2FnZTogTWVzc2FnZVxyXG4pOiBQcm9taXNlPGRpc2NvcmQuTWVzc2FnZUVtYmVkIHwgdHJ1ZT4ge1xyXG4gIGlmICghc3ViamVjdC5jaGVja1ZhbHVlKSByZXR1cm4gdHJ1ZVxyXG5cclxuICBpZiAoQXJyYXkuaXNBcnJheShzdWJqZWN0LmNoZWNrVmFsdWUpKSB7XHJcbiAgICBpZiAoc3ViamVjdC5jaGVja1ZhbHVlLmluY2x1ZGVzKHZhbHVlKSkge1xyXG4gICAgICByZXR1cm4gbmV3IGRpc2NvcmQuTWVzc2FnZUVtYmVkKClcclxuICAgICAgICAuc2V0Q29sb3IoXCJSRURcIilcclxuICAgICAgICAuc2V0QXV0aG9yKFxyXG4gICAgICAgICAgYEJhZCAke3N1YmplY3RUeXBlfSBwYXR0ZXJuIFwiJHtzdWJqZWN0Lm5hbWV9XCIuYCxcclxuICAgICAgICAgIG1lc3NhZ2UuY2xpZW50LnVzZXI/LmRpc3BsYXlBdmF0YXJVUkwoKVxyXG4gICAgICAgIClcclxuICAgICAgICAuc2V0RGVzY3JpcHRpb24oXHJcbiAgICAgICAgICBgRXhwZWN0ZWQgY2hvaWNlIGxpc3Q6IFxcYCR7c3ViamVjdC5jaGVja1ZhbHVlLmpvaW4oXCIgfCBcIil9XFxgYFxyXG4gICAgICAgIClcclxuICAgIH0gZWxzZSByZXR1cm4gdHJ1ZVxyXG4gIH1cclxuXHJcbiAgY29uc3QgY2hlY2tSZXN1bHQ6IHN0cmluZyB8IGJvb2xlYW4gfCBSZWdFeHAgPSBhd2FpdCBjb3JlLnNjcmFwKFxyXG4gICAgc3ViamVjdC5jaGVja1ZhbHVlLFxyXG4gICAgdmFsdWUsXHJcbiAgICBtZXNzYWdlXHJcbiAgKVxyXG5cclxuICBpZiAodHlwZW9mIGNoZWNrUmVzdWx0ID09PSBcInN0cmluZ1wiKSB7XHJcbiAgICByZXR1cm4gbmV3IGRpc2NvcmQuTWVzc2FnZUVtYmVkKClcclxuICAgICAgLnNldENvbG9yKFwiUkVEXCIpXHJcbiAgICAgIC5zZXRBdXRob3IoXHJcbiAgICAgICAgYEJhZCAke3N1YmplY3RUeXBlfSB0ZXN0ZWQgXCIke3N1YmplY3QubmFtZX1cIi5gLFxyXG4gICAgICAgIG1lc3NhZ2UuY2xpZW50LnVzZXI/LmRpc3BsYXlBdmF0YXJVUkwoKVxyXG4gICAgICApXHJcbiAgICAgIC5zZXREZXNjcmlwdGlvbihjaGVja1Jlc3VsdClcclxuICB9XHJcblxyXG4gIGlmICh0eXBlb2YgY2hlY2tSZXN1bHQgPT09IFwiYm9vbGVhblwiKSB7XHJcbiAgICBpZiAoIWNoZWNrUmVzdWx0KSB7XHJcbiAgICAgIHJldHVybiBuZXcgZGlzY29yZC5NZXNzYWdlRW1iZWQoKVxyXG4gICAgICAgIC5zZXRDb2xvcihcIlJFRFwiKVxyXG4gICAgICAgIC5zZXRBdXRob3IoXHJcbiAgICAgICAgICBgQmFkICR7c3ViamVjdFR5cGV9IHRlc3RlZCBcIiR7c3ViamVjdC5uYW1lfVwiLmAsXHJcbiAgICAgICAgICBtZXNzYWdlLmNsaWVudC51c2VyPy5kaXNwbGF5QXZhdGFyVVJMKClcclxuICAgICAgICApXHJcbiAgICAgICAgLnNldERlc2NyaXB0aW9uKFxyXG4gICAgICAgICAgdHlwZW9mIHN1YmplY3QuY2hlY2tWYWx1ZSA9PT0gXCJmdW5jdGlvblwiXHJcbiAgICAgICAgICAgID8gY29yZS5jb2RlLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgICAgICAgICBjb250ZW50OiBzdWJqZWN0LmNoZWNrVmFsdWUudG9TdHJpbmcoKSxcclxuICAgICAgICAgICAgICAgIGZvcm1hdDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIGxhbmc6IFwianNcIixcclxuICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICA6IHN1YmplY3QuY2hlY2tWYWx1ZSBpbnN0YW5jZW9mIFJlZ0V4cFxyXG4gICAgICAgICAgICA/IGBFeHBlY3RlZCBwYXR0ZXJuOiBcXGAke3N1YmplY3QuY2hlY2tWYWx1ZS5zb3VyY2V9XFxgYFxyXG4gICAgICAgICAgICA6IFwiUGxlYXNlIHVzZSB0aGUgYC0taGVscGAgZmxhZyBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cIlxyXG4gICAgICAgIClcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdHJ1ZVxyXG4gIH1cclxuXHJcbiAgaWYgKCFjaGVja1Jlc3VsdC50ZXN0KHZhbHVlKSkge1xyXG4gICAgcmV0dXJuIG5ldyBkaXNjb3JkLk1lc3NhZ2VFbWJlZCgpXHJcbiAgICAgIC5zZXRDb2xvcihcIlJFRFwiKVxyXG4gICAgICAuc2V0QXV0aG9yKFxyXG4gICAgICAgIGBCYWQgJHtzdWJqZWN0VHlwZX0gcGF0dGVybiBcIiR7c3ViamVjdC5uYW1lfVwiLmAsXHJcbiAgICAgICAgbWVzc2FnZS5jbGllbnQudXNlcj8uZGlzcGxheUF2YXRhclVSTCgpXHJcbiAgICAgIClcclxuICAgICAgLnNldERlc2NyaXB0aW9uKGBFeHBlY3RlZCBwYXR0ZXJuOiBcXGAke2NoZWNrUmVzdWx0LnNvdXJjZX1cXGBgKVxyXG4gIH1cclxuICByZXR1cm4gdHJ1ZVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY2hlY2tDYXN0ZWRWYWx1ZTxNZXNzYWdlIGV4dGVuZHMgY29tbWFuZC5Ob3JtYWxNZXNzYWdlPihcclxuICBzdWJqZWN0OiBQaWNrPFxyXG4gICAgT3B0aW9uPE1lc3NhZ2U+LFxyXG4gICAgXCJjaGVja0Nhc3RlZFZhbHVlXCIgfCBcIm5hbWVcIiB8IFwiY2hlY2tpbmdFcnJvck1lc3NhZ2VcIlxyXG4gID4sXHJcbiAgc3ViamVjdFR5cGU6IFwicG9zaXRpb25hbFwiIHwgXCJhcmd1bWVudFwiLFxyXG4gIGNhc3RlZFZhbHVlOiBhbnksXHJcbiAgbWVzc2FnZTogTWVzc2FnZVxyXG4pOiBQcm9taXNlPGRpc2NvcmQuTWVzc2FnZUVtYmVkIHwgdHJ1ZT4ge1xyXG4gIGlmICghc3ViamVjdC5jaGVja0Nhc3RlZFZhbHVlKSByZXR1cm4gdHJ1ZVxyXG5cclxuICBjb25zb2xlLmxvZyhcImNhc3RlZFZhbHVlOlwiLCBjYXN0ZWRWYWx1ZSlcclxuXHJcbiAgY29uc3QgY2hlY2tSZXN1bHQ6IHN0cmluZyB8IGJvb2xlYW4gPSBhd2FpdCBjb3JlLnNjcmFwKFxyXG4gICAgc3ViamVjdC5jaGVja0Nhc3RlZFZhbHVlLFxyXG4gICAgY2FzdGVkVmFsdWUsXHJcbiAgICBtZXNzYWdlXHJcbiAgKVxyXG5cclxuICBjb25zdCBlcnJvckVtYmVkID0gKGVycm9yTWVzc2FnZTogc3RyaW5nKTogZGlzY29yZC5NZXNzYWdlRW1iZWQgPT4ge1xyXG4gICAgY29uc3QgZW1iZWQgPSBuZXcgZGlzY29yZC5NZXNzYWdlRW1iZWQoKVxyXG4gICAgICAuc2V0Q29sb3IoXCJSRURcIilcclxuICAgICAgLnNldEF1dGhvcihcclxuICAgICAgICBgQmFkICR7c3ViamVjdFR5cGV9IHRlc3RlZCBcIiR7c3ViamVjdC5uYW1lfVwiLmAsXHJcbiAgICAgICAgbWVzc2FnZS5jbGllbnQudXNlcj8uZGlzcGxheUF2YXRhclVSTCgpXHJcbiAgICAgIClcclxuICAgICAgLnNldERlc2NyaXB0aW9uKGVycm9yTWVzc2FnZSlcclxuXHJcbiAgICBpZiAoc3ViamVjdC5jaGVja2luZ0Vycm9yTWVzc2FnZSkge1xyXG4gICAgICBpZiAodHlwZW9mIHN1YmplY3QuY2hlY2tpbmdFcnJvck1lc3NhZ2UgPT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgICByZXR1cm4gZW1iZWQuc2V0RGVzY3JpcHRpb24oc3ViamVjdC5jaGVja2luZ0Vycm9yTWVzc2FnZSlcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gc3ViamVjdC5jaGVja2luZ0Vycm9yTWVzc2FnZVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGVtYmVkXHJcbiAgfVxyXG5cclxuICBpZiAodHlwZW9mIGNoZWNrUmVzdWx0ID09PSBcInN0cmluZ1wiKSByZXR1cm4gZXJyb3JFbWJlZChjaGVja1Jlc3VsdClcclxuXHJcbiAgaWYgKCFjaGVja1Jlc3VsdClcclxuICAgIHJldHVybiBlcnJvckVtYmVkKFxyXG4gICAgICB0eXBlb2Ygc3ViamVjdC5jaGVja0Nhc3RlZFZhbHVlID09PSBcImZ1bmN0aW9uXCJcclxuICAgICAgICA/IGNvcmUuY29kZS5zdHJpbmdpZnkoe1xyXG4gICAgICAgICAgICBjb250ZW50OiBzdWJqZWN0LmNoZWNrQ2FzdGVkVmFsdWUudG9TdHJpbmcoKSxcclxuICAgICAgICAgICAgZm9ybWF0OiB0cnVlLFxyXG4gICAgICAgICAgICBsYW5nOiBcImpzXCIsXHJcbiAgICAgICAgICB9KVxyXG4gICAgICAgIDogXCJQbGVhc2UgdXNlIHRoZSBgLS1oZWxwYCBmbGFnIGZvciBtb3JlIGluZm9ybWF0aW9uLlwiXHJcbiAgICApXHJcblxyXG4gIHJldHVybiB0cnVlXHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjYXN0VmFsdWU8TWVzc2FnZSBleHRlbmRzIGNvbW1hbmQuTm9ybWFsTWVzc2FnZT4oXHJcbiAgc3ViamVjdDogUGljazxPcHRpb248TWVzc2FnZT4sIFwiY2FzdFZhbHVlXCIgfCBcIm5hbWVcIiB8IFwiY2FzdGluZ0Vycm9yTWVzc2FnZVwiPixcclxuICBzdWJqZWN0VHlwZTogXCJwb3NpdGlvbmFsXCIgfCBcImFyZ3VtZW50XCIsXHJcbiAgYmFzZVZhbHVlOiBzdHJpbmcgfCB1bmRlZmluZWQsXHJcbiAgbWVzc2FnZTogTWVzc2FnZSxcclxuICBzZXRWYWx1ZTogKHZhbHVlOiBhbnkpID0+IHVua25vd25cclxuKTogUHJvbWlzZTxkaXNjb3JkLk1lc3NhZ2VFbWJlZCB8IHRydWU+IHtcclxuICBjb25zdCBlbXB0eSA9IG5ldyBFcnJvcihcIlRoZSB2YWx1ZSBpcyBlbXB0eSFcIilcclxuXHJcbiAgY29uc3QgY2FzdCA9IGFzeW5jICgpID0+IHtcclxuICAgIGlmICghc3ViamVjdC5jYXN0VmFsdWUpIHJldHVyblxyXG5cclxuICAgIHN3aXRjaCAoc3ViamVjdC5jYXN0VmFsdWUpIHtcclxuICAgICAgY2FzZSBcImJvb2xlYW5cIjpcclxuICAgICAgICBpZiAoYmFzZVZhbHVlID09PSB1bmRlZmluZWQpIHRocm93IGVtcHR5XHJcbiAgICAgICAgZWxzZSBzZXRWYWx1ZSgvXig/OnRydWV8MXxvdWl8b258b3x5fHllcykkL2kudGVzdChiYXNlVmFsdWUpKVxyXG4gICAgICAgIGJyZWFrXHJcbiAgICAgIGNhc2UgXCJkYXRlXCI6XHJcbiAgICAgICAgaWYgKCFiYXNlVmFsdWUpIHtcclxuICAgICAgICAgIHRocm93IGVtcHR5XHJcbiAgICAgICAgfSBlbHNlIGlmIChiYXNlVmFsdWUgPT09IFwibm93XCIpIHtcclxuICAgICAgICAgIHNldFZhbHVlKG5ldyBEYXRlKCkpXHJcbiAgICAgICAgfSBlbHNlIGlmICgvXlsxLTldXFxkKiQvLnRlc3QoYmFzZVZhbHVlKSkge1xyXG4gICAgICAgICAgc2V0VmFsdWUoTnVtYmVyKGJhc2VWYWx1ZSkpXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHNldFZhbHVlKG5ldyBEYXRlKGJhc2VWYWx1ZSkpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGJyZWFrXHJcbiAgICAgIGNhc2UgXCJqc29uXCI6XHJcbiAgICAgICAgaWYgKGJhc2VWYWx1ZSkgc2V0VmFsdWUoSlNPTi5wYXJzZShiYXNlVmFsdWUpKVxyXG4gICAgICAgIGVsc2UgdGhyb3cgZW1wdHlcclxuICAgICAgICBicmVha1xyXG4gICAgICBjYXNlIFwibnVtYmVyXCI6XHJcbiAgICAgICAgc2V0VmFsdWUoTnVtYmVyKGJhc2VWYWx1ZSkpXHJcbiAgICAgICAgaWYgKCEvXi0/KD86MHxbMS05XVxcZCopJC8udGVzdChiYXNlVmFsdWUgPz8gXCJcIikpXHJcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUaGUgdmFsdWUgaXMgbm90IGEgTnVtYmVyIVwiKVxyXG4gICAgICAgIGJyZWFrXHJcbiAgICAgIGNhc2UgXCJyZWdleFwiOlxyXG4gICAgICAgIGlmIChiYXNlVmFsdWUpIHNldFZhbHVlKHJlZ2V4UGFyc2VyKGJhc2VWYWx1ZSkpXHJcbiAgICAgICAgZWxzZSB0aHJvdyBlbXB0eVxyXG4gICAgICAgIGJyZWFrXHJcbiAgICAgIGNhc2UgXCJhcnJheVwiOlxyXG4gICAgICAgIGlmIChiYXNlVmFsdWUgPT09IHVuZGVmaW5lZCkgc2V0VmFsdWUoW10pXHJcbiAgICAgICAgZWxzZSBzZXRWYWx1ZShiYXNlVmFsdWUuc3BsaXQoL1ssO3xdLykpXHJcbiAgICAgICAgYnJlYWtcclxuICAgICAgY2FzZSBcImNoYW5uZWxcIjpcclxuICAgICAgY2FzZSBcImNoYW5uZWwrXCI6XHJcbiAgICAgICAgaWYgKGJhc2VWYWx1ZSkge1xyXG4gICAgICAgICAgY29uc3QgbWF0Y2ggPSAvXig/OjwjKFxcZCspPnwoXFxkKykpJC8uZXhlYyhiYXNlVmFsdWUpXHJcbiAgICAgICAgICBpZiAobWF0Y2gpIHtcclxuICAgICAgICAgICAgY29uc3QgaWQgPSBtYXRjaFsxXSA/PyBtYXRjaFsyXVxyXG4gICAgICAgICAgICBjb25zdCBjaGFubmVsID0gbWVzc2FnZS5jbGllbnQuY2hhbm5lbHMuY2FjaGUuZ2V0KGlkKVxyXG4gICAgICAgICAgICBpZiAoY2hhbm5lbCkgc2V0VmFsdWUoY2hhbm5lbClcclxuICAgICAgICAgICAgZWxzZSB0aHJvdyBuZXcgRXJyb3IoXCJVbmtub3duIGNoYW5uZWwhXCIpXHJcbiAgICAgICAgICB9IGVsc2UgaWYgKHN1YmplY3QuY2FzdFZhbHVlID09PSBcImNoYW5uZWwrXCIpIHtcclxuICAgICAgICAgICAgY29uc3Qgc2VhcmNoID0gKGNoYW5uZWw6IGRpc2NvcmQuQ2hhbm5lbCkgPT4ge1xyXG4gICAgICAgICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgICAgICBcIm5hbWVcIiBpbiBjaGFubmVsICYmIC8vIEB0cy1pZ25vcmVcclxuICAgICAgICAgICAgICAgIGNoYW5uZWwubmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKGJhc2VWYWx1ZS50b0xvd2VyQ2FzZSgpKVxyXG4gICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBsZXQgY2hhbm5lbDogZGlzY29yZC5DaGFubmVsIHwgdW5kZWZpbmVkXHJcbiAgICAgICAgICAgIGlmIChjb21tYW5kLmlzR3VpbGRNZXNzYWdlKG1lc3NhZ2UpKVxyXG4gICAgICAgICAgICAgIGNoYW5uZWwgPSBtZXNzYWdlLmd1aWxkLmNoYW5uZWxzLmNhY2hlLmZpbmQoc2VhcmNoKVxyXG4gICAgICAgICAgICBjaGFubmVsID8/PSBtZXNzYWdlLmNsaWVudC5jaGFubmVscy5jYWNoZS5maW5kKHNlYXJjaClcclxuICAgICAgICAgICAgaWYgKGNoYW5uZWwpIHNldFZhbHVlKGNoYW5uZWwpXHJcbiAgICAgICAgICAgIGVsc2UgdGhyb3cgbmV3IEVycm9yKFwiQ2hhbm5lbCBub3QgZm91bmQhXCIpXHJcbiAgICAgICAgICB9IGVsc2UgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBjaGFubmVsIHZhbHVlIVwiKVxyXG4gICAgICAgIH0gZWxzZSB0aHJvdyBlbXB0eVxyXG4gICAgICAgIGJyZWFrXHJcbiAgICAgIGNhc2UgXCJtZW1iZXJcIjpcclxuICAgICAgY2FzZSBcIm1lbWJlcitcIjpcclxuICAgICAgICBpZiAoYmFzZVZhbHVlKSB7XHJcbiAgICAgICAgICBpZiAoY29tbWFuZC5pc0d1aWxkTWVzc2FnZShtZXNzYWdlKSkge1xyXG4gICAgICAgICAgICBjb25zdCBtYXRjaCA9IC9eKD86PEAhPyhcXGQrKT58KFxcZCspKSQvLmV4ZWMoYmFzZVZhbHVlKVxyXG4gICAgICAgICAgICBpZiAobWF0Y2gpIHtcclxuICAgICAgICAgICAgICBjb25zdCBpZCA9IG1hdGNoWzFdID8/IG1hdGNoWzJdXHJcbiAgICAgICAgICAgICAgY29uc3QgbWVtYmVyID0gbWVzc2FnZS5ndWlsZC5tZW1iZXJzLmNhY2hlLmdldChpZClcclxuICAgICAgICAgICAgICBpZiAobWVtYmVyKSBzZXRWYWx1ZShtZW1iZXIpXHJcbiAgICAgICAgICAgICAgZWxzZSB0aHJvdyBuZXcgRXJyb3IoXCJVbmtub3duIG1lbWJlciFcIilcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChzdWJqZWN0LmNhc3RWYWx1ZSA9PT0gXCJtZW1iZXIrXCIpIHtcclxuICAgICAgICAgICAgICBjb25zdCBtZW1iZXIgPSBtZXNzYWdlLmd1aWxkLm1lbWJlcnMuY2FjaGUuZmluZCgobWVtYmVyKSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICAgICAgICBtZW1iZXIuZGlzcGxheU5hbWVcclxuICAgICAgICAgICAgICAgICAgICAudG9Mb3dlckNhc2UoKVxyXG4gICAgICAgICAgICAgICAgICAgIC5pbmNsdWRlcyhiYXNlVmFsdWUudG9Mb3dlckNhc2UoKSkgfHxcclxuICAgICAgICAgICAgICAgICAgbWVtYmVyLnVzZXIudXNlcm5hbWVcclxuICAgICAgICAgICAgICAgICAgICAudG9Mb3dlckNhc2UoKVxyXG4gICAgICAgICAgICAgICAgICAgIC5pbmNsdWRlcyhiYXNlVmFsdWUudG9Mb3dlckNhc2UoKSlcclxuICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgIGlmIChtZW1iZXIpIHNldFZhbHVlKG1lbWJlcilcclxuICAgICAgICAgICAgICBlbHNlIHRocm93IG5ldyBFcnJvcihcIk1lbWJlciBub3QgZm91bmQhXCIpXHJcbiAgICAgICAgICAgIH0gZWxzZSB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIG1lbWJlciB2YWx1ZSFcIilcclxuICAgICAgICAgIH0gZWxzZVxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXHJcbiAgICAgICAgICAgICAgJ1RoZSBcIkd1aWxkTWVtYmVyXCIgY2FzdGluZyBpcyBvbmx5IGF2YWlsYWJsZSBpbiBhIGd1aWxkISdcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgIH0gZWxzZSB0aHJvdyBlbXB0eVxyXG4gICAgICAgIGJyZWFrXHJcbiAgICAgIGNhc2UgXCJtZXNzYWdlXCI6XHJcbiAgICAgICAgaWYgKGJhc2VWYWx1ZSkge1xyXG4gICAgICAgICAgY29uc3QgbWF0Y2ggPVxyXG4gICAgICAgICAgICAvXmh0dHBzPzpcXC9cXC9kaXNjb3JkXFwuY29tXFwvY2hhbm5lbHNcXC9cXGQrXFwvKFxcZCspXFwvKFxcZCspJC8uZXhlYyhcclxuICAgICAgICAgICAgICBiYXNlVmFsdWVcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgaWYgKG1hdGNoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IFssIGNoYW5uZWxJRCwgbWVzc2FnZUlEXSA9IG1hdGNoXHJcbiAgICAgICAgICAgIGNvbnN0IGNoYW5uZWwgPSBtZXNzYWdlLmNsaWVudC5jaGFubmVscy5jYWNoZS5nZXQoY2hhbm5lbElEKVxyXG4gICAgICAgICAgICBpZiAoY2hhbm5lbCkge1xyXG4gICAgICAgICAgICAgIGlmIChjaGFubmVsLmlzVGV4dCgpKSB7XHJcbiAgICAgICAgICAgICAgICBzZXRWYWx1ZShcclxuICAgICAgICAgICAgICAgICAgYXdhaXQgY2hhbm5lbC5tZXNzYWdlcy5mZXRjaChtZXNzYWdlSUQsIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3JjZTogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgY2FjaGU6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgIH0gZWxzZSB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIGNoYW5uZWwgdHlwZSFcIilcclxuICAgICAgICAgICAgfSBlbHNlIHRocm93IG5ldyBFcnJvcihcIlVua25vd24gY2hhbm5lbCFcIilcclxuICAgICAgICAgIH0gZWxzZSB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIG1lc3NhZ2UgbGluayFcIilcclxuICAgICAgICB9IGVsc2UgdGhyb3cgZW1wdHlcclxuICAgICAgICBicmVha1xyXG4gICAgICBjYXNlIFwidXNlclwiOlxyXG4gICAgICBjYXNlIFwidXNlcitcIjpcclxuICAgICAgICBpZiAoYmFzZVZhbHVlKSB7XHJcbiAgICAgICAgICBjb25zdCBtYXRjaCA9IC9eKD86PEAhPyhcXGQrKT58KFxcZCspKSQvLmV4ZWMoYmFzZVZhbHVlKVxyXG4gICAgICAgICAgaWYgKG1hdGNoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGlkID0gbWF0Y2hbMV0gPz8gbWF0Y2hbMl1cclxuICAgICAgICAgICAgY29uc3QgdXNlciA9IGF3YWl0IG1lc3NhZ2UuY2xpZW50LnVzZXJzLmZldGNoKGlkLCB7XHJcbiAgICAgICAgICAgICAgZm9yY2U6IGZhbHNlLFxyXG4gICAgICAgICAgICAgIGNhY2hlOiBmYWxzZSxcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgaWYgKHVzZXIpIHNldFZhbHVlKHVzZXIpXHJcbiAgICAgICAgICAgIGVsc2UgdGhyb3cgbmV3IEVycm9yKFwiVW5rbm93biB1c2VyIVwiKVxyXG4gICAgICAgICAgfSBlbHNlIGlmIChzdWJqZWN0LmNhc3RWYWx1ZSA9PT0gXCJ1c2VyK1wiKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHVzZXIgPSBtZXNzYWdlLmNsaWVudC51c2Vycy5jYWNoZS5maW5kKCh1c2VyKSA9PiB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIHVzZXIudXNlcm5hbWVcclxuICAgICAgICAgICAgICAgIC50b0xvd2VyQ2FzZSgpXHJcbiAgICAgICAgICAgICAgICAuaW5jbHVkZXMoYmFzZVZhbHVlLnRvTG93ZXJDYXNlKCkpXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIGlmICh1c2VyKSBzZXRWYWx1ZSh1c2VyKVxyXG4gICAgICAgICAgICBlbHNlIHRocm93IG5ldyBFcnJvcihcIlVzZXIgbm90IGZvdW5kIVwiKVxyXG4gICAgICAgICAgfSBlbHNlIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgdXNlciB2YWx1ZSFcIilcclxuICAgICAgICB9IGVsc2UgdGhyb3cgZW1wdHlcclxuICAgICAgICBicmVha1xyXG4gICAgICBjYXNlIFwicm9sZVwiOlxyXG4gICAgICBjYXNlIFwicm9sZStcIjpcclxuICAgICAgICBpZiAoYmFzZVZhbHVlKSB7XHJcbiAgICAgICAgICBpZiAoY29tbWFuZC5pc0d1aWxkTWVzc2FnZShtZXNzYWdlKSkge1xyXG4gICAgICAgICAgICBjb25zdCBtYXRjaCA9IC9eKD86PEAmPyhcXGQrKT58KFxcZCspKSQvLmV4ZWMoYmFzZVZhbHVlKVxyXG4gICAgICAgICAgICBpZiAobWF0Y2gpIHtcclxuICAgICAgICAgICAgICBjb25zdCBpZCA9IG1hdGNoWzFdID8/IG1hdGNoWzJdXHJcbiAgICAgICAgICAgICAgY29uc3Qgcm9sZSA9IG1lc3NhZ2UuZ3VpbGQucm9sZXMuY2FjaGUuZ2V0KGlkKVxyXG4gICAgICAgICAgICAgIGlmIChyb2xlKSBzZXRWYWx1ZShyb2xlKVxyXG4gICAgICAgICAgICAgIGVsc2UgdGhyb3cgbmV3IEVycm9yKFwiVW5rbm93biByb2xlIVwiKVxyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHN1YmplY3QuY2FzdFZhbHVlID09PSBcInJvbGUrXCIpIHtcclxuICAgICAgICAgICAgICBjb25zdCByb2xlID0gbWVzc2FnZS5ndWlsZC5yb2xlcy5jYWNoZS5maW5kKChyb2xlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcm9sZS5uYW1lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoYmFzZVZhbHVlLnRvTG93ZXJDYXNlKCkpXHJcbiAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICBpZiAocm9sZSkgc2V0VmFsdWUocm9sZSlcclxuICAgICAgICAgICAgICBlbHNlIHRocm93IG5ldyBFcnJvcihcIlJvbGUgbm90IGZvdW5kIVwiKVxyXG4gICAgICAgICAgICB9IGVsc2UgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCByb2xlIHZhbHVlIVwiKVxyXG4gICAgICAgICAgfSBlbHNlXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcclxuICAgICAgICAgICAgICAnVGhlIFwiR3VpbGRSb2xlXCIgY2FzdGluZyBpcyBvbmx5IGF2YWlsYWJsZSBpbiBhIGd1aWxkISdcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgIH0gZWxzZSB0aHJvdyBlbXB0eVxyXG4gICAgICAgIGJyZWFrXHJcbiAgICAgIGNhc2UgXCJlbW90ZVwiOlxyXG4gICAgICAgIGlmIChiYXNlVmFsdWUpIHtcclxuICAgICAgICAgIGNvbnN0IG1hdGNoID0gL14oPzo8YT86Lis6KFxcZCspPnwoXFxkKykpJC8uZXhlYyhiYXNlVmFsdWUpXHJcbiAgICAgICAgICBpZiAobWF0Y2gpIHtcclxuICAgICAgICAgICAgY29uc3QgaWQgPSBtYXRjaFsxXSA/PyBtYXRjaFsyXVxyXG4gICAgICAgICAgICBjb25zdCBlbW90ZSA9IG1lc3NhZ2UuY2xpZW50LmVtb2ppcy5jYWNoZS5nZXQoaWQpXHJcbiAgICAgICAgICAgIGlmIChlbW90ZSkgc2V0VmFsdWUoZW1vdGUpXHJcbiAgICAgICAgICAgIGVsc2UgdGhyb3cgbmV3IEVycm9yKFwiVW5rbm93biBlbW90ZSFcIilcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGVtb2ppTWF0Y2ggPSBjb3JlLmVtb2ppUmVnZXguZXhlYyhiYXNlVmFsdWUpXHJcbiAgICAgICAgICAgIGlmIChlbW9qaU1hdGNoKSBzZXRWYWx1ZShlbW9qaU1hdGNoWzBdKVxyXG4gICAgICAgICAgICBlbHNlIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgZW1vdGUgdmFsdWUhXCIpXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHRocm93IGVtcHR5XHJcbiAgICAgICAgYnJlYWtcclxuICAgICAgY2FzZSBcImludml0ZVwiOlxyXG4gICAgICAgIGlmIChiYXNlVmFsdWUpIHtcclxuICAgICAgICAgIGlmIChjb21tYW5kLmlzR3VpbGRNZXNzYWdlKG1lc3NhZ2UpKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGludml0ZXMgPSBhd2FpdCBtZXNzYWdlLmd1aWxkLmludml0ZXMuZmV0Y2goKVxyXG4gICAgICAgICAgICBjb25zdCBpbnZpdGUgPSBpbnZpdGVzLmZpbmQoXHJcbiAgICAgICAgICAgICAgKGludml0ZSkgPT4gaW52aXRlLmNvZGUgPT09IGJhc2VWYWx1ZSB8fCBpbnZpdGUudXJsID09PSBiYXNlVmFsdWVcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICBpZiAoaW52aXRlKSBzZXRWYWx1ZShpbnZpdGUpXHJcbiAgICAgICAgICAgIGVsc2UgdGhyb3cgbmV3IEVycm9yKFwiVW5rbm93biBpbnZpdGUhXCIpXHJcbiAgICAgICAgICB9IGVsc2VcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxyXG4gICAgICAgICAgICAgICdUaGUgXCJJbnZpdGVcIiBjYXN0aW5nIGlzIG9ubHkgYXZhaWxhYmxlIGluIGEgZ3VpbGQhJ1xyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgfSBlbHNlIHRocm93IGVtcHR5XHJcbiAgICAgICAgYnJlYWtcclxuICAgICAgZGVmYXVsdDpcclxuICAgICAgICBpZiAoYmFzZVZhbHVlID09PSB1bmRlZmluZWQpIHRocm93IGVtcHR5XHJcbiAgICAgICAgZWxzZSBzZXRWYWx1ZShhd2FpdCBzdWJqZWN0LmNhc3RWYWx1ZShiYXNlVmFsdWUsIG1lc3NhZ2UpKVxyXG4gICAgICAgIGJyZWFrXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICB0cnkge1xyXG4gICAgYXdhaXQgY2FzdCgpXHJcbiAgICByZXR1cm4gdHJ1ZVxyXG4gIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcclxuICAgIGNvbnN0IGVycm9yQ29kZSA9IGNvcmUuY29kZS5zdHJpbmdpZnkoe1xyXG4gICAgICBjb250ZW50OiBgJHtlcnJvci5uYW1lfTogJHtlcnJvci5tZXNzYWdlfWAsXHJcbiAgICAgIGxhbmc6IFwianNcIixcclxuICAgIH0pXHJcblxyXG4gICAgaWYgKHN1YmplY3QuY2FzdGluZ0Vycm9yTWVzc2FnZSkge1xyXG4gICAgICBpZiAodHlwZW9mIHN1YmplY3QuY2FzdGluZ0Vycm9yTWVzc2FnZSA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICAgIHJldHVybiBuZXcgZGlzY29yZC5NZXNzYWdlRW1iZWQoKVxyXG4gICAgICAgICAgLnNldENvbG9yKFwiUkVEXCIpXHJcbiAgICAgICAgICAuc2V0QXV0aG9yKFxyXG4gICAgICAgICAgICBgQmFkICR7c3ViamVjdFR5cGV9IHR5cGUgXCIke3N1YmplY3QubmFtZX1cIi5gLFxyXG4gICAgICAgICAgICBtZXNzYWdlLmNsaWVudC51c2VyPy5kaXNwbGF5QXZhdGFyVVJMKClcclxuICAgICAgICAgIClcclxuICAgICAgICAgIC5zZXREZXNjcmlwdGlvbihcclxuICAgICAgICAgICAgc3ViamVjdC5jYXN0aW5nRXJyb3JNZXNzYWdlLnJlcGxhY2UoL0BlcnJvci9nLCBlcnJvckNvZGUpXHJcbiAgICAgICAgICApXHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIHN1YmplY3QuY2FzdGluZ0Vycm9yTWVzc2FnZVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG5ldyBkaXNjb3JkLk1lc3NhZ2VFbWJlZCgpXHJcbiAgICAgIC5zZXRDb2xvcihcIlJFRFwiKVxyXG4gICAgICAuc2V0QXV0aG9yKFxyXG4gICAgICAgIGBCYWQgJHtzdWJqZWN0VHlwZX0gdHlwZSBcIiR7c3ViamVjdC5uYW1lfVwiLmAsXHJcbiAgICAgICAgbWVzc2FnZS5jbGllbnQudXNlcj8uZGlzcGxheUF2YXRhclVSTCgpXHJcbiAgICAgIClcclxuICAgICAgLnNldERlc2NyaXB0aW9uKFxyXG4gICAgICAgIGBDYW5ub3QgY2FzdCB0aGUgdmFsdWUgb2YgdGhlIFwiJHtzdWJqZWN0Lm5hbWV9XCIgJHtzdWJqZWN0VHlwZX0gdG8gJHtcclxuICAgICAgICAgIHR5cGVvZiBzdWJqZWN0LmNhc3RWYWx1ZSA9PT0gXCJmdW5jdGlvblwiXHJcbiAgICAgICAgICAgID8gXCJ7KmN1c3RvbSB0eXBlKn1cIlxyXG4gICAgICAgICAgICA6IFwiYFwiICsgc3ViamVjdC5jYXN0VmFsdWUgKyBcImBcIlxyXG4gICAgICAgIH1cXG4ke2Vycm9yQ29kZX1gXHJcbiAgICAgIClcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRUeXBlRGVzY3JpcHRpb25PZjxNZXNzYWdlIGV4dGVuZHMgY29tbWFuZC5Ob3JtYWxNZXNzYWdlPihcclxuICBhcmc6IE9wdGlvbjxNZXNzYWdlPlxyXG4pIHtcclxuICBpZiAoYXJnLnR5cGVEZXNjcmlwdGlvbikgcmV0dXJuIGFyZy50eXBlRGVzY3JpcHRpb25cclxuICBpZiAoIWFyZy5jYXN0VmFsdWUpIHJldHVybiBcInN0cmluZ1wiXHJcbiAgaWYgKHR5cGVvZiBhcmcuY2FzdFZhbHVlID09PSBcInN0cmluZ1wiKSB7XHJcbiAgICBpZiAoYXJnLmNhc3RWYWx1ZSA9PT0gXCJhcnJheVwiKSByZXR1cm4gXCJBcnJheTxzdHJpbmc+XCJcclxuICAgIHJldHVybiBhcmcuY2FzdFZhbHVlXHJcbiAgfVxyXG4gIHJldHVybiBcImFueVwiXHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpc0ZsYWc8TWVzc2FnZSBleHRlbmRzIGNvbW1hbmQuTm9ybWFsTWVzc2FnZT4oXHJcbiAgYXJnOiBPcHRpb248TWVzc2FnZT5cclxuKTogYXJnIGlzIEZsYWc8TWVzc2FnZT4ge1xyXG4gIHJldHVybiBhcmcuaGFzT3duUHJvcGVydHkoXCJmbGFnXCIpXHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB0cmltQXJndW1lbnRWYWx1ZSh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcclxuICBjb25zdCBtYXRjaCA9IC9eKD86XCIoLispXCJ8JyguKyknfCguKykpJC9zLmV4ZWModmFsdWUpXHJcbiAgaWYgKG1hdGNoKSByZXR1cm4gbWF0Y2hbMV0gPz8gbWF0Y2hbMl0gPz8gbWF0Y2hbM11cclxuICByZXR1cm4gdmFsdWVcclxufVxyXG4iXSwKICAibWFwcGluZ3MiOiAiQUFBQTtBQUVBO0FBRUE7QUFDQTtBQW1FTyw4QkFDTCxZQUNBLEtBTUE7QUFDQSxNQUFJLFdBQVcsSUFBSTtBQUNuQixNQUFJLGNBQWMsV0FBVyxlQUFlLElBQUk7QUFDaEQsTUFBSSxRQUNGLFdBQVcsSUFBSSxVQUFVLFVBQWEsV0FBVyxJQUFJLFVBQVU7QUFDakUsTUFBSSxRQUFRLFdBQVcsSUFBSTtBQUUzQixNQUFJLENBQUMsU0FBUyxJQUFJLFNBQVM7QUFDekIsZUFBVyxTQUFTLElBQUksU0FBUztBQUMvQixVQUFJLFdBQVcsZUFBZSxRQUFRO0FBQ3BDLG1CQUFXO0FBQ1gsc0JBQWM7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
