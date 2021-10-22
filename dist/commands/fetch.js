import * as app from "../app.js";
import { attachIsImage, resolveUsername, resolveEmoji } from "../namespaces/utils.js";
import Fetches from "../tables/fetches.js";
async function sendFetchEmbed({ osVersion, osArchitecture, osBuildVersion, theme, monitor, gpu, cpu, ram, disks, computer, image, message, member }) {
  const embed = new app.MessageEmbed();
  embed.setTitle(`Fetch ${member ? member.user.tag : message.author.tag} - ${computer}`);
  embed.setColor("GREEN");
  embed.addField("OS", `${osVersion} ${osArchitecture}`, true);
  embed.addField("Build", osBuildVersion ?? "Not identified", true);
  embed.addField("Visual Style", theme ?? "Not identified");
  embed.addField("GPU", gpu ?? "Not identified", true);
  embed.addField("Resolution", monitor ? monitor.split(", ").join("\n") : "Not identified", true);
  embed.addField("Disks", disks ? disks.join("\n") : "Not identified");
  embed.addField("Memory", ram ?? "Not identified", true);
  embed.addField("CPU", cpu ?? "Not identified", true);
  if (image) {
    embed.setImage(image);
  }
  if (osVersion?.includes("Windows 10")) {
    embed.setThumbnail("https://media.discordapp.net/attachments/763858681909477437/898683533659344926/Windows_logo_-_2012_dark_blue.svg.png");
  }
  if (osVersion?.includes("Windows 11")) {
    embed.setThumbnail("https://media.discordapp.net/attachments/763858681909477437/898683748952989716/windows-11-logo.png");
  }
  embed.setFooter(`Requested by ${message.author.tag}`, message.author.displayAvatarURL());
  message.send({ embeds: [embed] });
}
var fetch_default = new app.Command({
  name: "fetch",
  description: "Manages fetch information from user",
  channelType: "guild",
  options: [
    {
      name: "update",
      description: "Data to replace fetch information"
    },
    {
      name: "set",
      description: "Manually set a new value on your fetch information."
    }
  ],
  positional: [
    {
      name: "target",
      description: "Fetch target `<username or @username>` to get someone else's fetch"
    }
  ],
  async run(message) {
    const okEmoji = await resolveEmoji(message.guild, "check");
    const errEmoji = await resolveEmoji(message.guild, "linux");
    const sadEmoji = await resolveEmoji(message.guild, "sadcat");
    if (message.args.set) {
      const allowedFields = ["os", "arch", "build", "theme", "monitor", "gpu", "cpu", "disks", "ram", "computer", "image"];
      const attachment = message.attachments.first();
      const db = Fetches.query;
      if (message.args.set == "" || message.args.set == "image") {
        db.insert({
          user_id: message.author.id,
          image: attachment && attachIsImage(attachment) ? attachment.url : ""
        }).onConflict("user_id").merge().then(() => {
          const embed = new app.MessageEmbed();
          embed.setColor("GREEN");
          embed.setTitle(`${okEmoji} Updated fetch field ${message.args.set} to ${message.args.target}`);
          message.send({ embeds: [embed] });
        }).catch(() => {
          const embed = new app.MessageEmbed();
          embed.setColor("RED");
          embed.setTitle(`${errEmoji} Oops, something went wrong.`);
          message.send({ embeds: [embed] });
        });
        return;
      }
      if (allowedFields.includes(message.args.set)) {
        db.insert({
          user_id: message.author.id,
          [message.args.set]: message.args.target
        }).onConflict("user_id").merge().then(() => {
          const embed = new app.MessageEmbed();
          embed.setColor("GREEN");
          embed.setTitle(`${okEmoji} Updated fetch field ${message.args.set} to ${message.args.target}`);
          message.send({ embeds: [embed] });
        }).catch(() => {
          const embed = new app.MessageEmbed();
          embed.setColor("RED");
          embed.setTitle(`${errEmoji} Oops, something went wrong.`);
          message.send({ embeds: [embed] });
        });
        return;
      } else {
        const embed = new app.MessageEmbed();
        embed.setColor("RED");
        embed.setTitle(`${errEmoji} Invalid field selected (${message.args.set}).`);
        embed.setDescription(`Valid fields: ${allowedFields.join(", ")}`);
        message.send({ embeds: [embed] });
        return;
      }
      return;
    }
    if (message.args.update) {
      const attachment = message.attachments.first();
      let decodedFetch = Buffer.from(message.args.update, "base64").toString().replace("  ", "");
      decodedFetch = decodedFetch.substring(0, decodedFetch.length - 1);
      console.log(decodedFetch);
      const encodedJSON = JSON.parse(decodedFetch);
      console.log(encodedJSON);
      const db = Fetches.query;
      db.insert({
        user_id: message.author.id,
        os: encodedJSON.OS.Version,
        arch: encodedJSON.OS.Architecture,
        build: encodedJSON.OS.BuildVersion,
        theme: encodedJSON.Theme,
        monitor: encodedJSON.Monitors,
        gpu: encodedJSON.GPU.Name,
        cpu: encodedJSON.CPU,
        disks: encodedJSON.Disks.join("\n"),
        ram: encodedJSON.RAM,
        computer: encodedJSON.Name,
        image: attachment && attachIsImage(attachment) ? attachment.url : ""
      }).onConflict("user_id").merge().then(() => {
      }).catch((err) => {
      });
      sendFetchEmbed({
        osVersion: encodedJSON.OS.Version,
        osArchitecture: encodedJSON.OS.Architecture,
        osBuildVersion: encodedJSON.OS.BuildVersion,
        theme: encodedJSON.Theme,
        monitor: encodedJSON.Monitors,
        gpu: encodedJSON.CPU,
        cpu: encodedJSON.CPU,
        ram: encodedJSON.RAM,
        disks: encodedJSON.Disks,
        computer: encodedJSON.Name,
        image: attachment && attachIsImage(attachment) ? attachment.url : void 0,
        message
      });
      return;
    }
    if (message.args.target) {
      const catAngry = await resolveEmoji(message.guild, "woes");
      const member = await resolveUsername(message, message.args.target).then((member2) => {
        Fetches.query.select("*").where("user_id", "=", member2.id).then(async (rows) => {
          if (rows.length == 0) {
            const embed = new app.MessageEmbed().setTitle(`${sadEmoji} I don't have fetch information about this user yet :(`).setColor("YELLOW").addField("How to fetch", "[download](https://cdn.discordapp.com/attachments/763858761571500042/898706430322946089/Winthemers_UxiFetch.exe) Our fetcher and paste the fetch result here.").addField("How to add a picture", "Just upload the desired image when sending the fetcher message.");
            message.send({ embeds: [embed] });
          } else {
            for (const i in rows) {
              const row = rows[i];
              if (!row) {
                return;
              }
              const target = await message.guild.members.fetch(row.user_id);
              sendFetchEmbed({
                osVersion: row.os,
                osArchitecture: row.arch,
                osBuildVersion: row.build,
                theme: row.theme,
                monitor: row.monitor,
                gpu: row.gpu,
                cpu: row.cpu,
                ram: row.ram,
                disks: row.disks.split("\n"),
                computer: row.computer,
                image: row.image,
                message,
                member: target
              });
            }
          }
        });
      }).catch(() => {
        message.channel.send(`${catAngry} Got tired of waiting, you can call me again when decided.`);
      });
    } else if (!message.args.target) {
      Fetches.query.select("*").where("user_id", "=", message.author.id).then((rows) => {
        if (rows.length == 0) {
          const embed = new app.MessageEmbed().setTitle(`${sadEmoji} I don't have your fetch information yet :(`).setColor("YELLOW").addField("How to fetch", "[download](https://cdn.discordapp.com/attachments/763858761571500042/898706430322946089/Winthemers_UxiFetch.exe) Our fetcher and paste the fetch result here.").addField("How to add a picture", "Just upload the desired image when sending the fetcher message.");
          message.send({ embeds: [embed] });
        } else {
          for (const i in rows) {
            const row = rows[i];
            if (!row) {
              return;
            }
            sendFetchEmbed({
              osVersion: row.os,
              osArchitecture: row.arch,
              osBuildVersion: row.build,
              theme: row.theme,
              monitor: row.monitor,
              gpu: row.gpu,
              cpu: row.cpu,
              ram: row.ram,
              disks: row.disks.split("\n"),
              computer: row.computer,
              image: row.image,
              message
            });
          }
        }
      });
    }
  }
});
export {
  fetch_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2NvbW1hbmRzL2ZldGNoLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBDbGllbnQgfSBmcm9tIFwiZGlzY29yZC5qc1wiXHJcbmltcG9ydCAqIGFzIGFwcCBmcm9tIFwiLi4vYXBwLmpzXCJcclxuaW1wb3J0IHsgYXR0YWNoSXNJbWFnZSwgcmVzb2x2ZVVzZXJuYW1lLCByZXNvbHZlRW1vamkgfSBmcm9tICcuLi9uYW1lc3BhY2VzL3V0aWxzLmpzJ1xyXG5pbXBvcnQgRmV0Y2hlcyBmcm9tICcuLi90YWJsZXMvZmV0Y2hlcy5qcydcclxuXHJcbmludGVyZmFjZSBGZXRjaERhdGEge1xyXG4gIG1lc3NhZ2U6IGFwcC5HdWlsZE1lc3NhZ2VcclxuICBvc1ZlcnNpb24/OiBzdHJpbmdcclxuICBvc0FyY2hpdGVjdHVyZT86IHN0cmluZ1xyXG4gIG9zQnVpbGRWZXJzaW9uPzogc3RyaW5nXHJcbiAgdGhlbWU/OiBzdHJpbmdcclxuICBtb25pdG9yPzogc3RyaW5nXHJcbiAgZ3B1Pzogc3RyaW5nXHJcbiAgY3B1Pzogc3RyaW5nXHJcbiAgcmFtPzogc3RyaW5nXHJcbiAgZGlza3M/OiBzdHJpbmdbXVxyXG4gIGNvbXB1dGVyPzogc3RyaW5nXHJcbiAgaW1hZ2U/OiBzdHJpbmdcclxuICBtZW1iZXI/OiBhcHAuR3VpbGRNZW1iZXJcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gc2VuZEZldGNoRW1iZWQoe29zVmVyc2lvbiwgb3NBcmNoaXRlY3R1cmUsIG9zQnVpbGRWZXJzaW9uLCB0aGVtZSwgbW9uaXRvciwgZ3B1LCBjcHUsIHJhbSwgZGlza3MsIGNvbXB1dGVyLCBpbWFnZSwgbWVzc2FnZSwgbWVtYmVyfTogRmV0Y2hEYXRhKSB7XHJcbiAgY29uc3QgZW1iZWQgPSBuZXcgYXBwLk1lc3NhZ2VFbWJlZCgpXHJcblxyXG4gIGVtYmVkLnNldFRpdGxlKGBGZXRjaCAke21lbWJlciA/IG1lbWJlci51c2VyLnRhZyA6IG1lc3NhZ2UuYXV0aG9yLnRhZ30gLSAke2NvbXB1dGVyfWApXHJcbiAgZW1iZWQuc2V0Q29sb3IoJ0dSRUVOJylcclxuICBlbWJlZC5hZGRGaWVsZChcIk9TXCIsIGAke29zVmVyc2lvbn0gJHtvc0FyY2hpdGVjdHVyZX1gLCB0cnVlKVxyXG4gIGVtYmVkLmFkZEZpZWxkKFwiQnVpbGRcIiwgb3NCdWlsZFZlcnNpb24gPz8gJ05vdCBpZGVudGlmaWVkJywgdHJ1ZSlcclxuICBlbWJlZC5hZGRGaWVsZChcIlZpc3VhbCBTdHlsZVwiLCB0aGVtZSA/PyAnTm90IGlkZW50aWZpZWQnKVxyXG4gIGVtYmVkLmFkZEZpZWxkKFwiR1BVXCIsIGdwdSA/PyAnTm90IGlkZW50aWZpZWQnLCB0cnVlKVxyXG4gIGVtYmVkLmFkZEZpZWxkKFwiUmVzb2x1dGlvblwiLCBtb25pdG9yID8gbW9uaXRvci5zcGxpdCgnLCAnKS5qb2luKCdcXG4nKSA6ICdOb3QgaWRlbnRpZmllZCcsIHRydWUpXHJcbiAgZW1iZWQuYWRkRmllbGQoXCJEaXNrc1wiLCBkaXNrcyA/IGRpc2tzLmpvaW4oJ1xcbicpIDogJ05vdCBpZGVudGlmaWVkJylcclxuICBlbWJlZC5hZGRGaWVsZChcIk1lbW9yeVwiLCByYW0gPz8gJ05vdCBpZGVudGlmaWVkJywgdHJ1ZSlcclxuICBlbWJlZC5hZGRGaWVsZChcIkNQVVwiLCBjcHUgPz8gJ05vdCBpZGVudGlmaWVkJywgdHJ1ZSlcclxuXHJcbiAgaWYgKGltYWdlKSB7XHJcbiAgICBlbWJlZC5zZXRJbWFnZShpbWFnZSlcclxuICB9XHJcblxyXG4gIGlmIChvc1ZlcnNpb24/LmluY2x1ZGVzKFwiV2luZG93cyAxMFwiKSkge1xyXG4gICAgZW1iZWQuc2V0VGh1bWJuYWlsKCdodHRwczovL21lZGlhLmRpc2NvcmRhcHAubmV0L2F0dGFjaG1lbnRzLzc2Mzg1ODY4MTkwOTQ3NzQzNy84OTg2ODM1MzM2NTkzNDQ5MjYvV2luZG93c19sb2dvXy1fMjAxMl9kYXJrX2JsdWUuc3ZnLnBuZycpXHJcbiAgfVxyXG5cclxuICBpZiAob3NWZXJzaW9uPy5pbmNsdWRlcyhcIldpbmRvd3MgMTFcIikpIHtcclxuICAgIGVtYmVkLnNldFRodW1ibmFpbCgnaHR0cHM6Ly9tZWRpYS5kaXNjb3JkYXBwLm5ldC9hdHRhY2htZW50cy83NjM4NTg2ODE5MDk0Nzc0MzcvODk4NjgzNzQ4OTUyOTg5NzE2L3dpbmRvd3MtMTEtbG9nby5wbmcnKVxyXG4gIH1cclxuXHJcbiAgZW1iZWQuc2V0Rm9vdGVyKGBSZXF1ZXN0ZWQgYnkgJHttZXNzYWdlLmF1dGhvci50YWd9YCwgbWVzc2FnZS5hdXRob3IuZGlzcGxheUF2YXRhclVSTCgpKVxyXG5cclxuICBtZXNzYWdlLnNlbmQoe2VtYmVkczpbZW1iZWRdfSlcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgbmV3IGFwcC5Db21tYW5kKHtcclxuICBuYW1lOiBcImZldGNoXCIsXHJcbiAgZGVzY3JpcHRpb246IFwiTWFuYWdlcyBmZXRjaCBpbmZvcm1hdGlvbiBmcm9tIHVzZXJcIixcclxuICBjaGFubmVsVHlwZTogXCJndWlsZFwiLFxyXG4gIG9wdGlvbnM6IFtcclxuICAgIHtcclxuICAgICAgbmFtZTogXCJ1cGRhdGVcIixcclxuICAgICAgZGVzY3JpcHRpb246IFwiRGF0YSB0byByZXBsYWNlIGZldGNoIGluZm9ybWF0aW9uXCJcclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgIG5hbWU6IFwic2V0XCIsXHJcbiAgICAgIGRlc2NyaXB0aW9uOiBcIk1hbnVhbGx5IHNldCBhIG5ldyB2YWx1ZSBvbiB5b3VyIGZldGNoIGluZm9ybWF0aW9uLlwiLFxyXG4gICAgfVxyXG4gIF0sXHJcbiAgcG9zaXRpb25hbDogW1xyXG4gICAge1xyXG4gICAgICBuYW1lOiBcInRhcmdldFwiLFxyXG4gICAgICBkZXNjcmlwdGlvbjogXCJGZXRjaCB0YXJnZXQgYDx1c2VybmFtZSBvciBAdXNlcm5hbWU+YCB0byBnZXQgc29tZW9uZSBlbHNlJ3MgZmV0Y2hcIiBcclxuICAgICAgLy8gaXQncyBhY3R1YWxseSB0aGUgc2V0IHZhbHVlIGFzIHdlbGwsIGJ1dCB0aGUgdXNlciBkb2Vzbid0IG5lZWQgdG8ga25vdyB0ZWNobmljYWwgc2hpdCA6KVxyXG4gICAgfVxyXG4gIF0sXHJcbiAgYXN5bmMgcnVuKG1lc3NhZ2UpIHtcclxuICAgIGNvbnN0IG9rRW1vamkgPSBhd2FpdCByZXNvbHZlRW1vamkobWVzc2FnZS5ndWlsZCwgXCJjaGVja1wiKVxyXG4gICAgY29uc3QgZXJyRW1vamkgPSBhd2FpdCByZXNvbHZlRW1vamkobWVzc2FnZS5ndWlsZCwgXCJsaW51eFwiKVxyXG4gICAgY29uc3Qgc2FkRW1vamkgPSBhd2FpdCByZXNvbHZlRW1vamkobWVzc2FnZS5ndWlsZCwgXCJzYWRjYXRcIilcclxuXHJcbiAgICBpZiAobWVzc2FnZS5hcmdzLnNldCkge1xyXG4gICAgICBjb25zdCBhbGxvd2VkRmllbGRzID0gW1wib3NcIiwgXCJhcmNoXCIsIFwiYnVpbGRcIiwgXCJ0aGVtZVwiLCBcIm1vbml0b3JcIiwgXCJncHVcIiwgXCJjcHVcIiwgXCJkaXNrc1wiLCBcInJhbVwiLCBcImNvbXB1dGVyXCIsIFwiaW1hZ2VcIl1cclxuICAgICAgY29uc3QgYXR0YWNobWVudCA9IG1lc3NhZ2UuYXR0YWNobWVudHMuZmlyc3QoKVxyXG4gICAgICBcclxuICAgICAgY29uc3QgZGIgPSBGZXRjaGVzLnF1ZXJ5XHJcbiAgICAgIFxyXG4gICAgICBpZiAobWVzc2FnZS5hcmdzLnNldCA9PSBcIlwiIHx8IG1lc3NhZ2UuYXJncy5zZXQgPT0gXCJpbWFnZVwiKSB7IC8vIFdlIGFyZSBhbGxvd2luZyBpdCB0byBiZSBlbXB0eSBvbmx5IGZvciBpbWFnZXMuXHJcbiAgICAgICAgZGIuaW5zZXJ0KHtcclxuICAgICAgICAgIHVzZXJfaWQ6IG1lc3NhZ2UuYXV0aG9yLmlkLFxyXG4gICAgICAgICAgaW1hZ2U6IChhdHRhY2htZW50ICYmIGF0dGFjaElzSW1hZ2UoYXR0YWNobWVudCkpID8gYXR0YWNobWVudC51cmwgOiBcIlwiXHJcbiAgICAgICAgfSlcclxuICAgICAgICAub25Db25mbGljdCgndXNlcl9pZCcpXHJcbiAgICAgICAgLm1lcmdlKClcclxuICAgICAgICAudGhlbiggKCkgPT57XHJcbiAgICAgICAgICAgIGNvbnN0IGVtYmVkID0gbmV3IGFwcC5NZXNzYWdlRW1iZWQoKVxyXG4gICAgICAgICAgICBlbWJlZC5zZXRDb2xvcignR1JFRU4nKVxyXG4gICAgICAgICAgICBlbWJlZC5zZXRUaXRsZShgJHtva0Vtb2ppfSBVcGRhdGVkIGZldGNoIGZpZWxkICR7bWVzc2FnZS5hcmdzLnNldH0gdG8gJHttZXNzYWdlLmFyZ3MudGFyZ2V0fWApXHJcbiAgICAgICAgICAgIG1lc3NhZ2Uuc2VuZCh7ZW1iZWRzOltlbWJlZF19KVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmNhdGNoKCAoKSA9PiB7XHJcbiAgICAgICAgICBjb25zdCBlbWJlZCA9IG5ldyBhcHAuTWVzc2FnZUVtYmVkKClcclxuICAgICAgICAgIGVtYmVkLnNldENvbG9yKCdSRUQnKVxyXG4gICAgICAgICAgZW1iZWQuc2V0VGl0bGUoYCR7ZXJyRW1vaml9IE9vcHMsIHNvbWV0aGluZyB3ZW50IHdyb25nLmApXHJcbiAgICAgICAgICBtZXNzYWdlLnNlbmQoe2VtYmVkczpbZW1iZWRdfSlcclxuICAgICAgICB9KVxyXG5cclxuXHJcbiAgICAgICAgcmV0dXJuXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChhbGxvd2VkRmllbGRzLmluY2x1ZGVzKG1lc3NhZ2UuYXJncy5zZXQpKSB7XHJcbiAgICAgICAgZGIuaW5zZXJ0KHtcclxuICAgICAgICAgIHVzZXJfaWQ6IG1lc3NhZ2UuYXV0aG9yLmlkLFxyXG4gICAgICAgICAgW21lc3NhZ2UuYXJncy5zZXRdOiBtZXNzYWdlLmFyZ3MudGFyZ2V0XHJcbiAgICAgICAgfSlcclxuICAgICAgICAub25Db25mbGljdCgndXNlcl9pZCcpXHJcbiAgICAgICAgLm1lcmdlKClcclxuICAgICAgICAudGhlbiggKCkgPT57XHJcbiAgICAgICAgICBjb25zdCBlbWJlZCA9IG5ldyBhcHAuTWVzc2FnZUVtYmVkKClcclxuICAgICAgICAgIGVtYmVkLnNldENvbG9yKCdHUkVFTicpXHJcbiAgICAgICAgICBlbWJlZC5zZXRUaXRsZShgJHtva0Vtb2ppfSBVcGRhdGVkIGZldGNoIGZpZWxkICR7bWVzc2FnZS5hcmdzLnNldH0gdG8gJHttZXNzYWdlLmFyZ3MudGFyZ2V0fWApXHJcbiAgICAgICAgICBtZXNzYWdlLnNlbmQoe2VtYmVkczpbZW1iZWRdfSlcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5jYXRjaCggKCkgPT4ge1xyXG4gICAgICAgICAgY29uc3QgZW1iZWQgPSBuZXcgYXBwLk1lc3NhZ2VFbWJlZCgpXHJcbiAgICAgICAgICBlbWJlZC5zZXRDb2xvcignUkVEJylcclxuICAgICAgICAgIGVtYmVkLnNldFRpdGxlKGAke2VyckVtb2ppfSBPb3BzLCBzb21ldGhpbmcgd2VudCB3cm9uZy5gKVxyXG4gICAgICAgICAgbWVzc2FnZS5zZW5kKHtlbWJlZHM6W2VtYmVkXX0pXHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgcmV0dXJuXHJcbiAgICAgIH0gZWxzZSAge1xyXG4gICAgICAgIGNvbnN0IGVtYmVkID0gbmV3IGFwcC5NZXNzYWdlRW1iZWQoKVxyXG4gICAgICAgIGVtYmVkLnNldENvbG9yKCdSRUQnKVxyXG4gICAgICAgIGVtYmVkLnNldFRpdGxlKGAke2VyckVtb2ppfSBJbnZhbGlkIGZpZWxkIHNlbGVjdGVkICgke21lc3NhZ2UuYXJncy5zZXR9KS5gKVxyXG4gICAgICAgIGVtYmVkLnNldERlc2NyaXB0aW9uKGBWYWxpZCBmaWVsZHM6ICR7YWxsb3dlZEZpZWxkcy5qb2luKCcsICcpfWApXHJcbiAgICAgICAgbWVzc2FnZS5zZW5kKHtlbWJlZHM6W2VtYmVkXX0pXHJcblxyXG4gICAgICAgIHJldHVyblxyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm5cclxuICAgIH1cclxuXHJcbiAgICBpZiAobWVzc2FnZS5hcmdzLnVwZGF0ZSkge1xyXG4gICAgICBjb25zdCBhdHRhY2htZW50ID0gbWVzc2FnZS5hdHRhY2htZW50cy5maXJzdCgpXHJcbiAgICAgIGxldCBkZWNvZGVkRmV0Y2ggPSBCdWZmZXIuZnJvbShtZXNzYWdlLmFyZ3MudXBkYXRlLCAnYmFzZTY0JykudG9TdHJpbmcoKS5yZXBsYWNlKFwiICBcIiwgXCJcIilcclxuICAgICAgZGVjb2RlZEZldGNoID0gZGVjb2RlZEZldGNoLnN1YnN0cmluZygwLCBkZWNvZGVkRmV0Y2gubGVuZ3RoIC0gMSlcclxuICAgICAgY29uc29sZS5sb2coZGVjb2RlZEZldGNoKVxyXG4gICAgICBjb25zdCBlbmNvZGVkSlNPTiA9IEpTT04ucGFyc2UoZGVjb2RlZEZldGNoKVxyXG4gICAgICBjb25zb2xlLmxvZyhlbmNvZGVkSlNPTilcclxuXHJcbiAgICAgIGNvbnN0IGRiID0gRmV0Y2hlcy5xdWVyeVxyXG4gICAgICBkYi5pbnNlcnQoe1xyXG4gICAgICAgIHVzZXJfaWQ6IG1lc3NhZ2UuYXV0aG9yLmlkLFxyXG4gICAgICAgIG9zOiBlbmNvZGVkSlNPTi5PUy5WZXJzaW9uLFxyXG4gICAgICAgIGFyY2g6IGVuY29kZWRKU09OLk9TLkFyY2hpdGVjdHVyZSxcclxuICAgICAgICBidWlsZDogZW5jb2RlZEpTT04uT1MuQnVpbGRWZXJzaW9uLFxyXG4gICAgICAgIHRoZW1lOiBlbmNvZGVkSlNPTi5UaGVtZSxcclxuICAgICAgICBtb25pdG9yOiBlbmNvZGVkSlNPTi5Nb25pdG9ycyxcclxuICAgICAgICBncHU6IGVuY29kZWRKU09OLkdQVS5OYW1lLFxyXG4gICAgICAgIGNwdTogZW5jb2RlZEpTT04uQ1BVLFxyXG4gICAgICAgIGRpc2tzOiBlbmNvZGVkSlNPTi5EaXNrcy5qb2luKCdcXG4nKSxcclxuICAgICAgICByYW06IGVuY29kZWRKU09OLlJBTSxcclxuICAgICAgICBjb21wdXRlcjogZW5jb2RlZEpTT04uTmFtZSxcclxuICAgICAgICBpbWFnZTogKGF0dGFjaG1lbnQgJiYgYXR0YWNoSXNJbWFnZShhdHRhY2htZW50KSkgPyBhdHRhY2htZW50LnVybCA6IFwiXCJcclxuICAgICAgfSlcclxuICAgICAgLm9uQ29uZmxpY3QoJ3VzZXJfaWQnKVxyXG4gICAgICAubWVyZ2UoKVxyXG4gICAgICAudGhlbiggKCkgPT57XHJcbiAgICAgIH0pXHJcbiAgICAgIC5jYXRjaCggZXJyID0+IHtcclxuICAgICAgfSlcclxuICBcclxuXHJcbiAgICAgIHNlbmRGZXRjaEVtYmVkKHtcclxuICAgICAgICBvc1ZlcnNpb246IGVuY29kZWRKU09OLk9TLlZlcnNpb24sIFxyXG4gICAgICAgIG9zQXJjaGl0ZWN0dXJlOiBlbmNvZGVkSlNPTi5PUy5BcmNoaXRlY3R1cmUsIFxyXG4gICAgICAgIG9zQnVpbGRWZXJzaW9uOiBlbmNvZGVkSlNPTi5PUy5CdWlsZFZlcnNpb24sIFxyXG4gICAgICAgIHRoZW1lOiBlbmNvZGVkSlNPTi5UaGVtZSwgXHJcbiAgICAgICAgbW9uaXRvcjogZW5jb2RlZEpTT04uTW9uaXRvcnMsIFxyXG4gICAgICAgIGdwdTogZW5jb2RlZEpTT04uQ1BVLCBcclxuICAgICAgICBjcHU6IGVuY29kZWRKU09OLkNQVSwgXHJcbiAgICAgICAgcmFtOiBlbmNvZGVkSlNPTi5SQU0sIFxyXG4gICAgICAgIGRpc2tzOiBlbmNvZGVkSlNPTi5EaXNrcywgXHJcbiAgICAgICAgY29tcHV0ZXI6IGVuY29kZWRKU09OLk5hbWUsIFxyXG4gICAgICAgIGltYWdlOiAoYXR0YWNobWVudCAmJiBhdHRhY2hJc0ltYWdlKGF0dGFjaG1lbnQpKSA/IGF0dGFjaG1lbnQudXJsIDogdW5kZWZpbmVkLCBcclxuICAgICAgICBtZXNzYWdlXHJcbiAgICAgIH0pXHJcblxyXG4gICAgICByZXR1cm4gXHJcbiAgICB9XHJcblxyXG4gICAgaWYgKG1lc3NhZ2UuYXJncy50YXJnZXQpIHtcclxuICAgICAgY29uc3QgY2F0QW5ncnkgPSBhd2FpdCByZXNvbHZlRW1vamkobWVzc2FnZS5ndWlsZCwgJ3dvZXMnKVxyXG5cclxuICAgICAgY29uc3QgbWVtYmVyID0gYXdhaXQgcmVzb2x2ZVVzZXJuYW1lKG1lc3NhZ2UsIG1lc3NhZ2UuYXJncy50YXJnZXQpXHJcbiAgICAgIC50aGVuKCBtZW1iZXIgPT4ge1xyXG4gICAgICAgIEZldGNoZXMucXVlcnlcclxuICAgICAgICAuc2VsZWN0KFwiKlwiKVxyXG4gICAgICAgIC53aGVyZSgndXNlcl9pZCcsICc9JyxtZW1iZXIuaWQpXHJcbiAgICAgICAgLnRoZW4oIGFzeW5jIHJvd3MgPT4ge1xyXG4gICAgICAgICAgaWYgKHJvd3MubGVuZ3RoID09IDApIHtcclxuICAgICAgICAgICAgY29uc3QgZW1iZWQgPSBuZXcgYXBwLk1lc3NhZ2VFbWJlZCgpLnNldFRpdGxlKGAke3NhZEVtb2ppfSBJIGRvbid0IGhhdmUgZmV0Y2ggaW5mb3JtYXRpb24gYWJvdXQgdGhpcyB1c2VyIHlldCA6KGApXHJcbiAgICAgICAgICAgIC5zZXRDb2xvcignWUVMTE9XJylcclxuICAgICAgICAgICAgLmFkZEZpZWxkKFwiSG93IHRvIGZldGNoXCIsIFwiW2Rvd25sb2FkXShodHRwczovL2Nkbi5kaXNjb3JkYXBwLmNvbS9hdHRhY2htZW50cy83NjM4NTg3NjE1NzE1MDAwNDIvODk4NzA2NDMwMzIyOTQ2MDg5L1dpbnRoZW1lcnNfVXhpRmV0Y2guZXhlKSBPdXIgZmV0Y2hlciBhbmQgcGFzdGUgdGhlIGZldGNoIHJlc3VsdCBoZXJlLlwiKVxyXG4gICAgICAgICAgICAuYWRkRmllbGQoXCJIb3cgdG8gYWRkIGEgcGljdHVyZVwiLCBcIkp1c3QgdXBsb2FkIHRoZSBkZXNpcmVkIGltYWdlIHdoZW4gc2VuZGluZyB0aGUgZmV0Y2hlciBtZXNzYWdlLlwiKVxyXG4gICAgICAgICAgICBtZXNzYWdlLnNlbmQoe2VtYmVkczogW2VtYmVkXX0pXHJcbiAgXHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgZm9yIChjb25zdCBpIGluIHJvd3MpIHtcclxuICAgICAgICAgICAgICBjb25zdCByb3cgPSByb3dzW2ldXHJcbiAgICAgICAgICAgICAgaWYgKCFyb3cpIHsgcmV0dXJuIH1cclxuXHJcbiAgICAgICAgICAgICAgY29uc3QgdGFyZ2V0ID0gYXdhaXQgbWVzc2FnZS5ndWlsZC5tZW1iZXJzLmZldGNoKHJvdy51c2VyX2lkKVxyXG5cclxuICAgICAgICAgICAgICBzZW5kRmV0Y2hFbWJlZCh7XHJcbiAgICAgICAgICAgICAgICBvc1ZlcnNpb246IHJvdy5vcywgXHJcbiAgICAgICAgICAgICAgICBvc0FyY2hpdGVjdHVyZTogcm93LmFyY2gsIFxyXG4gICAgICAgICAgICAgICAgb3NCdWlsZFZlcnNpb246IHJvdy5idWlsZCwgXHJcbiAgICAgICAgICAgICAgICB0aGVtZTogcm93LnRoZW1lLCBcclxuICAgICAgICAgICAgICAgIG1vbml0b3I6IHJvdy5tb25pdG9yLCBcclxuICAgICAgICAgICAgICAgIGdwdTogcm93LmdwdSwgXHJcbiAgICAgICAgICAgICAgICBjcHU6IHJvdy5jcHUsIFxyXG4gICAgICAgICAgICAgICAgcmFtOiByb3cucmFtLCBcclxuICAgICAgICAgICAgICAgIGRpc2tzOiByb3cuZGlza3Muc3BsaXQoXCJcXG5cIiksIFxyXG4gICAgICAgICAgICAgICAgY29tcHV0ZXI6IHJvdy5jb21wdXRlciwgXHJcbiAgICAgICAgICAgICAgICBpbWFnZTogcm93LmltYWdlLCBcclxuICAgICAgICAgICAgICAgIG1lc3NhZ2UsXHJcbiAgICAgICAgICAgICAgICBtZW1iZXI6IHRhcmdldFxyXG4gICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICB9KVxyXG4gICAgICAuY2F0Y2goICgpID0+eyBcclxuICAgICAgICBtZXNzYWdlLmNoYW5uZWwuc2VuZChgJHtjYXRBbmdyeX0gR290IHRpcmVkIG9mIHdhaXRpbmcsIHlvdSBjYW4gY2FsbCBtZSBhZ2FpbiB3aGVuIGRlY2lkZWQuYCk7XHJcbiAgICAgIH0pXHJcblxyXG5cclxuICAgICAgLy8gbWVzc2FnZS5yZXBseShKU09OLnN0cmluZ2lmeSh1c2VyKSlcclxuICAgIH0gZWxzZSBpZighbWVzc2FnZS5hcmdzLnRhcmdldCkge1xyXG4gICAgICBGZXRjaGVzLnF1ZXJ5XHJcbiAgICAgIC5zZWxlY3QoXCIqXCIpXHJcbiAgICAgIC53aGVyZSgndXNlcl9pZCcsICc9JywgbWVzc2FnZS5hdXRob3IuaWQpXHJcbiAgICAgIC50aGVuKCByb3dzID0+IHtcclxuICAgICAgICBpZiAocm93cy5sZW5ndGggPT0gMCkge1xyXG4gICAgICAgICAgY29uc3QgZW1iZWQgPSBuZXcgYXBwLk1lc3NhZ2VFbWJlZCgpLnNldFRpdGxlKGAke3NhZEVtb2ppfSBJIGRvbid0IGhhdmUgeW91ciBmZXRjaCBpbmZvcm1hdGlvbiB5ZXQgOihgKVxyXG4gICAgICAgICAgLnNldENvbG9yKCdZRUxMT1cnKVxyXG4gICAgICAgICAgLmFkZEZpZWxkKFwiSG93IHRvIGZldGNoXCIsIFwiW2Rvd25sb2FkXShodHRwczovL2Nkbi5kaXNjb3JkYXBwLmNvbS9hdHRhY2htZW50cy83NjM4NTg3NjE1NzE1MDAwNDIvODk4NzA2NDMwMzIyOTQ2MDg5L1dpbnRoZW1lcnNfVXhpRmV0Y2guZXhlKSBPdXIgZmV0Y2hlciBhbmQgcGFzdGUgdGhlIGZldGNoIHJlc3VsdCBoZXJlLlwiKVxyXG4gICAgICAgICAgLmFkZEZpZWxkKFwiSG93IHRvIGFkZCBhIHBpY3R1cmVcIiwgXCJKdXN0IHVwbG9hZCB0aGUgZGVzaXJlZCBpbWFnZSB3aGVuIHNlbmRpbmcgdGhlIGZldGNoZXIgbWVzc2FnZS5cIilcclxuICAgICAgICAgIG1lc3NhZ2Uuc2VuZCh7ZW1iZWRzOiBbZW1iZWRdfSlcclxuXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIFxyXG4gICAgICAgICAgZm9yIChjb25zdCBpIGluIHJvd3MpIHtcclxuICAgICAgICAgICAgY29uc3Qgcm93ID0gcm93c1tpXVxyXG4gICAgICAgICAgICBpZiAoIXJvdykgeyByZXR1cm4gfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgc2VuZEZldGNoRW1iZWQoe1xyXG4gICAgICAgICAgICAgIG9zVmVyc2lvbjogcm93Lm9zLCBcclxuICAgICAgICAgICAgICBvc0FyY2hpdGVjdHVyZTogcm93LmFyY2gsIFxyXG4gICAgICAgICAgICAgIG9zQnVpbGRWZXJzaW9uOiByb3cuYnVpbGQsIFxyXG4gICAgICAgICAgICAgIHRoZW1lOiByb3cudGhlbWUsIFxyXG4gICAgICAgICAgICAgIG1vbml0b3I6IHJvdy5tb25pdG9yLCBcclxuICAgICAgICAgICAgICBncHU6IHJvdy5ncHUsIFxyXG4gICAgICAgICAgICAgIGNwdTogcm93LmNwdSwgXHJcbiAgICAgICAgICAgICAgcmFtOiByb3cucmFtLCBcclxuICAgICAgICAgICAgICBkaXNrczogcm93LmRpc2tzLnNwbGl0KFwiXFxuXCIpLCBcclxuICAgICAgICAgICAgICBjb21wdXRlcjogcm93LmNvbXB1dGVyLCBcclxuICAgICAgICAgICAgICBpbWFnZTogcm93LmltYWdlLCBcclxuICAgICAgICAgICAgICBtZXNzYWdlXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICBcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfSlcclxuXHJcbiAgICB9XHJcblxyXG4gIH1cclxufSkiXSwKICAibWFwcGluZ3MiOiAiQUFDQTtBQUNBO0FBQ0E7QUFrQkEsOEJBQThCLEVBQUMsV0FBVyxnQkFBZ0IsZ0JBQWdCLE9BQU8sU0FBUyxLQUFLLEtBQUssS0FBSyxPQUFPLFVBQVUsT0FBTyxTQUFTLFVBQW9CO0FBQzVKLFFBQU0sUUFBUSxJQUFJLElBQUk7QUFFdEIsUUFBTSxTQUFTLFNBQVMsU0FBUyxPQUFPLEtBQUssTUFBTSxRQUFRLE9BQU8sU0FBUztBQUMzRSxRQUFNLFNBQVM7QUFDZixRQUFNLFNB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
