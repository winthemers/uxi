var __defProp = Object.defineProperty;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
import discord from "discord.js";
import chalk from "chalk";
import tims from "tims";
import path from "path";
import * as core from "./core.js";
import * as logger from "./logger.js";
import * as handler from "./handler.js";
import * as argument from "./argument.js";
const commandHandler = new handler.Handler(process.env.BOT_COMMANDS_PATH ?? path.join(process.cwd(), "dist", "commands"));
commandHandler.on("load", async (filepath) => {
  const file = await import("file://" + filepath);
  return commands.add(file.default);
});
let defaultCommand = null;
const commands = new class CommandCollection extends discord.Collection {
  resolve(key) {
    for (const [name, command] of this) {
      if (key === name || command.options.aliases?.some((alias) => key === alias))
        return command;
    }
  }
  add(command) {
    validateCommand(command);
    this.set(command.options.name, command);
  }
}();
class Command {
  constructor(options) {
    this.options = options;
  }
}
function validateCommand(command, parent) {
  command.options.parent = parent;
  if (command.options.isDefault) {
    if (defaultCommand)
      logger.error(`the ${chalk.blueBright(command.options.name)} command wants to be a default command but the ${chalk.blueBright(defaultCommand.options.name)} command is already the default command`, "command:validateCommand");
    else
      defaultCommand = command;
  }
  const help = {
    name: "help",
    flag: "h",
    description: "Get help from the command"
  };
  if (!command.options.flags)
    command.options.flags = [help];
  else
    command.options.flags.push(help);
  for (const flag of command.options.flags)
    if (flag.flag) {
      if (flag.flag.length !== 1)
        throw new Error(`The "${flag.name}" flag length of "${path ? path + " " + command.options.name : command.options.name}" command must be equal to 1`);
    }
  if (command.options.coolDown) {
    if (!command.options.run.toString().includes("triggerCoolDown"))
      logger.warn(`you forgot using ${chalk.greenBright("message.triggerCoolDown()")} in the ${chalk.blueBright(command.options.name)} command.`, "command:validateCommand");
  }
  logger.log(`loaded command ${chalk.blueBright(commandBreadcrumb(command))} ${chalk.grey(command.options.description)}`);
  if (command.options.subs)
    for (const sub of command.options.subs)
      validateCommand(sub, command);
}
function commandBreadcrumb(command, separator = " ") {
  return commandParents(command).map((cmd) => cmd.options.name).reverse().join(separator);
}
function commandParents(command) {
  return command.options.parent ? [command, ...commandParents(command.options.parent)] : [command];
}
async function prepareCommand(message, cmd, context) {
  if (cmd.options.coolDown) {
    const slug = core.slug("coolDown", cmd.options.name, message.channel.id);
    const coolDown = core.cache.ensure(slug, {
      time: 0,
      trigger: false
    });
    message.triggerCoolDown = () => {
      core.cache.set(slug, {
        time: Date.now(),
        trigger: true
      });
    };
    if (coolDown.trigger) {
      const coolDownTime = await core.scrap(cmd.options.coolDown, message);
      if (Date.now() > coolDown.time + coolDownTime) {
        core.cache.set(slug, {
          time: 0,
          trigger: false
        });
      } else {
        return new discord.MessageEmbed().setColor("RED").setAuthor(`Please wait ${Math.ceil((coolDown.time + coolDownTime - Date.now()) / 1e3)} seconds...`, message.client.user.displayAvatarURL());
      }
    }
  } else {
    message.triggerCoolDown = () => {
      logger.warn(`You must setup the cooldown of the "${cmd.options.name}" command before using the "triggerCoolDown" method`, "command:prepareCommand");
    };
  }
  const channelType = await core.scrap(cmd.options.channelType, message);
  if (isGuildMessage(message)) {
    if (channelType === "dm")
      return new discord.MessageEmbed().setColor("RED").setAuthor("This command must be used in DM.", message.client.user.displayAvatarURL());
    if (core.scrap(cmd.options.guildOwnerOnly, message)) {
      if (message.guild.ownerId !== message.member.id && process.env.BOT_OWNER !== message.member.id)
        return new discord.MessageEmbed().setColor("RED").setAuthor("You must be the guild owner.", message.client.user.displayAvatarURL());
    }
    if (cmd.options.botPermissions) {
      const botPermissions = await core.scrap(cmd.options.botPermissions, message);
      for (const permission of botPermissions)
        if (!message.guild.me?.permissions.has(permission, true))
          return new discord.MessageEmbed().setColor("RED").setAuthor("Oops!", message.client.user.displayAvatarURL()).setDescription(`I need the \`${permission}\` permission to call this command.`);
    }
    if (cmd.options.userPermissions) {
      const userPermissions = await core.scrap(cmd.options.userPermissions, message);
      for (const permission of userPermissions)
        if (!message.member.permissions.has(permission, true))
          return new discord.MessageEmbed().setColor("RED").setAuthor("Oops!", message.client.user.displayAvatarURL()).setDescription(`You need the \`${permission}\` permission to call this command.`);
    }
    if (cmd.options.roles) {
      const roles = await core.scrap(cmd.options.roles, message);
      const isRole = (r) => {
        return typeof r === "string" || r instanceof discord.Role;
      };
      const getRoleId = (r) => {
        return typeof r === "string" ? r : r.id;
      };
      const member = await message.member.fetch();
      for (const roleCond of roles) {
        if (isRole(roleCond)) {
          const id = getRoleId(roleCond);
          if (!member.roles.cache.has(id)) {
            return new discord.MessageEmbed().setColor("RED").setAuthor("Oops!", message.client.user.displayAvatarURL()).setDescription(`You must have the <@${id}> role to call this command.`);
          }
        } else {
          if (roleCond.length === 1) {
            const _roleCond = roleCond[0];
            if (isRole(_roleCond)) {
              const id = getRoleId(_roleCond);
              if (member.roles.cache.has(id)) {
                return new discord.MessageEmbed().setColor("RED").setAuthor("Oops!", message.client.user.displayAvatarURL()).setDescription(`You mustn't have the <@${id}> role to call this command.`);
              }
            } else {
              for (const role of _roleCond) {
                if (member.roles.cache.has(getRoleId(role))) {
                  return new discord.MessageEmbed().setColor("RED").setAuthor("Oops!", message.client.user.displayAvatarURL()).setDescription(`You mustn't have the <@${getRoleId(role)}> role to call this command.`);
                }
              }
            }
          } else {
            let someRoleGiven = false;
            for (const role of roleCond) {
              if (Array.isArray(role)) {
                logger.warn(`Bad command.roles structure in ${chalk.bold(commandBreadcrumb(cmd, "/"))} command.`, "command:prepareCommand");
              } else {
                const id = getRoleId(role);
                if (member.roles.cache.has(id)) {
                  someRoleGiven = true;
                  break;
                }
              }
            }
            if (!someRoleGiven)
              return new discord.MessageEmbed().setColor("RED").setAuthor("Oops!", message.client.user.displayAvatarURL()).setDescription(`You must have at least one of the following roles to call this command.
${[
                ...roleCond
              ].filter((role) => !Array.isArray(role)).map((role) => `<@${getRoleId(role)}>`).join(" ")}`);
          }
        }
      }
    }
  }
  if (channelType === "guild") {
    if (isDirectMessage(message))
      return new discord.MessageEmbed().setColor("RED").setAuthor("This command must be used in a guild.", message.client.user.displayAvatarURL());
  }
  if (await core.scrap(cmd.options.botOwnerOnly, message)) {
    if (process.env.BOT_OWNER !== message.author.id)
      return new discord.MessageEmbed().setColor("RED").setAuthor("You must be my owner.", message.client.user.displayAvatarURL());
  }
  if (context) {
    if (cmd.options.positional) {
      const positionalList = await core.scrap(cmd.options.positional, message);
      for (const positional of positionalList) {
        const index = positionalList.indexOf(positional);
        let value = context.parsedArgs._[index];
        const given = value !== void 0 && value !== null;
        const set = (v) => {
          message.args[positional.name] = v;
          message.args[index] = v;
          value = v;
        };
        if (value)
          value = argument.trimArgumentValue(value);
        set(value);
        if (!given) {
          if (await core.scrap(positional.required, message)) {
            if (positional.missingErrorMessage) {
              if (typeof positional.missingErrorMessage === "string") {
                return new discord.MessageEmbed().setColor("RED").setAuthor(`Missing positional "${positional.name}"`, message.client.user.displayAvatarURL()).setDescription(positional.missingErrorMessage);
              } else {
                return positional.missingErrorMessage;
              }
            }
            return new discord.MessageEmbed().setColor("RED").setAuthor(`Missing positional "${positional.name}"`, message.client.user.displayAvatarURL()).setDescription(positional.description ? "Description: " + positional.description : `Run the following command to learn more: ${core.code.stringify({
              content: `${message.usedPrefix}${context.key} --help`
            })}`);
          } else if (positional.default !== void 0) {
            set(await core.scrap(positional.default, message));
          } else {
            set(null);
          }
        } else if (positional.checkValue) {
          const checked = await argument.checkValue(positional, "positional", value, message);
          if (checked !== true)
            return checked;
        }
        if (value !== null && positional.castValue) {
          const casted = await argument.castValue(positional, "positional", value, message, set);
          if (casted !== true)
            return casted;
        }
        if (value !== null && positional.checkCastedValue) {
          const checked = await argument.checkCastedValue(positional, "positional", value, message);
          if (checked !== true)
            return checked;
        }
        context.restPositional.shift();
      }
    }
    if (cmd.options.options) {
      const options = await core.scrap(cmd.options.options, message);
      for (const option of options) {
        let { given, value } = argument.resolveGivenArgument(context.parsedArgs, option);
        const set = (v) => {
          message.args[option.name] = v;
          value = v;
        };
        if (value === true)
          value = void 0;
        if (!given && await core.scrap(option.required, message)) {
          if (option.missingErrorMessage) {
            if (typeof option.missingErrorMessage === "string") {
              return new discord.MessageEmbed().setColor("RED").setAuthor(`Missing option "${option.name}"`, message.client.user.displayAvatarURL()).setDescription(option.missingErrorMessage);
            } else {
              return option.missingErrorMessage;
            }
          }
          return new discord.MessageEmbed().setColor("RED").setAuthor(`Missing option "${option.name}"`, message.client.user.displayAvatarURL()).setDescription(option.description ? "Description: " + option.description : `Example: \`--${option.name}=someValue\``);
        }
        set(value);
        if (value === void 0) {
          if (option.default !== void 0) {
            set(await core.scrap(option.default, message));
          } else if (option.castValue !== "array") {
            set(null);
          }
        } else if (option.checkValue) {
          const checked = await argument.checkValue(option, "argument", value, message);
          if (checked !== true)
            return checked;
        }
        if (value !== null && option.castValue) {
          const casted = await argument.castValue(option, "argument", value, message, set);
          if (casted !== true)
            return casted;
        }
        if (value !== null && option.checkCastedValue) {
          const checked = await argument.checkCastedValue(option, "argument", value, message);
          if (checked !== true)
            return checked;
        }
      }
    }
    if (cmd.options.flags) {
      for (const flag of cmd.options.flags) {
        let { given, nameIsGiven, value } = argument.resolveGivenArgument(context.parsedArgs, flag);
        const set = (v) => {
          message.args[flag.name] = v;
          value = v;
        };
        if (!nameIsGiven)
          set(false);
        else if (typeof value === "boolean")
          set(value);
        else if (/^(?:true|1|on|yes|oui)$/.test(value))
          set(true);
        else if (/^(?:false|0|off|no|non)$/.test(value))
          set(false);
        else {
          set(true);
          context.restPositional.unshift(value);
        }
      }
    }
    message.rest = context.restPositional.join(" ");
    if (cmd.options.rest) {
      const rest = await core.scrap(cmd.options.rest, message);
      if (rest.all)
        message.rest = context.baseContent;
      if (message.rest.length === 0) {
        if (await core.scrap(rest.required, message)) {
          if (rest.missingErrorMessage) {
            if (typeof rest.missingErrorMessage === "string") {
              return new discord.MessageEmbed().setColor("RED").setAuthor(`Missing rest "${rest.name}"`, message.client.user.displayAvatarURL()).setDescription(rest.missingErrorMessage);
            } else {
              return rest.missingErrorMessage;
            }
          }
          return new discord.MessageEmbed().setColor("RED").setAuthor(`Missing rest "${rest.name}"`, message.client.user.displayAvatarURL()).setDescription(rest.description ?? "Please use `--help` flag for more information.");
        } else if (rest.default) {
          message.args[rest.name] = await core.scrap(rest.default, message);
        }
      } else {
        message.args[rest.name] = message.rest;
      }
    }
  }
  if (cmd.options.middlewares) {
    const middlewares = await core.scrap(cmd.options.middlewares, message);
    let currentData = {};
    for (const middleware of middlewares) {
      const { result, data } = await middleware(message, currentData);
      currentData = __spreadValues(__spreadValues({}, currentData), data ?? {});
      if (typeof result === "string")
        return new discord.MessageEmbed().setColor("RED").setAuthor(`${middleware.name ? `"${middleware.name}" m` : "M"}iddleware error`, message.client.user.displayAvatarURL()).setDescription(result);
      if (!result)
        return false;
    }
  }
  return true;
}
async function sendCommandDetails(message, cmd) {
  let pattern = `${message.usedPrefix}${cmd.options.isDefault ? `[${commandBreadcrumb(cmd)}]` : commandBreadcrumb(cmd)}`;
  const positionalList = [];
  const argumentList = [];
  const flagList = [];
  let restPattern = "";
  if (cmd.options.rest) {
    const rest = await core.scrap(cmd.options.rest, message);
    const dft = rest.default !== void 0 ? `="${await core.scrap(rest.default, message)}"` : "";
    restPattern = await core.scrap(rest.required, message) ? `<...${rest.name}>` : `[...${rest.name}${dft}]`;
  }
  if (cmd.options.positional) {
    const cmdPositional = await core.scrap(cmd.options.positional, message);
    for (const positional of cmdPositional) {
      const dft = positional.default !== void 0 ? `="${await core.scrap(positional.default, message)}"` : "";
      positionalList.push(await core.scrap(positional.required, message) && !dft ? `<${positional.name}>` : `[${positional.name}${dft}]`);
    }
  }
  if (cmd.options.options) {
    const cmdOptions = await core.scrap(cmd.options.options, message);
    for (const arg of cmdOptions) {
      const dft = arg.default !== void 0 ? `="${core.scrap(arg.default, message)}"` : "";
      argumentList.push(await core.scrap(arg.required, message) ? `\`--${arg.name}${dft}\` (\`${argument.getTypeDescriptionOf(arg)}\`) ${arg.description ?? ""}` : `\`[--${arg.name}${dft}]\` (\`${argument.getTypeDescriptionOf(arg)}\`) ${arg.description ?? ""}`);
    }
  }
  if (cmd.options.flags) {
    for (const flag of cmd.options.flags) {
      flagList.push(`[--${flag.name}]`);
    }
  }
  const specialPermissions = [];
  if (await core.scrap(cmd.options.botOwnerOnly, message))
    specialPermissions.push("BOT_OWNER");
  if (await core.scrap(cmd.options.guildOwnerOnly, message))
    specialPermissions.push("GUILD_OWNER");
  const embed = new discord.MessageEmbed().setColor("BLURPLE").setAuthor("Command details", message.client.user.displayAvatarURL()).setTitle(`${pattern} ${[...positionalList, restPattern, ...flagList].join(" ")} ${cmd.options ? "[OPTIONS]" : ""}`).setDescription(await core.scrap(cmd.options.longDescription, message) ?? cmd.options.description ?? "no description");
  if (argumentList.length > 0)
    embed.addField("options", argumentList.join("\n"), false);
  if (cmd.options.aliases) {
    const aliases = cmd.options.aliases;
    embed.addField("aliases", aliases.map((alias) => `\`${alias}\``).join(", "), true);
  }
  if (cmd.options.examples) {
    const examples = await core.scrap(cmd.options.examples, message);
    embed.addField("examples:", core.code.stringify({
      content: examples.map((example) => message.usedPrefix + example).join("\n")
    }), false);
  }
  if (cmd.options.botPermissions) {
    const botPermissions = await core.scrap(cmd.options.botPermissions, message);
    embed.addField("bot permissions", botPermissions.join(", "), true);
  }
  if (cmd.options.userPermissions) {
    const userPermissions = await core.scrap(cmd.options.userPermissions, message);
    embed.addField("user permissions", userPermissions.join(", "), true);
  }
  if (specialPermissions.length > 0)
    embed.addField("special permissions", specialPermissions.map((perm) => `\`${perm}\``).join(", "), true);
  if (cmd.options.coolDown) {
    const coolDown = await core.scrap(cmd.options.coolDown, message);
    embed.addField("cool down", tims.duration(coolDown), true);
  }
  if (cmd.options.subs)
    embed.addField("sub commands:", (await Promise.all(cmd.options.subs.map(async (sub) => {
      const prepared = await prepareCommand(message, sub);
      if (prepared !== true)
        return "";
      return commandToListItem(message, sub);
    }))).filter((line) => line.length > 0).join("\n") || "Sub commands are not accessible by you.", false);
  if (cmd.options.channelType !== "all")
    embed.setFooter(`This command can only be sent in ${cmd.options.channelType} channel.`);
  await message.channel.send({ embeds: [embed] });
}
function commandToListItem(message, cmd) {
  return `**${message.usedPrefix}${commandBreadcrumb(cmd, " ")}** - ${cmd.options.description ?? "no description"}`;
}
function isNormalMessage(message) {
  return !message.system && !!message.channel && !!message.author && !message.webhookId;
}
function isGuildMessage(message) {
  return !!message.member && !!message.guild && message.channel instanceof discord.GuildChannel;
}
function isDirectMessage(message) {
  return message.channel instanceof discord.DMChannel;
}
export {
  Command,
  commandBreadcrumb,
  commandHandler,
  commandParents,
  commandToListItem,
  commands,
  defaultCommand,
  isDirectMessage,
  isGuildMessage,
  isNormalMessage,
  prepareCommand,
  sendCommandDetails,
  validateCommand
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2FwcC9jb21tYW5kLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgZGlzY29yZCBmcm9tIFwiZGlzY29yZC5qc1wiXHJcbmltcG9ydCBBUEkgZnJvbSBcImRpc2NvcmQtYXBpLXR5cGVzL3Y4XCJcclxuaW1wb3J0IGNoYWxrIGZyb20gXCJjaGFsa1wiXHJcbmltcG9ydCB0aW1zIGZyb20gXCJ0aW1zXCJcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIlxyXG5pbXBvcnQgeWFyZ3NQYXJzZXIgZnJvbSBcInlhcmdzLXBhcnNlclwiXHJcblxyXG5pbXBvcnQgKiBhcyBjb3JlIGZyb20gXCIuL2NvcmUuanNcIlxyXG5pbXBvcnQgKiBhcyBsb2dnZXIgZnJvbSBcIi4vbG9nZ2VyLmpzXCJcclxuaW1wb3J0ICogYXMgaGFuZGxlciBmcm9tIFwiLi9oYW5kbGVyLmpzXCJcclxuaW1wb3J0ICogYXMgYXJndW1lbnQgZnJvbSBcIi4vYXJndW1lbnQuanNcIlxyXG5cclxuZXhwb3J0IGNvbnN0IGNvbW1hbmRIYW5kbGVyID0gbmV3IGhhbmRsZXIuSGFuZGxlcihcclxuICBwcm9jZXNzLmVudi5CT1RfQ09NTUFORFNfUEFUSCA/PyBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgXCJkaXN0XCIsIFwiY29tbWFuZHNcIilcclxuKVxyXG5cclxuY29tbWFuZEhhbmRsZXIub24oXCJsb2FkXCIsIGFzeW5jIChmaWxlcGF0aCkgPT4ge1xyXG4gIGNvbnN0IGZpbGUgPSBhd2FpdCBpbXBvcnQoXCJmaWxlOi8vXCIgKyBmaWxlcGF0aClcclxuICByZXR1cm4gY29tbWFuZHMuYWRkKGZpbGUuZGVmYXVsdClcclxufSlcclxuXHJcbmV4cG9ydCBsZXQgZGVmYXVsdENvbW1hbmQ6IENvbW1hbmQ8YW55PiB8IG51bGwgPSBudWxsXHJcblxyXG5leHBvcnQgY29uc3QgY29tbWFuZHMgPSBuZXcgKGNsYXNzIENvbW1hbmRDb2xsZWN0aW9uIGV4dGVuZHMgZGlzY29yZC5Db2xsZWN0aW9uPFxyXG4gIHN0cmluZyxcclxuICBDb21tYW5kPGtleW9mIENvbW1hbmRNZXNzYWdlVHlwZT5cclxuPiB7XHJcbiAgcHVibGljIHJlc29sdmUoa2V5OiBzdHJpbmcpOiBDb21tYW5kPGtleW9mIENvbW1hbmRNZXNzYWdlVHlwZT4gfCB1bmRlZmluZWQge1xyXG4gICAgZm9yIChjb25zdCBbbmFtZSwgY29tbWFuZF0gb2YgdGhpcykge1xyXG4gICAgICBpZiAoXHJcbiAgICAgICAga2V5ID09PSBuYW1lIHx8XHJcbiAgICAgICAgY29tbWFuZC5vcHRpb25zLmFsaWFzZXM/LnNvbWUoKGFsaWFzKSA9PiBrZXkgPT09IGFsaWFzKVxyXG4gICAgICApXHJcbiAgICAgICAgcmV0dXJuIGNvbW1hbmRcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHB1YmxpYyBhZGQoY29tbWFuZDogQ29tbWFuZDxrZXlvZiBDb21tYW5kTWVzc2FnZVR5cGU+KSB7XHJcbiAgICB2YWxpZGF0ZUNvbW1hbmQoY29tbWFuZClcclxuICAgIHRoaXMuc2V0KGNvbW1hbmQub3B0aW9ucy5uYW1lLCBjb21tYW5kKVxyXG4gIH1cclxufSkoKVxyXG5cclxuZXhwb3J0IHR5cGUgU2VudEl0ZW0gPSBzdHJpbmcgfCBkaXNjb3JkLk1lc3NhZ2VQYXlsb2FkIHwgZGlzY29yZC5NZXNzYWdlT3B0aW9uc1xyXG5cclxuZXhwb3J0IHR5cGUgTm9ybWFsTWVzc2FnZSA9IGRpc2NvcmQuTWVzc2FnZSAmIHtcclxuICBhcmdzOiB7IFtuYW1lOiBzdHJpbmddOiBhbnkgfSAmIGFueVtdXHJcbiAgdHJpZ2dlckNvb2xEb3duOiAoKSA9PiB2b2lkXHJcbiAgc2VuZDogKHRoaXM6IE5vcm1hbE1lc3NhZ2UsIGl0ZW06IFNlbnRJdGVtKSA9PiBQcm9taXNlPGRpc2NvcmQuTWVzc2FnZT5cclxuICBzZW5kVGltZW91dDogKFxyXG4gICAgdGhpczogTm9ybWFsTWVzc2FnZSxcclxuICAgIHRpbWVvdXQ6IG51bWJlcixcclxuICAgIGl0ZW06IFNlbnRJdGVtXHJcbiAgKSA9PiBQcm9taXNlPGRpc2NvcmQuTWVzc2FnZT5cclxuICB1c2VkQXNEZWZhdWx0OiBib29sZWFuXHJcbiAgaXNGcm9tQm90T3duZXI6IGJvb2xlYW5cclxuICBpc0Zyb21HdWlsZE93bmVyOiBib29sZWFuXHJcbiAgdXNlZFByZWZpeDogc3RyaW5nXHJcbiAgY2xpZW50OiBjb3JlLkZ1bGxDbGllbnRcclxuICByZXN0OiBzdHJpbmdcclxufVxyXG5cclxuZXhwb3J0IHR5cGUgR3VpbGRNZXNzYWdlID0gTm9ybWFsTWVzc2FnZSAmIHtcclxuICBjaGFubmVsOiBkaXNjb3JkLlRleHRDaGFubmVsICYgZGlzY29yZC5HdWlsZENoYW5uZWxcclxuICBndWlsZDogZGlzY29yZC5HdWlsZFxyXG4gIG1lbWJlcjogZGlzY29yZC5HdWlsZE1lbWJlclxyXG59XHJcblxyXG5leHBvcnQgdHlwZSBEaXJlY3RNZXNzYWdlID0gTm9ybWFsTWVzc2FnZSAmIHtcclxuICBjaGFubmVsOiBkaXNjb3JkLkRNQ2hhbm5lbFxyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIENvb2xEb3duIHtcclxuICB0aW1lOiBudW1iZXJcclxuICB0cmlnZ2VyOiBib29sZWFuXHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgTWlkZGxld2FyZVJlc3VsdCB7XHJcbiAgcmVzdWx0OiBib29sZWFuIHwgc3RyaW5nXHJcbiAgZGF0YTogYW55XHJcbn1cclxuXHJcbmV4cG9ydCB0eXBlIE1pZGRsZXdhcmU8VHlwZSBleHRlbmRzIGtleW9mIENvbW1hbmRNZXNzYWdlVHlwZT4gPSAoXHJcbiAgbWVzc2FnZTogQ29tbWFuZE1lc3NhZ2VUeXBlW1R5cGVdLFxyXG4gIGRhdGE6IGFueVxyXG4pID0+IFByb21pc2U8TWlkZGxld2FyZVJlc3VsdD4gfCBNaWRkbGV3YXJlUmVzdWx0XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIENvbW1hbmRNZXNzYWdlVHlwZSB7XHJcbiAgZ3VpbGQ6IEd1aWxkTWVzc2FnZVxyXG4gIGRtOiBEaXJlY3RNZXNzYWdlXHJcbiAgYWxsOiBOb3JtYWxNZXNzYWdlXHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgQ29tbWFuZE9wdGlvbnM8VHlwZSBleHRlbmRzIGtleW9mIENvbW1hbmRNZXNzYWdlVHlwZT4ge1xyXG4gIGNoYW5uZWxUeXBlPzogVHlwZVxyXG5cclxuICBuYW1lOiBzdHJpbmdcclxuICAvKipcclxuICAgKiBTaG9ydCBkZXNjcmlwdGlvbiBkaXNwbGF5ZWQgaW4gaGVscCBtZW51XHJcbiAgICovXHJcbiAgZGVzY3JpcHRpb246IHN0cmluZ1xyXG4gIC8qKlxyXG4gICAqIERlc2NyaXB0aW9uIGRpc3BsYXllZCBpbiBjb21tYW5kIGRldGFpbFxyXG4gICAqL1xyXG4gIGxvbmdEZXNjcmlwdGlvbj86IGNvcmUuU2NyYXA8c3RyaW5nLCBbbWVzc2FnZTogQ29tbWFuZE1lc3NhZ2VUeXBlW1R5cGVdXT5cclxuICAvKipcclxuICAgKiBVc2UgdGhpcyBjb21tYW5kIGlmIHByZWZpeCBpcyBnaXZlbiBidXQgd2l0aG91dCBjb21tYW5kIG1hdGNoaW5nXHJcbiAgICovXHJcbiAgaXNEZWZhdWx0PzogYm9vbGVhblxyXG4gIC8qKlxyXG4gICAqIFVzZSB0aGlzIGNvbW1hbmQgYXMgc2xhc2ggY29tbWFuZFxyXG4gICAqL1xyXG4gIGlzU2xhc2g/OiBib29sZWFuXHJcbiAgYWxpYXNlcz86IHN0cmluZ1tdXHJcbiAgLyoqXHJcbiAgICogQ29vbCBkb3duIG9mIGNvbW1hbmQgKGluIG1zKVxyXG4gICAqL1xyXG4gIGNvb2xEb3duPzogY29yZS5TY3JhcDxudW1iZXIsIFttZXNzYWdlOiBDb21tYW5kTWVzc2FnZVR5cGVbVHlwZV1dPlxyXG4gIGV4YW1wbGVzPzogY29yZS5TY3JhcDxzdHJpbmdbXSwgW21lc3NhZ2U6IENvbW1hbmRNZXNzYWdlVHlwZVtUeXBlXV0+XHJcblxyXG4gIC8vIFJlc3RyaWN0aW9uIGZsYWdzIGFuZCBwZXJtaXNzaW9uc1xyXG4gIGd1aWxkT3duZXJPbmx5PzogY29yZS5TY3JhcDxib29sZWFuLCBbbWVzc2FnZTogQ29tbWFuZE1lc3NhZ2VUeXBlW1R5cGVdXT5cclxuICBib3RPd25lck9ubHk/OiBjb3JlLlNjcmFwPGJvb2xlYW4sIFttZXNzYWdlOiBDb21tYW5kTWVzc2FnZVR5cGVbVHlwZV1dPlxyXG4gIHVzZXJQZXJtaXNzaW9ucz86IGNvcmUuU2NyYXA8XHJcbiAgICBkaXNjb3JkLlBlcm1pc3Npb25TdHJpbmdbXSxcclxuICAgIFttZXNzYWdlOiBDb21tYW5kTWVzc2FnZVR5cGVbVHlwZV1dXHJcbiAgPlxyXG4gIGJvdFBlcm1pc3Npb25zPzogY29yZS5TY3JhcDxcclxuICAgIGRpc2NvcmQuUGVybWlzc2lvblN0cmluZ1tdLFxyXG4gICAgW21lc3NhZ2U6IENvbW1hbmRNZXNzYWdlVHlwZVtUeXBlXV1cclxuICA+XHJcblxyXG4gIHJvbGVzPzogY29yZS5TY3JhcDxcclxuICAgIChcclxuICAgICAgfCBkaXNjb3JkLlJvbGVSZXNvbHZhYmxlXHJcbiAgICAgIHwgZGlzY29yZC5Sb2xlUmVzb2x2YWJsZVtdXHJcbiAgICAgIHwgW2Rpc2NvcmQuUm9sZVJlc29sdmFibGVdXHJcbiAgICAgIHwgW2Rpc2NvcmQuUm9sZVJlc29sdmFibGVbXV1cclxuICAgIClbXSxcclxuICAgIFttZXNzYWdlOiBDb21tYW5kTWVzc2FnZVR5cGVbVHlwZV1dXHJcbiAgPlxyXG5cclxuICAvKipcclxuICAgKiBNaWRkbGV3YXJlcyBjYW4gc3RvcCB0aGUgY29tbWFuZCBpZiByZXR1cm5pbmcgYSBzdHJpbmcgKHN0cmluZyBpcyBkaXNwbGF5ZWQgYXMgZXJyb3IgbWVzc2FnZSBpbiBkaXNjb3JkKVxyXG4gICAqL1xyXG4gIG1pZGRsZXdhcmVzPzogTWlkZGxld2FyZTxUeXBlPltdXHJcblxyXG4gIC8qKlxyXG4gICAqIFRoZSByZXN0IG9mIG1lc3NhZ2UgYWZ0ZXIgZXhjbHVkZXMgYWxsIG90aGVyIGFyZ3VtZW50cy5cclxuICAgKi9cclxuICByZXN0PzogYXJndW1lbnQuUmVzdDxDb21tYW5kTWVzc2FnZVR5cGVbVHlwZV0+XHJcbiAgLyoqXHJcbiAgICogWWFyZ3MgcG9zaXRpb25hbCBhcmd1bWVudCAoZS5nLiBgW2FyZ10gPGFyZz5gKVxyXG4gICAqL1xyXG4gIHBvc2l0aW9uYWw/OiBhcmd1bWVudC5Qb3NpdGlvbmFsPENvbW1hbmRNZXNzYWdlVHlwZVtUeXBlXT5bXVxyXG4gIC8qKlxyXG4gICAqIFlhcmdzIG9wdGlvbiBhcmd1bWVudHMgKGUuZy4gYC0tbXlBcmd1bWVudD12YWx1ZWApXHJcbiAgICovXHJcbiAgb3B0aW9ucz86IGFyZ3VtZW50Lk9wdGlvbjxDb21tYW5kTWVzc2FnZVR5cGVbVHlwZV0+W11cclxuICAvKipcclxuICAgKiBZYXJncyBmbGFnIGFyZ3VtZW50cyAoZS5nLiBgLS1teUZsYWcgLWZgKVxyXG4gICAqL1xyXG4gIGZsYWdzPzogYXJndW1lbnQuRmxhZzxDb21tYW5kTWVzc2FnZVR5cGVbVHlwZV0+W11cclxuICBydW46ICh0aGlzOiBDb21tYW5kPFR5cGU+LCBtZXNzYWdlOiBDb21tYW5kTWVzc2FnZVR5cGVbVHlwZV0pID0+IHVua25vd25cclxuICAvKipcclxuICAgKiBTdWItY29tbWFuZHNcclxuICAgKi9cclxuICBzdWJzPzogKENvbW1hbmQ8XCJndWlsZFwiPiB8IENvbW1hbmQ8XCJkbVwiPiB8IENvbW1hbmQ8XCJhbGxcIj4pW11cclxuICAvKipcclxuICAgKiBUaGlzIHNsYXNoIGNvbW1hbmQgb3B0aW9ucyBhcmUgYXV0b21hdGljYWxseSBzZXR1cCBvbiBib3QgcnVubmluZyBidXQgeW91IGNhbiBjb25maWd1cmUgaXQgbWFudWFsbHkgdG9vLlxyXG4gICAqL1xyXG4gIHNsYXNoPzogQVBJLlJFU1RQb3N0QVBJQXBwbGljYXRpb25Db21tYW5kc0pTT05Cb2R5XHJcbiAgLyoqXHJcbiAgICogVGhpcyBwcm9wZXJ0eSBpcyBhdXRvbWF0aWNhbGx5IHNldHVwIG9uIGJvdCBydW5uaW5nLlxyXG4gICAqIEBkZXByZWNhdGVkXHJcbiAgICovXHJcbiAgcGFyZW50PzogQ29tbWFuZDxrZXlvZiBDb21tYW5kTWVzc2FnZVR5cGU+XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBDb21tYW5kPFR5cGUgZXh0ZW5kcyBrZXlvZiBDb21tYW5kTWVzc2FnZVR5cGUgPSBcImFsbFwiPiB7XHJcbiAgY29uc3RydWN0b3IocHVibGljIG9wdGlvbnM6IENvbW1hbmRPcHRpb25zPFR5cGU+KSB7fVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVDb21tYW5kPFxyXG4gIFR5cGUgZXh0ZW5kcyBrZXlvZiBDb21tYW5kTWVzc2FnZVR5cGUgPSBrZXlvZiBDb21tYW5kTWVzc2FnZVR5cGVcclxuPihcclxuICBjb21tYW5kOiBDb21tYW5kPFR5cGU+LFxyXG4gIHBhcmVudD86IENvbW1hbmQ8a2V5b2YgQ29tbWFuZE1lc3NhZ2VUeXBlPlxyXG4pOiB2b2lkIHwgbmV2ZXIge1xyXG4gIGNvbW1hbmQub3B0aW9ucy5wYXJlbnQgPSBwYXJlbnRcclxuXHJcbiAgaWYgKGNvbW1hbmQub3B0aW9ucy5pc0RlZmF1bHQpIHtcclxuICAgIGlmIChkZWZhdWx0Q29tbWFuZClcclxuICAgICAgbG9nZ2VyLmVycm9yKFxyXG4gICAgICAgIGB0aGUgJHtjaGFsay5ibHVlQnJpZ2h0KFxyXG4gICAgICAgICAgY29tbWFuZC5vcHRpb25zLm5hbWVcclxuICAgICAgICApfSBjb21tYW5kIHdhbnRzIHRvIGJlIGEgZGVmYXVsdCBjb21tYW5kIGJ1dCB0aGUgJHtjaGFsay5ibHVlQnJpZ2h0KFxyXG4gICAgICAgICAgZGVmYXVsdENvbW1hbmQub3B0aW9ucy5uYW1lXHJcbiAgICAgICAgKX0gY29tbWFuZCBpcyBhbHJlYWR5IHRoZSBkZWZhdWx0IGNvbW1hbmRgLFxyXG4gICAgICAgIFwiY29tbWFuZDp2YWxpZGF0ZUNvbW1hbmRcIlxyXG4gICAgICApXHJcbiAgICBlbHNlIGRlZmF1bHRDb21tYW5kID0gY29tbWFuZFxyXG4gIH1cclxuXHJcbiAgY29uc3QgaGVscDogYXJndW1lbnQuRmxhZzxDb21tYW5kTWVzc2FnZVR5cGVbVHlwZV0+ID0ge1xyXG4gICAgbmFtZTogXCJoZWxwXCIsXHJcbiAgICBmbGFnOiBcImhcIixcclxuICAgIGRlc2NyaXB0aW9uOiBcIkdldCBoZWxwIGZyb20gdGhlIGNvbW1hbmRcIixcclxuICB9XHJcblxyXG4gIGlmICghY29tbWFuZC5vcHRpb25zLmZsYWdzKSBjb21tYW5kLm9wdGlvbnMuZmxhZ3MgPSBbaGVscF1cclxuICBlbHNlIGNvbW1hbmQub3B0aW9ucy5mbGFncy5wdXNoKGhlbHApXHJcblxyXG4gIGZvciAoY29uc3QgZmxhZyBvZiBjb21tYW5kLm9wdGlvbnMuZmxhZ3MpXHJcbiAgICBpZiAoZmxhZy5mbGFnKVxyXG4gICAgICBpZiAoZmxhZy5mbGFnLmxlbmd0aCAhPT0gMSlcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXHJcbiAgICAgICAgICBgVGhlIFwiJHtmbGFnLm5hbWV9XCIgZmxhZyBsZW5ndGggb2YgXCIke1xyXG4gICAgICAgICAgICBwYXRoID8gcGF0aCArIFwiIFwiICsgY29tbWFuZC5vcHRpb25zLm5hbWUgOiBjb21tYW5kLm9wdGlvbnMubmFtZVxyXG4gICAgICAgICAgfVwiIGNvbW1hbmQgbXVzdCBiZSBlcXVhbCB0byAxYFxyXG4gICAgICAgIClcclxuXHJcbiAgaWYgKGNvbW1hbmQub3B0aW9ucy5jb29sRG93bilcclxuICAgIGlmICghY29tbWFuZC5vcHRpb25zLnJ1bi50b1N0cmluZygpLmluY2x1ZGVzKFwidHJpZ2dlckNvb2xEb3duXCIpKVxyXG4gICAgICBsb2dnZXIud2FybihcclxuICAgICAgICBgeW91IGZvcmdvdCB1c2luZyAke2NoYWxrLmdyZWVuQnJpZ2h0KFxyXG4gICAgICAgICAgXCJtZXNzYWdlLnRyaWdnZXJDb29sRG93bigpXCJcclxuICAgICAgICApfSBpbiB0aGUgJHtjaGFsay5ibHVlQnJpZ2h0KGNvbW1hbmQub3B0aW9ucy5uYW1lKX0gY29tbWFuZC5gLFxyXG4gICAgICAgIFwiY29tbWFuZDp2YWxpZGF0ZUNvbW1hbmRcIlxyXG4gICAgICApXHJcblxyXG4gIGxvZ2dlci5sb2coXHJcbiAgICBgbG9hZGVkIGNvbW1hbmQgJHtjaGFsay5ibHVlQnJpZ2h0KFxyXG4gICAgICBjb21tYW5kQnJlYWRjcnVtYihjb21tYW5kKVxyXG4gICAgKX0gJHtjaGFsay5ncmV5KGNvbW1hbmQub3B0aW9ucy5kZXNjcmlwdGlvbil9YFxyXG4gIClcclxuXHJcbiAgaWYgKGNvbW1hbmQub3B0aW9ucy5zdWJzKVxyXG4gICAgZm9yIChjb25zdCBzdWIgb2YgY29tbWFuZC5vcHRpb25zLnN1YnMpXHJcbiAgICAgIHZhbGlkYXRlQ29tbWFuZChzdWIgYXMgYW55LCBjb21tYW5kIGFzIENvbW1hbmQ8YW55PilcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNvbW1hbmRCcmVhZGNydW1iPFR5cGUgZXh0ZW5kcyBrZXlvZiBDb21tYW5kTWVzc2FnZVR5cGU+KFxyXG4gIGNvbW1hbmQ6IENvbW1hbmQ8VHlwZT4sXHJcbiAgc2VwYXJhdG9yID0gXCIgXCJcclxuKTogc3RyaW5nIHtcclxuICByZXR1cm4gY29tbWFuZFBhcmVudHMoY29tbWFuZClcclxuICAgIC5tYXAoKGNtZCkgPT4gY21kLm9wdGlvbnMubmFtZSlcclxuICAgIC5yZXZlcnNlKClcclxuICAgIC5qb2luKHNlcGFyYXRvcilcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNvbW1hbmRQYXJlbnRzPFR5cGUgZXh0ZW5kcyBrZXlvZiBDb21tYW5kTWVzc2FnZVR5cGU+KFxyXG4gIGNvbW1hbmQ6IENvbW1hbmQ8VHlwZT5cclxuKTogQ29tbWFuZDxhbnk+W10ge1xyXG4gIHJldHVybiBjb21tYW5kLm9wdGlvbnMucGFyZW50XHJcbiAgICA/IFtjb21tYW5kLCAuLi5jb21tYW5kUGFyZW50cyhjb21tYW5kLm9wdGlvbnMucGFyZW50KV1cclxuICAgIDogW2NvbW1hbmRdXHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwcmVwYXJlQ29tbWFuZDxUeXBlIGV4dGVuZHMga2V5b2YgQ29tbWFuZE1lc3NhZ2VUeXBlPihcclxuICBtZXNzYWdlOiBDb21tYW5kTWVzc2FnZVR5cGVbVHlwZV0sXHJcbiAgY21kOiBDb21tYW5kPFR5cGU+LFxyXG4gIGNvbnRleHQ/OiB7XHJcbiAgICByZXN0UG9zaXRpb25hbDogc3RyaW5nW11cclxuICAgIGJhc2VDb250ZW50OiBzdHJpbmdcclxuICAgIHBhcnNlZEFyZ3M6IHlhcmdzUGFyc2VyLkFyZ3VtZW50c1xyXG4gICAga2V5OiBzdHJpbmdcclxuICB9XHJcbik6IFByb21pc2U8ZGlzY29yZC5NZXNzYWdlRW1iZWQgfCBib29sZWFuPiB7XHJcbiAgLy8gY29vbERvd25cclxuICBpZiAoY21kLm9wdGlvbnMuY29vbERvd24pIHtcclxuICAgIGNvbnN0IHNsdWcgPSBjb3JlLnNsdWcoXCJjb29sRG93blwiLCBjbWQub3B0aW9ucy5uYW1lLCBtZXNzYWdlLmNoYW5uZWwuaWQpXHJcbiAgICBjb25zdCBjb29sRG93biA9IGNvcmUuY2FjaGUuZW5zdXJlPENvb2xEb3duPihzbHVnLCB7XHJcbiAgICAgIHRpbWU6IDAsXHJcbiAgICAgIHRyaWdnZXI6IGZhbHNlLFxyXG4gICAgfSlcclxuXHJcbiAgICBtZXNzYWdlLnRyaWdnZXJDb29sRG93biA9ICgpID0+IHtcclxuICAgICAgY29yZS5jYWNoZS5zZXQoc2x1Zywge1xyXG4gICAgICAgIHRpbWU6IERhdGUubm93KCksXHJcbiAgICAgICAgdHJpZ2dlcjogdHJ1ZSxcclxuICAgICAgfSlcclxuICAgIH1cclxuXHJcbiAgICBpZiAoY29vbERvd24udHJpZ2dlcikge1xyXG4gICAgICBjb25zdCBjb29sRG93blRpbWUgPSBhd2FpdCBjb3JlLnNjcmFwKGNtZC5vcHRpb25zLmNvb2xEb3duLCBtZXNzYWdlKVxyXG5cclxuICAgICAgaWYgKERhdGUubm93KCkgPiBjb29sRG93bi50aW1lICsgY29vbERvd25UaW1lKSB7XHJcbiAgICAgICAgY29yZS5jYWNoZS5zZXQoc2x1Zywge1xyXG4gICAgICAgICAgdGltZTogMCxcclxuICAgICAgICAgIHRyaWdnZXI6IGZhbHNlLFxyXG4gICAgICAgIH0pXHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBkaXNjb3JkLk1lc3NhZ2VFbWJlZCgpXHJcbiAgICAgICAgICAuc2V0Q29sb3IoXCJSRURcIilcclxuICAgICAgICAgIC5zZXRBdXRob3IoXHJcbiAgICAgICAgICAgIGBQbGVhc2Ugd2FpdCAke01hdGguY2VpbChcclxuICAgICAgICAgICAgICAoY29vbERvd24udGltZSArIGNvb2xEb3duVGltZSAtIERhdGUubm93KCkpIC8gMTAwMFxyXG4gICAgICAgICAgICApfSBzZWNvbmRzLi4uYCxcclxuICAgICAgICAgICAgbWVzc2FnZS5jbGllbnQudXNlci5kaXNwbGF5QXZhdGFyVVJMKClcclxuICAgICAgICAgIClcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0gZWxzZSB7XHJcbiAgICBtZXNzYWdlLnRyaWdnZXJDb29sRG93biA9ICgpID0+IHtcclxuICAgICAgbG9nZ2VyLndhcm4oXHJcbiAgICAgICAgYFlvdSBtdXN0IHNldHVwIHRoZSBjb29sZG93biBvZiB0aGUgXCIke2NtZC5vcHRpb25zLm5hbWV9XCIgY29tbWFuZCBiZWZvcmUgdXNpbmcgdGhlIFwidHJpZ2dlckNvb2xEb3duXCIgbWV0aG9kYCxcclxuICAgICAgICBcImNvbW1hbmQ6cHJlcGFyZUNvbW1hbmRcIlxyXG4gICAgICApXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBjb25zdCBjaGFubmVsVHlwZSA9IGF3YWl0IGNvcmUuc2NyYXAoY21kLm9wdGlvbnMuY2hhbm5lbFR5cGUsIG1lc3NhZ2UpXHJcblxyXG4gIGlmIChpc0d1aWxkTWVzc2FnZShtZXNzYWdlKSkge1xyXG4gICAgaWYgKGNoYW5uZWxUeXBlID09PSBcImRtXCIpXHJcbiAgICAgIHJldHVybiBuZXcgZGlzY29yZC5NZXNzYWdlRW1iZWQoKVxyXG4gICAgICAgIC5zZXRDb2xvcihcIlJFRFwiKVxyXG4gICAgICAgIC5zZXRBdXRob3IoXHJcbiAgICAgICAgICBcIlRoaXMgY29tbWFuZCBtdXN0IGJlIHVzZWQgaW4gRE0uXCIsXHJcbiAgICAgICAgICBtZXNzYWdlLmNsaWVudC51c2VyLmRpc3BsYXlBdmF0YXJVUkwoKVxyXG4gICAgICAgIClcclxuXHJcbiAgICBpZiAoY29yZS5zY3JhcChjbWQub3B0aW9ucy5ndWlsZE93bmVyT25seSwgbWVzc2FnZSkpXHJcbiAgICAgIGlmIChcclxuICAgICAgICBtZXNzYWdlLmd1aWxkLm93bmVySWQgIT09IG1lc3NhZ2UubWVtYmVyLmlkICYmXHJcbiAgICAgICAgcHJvY2Vzcy5lbnYuQk9UX09XTkVSICE9PSBtZXNzYWdlLm1lbWJlci5pZFxyXG4gICAgICApXHJcbiAgICAgICAgcmV0dXJuIG5ldyBkaXNjb3JkLk1lc3NhZ2VFbWJlZCgpXHJcbiAgICAgICAgICAuc2V0Q29sb3IoXCJSRURcIilcclxuICAgICAgICAgIC5zZXRBdXRob3IoXHJcbiAgICAgICAgICAgIFwiWW91IG11c3QgYmUgdGhlIGd1aWxkIG93bmVyLlwiLFxyXG4gICAgICAgICAgICBtZXNzYWdlLmNsaWVudC51c2VyLmRpc3BsYXlBdmF0YXJVUkwoKVxyXG4gICAgICAgICAgKVxyXG5cclxuICAgIGlmIChjbWQub3B0aW9ucy5ib3RQZXJtaXNzaW9ucykge1xyXG4gICAgICBjb25zdCBib3RQZXJtaXNzaW9ucyA9IGF3YWl0IGNvcmUuc2NyYXAoXHJcbiAgICAgICAgY21kLm9wdGlvbnMuYm90UGVybWlzc2lvbnMsXHJcbiAgICAgICAgbWVzc2FnZVxyXG4gICAgICApXHJcblxyXG4gICAgICBmb3IgKGNvbnN0IHBlcm1pc3Npb24gb2YgYm90UGVybWlzc2lvbnMpXHJcbiAgICAgICAgaWYgKCFtZXNzYWdlLmd1aWxkLm1lPy5wZXJtaXNzaW9ucy5oYXMocGVybWlzc2lvbiwgdHJ1ZSkpXHJcbiAgICAgICAgICByZXR1cm4gbmV3IGRpc2NvcmQuTWVzc2FnZUVtYmVkKClcclxuICAgICAgICAgICAgLnNldENvbG9yKFwiUkVEXCIpXHJcbiAgICAgICAgICAgIC5zZXRBdXRob3IoXCJPb3BzIVwiLCBtZXNzYWdlLmNsaWVudC51c2VyLmRpc3BsYXlBdmF0YXJVUkwoKSlcclxuICAgICAgICAgICAgLnNldERlc2NyaXB0aW9uKFxyXG4gICAgICAgICAgICAgIGBJIG5lZWQgdGhlIFxcYCR7cGVybWlzc2lvbn1cXGAgcGVybWlzc2lvbiB0byBjYWxsIHRoaXMgY29tbWFuZC5gXHJcbiAgICAgICAgICAgIClcclxuICAgIH1cclxuXHJcbiAgICBpZiAoY21kLm9wdGlvbnMudXNlclBlcm1pc3Npb25zKSB7XHJcbiAgICAgIGNvbnN0IHVzZXJQZXJtaXNzaW9ucyA9IGF3YWl0IGNvcmUuc2NyYXAoXHJcbiAgICAgICAgY21kLm9wdGlvbnMudXNlclBlcm1pc3Npb25zLFxyXG4gICAgICAgIG1lc3NhZ2VcclxuICAgICAgKVxyXG5cclxuICAgICAgZm9yIChjb25zdCBwZXJtaXNzaW9uIG9mIHVzZXJQZXJtaXNzaW9ucylcclxuICAgICAgICBpZiAoIW1lc3NhZ2UubWVtYmVyLnBlcm1pc3Npb25zLmhhcyhwZXJtaXNzaW9uLCB0cnVlKSlcclxuICAgICAgICAgIHJldHVybiBuZXcgZGlzY29yZC5NZXNzYWdlRW1iZWQoKVxyXG4gICAgICAgICAgICAuc2V0Q29sb3IoXCJSRURcIilcclxuICAgICAgICAgICAgLnNldEF1dGhvcihcIk9vcHMhXCIsIG1lc3NhZ2UuY2xpZW50LnVzZXIuZGlzcGxheUF2YXRhclVSTCgpKVxyXG4gICAgICAgICAgICAuc2V0RGVzY3JpcHRpb24oXHJcbiAgICAgICAgICAgICAgYFlvdSBuZWVkIHRoZSBcXGAke3Blcm1pc3Npb259XFxgIHBlcm1pc3Npb24gdG8gY2FsbCB0aGlzIGNvbW1hbmQuYFxyXG4gICAgICAgICAgICApXHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGNtZC5vcHRpb25zLnJvbGVzKSB7XHJcbiAgICAgIGNvbnN0IHJvbGVzID0gYXdhaXQgY29yZS5zY3JhcChjbWQub3B0aW9ucy5yb2xlcywgbWVzc2FnZSlcclxuXHJcbiAgICAgIGNvbnN0IGlzUm9sZSA9IChyOiBhbnkpOiByIGlzIGRpc2NvcmQuUm9sZVJlc29sdmFibGUgPT4ge1xyXG4gICAgICAgIHJldHVybiB0eXBlb2YgciA9PT0gXCJzdHJpbmdcIiB8fCByIGluc3RhbmNlb2YgZGlzY29yZC5Sb2xlXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IGdldFJvbGVJZCA9IChyOiBkaXNjb3JkLlJvbGVSZXNvbHZhYmxlKTogc3RyaW5nID0+IHtcclxuICAgICAgICByZXR1cm4gdHlwZW9mIHIgPT09IFwic3RyaW5nXCIgPyByIDogci5pZFxyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBtZW1iZXIgPSBhd2FpdCBtZXNzYWdlLm1lbWJlci5mZXRjaCgpXHJcblxyXG4gICAgICBmb3IgKGNvbnN0IHJvbGVDb25kIG9mIHJvbGVzKSB7XHJcbiAgICAgICAgaWYgKGlzUm9sZShyb2xlQ29uZCkpIHtcclxuICAgICAgICAgIGNvbnN0IGlkID0gZ2V0Um9sZUlkKHJvbGVDb25kKVxyXG5cclxuICAgICAgICAgIGlmICghbWVtYmVyLnJvbGVzLmNhY2hlLmhhcyhpZCkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBkaXNjb3JkLk1lc3NhZ2VFbWJlZCgpXHJcbiAgICAgICAgICAgICAgLnNldENvbG9yKFwiUkVEXCIpXHJcbiAgICAgICAgICAgICAgLnNldEF1dGhvcihcIk9vcHMhXCIsIG1lc3NhZ2UuY2xpZW50LnVzZXIuZGlzcGxheUF2YXRhclVSTCgpKVxyXG4gICAgICAgICAgICAgIC5zZXREZXNjcmlwdGlvbihcclxuICAgICAgICAgICAgICAgIGBZb3UgbXVzdCBoYXZlIHRoZSA8QCR7aWR9PiByb2xlIHRvIGNhbGwgdGhpcyBjb21tYW5kLmBcclxuICAgICAgICAgICAgICApXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGlmIChyb2xlQ29uZC5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICAgICAgY29uc3QgX3JvbGVDb25kID0gcm9sZUNvbmRbMF1cclxuICAgICAgICAgICAgaWYgKGlzUm9sZShfcm9sZUNvbmQpKSB7XHJcbiAgICAgICAgICAgICAgY29uc3QgaWQgPSBnZXRSb2xlSWQoX3JvbGVDb25kKVxyXG5cclxuICAgICAgICAgICAgICBpZiAobWVtYmVyLnJvbGVzLmNhY2hlLmhhcyhpZCkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgZGlzY29yZC5NZXNzYWdlRW1iZWQoKVxyXG4gICAgICAgICAgICAgICAgICAuc2V0Q29sb3IoXCJSRURcIilcclxuICAgICAgICAgICAgICAgICAgLnNldEF1dGhvcihcIk9vcHMhXCIsIG1lc3NhZ2UuY2xpZW50LnVzZXIuZGlzcGxheUF2YXRhclVSTCgpKVxyXG4gICAgICAgICAgICAgICAgICAuc2V0RGVzY3JpcHRpb24oXHJcbiAgICAgICAgICAgICAgICAgICAgYFlvdSBtdXN0bid0IGhhdmUgdGhlIDxAJHtpZH0+IHJvbGUgdG8gY2FsbCB0aGlzIGNvbW1hbmQuYFxyXG4gICAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIGZvciAoY29uc3Qgcm9sZSBvZiBfcm9sZUNvbmQpIHtcclxuICAgICAgICAgICAgICAgIGlmIChtZW1iZXIucm9sZXMuY2FjaGUuaGFzKGdldFJvbGVJZChyb2xlKSkpIHtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBkaXNjb3JkLk1lc3NhZ2VFbWJlZCgpXHJcbiAgICAgICAgICAgICAgICAgICAgLnNldENvbG9yKFwiUkVEXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgLnNldEF1dGhvcihcIk9vcHMhXCIsIG1lc3NhZ2UuY2xpZW50LnVzZXIuZGlzcGxheUF2YXRhclVSTCgpKVxyXG4gICAgICAgICAgICAgICAgICAgIC5zZXREZXNjcmlwdGlvbihcclxuICAgICAgICAgICAgICAgICAgICAgIGBZb3UgbXVzdG4ndCBoYXZlIHRoZSA8QCR7Z2V0Um9sZUlkKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICByb2xlXHJcbiAgICAgICAgICAgICAgICAgICAgICApfT4gcm9sZSB0byBjYWxsIHRoaXMgY29tbWFuZC5gXHJcbiAgICAgICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbGV0IHNvbWVSb2xlR2l2ZW4gPSBmYWxzZVxyXG5cclxuICAgICAgICAgICAgZm9yIChjb25zdCByb2xlIG9mIHJvbGVDb25kKSB7XHJcbiAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkocm9sZSkpIHtcclxuICAgICAgICAgICAgICAgIGxvZ2dlci53YXJuKFxyXG4gICAgICAgICAgICAgICAgICBgQmFkIGNvbW1hbmQucm9sZXMgc3RydWN0dXJlIGluICR7Y2hhbGsuYm9sZChcclxuICAgICAgICAgICAgICAgICAgICBjb21tYW5kQnJlYWRjcnVtYihjbWQsIFwiL1wiKVxyXG4gICAgICAgICAgICAgICAgICApfSBjb21tYW5kLmAsXHJcbiAgICAgICAgICAgICAgICAgIFwiY29tbWFuZDpwcmVwYXJlQ29tbWFuZFwiXHJcbiAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGlkID0gZ2V0Um9sZUlkKHJvbGUpXHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKG1lbWJlci5yb2xlcy5jYWNoZS5oYXMoaWQpKSB7XHJcbiAgICAgICAgICAgICAgICAgIHNvbWVSb2xlR2l2ZW4gPSB0cnVlXHJcbiAgICAgICAgICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIXNvbWVSb2xlR2l2ZW4pXHJcbiAgICAgICAgICAgICAgcmV0dXJuIG5ldyBkaXNjb3JkLk1lc3NhZ2VFbWJlZCgpXHJcbiAgICAgICAgICAgICAgICAuc2V0Q29sb3IoXCJSRURcIilcclxuICAgICAgICAgICAgICAgIC5zZXRBdXRob3IoXCJPb3BzIVwiLCBtZXNzYWdlLmNsaWVudC51c2VyLmRpc3BsYXlBdmF0YXJVUkwoKSlcclxuICAgICAgICAgICAgICAgIC5zZXREZXNjcmlwdGlvbihcclxuICAgICAgICAgICAgICAgICAgYFlvdSBtdXN0IGhhdmUgYXQgbGVhc3Qgb25lIG9mIHRoZSBmb2xsb3dpbmcgcm9sZXMgdG8gY2FsbCB0aGlzIGNvbW1hbmQuXFxuJHtbXHJcbiAgICAgICAgICAgICAgICAgICAgLi4ucm9sZUNvbmQsXHJcbiAgICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgICAgICAgICAuZmlsdGVyKFxyXG4gICAgICAgICAgICAgICAgICAgICAgKHJvbGUpOiByb2xlIGlzIGRpc2NvcmQuUm9sZVJlc29sdmFibGUgPT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgIUFycmF5LmlzQXJyYXkocm9sZSlcclxuICAgICAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgICAgICAgLm1hcCgocm9sZSkgPT4gYDxAJHtnZXRSb2xlSWQocm9sZSl9PmApXHJcbiAgICAgICAgICAgICAgICAgICAgLmpvaW4oXCIgXCIpfWBcclxuICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIGlmIChjaGFubmVsVHlwZSA9PT0gXCJndWlsZFwiKVxyXG4gICAgaWYgKGlzRGlyZWN0TWVzc2FnZShtZXNzYWdlKSlcclxuICAgICAgcmV0dXJuIG5ldyBkaXNjb3JkLk1lc3NhZ2VFbWJlZCgpXHJcbiAgICAgICAgLnNldENvbG9yKFwiUkVEXCIpXHJcbiAgICAgICAgLnNldEF1dGhvcihcclxuICAgICAgICAgIFwiVGhpcyBjb21tYW5kIG11c3QgYmUgdXNlZCBpbiBhIGd1aWxkLlwiLFxyXG4gICAgICAgICAgbWVzc2FnZS5jbGllbnQudXNlci5kaXNwbGF5QXZhdGFyVVJMKClcclxuICAgICAgICApXHJcblxyXG4gIGlmIChhd2FpdCBjb3JlLnNjcmFwKGNtZC5vcHRpb25zLmJvdE93bmVyT25seSwgbWVzc2FnZSkpXHJcbiAgICBpZiAocHJvY2Vzcy5lbnYuQk9UX09XTkVSICE9PSBtZXNzYWdlLmF1dGhvci5pZClcclxuICAgICAgcmV0dXJuIG5ldyBkaXNjb3JkLk1lc3NhZ2VFbWJlZCgpXHJcbiAgICAgICAgLnNldENvbG9yKFwiUkVEXCIpXHJcbiAgICAgICAgLnNldEF1dGhvcihcclxuICAgICAgICAgIFwiWW91IG11c3QgYmUgbXkgb3duZXIuXCIsXHJcbiAgICAgICAgICBtZXNzYWdlLmNsaWVudC51c2VyLmRpc3BsYXlBdmF0YXJVUkwoKVxyXG4gICAgICAgIClcclxuXHJcbiAgaWYgKGNvbnRleHQpIHtcclxuICAgIGlmIChjbWQub3B0aW9ucy5wb3NpdGlvbmFsKSB7XHJcbiAgICAgIGNvbnN0IHBvc2l0aW9uYWxMaXN0ID0gYXdhaXQgY29yZS5zY3JhcChjbWQub3B0aW9ucy5wb3NpdGlvbmFsLCBtZXNzYWdlKVxyXG5cclxuICAgICAgZm9yIChjb25zdCBwb3NpdGlvbmFsIG9mIHBvc2l0aW9uYWxMaXN0KSB7XHJcbiAgICAgICAgY29uc3QgaW5kZXggPSBwb3NpdGlvbmFsTGlzdC5pbmRleE9mKHBvc2l0aW9uYWwpXHJcbiAgICAgICAgbGV0IHZhbHVlOiBhbnkgPSBjb250ZXh0LnBhcnNlZEFyZ3MuX1tpbmRleF1cclxuICAgICAgICBjb25zdCBnaXZlbiA9IHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IG51bGxcclxuXHJcbiAgICAgICAgY29uc3Qgc2V0ID0gKHY6IGFueSkgPT4ge1xyXG4gICAgICAgICAgbWVzc2FnZS5hcmdzW3Bvc2l0aW9uYWwubmFtZV0gPSB2XHJcbiAgICAgICAgICBtZXNzYWdlLmFyZ3NbaW5kZXhdID0gdlxyXG4gICAgICAgICAgdmFsdWUgPSB2XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodmFsdWUpIHZhbHVlID0gYXJndW1lbnQudHJpbUFyZ3VtZW50VmFsdWUodmFsdWUpXHJcblxyXG4gICAgICAgIHNldCh2YWx1ZSlcclxuXHJcbiAgICAgICAgaWYgKCFnaXZlbikge1xyXG4gICAgICAgICAgaWYgKGF3YWl0IGNvcmUuc2NyYXAocG9zaXRpb25hbC5yZXF1aXJlZCwgbWVzc2FnZSkpIHtcclxuICAgICAgICAgICAgaWYgKHBvc2l0aW9uYWwubWlzc2luZ0Vycm9yTWVzc2FnZSkge1xyXG4gICAgICAgICAgICAgIGlmICh0eXBlb2YgcG9zaXRpb25hbC5taXNzaW5nRXJyb3JNZXNzYWdlID09PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IGRpc2NvcmQuTWVzc2FnZUVtYmVkKClcclxuICAgICAgICAgICAgICAgICAgLnNldENvbG9yKFwiUkVEXCIpXHJcbiAgICAgICAgICAgICAgICAgIC5zZXRBdXRob3IoXHJcbiAgICAgICAgICAgICAgICAgICAgYE1pc3NpbmcgcG9zaXRpb25hbCBcIiR7cG9zaXRpb25hbC5uYW1lfVwiYCxcclxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlLmNsaWVudC51c2VyLmRpc3BsYXlBdmF0YXJVUkwoKVxyXG4gICAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgICAgIC5zZXREZXNjcmlwdGlvbihwb3NpdGlvbmFsLm1pc3NpbmdFcnJvck1lc3NhZ2UpXHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBwb3NpdGlvbmFsLm1pc3NpbmdFcnJvck1lc3NhZ2VcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgZGlzY29yZC5NZXNzYWdlRW1iZWQoKVxyXG4gICAgICAgICAgICAgIC5zZXRDb2xvcihcIlJFRFwiKVxyXG4gICAgICAgICAgICAgIC5zZXRBdXRob3IoXHJcbiAgICAgICAgICAgICAgICBgTWlzc2luZyBwb3NpdGlvbmFsIFwiJHtwb3NpdGlvbmFsLm5hbWV9XCJgLFxyXG4gICAgICAgICAgICAgICAgbWVzc2FnZS5jbGllbnQudXNlci5kaXNwbGF5QXZhdGFyVVJMKClcclxuICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgLnNldERlc2NyaXB0aW9uKFxyXG4gICAgICAgICAgICAgICAgcG9zaXRpb25hbC5kZXNjcmlwdGlvblxyXG4gICAgICAgICAgICAgICAgICA/IFwiRGVzY3JpcHRpb246IFwiICsgcG9zaXRpb25hbC5kZXNjcmlwdGlvblxyXG4gICAgICAgICAgICAgICAgICA6IGBSdW4gdGhlIGZvbGxvd2luZyBjb21tYW5kIHRvIGxlYXJuIG1vcmU6ICR7Y29yZS5jb2RlLnN0cmluZ2lmeShcclxuICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudDogYCR7bWVzc2FnZS51c2VkUHJlZml4fSR7Y29udGV4dC5rZXl9IC0taGVscGAsXHJcbiAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgKX1gXHJcbiAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgfSBlbHNlIGlmIChwb3NpdGlvbmFsLmRlZmF1bHQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBzZXQoYXdhaXQgY29yZS5zY3JhcChwb3NpdGlvbmFsLmRlZmF1bHQsIG1lc3NhZ2UpKVxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgc2V0KG51bGwpXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIGlmIChwb3NpdGlvbmFsLmNoZWNrVmFsdWUpIHtcclxuICAgICAgICAgIGNvbnN0IGNoZWNrZWQgPSBhd2FpdCBhcmd1bWVudC5jaGVja1ZhbHVlKFxyXG4gICAgICAgICAgICBwb3NpdGlvbmFsLFxyXG4gICAgICAgICAgICBcInBvc2l0aW9uYWxcIixcclxuICAgICAgICAgICAgdmFsdWUsXHJcbiAgICAgICAgICAgIG1lc3NhZ2VcclxuICAgICAgICAgIClcclxuXHJcbiAgICAgICAgICBpZiAoY2hlY2tlZCAhPT0gdHJ1ZSkgcmV0dXJuIGNoZWNrZWRcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh2YWx1ZSAhPT0gbnVsbCAmJiBwb3NpdGlvbmFsLmNhc3RWYWx1ZSkge1xyXG4gICAgICAgICAgY29uc3QgY2FzdGVkID0gYXdhaXQgYXJndW1lbnQuY2FzdFZhbHVlKFxyXG4gICAgICAgICAgICBwb3NpdGlvbmFsLFxyXG4gICAgICAgICAgICBcInBvc2l0aW9uYWxcIixcclxuICAgICAgICAgICAgdmFsdWUsXHJcbiAgICAgICAgICAgIG1lc3NhZ2UsXHJcbiAgICAgICAgICAgIHNldFxyXG4gICAgICAgICAgKVxyXG5cclxuICAgICAgICAgIGlmIChjYXN0ZWQgIT09IHRydWUpIHJldHVybiBjYXN0ZWRcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh2YWx1ZSAhPT0gbnVsbCAmJiBwb3NpdGlvbmFsLmNoZWNrQ2FzdGVkVmFsdWUpIHtcclxuICAgICAgICAgIGNvbnN0IGNoZWNrZWQgPSBhd2FpdCBhcmd1bWVudC5jaGVja0Nhc3RlZFZhbHVlKFxyXG4gICAgICAgICAgICBwb3NpdGlvbmFsLFxyXG4gICAgICAgICAgICBcInBvc2l0aW9uYWxcIixcclxuICAgICAgICAgICAgdmFsdWUsXHJcbiAgICAgICAgICAgIG1lc3NhZ2VcclxuICAgICAgICAgIClcclxuXHJcbiAgICAgICAgICBpZiAoY2hlY2tlZCAhPT0gdHJ1ZSkgcmV0dXJuIGNoZWNrZWRcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnRleHQucmVzdFBvc2l0aW9uYWwuc2hpZnQoKVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGNtZC5vcHRpb25zLm9wdGlvbnMpIHtcclxuICAgICAgY29uc3Qgb3B0aW9ucyA9IGF3YWl0IGNvcmUuc2NyYXAoY21kLm9wdGlvbnMub3B0aW9ucywgbWVzc2FnZSlcclxuXHJcbiAgICAgIGZvciAoY29uc3Qgb3B0aW9uIG9mIG9wdGlvbnMpIHtcclxuICAgICAgICBsZXQgeyBnaXZlbiwgdmFsdWUgfSA9IGFyZ3VtZW50LnJlc29sdmVHaXZlbkFyZ3VtZW50KFxyXG4gICAgICAgICAgY29udGV4dC5wYXJzZWRBcmdzLFxyXG4gICAgICAgICAgb3B0aW9uXHJcbiAgICAgICAgKVxyXG5cclxuICAgICAgICBjb25zdCBzZXQgPSAodjogYW55KSA9PiB7XHJcbiAgICAgICAgICBtZXNzYWdlLmFyZ3Nbb3B0aW9uLm5hbWVdID0gdlxyXG4gICAgICAgICAgdmFsdWUgPSB2XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodmFsdWUgPT09IHRydWUpIHZhbHVlID0gdW5kZWZpbmVkXHJcblxyXG4gICAgICAgIGlmICghZ2l2ZW4gJiYgKGF3YWl0IGNvcmUuc2NyYXAob3B0aW9uLnJlcXVpcmVkLCBtZXNzYWdlKSkpIHtcclxuICAgICAgICAgIGlmIChvcHRpb24ubWlzc2luZ0Vycm9yTWVzc2FnZSkge1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIG9wdGlvbi5taXNzaW5nRXJyb3JNZXNzYWdlID09PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIG5ldyBkaXNjb3JkLk1lc3NhZ2VFbWJlZCgpXHJcbiAgICAgICAgICAgICAgICAuc2V0Q29sb3IoXCJSRURcIilcclxuICAgICAgICAgICAgICAgIC5zZXRBdXRob3IoXHJcbiAgICAgICAgICAgICAgICAgIGBNaXNzaW5nIG9wdGlvbiBcIiR7b3B0aW9uLm5hbWV9XCJgLFxyXG4gICAgICAgICAgICAgICAgICBtZXNzYWdlLmNsaWVudC51c2VyLmRpc3BsYXlBdmF0YXJVUkwoKVxyXG4gICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgLnNldERlc2NyaXB0aW9uKG9wdGlvbi5taXNzaW5nRXJyb3JNZXNzYWdlKVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIHJldHVybiBvcHRpb24ubWlzc2luZ0Vycm9yTWVzc2FnZVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgcmV0dXJuIG5ldyBkaXNjb3JkLk1lc3NhZ2VFbWJlZCgpXHJcbiAgICAgICAgICAgIC5zZXRDb2xvcihcIlJFRFwiKVxyXG4gICAgICAgICAgICAuc2V0QXV0aG9yKFxyXG4gICAgICAgICAgICAgIGBNaXNzaW5nIG9wdGlvbiBcIiR7b3B0aW9uLm5hbWV9XCJgLFxyXG4gICAgICAgICAgICAgIG1lc3NhZ2UuY2xpZW50LnVzZXIuZGlzcGxheUF2YXRhclVSTCgpXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgICAgLnNldERlc2NyaXB0aW9uKFxyXG4gICAgICAgICAgICAgIG9wdGlvbi5kZXNjcmlwdGlvblxyXG4gICAgICAgICAgICAgICAgPyBcIkRlc2NyaXB0aW9uOiBcIiArIG9wdGlvbi5kZXNjcmlwdGlvblxyXG4gICAgICAgICAgICAgICAgOiBgRXhhbXBsZTogXFxgLS0ke29wdGlvbi5uYW1lfT1zb21lVmFsdWVcXGBgXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHNldCh2YWx1ZSlcclxuXHJcbiAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgIGlmIChvcHRpb24uZGVmYXVsdCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHNldChhd2FpdCBjb3JlLnNjcmFwKG9wdGlvbi5kZWZhdWx0LCBtZXNzYWdlKSlcclxuICAgICAgICAgIH0gZWxzZSBpZiAob3B0aW9uLmNhc3RWYWx1ZSAhPT0gXCJhcnJheVwiKSB7XHJcbiAgICAgICAgICAgIHNldChudWxsKVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSBpZiAob3B0aW9uLmNoZWNrVmFsdWUpIHtcclxuICAgICAgICAgIGNvbnN0IGNoZWNrZWQgPSBhd2FpdCBhcmd1bWVudC5jaGVja1ZhbHVlKFxyXG4gICAgICAgICAgICBvcHRpb24sXHJcbiAgICAgICAgICAgIFwiYXJndW1lbnRcIixcclxuICAgICAgICAgICAgdmFsdWUsXHJcbiAgICAgICAgICAgIG1lc3NhZ2VcclxuICAgICAgICAgIClcclxuXHJcbiAgICAgICAgICBpZiAoY2hlY2tlZCAhPT0gdHJ1ZSkgcmV0dXJuIGNoZWNrZWRcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh2YWx1ZSAhPT0gbnVsbCAmJiBvcHRpb24uY2FzdFZhbHVlKSB7XHJcbiAgICAgICAgICBjb25zdCBjYXN0ZWQgPSBhd2FpdCBhcmd1bWVudC5jYXN0VmFsdWUoXHJcbiAgICAgICAgICAgIG9wdGlvbixcclxuICAgICAgICAgICAgXCJhcmd1bWVudFwiLFxyXG4gICAgICAgICAgICB2YWx1ZSxcclxuICAgICAgICAgICAgbWVzc2FnZSxcclxuICAgICAgICAgICAgc2V0XHJcbiAgICAgICAgICApXHJcblxyXG4gICAgICAgICAgaWYgKGNhc3RlZCAhPT0gdHJ1ZSkgcmV0dXJuIGNhc3RlZFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHZhbHVlICE9PSBudWxsICYmIG9wdGlvbi5jaGVja0Nhc3RlZFZhbHVlKSB7XHJcbiAgICAgICAgICBjb25zdCBjaGVja2VkID0gYXdhaXQgYXJndW1lbnQuY2hlY2tDYXN0ZWRWYWx1ZShcclxuICAgICAgICAgICAgb3B0aW9uLFxyXG4gICAgICAgICAgICBcImFyZ3VtZW50XCIsXHJcbiAgICAgICAgICAgIHZhbHVlLFxyXG4gICAgICAgICAgICBtZXNzYWdlXHJcbiAgICAgICAgICApXHJcblxyXG4gICAgICAgICAgaWYgKGNoZWNrZWQgIT09IHRydWUpIHJldHVybiBjaGVja2VkXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGNtZC5vcHRpb25zLmZsYWdzKSB7XHJcbiAgICAgIGZvciAoY29uc3QgZmxhZyBvZiBjbWQub3B0aW9ucy5mbGFncykge1xyXG4gICAgICAgIGxldCB7IGdpdmVuLCBuYW1lSXNHaXZlbiwgdmFsdWUgfSA9IGFyZ3VtZW50LnJlc29sdmVHaXZlbkFyZ3VtZW50KFxyXG4gICAgICAgICAgY29udGV4dC5wYXJzZWRBcmdzLFxyXG4gICAgICAgICAgZmxhZ1xyXG4gICAgICAgIClcclxuXHJcbiAgICAgICAgY29uc3Qgc2V0ID0gKHY6IGJvb2xlYW4pID0+IHtcclxuICAgICAgICAgIG1lc3NhZ2UuYXJnc1tmbGFnLm5hbWVdID0gdlxyXG4gICAgICAgICAgdmFsdWUgPSB2XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIW5hbWVJc0dpdmVuKSBzZXQoZmFsc2UpXHJcbiAgICAgICAgZWxzZSBpZiAodHlwZW9mIHZhbHVlID09PSBcImJvb2xlYW5cIikgc2V0KHZhbHVlKVxyXG4gICAgICAgIGVsc2UgaWYgKC9eKD86dHJ1ZXwxfG9ufHllc3xvdWkpJC8udGVzdCh2YWx1ZSkpIHNldCh0cnVlKVxyXG4gICAgICAgIGVsc2UgaWYgKC9eKD86ZmFsc2V8MHxvZmZ8bm98bm9uKSQvLnRlc3QodmFsdWUpKSBzZXQoZmFsc2UpXHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICBzZXQodHJ1ZSlcclxuICAgICAgICAgIGNvbnRleHQucmVzdFBvc2l0aW9uYWwudW5zaGlmdCh2YWx1ZSlcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBtZXNzYWdlLnJlc3QgPSBjb250ZXh0LnJlc3RQb3NpdGlvbmFsLmpvaW4oXCIgXCIpXHJcblxyXG4gICAgaWYgKGNtZC5vcHRpb25zLnJlc3QpIHtcclxuICAgICAgY29uc3QgcmVzdCA9IGF3YWl0IGNvcmUuc2NyYXAoY21kLm9wdGlvbnMucmVzdCwgbWVzc2FnZSlcclxuXHJcbiAgICAgIGlmIChyZXN0LmFsbCkgbWVzc2FnZS5yZXN0ID0gY29udGV4dC5iYXNlQ29udGVudFxyXG5cclxuICAgICAgaWYgKG1lc3NhZ2UucmVzdC5sZW5ndGggPT09IDApIHtcclxuICAgICAgICBpZiAoYXdhaXQgY29yZS5zY3JhcChyZXN0LnJlcXVpcmVkLCBtZXNzYWdlKSkge1xyXG4gICAgICAgICAgaWYgKHJlc3QubWlzc2luZ0Vycm9yTWVzc2FnZSkge1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIHJlc3QubWlzc2luZ0Vycm9yTWVzc2FnZSA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICAgICAgICAgIHJldHVybiBuZXcgZGlzY29yZC5NZXNzYWdlRW1iZWQoKVxyXG4gICAgICAgICAgICAgICAgLnNldENvbG9yKFwiUkVEXCIpXHJcbiAgICAgICAgICAgICAgICAuc2V0QXV0aG9yKFxyXG4gICAgICAgICAgICAgICAgICBgTWlzc2luZyByZXN0IFwiJHtyZXN0Lm5hbWV9XCJgLFxyXG4gICAgICAgICAgICAgICAgICBtZXNzYWdlLmNsaWVudC51c2VyLmRpc3BsYXlBdmF0YXJVUkwoKVxyXG4gICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgLnNldERlc2NyaXB0aW9uKHJlc3QubWlzc2luZ0Vycm9yTWVzc2FnZSlcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICByZXR1cm4gcmVzdC5taXNzaW5nRXJyb3JNZXNzYWdlXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICByZXR1cm4gbmV3IGRpc2NvcmQuTWVzc2FnZUVtYmVkKClcclxuICAgICAgICAgICAgLnNldENvbG9yKFwiUkVEXCIpXHJcbiAgICAgICAgICAgIC5zZXRBdXRob3IoXHJcbiAgICAgICAgICAgICAgYE1pc3NpbmcgcmVzdCBcIiR7cmVzdC5uYW1lfVwiYCxcclxuICAgICAgICAgICAgICBtZXNzYWdlLmNsaWVudC51c2VyLmRpc3BsYXlBdmF0YXJVUkwoKVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICAgIC5zZXREZXNjcmlwdGlvbihcclxuICAgICAgICAgICAgICByZXN0LmRlc2NyaXB0aW9uID8/XHJcbiAgICAgICAgICAgICAgICBcIlBsZWFzZSB1c2UgYC0taGVscGAgZmxhZyBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cIlxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgfSBlbHNlIGlmIChyZXN0LmRlZmF1bHQpIHtcclxuICAgICAgICAgIG1lc3NhZ2UuYXJnc1tyZXN0Lm5hbWVdID0gYXdhaXQgY29yZS5zY3JhcChyZXN0LmRlZmF1bHQsIG1lc3NhZ2UpXHJcbiAgICAgICAgfVxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIG1lc3NhZ2UuYXJnc1tyZXN0Lm5hbWVdID0gbWVzc2FnZS5yZXN0XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIGlmIChjbWQub3B0aW9ucy5taWRkbGV3YXJlcykge1xyXG4gICAgY29uc3QgbWlkZGxld2FyZXMgPSBhd2FpdCBjb3JlLnNjcmFwKGNtZC5vcHRpb25zLm1pZGRsZXdhcmVzLCBtZXNzYWdlKVxyXG5cclxuICAgIGxldCBjdXJyZW50RGF0YTogYW55ID0ge31cclxuXHJcbiAgICBmb3IgKGNvbnN0IG1pZGRsZXdhcmUgb2YgbWlkZGxld2FyZXMpIHtcclxuICAgICAgY29uc3QgeyByZXN1bHQsIGRhdGEgfSA9IGF3YWl0IG1pZGRsZXdhcmUobWVzc2FnZSwgY3VycmVudERhdGEpXHJcblxyXG4gICAgICBjdXJyZW50RGF0YSA9IHtcclxuICAgICAgICAuLi5jdXJyZW50RGF0YSxcclxuICAgICAgICAuLi4oZGF0YSA/PyB7fSksXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICh0eXBlb2YgcmVzdWx0ID09PSBcInN0cmluZ1wiKVxyXG4gICAgICAgIHJldHVybiBuZXcgZGlzY29yZC5NZXNzYWdlRW1iZWQoKVxyXG4gICAgICAgICAgLnNldENvbG9yKFwiUkVEXCIpXHJcbiAgICAgICAgICAuc2V0QXV0aG9yKFxyXG4gICAgICAgICAgICBgJHtcclxuICAgICAgICAgICAgICBtaWRkbGV3YXJlLm5hbWUgPyBgXCIke21pZGRsZXdhcmUubmFtZX1cIiBtYCA6IFwiTVwiXHJcbiAgICAgICAgICAgIH1pZGRsZXdhcmUgZXJyb3JgLFxyXG4gICAgICAgICAgICBtZXNzYWdlLmNsaWVudC51c2VyLmRpc3BsYXlBdmF0YXJVUkwoKVxyXG4gICAgICAgICAgKVxyXG4gICAgICAgICAgLnNldERlc2NyaXB0aW9uKHJlc3VsdClcclxuXHJcbiAgICAgIGlmICghcmVzdWx0KSByZXR1cm4gZmFsc2VcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHJldHVybiB0cnVlXHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZW5kQ29tbWFuZERldGFpbHM8VHlwZSBleHRlbmRzIGtleW9mIENvbW1hbmRNZXNzYWdlVHlwZT4oXHJcbiAgbWVzc2FnZTogQ29tbWFuZE1lc3NhZ2VUeXBlW1R5cGVdLFxyXG4gIGNtZDogQ29tbWFuZDxUeXBlPlxyXG4pOiBQcm9taXNlPHZvaWQ+IHtcclxuICBsZXQgcGF0dGVybiA9IGAke21lc3NhZ2UudXNlZFByZWZpeH0ke1xyXG4gICAgY21kLm9wdGlvbnMuaXNEZWZhdWx0XHJcbiAgICAgID8gYFske2NvbW1hbmRCcmVhZGNydW1iKGNtZCl9XWBcclxuICAgICAgOiBjb21tYW5kQnJlYWRjcnVtYihjbWQpXHJcbiAgfWBcclxuXHJcbiAgY29uc3QgcG9zaXRpb25hbExpc3Q6IHN0cmluZ1tdID0gW11cclxuICBjb25zdCBhcmd1bWVudExpc3Q6IHN0cmluZ1tdID0gW11cclxuICBjb25zdCBmbGFnTGlzdDogc3RyaW5nW10gPSBbXVxyXG4gIGxldCByZXN0UGF0dGVybiA9IFwiXCJcclxuXHJcbiAgaWYgKGNtZC5vcHRpb25zLnJlc3QpIHtcclxuICAgIGNvbnN0IHJlc3QgPSBhd2FpdCBjb3JlLnNjcmFwKGNtZC5vcHRpb25zLnJlc3QsIG1lc3NhZ2UpXHJcbiAgICBjb25zdCBkZnQgPVxyXG4gICAgICByZXN0LmRlZmF1bHQgIT09IHVuZGVmaW5lZFxyXG4gICAgICAgID8gYD1cIiR7YXdhaXQgY29yZS5zY3JhcChyZXN0LmRlZmF1bHQsIG1lc3NhZ2UpfVwiYFxyXG4gICAgICAgIDogXCJcIlxyXG5cclxuICAgIHJlc3RQYXR0ZXJuID0gKGF3YWl0IGNvcmUuc2NyYXAocmVzdC5yZXF1aXJlZCwgbWVzc2FnZSkpXHJcbiAgICAgID8gYDwuLi4ke3Jlc3QubmFtZX0+YFxyXG4gICAgICA6IGBbLi4uJHtyZXN0Lm5hbWV9JHtkZnR9XWBcclxuICB9XHJcblxyXG4gIGlmIChjbWQub3B0aW9ucy5wb3NpdGlvbmFsKSB7XHJcbiAgICBjb25zdCBjbWRQb3NpdGlvbmFsID0gYXdhaXQgY29yZS5zY3JhcChjbWQub3B0aW9ucy5wb3NpdGlvbmFsLCBtZXNzYWdlKVxyXG5cclxuICAgIGZvciAoY29uc3QgcG9zaXRpb25hbCBvZiBjbWRQb3NpdGlvbmFsKSB7XHJcbiAgICAgIGNvbnN0IGRmdCA9XHJcbiAgICAgICAgcG9zaXRpb25hbC5kZWZhdWx0ICE9PSB1bmRlZmluZWRcclxuICAgICAgICAgID8gYD1cIiR7YXdhaXQgY29yZS5zY3JhcChwb3NpdGlvbmFsLmRlZmF1bHQsIG1lc3NhZ2UpfVwiYFxyXG4gICAgICAgICAgOiBcIlwiXHJcbiAgICAgIHBvc2l0aW9uYWxMaXN0LnB1c2goXHJcbiAgICAgICAgKGF3YWl0IGNvcmUuc2NyYXAocG9zaXRpb25hbC5yZXF1aXJlZCwgbWVzc2FnZSkpICYmICFkZnRcclxuICAgICAgICAgID8gYDwke3Bvc2l0aW9uYWwubmFtZX0+YFxyXG4gICAgICAgICAgOiBgWyR7cG9zaXRpb25hbC5uYW1lfSR7ZGZ0fV1gXHJcbiAgICAgIClcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGlmIChjbWQub3B0aW9ucy5vcHRpb25zKSB7XHJcbiAgICBjb25zdCBjbWRPcHRpb25zID0gYXdhaXQgY29yZS5zY3JhcChjbWQub3B0aW9ucy5vcHRpb25zLCBtZXNzYWdlKVxyXG5cclxuICAgIGZvciAoY29uc3QgYXJnIG9mIGNtZE9wdGlvbnMpIHtcclxuICAgICAgY29uc3QgZGZ0ID1cclxuICAgICAgICBhcmcuZGVmYXVsdCAhPT0gdW5kZWZpbmVkXHJcbiAgICAgICAgICA/IGA9XCIke2NvcmUuc2NyYXAoYXJnLmRlZmF1bHQsIG1lc3NhZ2UpfVwiYFxyXG4gICAgICAgICAgOiBcIlwiXHJcbiAgICAgIGFyZ3VtZW50TGlzdC5wdXNoKFxyXG4gICAgICAgIChhd2FpdCBjb3JlLnNjcmFwKGFyZy5yZXF1aXJlZCwgbWVzc2FnZSkpXHJcbiAgICAgICAgICA/IGBcXGAtLSR7YXJnLm5hbWV9JHtkZnR9XFxgIChcXGAke2FyZ3VtZW50LmdldFR5cGVEZXNjcmlwdGlvbk9mKFxyXG4gICAgICAgICAgICAgIGFyZ1xyXG4gICAgICAgICAgICApfVxcYCkgJHthcmcuZGVzY3JpcHRpb24gPz8gXCJcIn1gXHJcbiAgICAgICAgICA6IGBcXGBbLS0ke2FyZy5uYW1lfSR7ZGZ0fV1cXGAgKFxcYCR7YXJndW1lbnQuZ2V0VHlwZURlc2NyaXB0aW9uT2YoXHJcbiAgICAgICAgICAgICAgYXJnXHJcbiAgICAgICAgICAgICl9XFxgKSAke2FyZy5kZXNjcmlwdGlvbiA/PyBcIlwifWBcclxuICAgICAgKVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgaWYgKGNtZC5vcHRpb25zLmZsYWdzKSB7XHJcbiAgICBmb3IgKGNvbnN0IGZsYWcgb2YgY21kLm9wdGlvbnMuZmxhZ3MpIHtcclxuICAgICAgZmxhZ0xpc3QucHVzaChgWy0tJHtmbGFnLm5hbWV9XWApXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBjb25zdCBzcGVjaWFsUGVybWlzc2lvbnMgPSBbXVxyXG5cclxuICBpZiAoYXdhaXQgY29yZS5zY3JhcChjbWQub3B0aW9ucy5ib3RPd25lck9ubHksIG1lc3NhZ2UpKVxyXG4gICAgc3BlY2lhbFBlcm1pc3Npb25zLnB1c2goXCJCT1RfT1dORVJcIilcclxuICBpZiAoYXdhaXQgY29yZS5zY3JhcChjbWQub3B0aW9ucy5ndWlsZE93bmVyT25seSwgbWVzc2FnZSkpXHJcbiAgICBzcGVjaWFsUGVybWlzc2lvbnMucHVzaChcIkdVSUxEX09XTkVSXCIpXHJcblxyXG4gIGNvbnN0IGVtYmVkID0gbmV3IGRpc2NvcmQuTWVzc2FnZUVtYmVkKClcclxuICAgIC5zZXRDb2xvcihcIkJMVVJQTEVcIilcclxuICAgIC5zZXRBdXRob3IoXCJDb21tYW5kIGRldGFpbHNcIiwgbWVzc2FnZS5jbGllbnQudXNlci5kaXNwbGF5QXZhdGFyVVJMKCkpXHJcbiAgICAuc2V0VGl0bGUoXHJcbiAgICAgIGAke3BhdHRlcm59ICR7Wy4uLnBvc2l0aW9uYWxMaXN0LCByZXN0UGF0dGVybiwgLi4uZmxhZ0xpc3RdLmpvaW4oXCIgXCIpfSAke1xyXG4gICAgICAgIGNtZC5vcHRpb25zID8gXCJbT1BUSU9OU11cIiA6IFwiXCJcclxuICAgICAgfWBcclxuICAgIClcclxuICAgIC5zZXREZXNjcmlwdGlvbihcclxuICAgICAgKGF3YWl0IGNvcmUuc2NyYXAoY21kLm9wdGlvbnMubG9uZ0Rlc2NyaXB0aW9uLCBtZXNzYWdlKSkgPz9cclxuICAgICAgICBjbWQub3B0aW9ucy5kZXNjcmlwdGlvbiA/P1xyXG4gICAgICAgIFwibm8gZGVzY3JpcHRpb25cIlxyXG4gICAgKVxyXG5cclxuICBpZiAoYXJndW1lbnRMaXN0Lmxlbmd0aCA+IDApXHJcbiAgICBlbWJlZC5hZGRGaWVsZChcIm9wdGlvbnNcIiwgYXJndW1lbnRMaXN0LmpvaW4oXCJcXG5cIiksIGZhbHNlKVxyXG5cclxuICBpZiAoY21kLm9wdGlvbnMuYWxpYXNlcykge1xyXG4gICAgY29uc3QgYWxpYXNlcyA9IGNtZC5vcHRpb25zLmFsaWFzZXNcclxuXHJcbiAgICBlbWJlZC5hZGRGaWVsZChcclxuICAgICAgXCJhbGlhc2VzXCIsXHJcbiAgICAgIGFsaWFzZXMubWFwKChhbGlhcykgPT4gYFxcYCR7YWxpYXN9XFxgYCkuam9pbihcIiwgXCIpLFxyXG4gICAgICB0cnVlXHJcbiAgICApXHJcbiAgfVxyXG5cclxuICBpZiAoY21kLm9wdGlvbnMuZXhhbXBsZXMpIHtcclxuICAgIGNvbnN0IGV4YW1wbGVzID0gYXdhaXQgY29yZS5zY3JhcChjbWQub3B0aW9ucy5leGFtcGxlcywgbWVzc2FnZSlcclxuXHJcbiAgICBlbWJlZC5hZGRGaWVsZChcclxuICAgICAgXCJleGFtcGxlczpcIixcclxuICAgICAgY29yZS5jb2RlLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgY29udGVudDogZXhhbXBsZXNcclxuICAgICAgICAgIC5tYXAoKGV4YW1wbGUpID0+IG1lc3NhZ2UudXNlZFByZWZpeCArIGV4YW1wbGUpXHJcbiAgICAgICAgICAuam9pbihcIlxcblwiKSxcclxuICAgICAgfSksXHJcbiAgICAgIGZhbHNlXHJcbiAgICApXHJcbiAgfVxyXG5cclxuICBpZiAoY21kLm9wdGlvbnMuYm90UGVybWlzc2lvbnMpIHtcclxuICAgIGNvbnN0IGJvdFBlcm1pc3Npb25zID0gYXdhaXQgY29yZS5zY3JhcChjbWQub3B0aW9ucy5ib3RQZXJtaXNzaW9ucywgbWVzc2FnZSlcclxuXHJcbiAgICBlbWJlZC5hZGRGaWVsZChcImJvdCBwZXJtaXNzaW9uc1wiLCBib3RQZXJtaXNzaW9ucy5qb2luKFwiLCBcIiksIHRydWUpXHJcbiAgfVxyXG5cclxuICBpZiAoY21kLm9wdGlvbnMudXNlclBlcm1pc3Npb25zKSB7XHJcbiAgICBjb25zdCB1c2VyUGVybWlzc2lvbnMgPSBhd2FpdCBjb3JlLnNjcmFwKFxyXG4gICAgICBjbWQub3B0aW9ucy51c2VyUGVybWlzc2lvbnMsXHJcbiAgICAgIG1lc3NhZ2VcclxuICAgIClcclxuXHJcbiAgICBlbWJlZC5hZGRGaWVsZChcInVzZXIgcGVybWlzc2lvbnNcIiwgdXNlclBlcm1pc3Npb25zLmpvaW4oXCIsIFwiKSwgdHJ1ZSlcclxuICB9XHJcblxyXG4gIGlmIChzcGVjaWFsUGVybWlzc2lvbnMubGVuZ3RoID4gMClcclxuICAgIGVtYmVkLmFkZEZpZWxkKFxyXG4gICAgICBcInNwZWNpYWwgcGVybWlzc2lvbnNcIixcclxuICAgICAgc3BlY2lhbFBlcm1pc3Npb25zLm1hcCgocGVybSkgPT4gYFxcYCR7cGVybX1cXGBgKS5qb2luKFwiLCBcIiksXHJcbiAgICAgIHRydWVcclxuICAgIClcclxuXHJcbiAgaWYgKGNtZC5vcHRpb25zLmNvb2xEb3duKSB7XHJcbiAgICBjb25zdCBjb29sRG93biA9IGF3YWl0IGNvcmUuc2NyYXAoY21kLm9wdGlvbnMuY29vbERvd24sIG1lc3NhZ2UpXHJcblxyXG4gICAgZW1iZWQuYWRkRmllbGQoXCJjb29sIGRvd25cIiwgdGltcy5kdXJhdGlvbihjb29sRG93biksIHRydWUpXHJcbiAgfVxyXG5cclxuICBpZiAoY21kLm9wdGlvbnMuc3VicylcclxuICAgIGVtYmVkLmFkZEZpZWxkKFxyXG4gICAgICBcInN1YiBjb21tYW5kczpcIixcclxuICAgICAgKFxyXG4gICAgICAgIGF3YWl0IFByb21pc2UuYWxsKFxyXG4gICAgICAgICAgY21kLm9wdGlvbnMuc3Vicy5tYXAoYXN5bmMgKHN1YjogQ29tbWFuZDxhbnk+KSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHByZXBhcmVkID0gYXdhaXQgcHJlcGFyZUNvbW1hbmQobWVzc2FnZSwgc3ViKVxyXG4gICAgICAgICAgICBpZiAocHJlcGFyZWQgIT09IHRydWUpIHJldHVybiBcIlwiXHJcbiAgICAgICAgICAgIHJldHVybiBjb21tYW5kVG9MaXN0SXRlbShtZXNzYWdlLCBzdWIpXHJcbiAgICAgICAgICB9KVxyXG4gICAgICAgIClcclxuICAgICAgKVxyXG4gICAgICAgIC5maWx0ZXIoKGxpbmUpID0+IGxpbmUubGVuZ3RoID4gMClcclxuICAgICAgICAuam9pbihcIlxcblwiKSB8fCBcIlN1YiBjb21tYW5kcyBhcmUgbm90IGFjY2Vzc2libGUgYnkgeW91LlwiLFxyXG4gICAgICBmYWxzZVxyXG4gICAgKVxyXG5cclxuICBpZiAoY21kLm9wdGlvbnMuY2hhbm5lbFR5cGUgIT09IFwiYWxsXCIpXHJcbiAgICBlbWJlZC5zZXRGb290ZXIoXHJcbiAgICAgIGBUaGlzIGNvbW1hbmQgY2FuIG9ubHkgYmUgc2VudCBpbiAke2NtZC5vcHRpb25zLmNoYW5uZWxUeXBlfSBjaGFubmVsLmBcclxuICAgIClcclxuXHJcbiAgYXdhaXQgbWVzc2FnZS5jaGFubmVsLnNlbmQoeyBlbWJlZHM6IFtlbWJlZF0gfSlcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNvbW1hbmRUb0xpc3RJdGVtPFR5cGUgZXh0ZW5kcyBrZXlvZiBDb21tYW5kTWVzc2FnZVR5cGU+KFxyXG4gIG1lc3NhZ2U6IENvbW1hbmRNZXNzYWdlVHlwZVtUeXBlXSxcclxuICBjbWQ6IENvbW1hbmQ8VHlwZT5cclxuKTogc3RyaW5nIHtcclxuICByZXR1cm4gYCoqJHttZXNzYWdlLnVzZWRQcmVmaXh9JHtjb21tYW5kQnJlYWRjcnVtYihjbWQsIFwiIFwiKX0qKiAtICR7XHJcbiAgICBjbWQub3B0aW9ucy5kZXNjcmlwdGlvbiA/PyBcIm5vIGRlc2NyaXB0aW9uXCJcclxuICB9YFxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaXNOb3JtYWxNZXNzYWdlKFxyXG4gIG1lc3NhZ2U6IGRpc2NvcmQuTWVzc2FnZSB8IGRpc2NvcmQuUGFydGlhbE1lc3NhZ2VcclxuKTogbWVzc2FnZSBpcyBOb3JtYWxNZXNzYWdlIHtcclxuICByZXR1cm4gKFxyXG4gICAgIW1lc3NhZ2Uuc3lzdGVtICYmXHJcbiAgICAhIW1lc3NhZ2UuY2hhbm5lbCAmJlxyXG4gICAgISFtZXNzYWdlLmF1dGhvciAmJlxyXG4gICAgIW1lc3NhZ2Uud2ViaG9va0lkXHJcbiAgKVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaXNHdWlsZE1lc3NhZ2UoXHJcbiAgbWVzc2FnZTogTm9ybWFsTWVzc2FnZVxyXG4pOiBtZXNzYWdlIGlzIEd1aWxkTWVzc2FnZSB7XHJcbiAgcmV0dXJuIChcclxuICAgICEhbWVzc2FnZS5tZW1iZXIgJiZcclxuICAgICEhbWVzc2FnZS5ndWlsZCAmJlxyXG4gICAgbWVzc2FnZS5jaGFubmVsIGluc3RhbmNlb2YgZGlzY29yZC5HdWlsZENoYW5uZWxcclxuICApXHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpc0RpcmVjdE1lc3NhZ2UoXHJcbiAgbWVzc2FnZTogTm9ybWFsTWVzc2FnZVxyXG4pOiBtZXNzYWdlIGlzIERpcmVjdE1lc3NhZ2Uge1xyXG4gIHJldHVybiBtZXNzYWdlLmNoYW5uZWwgaW5zdGFuY2VvZiBkaXNjb3JkLkRNQ2hhbm5lbFxyXG59XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUVBO0FBQ0E7QUFDQTtBQUdBO0FBQ0E7QUFDQTtBQUNBO0FBRU8sTUFBTSxpQkFBaUIsSUFBSSxRQUFRLFFBQ3hDLFFBQVEsSUFBSSxxQkFBcUIsS0FBSyxLQUFLLFFBQVEsT0FBTyxRQUFRO0FBR3BFLGVBQWUsR0FBRyxRQUFRLE9BQU8sYUFBYTtBQUM1QyxRQUFNLE9BQU8sTUFBTSxPQUFPLFlBQVk7QUFDdEMsU0FBTyxTQUFTLElBQUksS0FBSztBQUFBO0FBR3BCLElBQUksaUJBQXNDO0FBRTFDLE1BQU0sV0FBVyxJQUFLLGdDQUFnQyxRQUFRLFdBR25FO0FBQUEsRUFDTyxRQUFRLEtBQTREO0FBQ3pFLGVBQVcsQ0FBQyxNQUFNLFlBQVksTUFBTTtBQUNsQyxVQUNFLFFBQVEsUUFDUixRQUFRLFFBQVEsU0FBUyxLQUFLLENBQUMsVUFBVSxRQUFRO0FBRWpELGVBQU87QUFBQTtBQUFBO0FBQUEsRUFJTixJQUFJLFNBQTRDO0FBQ3JELG9CQUFnQjtBQUNoQixTQUFLLElBQUksUUFBUSxRQUFRLE1BQU07QUFBQTtBQUFBO0FBNEk1QixjQUE2RDtBQUFBLEVBQ2xFLFlBQW1CLFNBQStCO0FBQS9CO0FBQUE7QUFBQTtBQUdkLHlCQUdMLFNBQ0EsUUFDYztBQUNkLFVBQVEsUUFBUSxTQUFTO0FBRXpCLE1BQUksUUFBUSxRQUFRLFdBQVc7QUFDN0IsUUFBSTtBQUNGLGFBQU8sTUFDTCxPQUFPLE1BQU0sV0FDWCxRQUFRLFFBQVEsdURBQ2lDLE1BQU0sV0FDdkQsZUFBZSxRQUFRLGdEQUV6QjtBQUFBO0FBRUMsdUJBQWlCO0FBQUE7QUFHeEIsUUFBTSxPQUFnRDtBQUFBLElBQ3BELE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLGFBQWE7QUFBQTtBQUdmLE1BQUksQ0FBQyxRQUFRLFFBQVE7QUFBTyxZQUFRLFFBQVEsUUFBUSxDQUFDO0FBQUE7QUFDaEQsWUFBUSxRQUFRLE1BQU0sS0FBSztBQUVoQyxhQUFXLFFBQVEsUUFBUSxRQUFRO0FBQ2pDLFFBQUksS0FBSztBQUNQLFVBQUksS0FBSyxLQUFLLFdBQVc7QUFDdkIsY0FBTSxJQUFJLE1BQ1IsUUFBUSxLQUFLLHlCQUNYLE9BQU8sT0FBTyxNQUFNLFFBQVEsUUFBUSxPQUFPLFFBQVEsUUFBUTtBQUFBO0FBSXJFLE1BQUksUUFBUSxRQUFRO0FBQ2xCLFFBQUksQ0FBQyxRQUFRLFFBQVEsSUFBSSxXQUFXLFNBQVM7QUFDM0MsYUFBTyxLQUNMLG9CQUFvQixNQUFNLFlBQ3hCLHVDQUNVLE1BQU0sV0FBVyxRQUFRLFFBQVEsa0JBQzdDO0FBQUE7QUFHTixTQUFPLElBQ0wsa0JBQWtCLE1BQU0sV0FDdEIsa0JBQWtCLGFBQ2YsTUFBTSxLQUFLLFFBQVEsUUFBUTtBQUdsQyxNQUFJLFFBQVEsUUFBUTtBQUNsQixlQUFXLE9BQU8sUUFBUSxRQUFRO0FBQ2hDLHNCQUFnQixLQUFZO0FBQUE7QUFHM0IsMkJBQ0wsU0FDQSxZQUFZLEtBQ0o7QUFDUixTQUFPLGVBQWUsU0FDbkIsSUFBSSxDQUFDLFFBQVEsSUFBSSxRQUFRLE1BQ3pCLFVBQ0EsS0FBSztBQUFBO0FBR0gsd0JBQ0wsU0FDZ0I7QUFDaEIsU0FBTyxRQUFRLFFBQVEsU0FDbkIsQ0FBQyxTQUFTLEdBQUcsZUFBZSxRQUFRLFFBQVEsV0FDNUMsQ0FBQztBQUFBO0FBR1AsOEJBQ0UsU0FDQSxLQUNBLFNBTXlDO0FBRXpDLE1BQUksSUFBSSxRQUFRLFVBQVU7QUFDeEIsVUFBTSxPQUFPLEtBQUssS0FBSyxZQUFZLElBQUksUUFBUSxNQUFNLFFBQVEsUUFBUTtBQUNyRSxVQUFNLFdBQVcsS0FBSyxNQUFNLE9BQWlCLE1BQU07QUFBQSxNQUNqRCxNQUFNO0FBQUEsTUFDTixTQUFTO0FBQUE7QUFHWCxZQUFRLGtCQUFrQixNQUFNO0FBQzlCLFdBQUssTUFBTSxJQUFJLE1BQU07QUFBQSxRQUNuQixNQUFNLEtBQUs7QUFBQSxRQUNYLFNBQVM7QUFBQTtBQUFBO0FBSWIsUUFBSSxTQUFTLFNBQVM7QUFDcEIsWUFBTSxlQUFlLE1BQU0sS0FBSyxNQUFNLElBQUksUUFBUSxVQUFVO0FBRTVELFVBQUksS0FBSyxRQUFRLFNBQVMsT0FBTyxjQUFjO0FBQzdDLGFBQUssTUFBTSxJQUFJLE1BQU07QUFBQSxVQUNuQixNQUFNO0FBQUEsVUFDTixTQUFTO0FBQUE7QUFBQSxhQUVOO0FBQ0wsZUFBTyxJQUFJLFFBQVEsZUFDaEIsU0FBUyxPQUNULFVBQ0MsZUFBZSxLQUFLLEtBQ2pCLFVBQVMsT0FBTyxlQUFlLEtBQUssU0FBUyxtQkFFaEQsUUFBUSxPQUFPLEtBQUs7QUFBQTtBQUFBO0FBQUEsU0FJdkI7QUFDTCxZQUFRLGtCQUFrQixNQUFNO0FBQzlCLGFBQU8sS0FDTCx1Q0FBdUMsSUFBSSxRQUFRLDJEQUNuRDtBQUFBO0FBQUE7QUFLTixRQUFNLGNBQWMsTUFBTSxLQUFLLE1BQU0sSUFBSSxRQUFRLGFBQWE7QUFFOUQsTUFBSSxlQUFlLFVBQVU7QUFDM0IsUUFBSSxnQkFBZ0I7QUFDbEIsYUFBTyxJQUFJLFFBQVEsZUFDaEIsU0FBUyxPQUNULFVBQ0Msb0NBQ0EsUUFBUSxPQUFPLEtBQUs7QUFHMUIsUUFBSSxLQUFLLE1BQU0sSUFBSSxRQUFRLGdCQUFnQjtBQUN6QyxVQUNFLFFBQVEsTUFBTSxZQUFZLFFBQVEsT0FBTyxNQUN6QyxRQUFRLElBQUksY0FBYyxRQUFRLE9BQU87QUFFekMsZUFBTyxJQUFJLFFBQVEsZUFDaEIsU0FBUyxPQUNULFVBQ0MsZ0NBQ0EsUUFBUSxPQUFPLEtBQUs7QUFBQTtBQUc1QixRQUFJLElBQUksUUFBUSxnQkFBZ0I7QUFDOUIsWUFBTSxpQkFBaUIsTUFBTSxLQUFLLE1BQ2hDLElBQUksUUFBUSxnQkFDWjtBQUdGLGlCQUFXLGNBQWM7QUFDdkIsWUFBSSxDQUFDLFFBQVEsTUFBTSxJQUFJLFlBQVksSUFBSSxZQUFZO0FBQ2pELGlCQUFPLElBQUksUUFBUSxlQUNoQixTQUFTLE9BQ1QsVUFBVSxTQUFTLFFBQVEsT0FBTyxLQUFLLG9CQUN2QyxlQUNDLGdCQUFnQjtBQUFBO0FBSTFCLFFBQUksSUFBSSxRQUFRLGlCQUFpQjtBQUMvQixZQUFNLGtCQUFrQixNQUFNLEtBQUssTUFDakMsSUFBSSxRQUFRLGlCQUNaO0FBR0YsaUJBQVcsY0FBYztBQUN2QixZQUFJLENBQUMsUUFBUSxPQUFPLFlBQVksSUFBSSxZQUFZO0FBQzlDLGlCQUFPLElBQUksUUFBUSxlQUNoQixTQUFTLE9BQ1QsVUFBVSxTQUFTLFFBQVEsT0FBTyxLQUFLLG9CQUN2QyxlQUNDLGtCQUFrQjtBQUFBO0FBSTVCLFFBQUksSUFBSSxRQUFRLE9BQU87QUFDckIsWUFBTSxRQUFRLE1BQU0sS0FBSyxNQUFNLElBQUksUUFBUSxPQUFPO0FBRWxELFlBQU0sU0FBUyxDQUFDLE1BQXdDO0FBQ3RELGVBQU8sT0FBTyxNQUFNLFlBQVksYUFBYSxRQUFRO0FBQUE7QUFHdkQsWUFBTSxZQUFZLENBQUMsTUFBc0M7QUFDdkQsZUFBTyxPQUFPLE1BQU0sV0FBVyxJQUFJLEVBQUU7QUFBQTtBQUd2QyxZQUFNLFNBQVMsTUFBTSxRQUFRLE9BQU87QUFFcEMsaUJBQVcsWUFBWSxPQUFPO0FBQzVCLFlBQUksT0FBTyxXQUFXO0FBQ3BCLGdCQUFNLEtBQUssVUFBVTtBQUVyQixjQUFJLENBQUMsT0FBTyxNQUFNLE1BQU0sSUFBSSxLQUFLO0FBQy9CLG1CQUFPLElBQUksUUFBUSxlQUNoQixTQUFTLE9BQ1QsVUFBVSxTQUFTLFFBQVEsT0FBTyxLQUFLLG9CQUN2QyxlQUNDLHVCQUF1QjtBQUFBO0FBQUEsZUFHeEI7QUFDTCxjQUFJLFNBQVMsV0FBVyxHQUFHO0FBQ3pCLGtCQUFNLFlBQVksU0FBUztBQUMzQixnQkFBSSxPQUFPLFlBQVk7QUFDckIsb0JBQU0sS0FBSyxVQUFVO0FBRXJCLGtCQUFJLE9BQU8sTUFBTSxNQUFNLElBQUksS0FBSztBQUM5Qix1QkFBTyxJQUFJLFFBQVEsZUFDaEIsU0FBUyxPQUNULFVBQVUsU0FBUyxRQUFRLE9BQU8sS0FBSyxvQkFDdkMsZUFDQywwQkFBMEI7QUFBQTtBQUFBLG1CQUczQjtBQUNMLHlCQUFXLFFBQVEsV0FBVztBQUM1QixvQkFBSSxPQUFPLE1BQU0sTUFBTSxJQUFJLFVBQVUsUUFBUTtBQUMzQyx5QkFBTyxJQUFJLFFBQVEsZUFDaEIsU0FBUyxPQUNULFVBQVUsU0FBUyxRQUFRLE9BQU8sS0FBSyxvQkFDdkMsZUFDQywwQkFBMEIsVUFDeEI7QUFBQTtBQUFBO0FBQUE7QUFBQSxpQkFNUDtBQUNMLGdCQUFJLGdCQUFnQjtBQUVwQix1QkFBVyxRQUFRLFVBQVU7QUFDM0Isa0JBQUksTUFBTSxRQUFRLE9BQU87QUFDdkIsdUJBQU8sS0FDTCxrQ0FBa0MsTUFBTSxLQUN0QyxrQkFBa0IsS0FBSyxrQkFFekI7QUFBQSxxQkFFRztBQUNMLHNCQUFNLEtBQUssVUFBVTtBQUVyQixvQkFBSSxPQUFPLE1BQU0sTUFBTSxJQUFJLEtBQUs7QUFDOUIsa0NBQWdCO0FBQ2hCO0FBQUE7QUFBQTtBQUFBO0FBS04sZ0JBQUksQ0FBQztBQUNILHFCQUFPLElBQUksUUFBUSxlQUNoQixTQUFTLE9BQ1QsVUFBVSxTQUFTLFFBQVEsT0FBTyxLQUFLLG9CQUN2QyxlQUNDO0FBQUEsRUFBNEU7QUFBQSxnQkFDMUUsR0FBRztBQUFBLGdCQUVGLE9BQ0MsQ0FBQyxTQUNDLENBQUMsTUFBTSxRQUFRLE9BRWxCLElBQUksQ0FBQyxTQUFTLEtBQUssVUFBVSxVQUM3QixLQUFLO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQVF4QixNQUFJLGdCQUFnQjtBQUNsQixRQUFJLGdCQUFnQjtBQUNsQixhQUFPLElBQUksUUFBUSxlQUNoQixTQUFTLE9BQ1QsVUFDQyx5Q0FDQSxRQUFRLE9BQU8sS0FBSztBQUFBO0FBRzVCLE1BQUksTUFBTSxLQUFLLE1BQU0sSUFBSSxRQUFRLGNBQWM7QUFDN0MsUUFBSSxRQUFRLElBQUksY0FBYyxRQUFRLE9BQU87QUFDM0MsYUFBTyxJQUFJLFFBQVEsZUFDaEIsU0FBUyxPQUNULFVBQ0MseUJBQ0EsUUFBUSxPQUFPLEtBQUs7QUFBQTtBQUc1QixNQUFJLFNBQVM7QUFDWCxRQUFJLElBQUksUUFBUSxZQUFZO0FBQzFCLFlBQU0saUJBQWlCLE1BQU0sS0FBSyxNQUFNLElBQUksUUFBUSxZQUFZO0FBRWhFLGlCQUFXLGNBQWMsZ0JBQWdCO0FBQ3ZDLGNBQU0sUUFBUSxlQUFlLFFBQVE7QUFDckMsWUFBSSxRQUFhLFFBQVEsV0FBVyxFQUFFO0FBQ3RDLGNBQU0sUUFBUSxVQUFVLFVBQWEsVUFBVTtBQUUvQyxjQUFNLE1BQU0sQ0FBQyxNQUFXO0FBQ3RCLGtCQUFRLEtBQUssV0FBVyxRQUFRO0FBQ2hDLGtCQUFRLEtBQUssU0FBUztBQUN0QixrQkFBUTtBQUFBO0FBR1YsWUFBSTtBQUFPLGtCQUFRLFNBQVMsa0JBQWtCO0FBRTlDLFlBQUk7QUFFSixZQUFJLENBQUMsT0FBTztBQUNWLGNBQUksTUFBTSxLQUFLLE1BQU0sV0FBVyxVQUFVLFVBQVU7QUFDbEQsZ0JBQUksV0FBVyxxQkFBcUI7QUFDbEMsa0JBQUksT0FBTyxXQUFXLHdCQUF3QixVQUFVO0FBQ3RELHVCQUFPLElBQUksUUFBUSxlQUNoQixTQUFTLE9BQ1QsVUFDQyx1QkFBdUIsV0FBVyxTQUNsQyxRQUFRLE9BQU8sS0FBSyxvQkFFckIsZUFBZSxXQUFXO0FBQUEscUJBQ3hCO0FBQ0wsdUJBQU8sV0FBVztBQUFBO0FBQUE7QUFJdEIsbUJBQU8sSUFBSSxRQUFRLGVBQ2hCLFNBQVMsT0FDVCxVQUNDLHVCQUF1QixXQUFXLFNBQ2xDLFFBQVEsT0FBTyxLQUFLLG9CQUVyQixlQUNDLFdBQVcsY0FDUCxrQkFBa0IsV0FBVyxjQUM3Qiw0Q0FBNEMsS0FBSyxLQUFLLFVBQ3BEO0FBQUEsY0FDRSxTQUFTLEdBQUcsUUFBUSxhQUFhLFFBQVE7QUFBQTtBQUFBLHFCQUk1QyxXQUFXLFlBQVksUUFBVztBQUMzQyxnQkFBSSxNQUFNLEtBQUssTUFBTSxXQUFXLFNBQVM7QUFBQSxpQkFDcEM7QUFDTCxnQkFBSTtBQUFBO0FBQUEsbUJBRUcsV0FBVyxZQUFZO0FBQ2hDLGdCQUFNLFVBQVUsTUFBTSxTQUFTLFdBQzdCLFlBQ0EsY0FDQSxPQUNBO0FBR0YsY0FBSSxZQUFZO0FBQU0sbUJBQU87QUFBQTtBQUcvQixZQUFJLFVBQVUsUUFBUSxXQUFXLFdBQVc7QUFDMUMsZ0JBQU0sU0FBUyxNQUFNLFNBQVMsVUFDNUIsWUFDQSxjQUNBLE9BQ0EsU0FDQTtBQUdGLGNBQUksV0FBVztBQUFNLG1CQUFPO0FBQUE7QUFHOUIsWUFBSSxVQUFVLFFBQVEsV0FBVyxrQkFBa0I7QUFDakQsZ0JBQU0sVUFBVSxNQUFNLFNBQVMsaUJBQzdCLFlBQ0EsY0FDQSxPQUNBO0FBR0YsY0FBSSxZQUFZO0FBQU0sbUJBQU87QUFBQTtBQUcvQixnQkFBUSxlQUFlO0FBQUE7QUFBQTtBQUkzQixRQUFJLElBQUksUUFBUSxTQUFTO0FBQ3ZCLFlBQU0sVUFBVSxNQUFNLEtBQUssTUFBTSxJQUFJLFFBQVEsU0FBUztBQUV0RCxpQkFBVyxVQUFVLFNBQVM7QUFDNUIsWUFBSSxFQUFFLE9BQU8sVUFBVSxTQUFTLHFCQUM5QixRQUFRLFlBQ1I7QUFHRixjQUFNLE1BQU0sQ0FBQyxNQUFXO0FBQ3RCLGtCQUFRLEtBQUssT0FBTyxRQUFRO0FBQzVCLGtCQUFRO0FBQUE7QUFHVixZQUFJLFVBQVU7QUFBTSxrQkFBUTtBQUU1QixZQUFJLENBQUMsU0FBVSxNQUFNLEtBQUssTUFBTSxPQUFPLFVBQVUsVUFBVztBQUMxRCxjQUFJLE9BQU8scUJBQXFCO0FBQzlCLGdCQUFJLE9BQU8sT0FBTyx3QkFBd0IsVUFBVTtBQUNsRCxxQkFBTyxJQUFJLFFBQVEsZUFDaEIsU0FBUyxPQUNULFVBQ0MsbUJBQW1CLE9BQU8sU0FDMUIsUUFBUSxPQUFPLEtBQUssb0JBRXJCLGVBQWUsT0FBTztBQUFBLG1CQUNwQjtBQUNMLHFCQUFPLE9BQU87QUFBQTtBQUFBO0FBSWxCLGlCQUFPLElBQUksUUFBUSxlQUNoQixTQUFTLE9BQ1QsVUFDQyxtQkFBbUIsT0FBTyxTQUMxQixRQUFRLE9BQU8sS0FBSyxvQkFFckIsZUFDQyxPQUFPLGNBQ0gsa0JBQWtCLE9BQU8sY0FDekIsZ0JBQWdCLE9BQU87QUFBQTtBQUlqQyxZQUFJO0FBRUosWUFBSSxVQUFVLFFBQVc7QUFDdkIsY0FBSSxPQUFPLFlBQVksUUFBVztBQUNoQyxnQkFBSSxNQUFNLEtBQUssTUFBTSxPQUFPLFNBQVM7QUFBQSxxQkFDNUIsT0FBTyxjQUFjLFNBQVM7QUFDdkMsZ0JBQUk7QUFBQTtBQUFBLG1CQUVHLE9BQU8sWUFBWTtBQUM1QixnQkFBTSxVQUFVLE1BQU0sU0FBUyxXQUM3QixRQUNBLFlBQ0EsT0FDQTtBQUdGLGNBQUksWUFBWTtBQUFNLG1CQUFPO0FBQUE7QUFHL0IsWUFBSSxVQUFVLFFBQVEsT0FBTyxXQUFXO0FBQ3RDLGdCQUFNLFNBQVMsTUFBTSxTQUFTLFVBQzVCLFFBQ0EsWUFDQSxPQUNBLFNBQ0E7QUFHRixjQUFJLFdBQVc7QUFBTSxtQkFBTztBQUFBO0FBRzlCLFlBQUksVUFBVSxRQUFRLE9BQU8sa0JBQWtCO0FBQzdDLGdCQUFNLFVBQVUsTUFBTSxTQUFTLGlCQUM3QixRQUNBLFlBQ0EsT0FDQTtBQUdGLGNBQUksWUFBWTtBQUFNLG1CQUFPO0FBQUE7QUFBQTtBQUFBO0FBS25DLFFBQUksSUFBSSxRQUFRLE9BQU87QUFDckIsaUJBQVcsUUFBUSxJQUFJLFFBQVEsT0FBTztBQUNwQyxZQUFJLEVBQUUsT0FBTyxhQUFhLFVBQVUsU0FBUyxxQkFDM0MsUUFBUSxZQUNSO0FBR0YsY0FBTSxNQUFNLENBQUMsTUFBZTtBQUMxQixrQkFBUSxLQUFLLEtBQUssUUFBUTtBQUMxQixrQkFBUTtBQUFBO0FBR1YsWUFBSSxDQUFDO0FBQWEsY0FBSTtBQUFBLGlCQUNiLE9BQU8sVUFBVTtBQUFXLGNBQUk7QUFBQSxpQkFDaEMsMEJBQTBCLEtBQUs7QUFBUSxjQUFJO0FBQUEsaUJBQzNDLDJCQUEyQixLQUFLO0FBQVEsY0FBSTtBQUFBLGFBQ2hEO0FBQ0gsY0FBSTtBQUNKLGtCQUFRLGVBQWUsUUFBUTtBQUFBO0FBQUE7QUFBQTtBQUtyQyxZQUFRLE9BQU8sUUFBUSxlQUFlLEtBQUs7QUFFM0MsUUFBSSxJQUFJLFFBQVEsTUFBTTtBQUNwQixZQUFNLE9BQU8sTUFBTSxLQUFLLE1BQU0sSUFBSSxRQUFRLE1BQU07QUFFaEQsVUFBSSxLQUFLO0FBQUssZ0JBQVEsT0FBTyxRQUFRO0FBRXJDLFVBQUksUUFBUSxLQUFLLFdBQVcsR0FBRztBQUM3QixZQUFJLE1BQU0sS0FBSyxNQUFNLEtBQUssVUFBVSxVQUFVO0FBQzVDLGNBQUksS0FBSyxxQkFBcUI7QUFDNUIsZ0JBQUksT0FBTyxLQUFLLHdCQUF3QixVQUFVO0FBQ2hELHFCQUFPLElBQUksUUFBUSxlQUNoQixTQUFTLE9BQ1QsVUFDQyxpQkFBaUIsS0FBSyxTQUN0QixRQUFRLE9BQU8sS0FBSyxvQkFFckIsZUFBZSxLQUFLO0FBQUEsbUJBQ2xCO0FBQ0wscUJBQU8sS0FBSztBQUFBO0FBQUE7QUFJaEIsaUJBQU8sSUFBSSxRQUFRLGVBQ2hCLFNBQVMsT0FDVCxVQUNDLGlCQUFpQixLQUFLLFNBQ3RCLFFBQVEsT0FBTyxLQUFLLG9CQUVyQixlQUNDLEtBQUssZUFDSDtBQUFBLG1CQUVHLEtBQUssU0FBUztBQUN2QixrQkFBUSxLQUFLLEtBQUssUUFBUSxNQUFNLEtBQUssTUFBTSxLQUFLLFNBQVM7QUFBQTtBQUFBLGFBRXREO0FBQ0wsZ0JBQVEsS0FBSyxLQUFLLFFBQVEsUUFBUTtBQUFBO0FBQUE7QUFBQTtBQUt4QyxNQUFJLElBQUksUUFBUSxhQUFhO0FBQzNCLFVBQU0sY0FBYyxNQUFNLEtBQUssTUFBTSxJQUFJLFFBQVEsYUFBYTtBQUU5RCxRQUFJLGNBQW1CO0FBRXZCLGVBQVcsY0FBYyxhQUFhO0FBQ3BDLFlBQU0sRUFBRSxRQUFRLFNBQVMsTUFBTSxXQUFXLFNBQVM7QUFFbkQsb0JBQWMsa0NBQ1QsY0FDQyxRQUFRO0FBR2QsVUFBSSxPQUFPLFdBQVc7QUFDcEIsZUFBTyxJQUFJLFFBQVEsZUFDaEIsU0FBUyxPQUNULFVBQ0MsR0FDRSxXQUFXLE9BQU8sSUFBSSxXQUFXLFlBQVksc0JBRS9DLFFBQVEsT0FBTyxLQUFLLG9CQUVyQixlQUFlO0FBRXBCLFVBQUksQ0FBQztBQUFRLGVBQU87QUFBQTtBQUFBO0FBSXhCLFNBQU87QUFBQTtBQUdULGtDQUNFLFNBQ0EsS0FDZTtBQUNmLE1BQUksVUFBVSxHQUFHLFFBQVEsYUFDdkIsSUFBSSxRQUFRLFlBQ1IsSUFBSSxrQkFBa0IsVUFDdEIsa0JBQWtCO0FBR3hCLFFBQU0saUJBQTJCO0FBQ2pDLFFBQU0sZUFBeUI7QUFDL0IsUUFBTSxXQUFxQjtBQUMzQixNQUFJLGNBQWM7QUFFbEIsTUFBSSxJQUFJLFFBQVEsTUFBTTtBQUNwQixVQUFNLE9BQU8sTUFBTSxLQUFLLE1BQU0sSUFBSSxRQUFRLE1BQU07QUFDaEQsVUFBTSxNQUNKLEtBQUssWUFBWSxTQUNiLEtBQUssTUFBTSxLQUFLLE1BQU0sS0FBSyxTQUFTLGNBQ3BDO0FBRU4sa0JBQWUsTUFBTSxLQUFLLE1BQU0sS0FBSyxVQUFVLFdBQzNDLE9BQU8sS0FBSyxVQUNaLE9BQU8sS0FBSyxPQUFPO0FBQUE7QUFHekIsTUFBSSxJQUFJLFFBQVEsWUFBWTtBQUMxQixVQUFNLGdCQUFnQixNQUFNLEtBQUssTUFBTSxJQUFJLFFBQVEsWUFBWTtBQUUvRCxlQUFXLGNBQWMsZUFBZTtBQUN0QyxZQUFNLE1BQ0osV0FBVyxZQUFZLFNBQ25CLEtBQUssTUFBTSxLQUFLLE1BQU0sV0FBVyxTQUFTLGNBQzFDO0FBQ04scUJBQWUsS0FDWixNQUFNLEtBQUssTUFBTSxXQUFXLFVBQVUsWUFBYSxDQUFDLE1BQ2pELElBQUksV0FBVyxVQUNmLElBQUksV0FBVyxPQUFPO0FBQUE7QUFBQTtBQUtoQyxNQUFJLElBQUksUUFBUSxTQUFTO0FBQ3ZCLFVBQU0sYUFBYSxNQUFNLEtBQUssTUFBTSxJQUFJLFFBQVEsU0FBUztBQUV6RCxlQUFXLE9BQU8sWUFBWTtBQUM1QixZQUFNLE1BQ0osSUFBSSxZQUFZLFNBQ1osS0FBSyxLQUFLLE1BQU0sSUFBSSxTQUFTLGNBQzdCO0FBQ04sbUJBQWEsS0FDVixNQUFNLEtBQUssTUFBTSxJQUFJLFVBQVUsV0FDNUIsT0FBTyxJQUFJLE9BQU8sWUFBWSxTQUFTLHFCQUNyQyxXQUNNLElBQUksZUFBZSxPQUMzQixRQUFRLElBQUksT0FBTyxhQUFhLFNBQVMscUJBQ3ZDLFdBQ00sSUFBSSxlQUFlO0FBQUE7QUFBQTtBQUtyQyxNQUFJLElBQUksUUFBUSxPQUFPO0FBQ3JCLGVBQVcsUUFBUSxJQUFJLFFBQVEsT0FBTztBQUNwQyxlQUFTLEtBQUssTUFBTSxLQUFLO0FBQUE7QUFBQTtBQUk3QixRQUFNLHFCQUFxQjtBQUUzQixNQUFJLE1BQU0sS0FBSyxNQUFNLElBQUksUUFBUSxjQUFjO0FBQzdDLHVCQUFtQixLQUFLO0FBQzFCLE1BQUksTUFBTSxLQUFLLE1BQU0sSUFBSSxRQUFRLGdCQUFnQjtBQUMvQyx1QkFBbUIsS0FBSztBQUUxQixRQUFNLFFBQVEsSUFBSSxRQUFRLGVBQ3ZCLFNBQVMsV0FDVCxVQUFVLG1CQUFtQixRQUFRLE9BQU8sS0FBSyxvQkFDakQsU0FDQyxHQUFHLFdBQVcsQ0FBQyxHQUFHLGdCQUFnQixhQUFhLEdBQUcsVUFBVSxLQUFLLFFBQy9ELElBQUksVUFBVSxjQUFjLE1BRy9CLGVBQ0UsTUFBTSxLQUFLLE1BQU0sSUFBSSxRQUFRLGlCQUFpQixZQUM3QyxJQUFJLFFBQVEsZUFDWjtBQUdOLE1BQUksYUFBYSxTQUFTO0FBQ3hCLFVBQU0sU0FBUyxXQUFXLGFBQWEsS0FBSyxPQUFPO0FBRXJELE1BQUksSUFBSSxRQUFRLFNBQVM7QUFDdkIsVUFBTSxVQUFVLElBQUksUUFBUTtBQUU1QixVQUFNLFNBQ0osV0FDQSxRQUFRLElBQUksQ0FBQyxVQUFVLEtBQUssV0FBVyxLQUFLLE9BQzVDO0FBQUE7QUFJSixNQUFJLElBQUksUUFBUSxVQUFVO0FBQ3hCLFVBQU0sV0FBVyxNQUFNLEtBQUssTUFBTSxJQUFJLFFBQVEsVUFBVTtBQUV4RCxVQUFNLFNBQ0osYUFDQSxLQUFLLEtBQUssVUFBVTtBQUFBLE1BQ2xCLFNBQVMsU0FDTixJQUFJLENBQUMsWUFBWSxRQUFRLGFBQWEsU0FDdEMsS0FBSztBQUFBLFFBRVY7QUFBQTtBQUlKLE1BQUksSUFBSSxRQUFRLGdCQUFnQjtBQUM5QixVQUFNLGlCQUFpQixNQUFNLEtBQUssTUFBTSxJQUFJLFFBQVEsZ0JBQWdCO0FBRXBFLFVBQU0sU0FBUyxtQkFBbUIsZUFBZSxLQUFLLE9BQU87QUFBQTtBQUcvRCxNQUFJLElBQUksUUFBUSxpQkFBaUI7QUFDL0IsVUFBTSxrQkFBa0IsTUFBTSxLQUFLLE1BQ2pDLElBQUksUUFBUSxpQkFDWjtBQUdGLFVBQU0sU0FBUyxvQkFBb0IsZ0JBQWdCLEtBQUssT0FBTztBQUFBO0FBR2pFLE1BQUksbUJBQW1CLFNBQVM7QUFDOUIsVUFBTSxTQUNKLHVCQUNBLG1CQUFtQixJQUFJLENBQUMsU0FBUyxLQUFLLFVBQVUsS0FBSyxPQUNyRDtBQUdKLE1BQUksSUFBSSxRQUFRLFVBQVU7QUFDeEIsVUFBTSxXQUFXLE1BQU0sS0FBSyxNQUFNLElBQUksUUFBUSxVQUFVO0FBRXhELFVBQU0sU0FBUyxhQUFhLEtBQUssU0FBUyxXQUFXO0FBQUE7QUFHdkQsTUFBSSxJQUFJLFFBQVE7QUFDZCxVQUFNLFNBQ0osaUJBRUUsT0FBTSxRQUFRLElBQ1osSUFBSSxRQUFRLEtBQUssSUFBSSxPQUFPLFFBQXNCO0FBQ2hELFlBQU0sV0FBVyxNQUFNLGVBQWUsU0FBUztBQUMvQyxVQUFJLGFBQWE7QUFBTSxlQUFPO0FBQzlCLGFBQU8sa0JBQWtCLFNBQVM7QUFBQSxTQUlyQyxPQUFPLENBQUMsU0FBUyxLQUFLLFNBQVMsR0FDL0IsS0FBSyxTQUFTLDJDQUNqQjtBQUdKLE1BQUksSUFBSSxRQUFRLGdCQUFnQjtBQUM5QixVQUFNLFVBQ0osb0NBQW9DLElBQUksUUFBUTtBQUdwRCxRQUFNLFFBQVEsUUFBUSxLQUFLLEVBQUUsUUFBUSxDQUFDO0FBQUE7QUFHakMsMkJBQ0wsU0FDQSxLQUNRO0FBQ1IsU0FBTyxLQUFLLFFBQVEsYUFBYSxrQkFBa0IsS0FBSyxZQUN0RCxJQUFJLFFBQVEsZUFBZTtBQUFBO0FBSXhCLHlCQUNMLFNBQzBCO0FBQzFCLFNBQ0UsQ0FBQyxRQUFRLFVBQ1QsQ0FBQyxDQUFDLFFBQVEsV0FDVixDQUFDLENBQUMsUUFBUSxVQUNWLENBQUMsUUFBUTtBQUFBO0FBSU4sd0JBQ0wsU0FDeUI7QUFDekIsU0FDRSxDQUFDLENBQUMsUUFBUSxVQUNWLENBQUMsQ0FBQyxRQUFRLFNBQ1YsUUFBUSxtQkFBbUIsUUFBUTtBQUFBO0FBSWhDLHlCQUNMLFNBQzBCO0FBQzFCLFNBQU8sUUFBUSxtQkFBbUIsUUFBUTtBQUFBOyIsCiAgIm5hbWVzIjogW10KfQo=
