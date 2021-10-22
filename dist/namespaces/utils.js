import Discord from "discord.js";
import { createWriteStream } from "fs";
import * as stream from "stream";
import { promisify } from "util";
import axios from "axios";
import { CollectorUtils } from "discord.js-collector-utils";
async function resolveEmoji(guild, name) {
  if (!guild) {
    return "";
  }
  return guild.emojis.cache.find((emoji) => emoji.name === name);
}
function attachIsImage(msgAttach) {
  return msgAttach.url.includes(".png") || msgAttach.url.includes(".jpg") || msgAttach.url.includes(".webp") || msgAttach.url.includes(".webm") || msgAttach.url.includes(".mp4");
}
const finished = promisify(stream.finished);
async function downloadFile(fileUrl, outputLocationPath) {
  const writer = createWriteStream(outputLocationPath);
  return axios({
    method: "get",
    url: fileUrl,
    responseType: "stream"
  }).then(async (response) => {
    response.data.pipe(writer);
    return finished(writer);
  });
}
function getExtension(fileName) {
  return fileName.substring(fileName.lastIndexOf(".") + 1, fileName.length) || fileName;
}
async function resolveUsername(message, name) {
  const emoteOptions = ["1\uFE0F\u20E3", "2\uFE0F\u20E3", "3\uFE0F\u20E3", "4\uFE0F\u20E3", "5\uFE0F\u20E3", "6\uFE0F\u20E3", "7\uFE0F\u20E3", "8\uFE0F\u20E3", "9\uFE0F\u20E3", "\u{1F51F}"];
  const memberSelection = {};
  const promise = new Promise(async (resolve, reject) => {
    if (message.mentions.members?.size && message.mentions.members?.size >= 1) {
      console.log("Resolving -> mention");
      resolve(message.mentions.members.first());
    }
    if (typeof name == "string") {
      const foundMembers = await message.guild?.members.search({
        query: name,
        limit: emoteOptions.length
      });
      if (foundMembers && foundMembers?.size > 1) {
        const embed = new Discord.MessageEmbed();
        let descriptionList = "";
        let i = 0;
        foundMembers.forEach(async (member, index) => {
          descriptionList = descriptionList + `${emoteOptions[i]} - <@${member.user.id}> (${member.user.tag})
`;
          memberSelection[i] = member;
          i++;
        });
        embed.setDescription(descriptionList);
        const prompt = await message.channel.send({ embeds: [embed] });
        for (let i2 = 0; i2 < foundMembers.size; i2++) {
          await prompt.react(emoteOptions[i2]);
        }
        await CollectorUtils.collectByReaction(prompt, (msgReaction, reactor) => reactor.id === message.author.id, (nextMsg) => nextMsg.author.id === message.author.id && nextMsg.content === "stop", async (msgReaction, reactor) => {
          const index = emoteOptions.indexOf(msgReaction.emoji.name ?? "");
          const user = memberSelection[index];
          console.log("Resolved -> reaction");
          resolve(user);
          return;
        }, async () => {
          reject("timeout");
        }, { time: 1e4, reset: true });
      } else if (foundMembers && foundMembers?.size === 1) {
        resolve(foundMembers?.first());
      }
    }
  });
  return promise;
}
export {
  attachIsImage,
  downloadFile,
  getExtension,
  resolveEmoji,
  resolveUsername
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL25hbWVzcGFjZXMvdXRpbHMudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCBEaXNjb3JkLCB7IEFwcGxpY2F0aW9uLCBDbGllbnQsIE1lc3NhZ2VSZWFjdGlvbiB9IGZyb20gJ2Rpc2NvcmQuanMnXHJcbmltcG9ydCB7Y3JlYXRlV3JpdGVTdHJlYW19IGZyb20gJ2ZzJ1xyXG5pbXBvcnQgKiBhcyBzdHJlYW0gZnJvbSAnc3RyZWFtJ1xyXG5pbXBvcnQgeyBwcm9taXNpZnkgfSBmcm9tICd1dGlsJ1xyXG5pbXBvcnQgYXhpb3MgZnJvbSAnYXhpb3MnXHJcbmltcG9ydCB7IEd1aWxkTWVzc2FnZSB9IGZyb20gJy4uL2FwcC9jb21tYW5kJztcclxuaW1wb3J0IHsgQ29sbGVjdG9yVXRpbHMgfSBmcm9tICdkaXNjb3JkLmpzLWNvbGxlY3Rvci11dGlscyc7XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVzb2x2ZUVtb2ppKGd1aWxkOiBEaXNjb3JkLkd1aWxkIHwgbnVsbCwgbmFtZTogc3RyaW5nKSB7XHJcbiAgaWYgKCFndWlsZCkgeyByZXR1cm4gXCJcIiB9XHJcblxyXG4gIHJldHVybiBndWlsZC5lbW9qaXMuY2FjaGUuZmluZChlbW9qaSA9PiBlbW9qaS5uYW1lID09PSBuYW1lKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGF0dGFjaElzSW1hZ2UobXNnQXR0YWNoOiBEaXNjb3JkLk1lc3NhZ2VBdHRhY2htZW50KSB7XHJcbiAgcmV0dXJuIG1zZ0F0dGFjaC51cmwuaW5jbHVkZXMoXCIucG5nXCIpIHx8IG1zZ0F0dGFjaC51cmwuaW5jbHVkZXMoXCIuanBnXCIpIHx8IG1zZ0F0dGFjaC51cmwuaW5jbHVkZXMoXCIud2VicFwiKSB8fCBtc2dBdHRhY2gudXJsLmluY2x1ZGVzKFwiLndlYm1cIikgfHwgbXNnQXR0YWNoLnVybC5pbmNsdWRlcyhcIi5tcDRcIikgLy8gTVA0IEFuZCBXZWJtIGFyZSBhbHNvIGdpZnMsIGFuZCB3ZSBhcmUgbm90IGFnYWlucyB2aWRlb3MuLi4uIEJ1dCB0aGUgZnVuY3Rpb24gbmFtZSBpcyBub3cgaW5jb3JyZWN0LlxyXG59XHJcblxyXG5cclxuY29uc3QgZmluaXNoZWQgPSBwcm9taXNpZnkoc3RyZWFtLmZpbmlzaGVkKTtcclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkb3dubG9hZEZpbGUoZmlsZVVybDogc3RyaW5nLCBvdXRwdXRMb2NhdGlvblBhdGg6IHN0cmluZyk6IFByb21pc2U8YW55PiB7XHJcbiAgY29uc3Qgd3JpdGVyID0gY3JlYXRlV3JpdGVTdHJlYW0ob3V0cHV0TG9jYXRpb25QYXRoKTtcclxuICByZXR1cm4gYXhpb3Moe1xyXG4gICAgbWV0aG9kOiAnZ2V0JyxcclxuICAgIHVybDogZmlsZVVybCxcclxuICAgIHJlc3BvbnNlVHlwZTogJ3N0cmVhbScsXHJcbiAgfSkudGhlbihhc3luYyByZXNwb25zZSA9PiB7XHJcbiAgICAvL0B0cy1leHBlY3QtZXJyb3JcclxuICAgIHJlc3BvbnNlLmRhdGEucGlwZSh3cml0ZXIpXHJcbiAgICByZXR1cm4gZmluaXNoZWQod3JpdGVyKVxyXG4gIH0pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0RXh0ZW5zaW9uKGZpbGVOYW1lOiBzdHJpbmcpIHtcclxuICByZXR1cm4gZmlsZU5hbWUuc3Vic3RyaW5nKGZpbGVOYW1lLmxhc3RJbmRleE9mKCcuJykgKyAxLCBmaWxlTmFtZS5sZW5ndGgpIHx8IGZpbGVOYW1lO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVzb2x2ZVVzZXJuYW1lKG1lc3NhZ2U6IERpc2NvcmQuTWVzc2FnZSwgbmFtZTogc3RyaW5nIHwgRGlzY29yZC5NZW1iZXJNZW50aW9uKSB7XHJcbiAgY29uc3QgZW1vdGVPcHRpb25zID0gWycxXHVGRTBGXHUyMEUzJywgJzJcdUZFMEZcdTIwRTMnLCAnM1x1RkUwRlx1MjBFMycsICc0XHVGRTBGXHUyMEUzJywgJzVcdUZFMEZcdTIwRTMnLCAnNlx1RkUwRlx1MjBFMycsICc3XHVGRTBGXHUyMEUzJywgJzhcdUZFMEZcdTIwRTMnLCAnOVx1RkUwRlx1MjBFMycsICdcdUQ4M0RcdUREMUYnXVxyXG4gIGNvbnN0IG1lbWJlclNlbGVjdGlvbjogYW55ID0ge31cclxuXHJcbiAgY29uc3QgcHJvbWlzZSA9IG5ldyBQcm9taXNlKGFzeW5jIChyZXNvbHZlOiAobWVtYmVyOiBEaXNjb3JkLkd1aWxkTWVtYmVyKSA9PiB2b2lkLCByZWplY3QpID0+IHtcclxuXHJcbiAgICBpZiAobWVzc2FnZS5tZW50aW9ucy5tZW1iZXJzPy5zaXplICYmIG1lc3NhZ2UubWVudGlvbnMubWVtYmVycz8uc2l6ZSA+PSAxICkgeyAvLyBIZSBtZW50aW9uZWQgOmJsZXNzOlxyXG4gICAgICBjb25zb2xlLmxvZyhcIlJlc29sdmluZyAtPiBtZW50aW9uXCIpXHJcblxyXG4gICAgICAvL0B0cy1leHBlY3QtZXJyb3IgLS0gRGlzY29yZEpTIHR5cGVzIGFyZSBub3QgaGVscGluZy4uLlxyXG4gICAgICByZXNvbHZlKCBtZXNzYWdlLm1lbnRpb25zLm1lbWJlcnMuZmlyc3QoKSApXHJcblxyXG4gICAgfVxyXG4gIFxyXG4gICAgaWYgKHR5cGVvZiBuYW1lID09IFwic3RyaW5nXCIpIHsgLy8gSXMgdGhpcyBjaGVjayByZWFsbHkgbmVlZGVkPyBubywgYnV0IHRoaXMgbWFrZXMgdHlwZXNjcmlwdCBjb21waWxlZCBoYXBweSA6KVxyXG5cclxuICAgICAgY29uc3QgZm91bmRNZW1iZXJzID0gYXdhaXQgbWVzc2FnZS5ndWlsZD8ubWVtYmVycy5zZWFyY2goe1xyXG4gICAgICAgIHF1ZXJ5OiBuYW1lLFxyXG4gICAgICAgIGxpbWl0OiBlbW90ZU9wdGlvbnMubGVuZ3RoXHJcbiAgICAgIH0pXHJcbiAgICAgIFxyXG5cclxuICAgICAgaWYgKGZvdW5kTWVtYmVycyAmJiBmb3VuZE1lbWJlcnM/LnNpemUgPiAxKSB7XHJcbiAgICAgICAgY29uc3QgZW1iZWQgPSBuZXcgRGlzY29yZC5NZXNzYWdlRW1iZWQoKVxyXG4gICAgICAgIGxldCBkZXNjcmlwdGlvbkxpc3QgPSBcIlwiXHJcbiAgICAgICAgXHJcbiAgICAgICAgbGV0IGkgPSAwXHJcbiAgICAgICAgZm91bmRNZW1iZXJzLmZvckVhY2goIGFzeW5jIChtZW1iZXIsIGluZGV4KSA9PiB7XHJcbiAgICAgICAgICBkZXNjcmlwdGlvbkxpc3QgPSBkZXNjcmlwdGlvbkxpc3QgKyBgJHtlbW90ZU9wdGlvbnNbaV19IC0gPEAke21lbWJlci51c2VyLmlkfT4gKCR7bWVtYmVyLnVzZXIudGFnfSlcXG5gXHJcbiAgICAgICAgICBtZW1iZXJTZWxlY3Rpb25baV0gPSBtZW1iZXIgLy8gV2h5PyBiZWNhdXNlIGl0J3MgZWFzaWVyLCBkaXNjb3JkIGNoYW5nZWQgdGhlIGd1aWxkLm1lbWJlciBhbmQgLnVzZXIgdHdpY2UgYmV0d2VlbiB2MTAgYW5kIHYxMywgaW4gY2FzZSB0aGV5IGNoYW5nZSBhZ2FpbiBpIHByZWZlciB0byBjaGFuZ2UgdGhpcyBsaW5lIGFuZCB0aGUgbG9vcCBhYm92ZSBpdCB0aGFuIGV2ZXJ5dGhpbmcgZWxzZS4uLi5cclxuICAgICAgICAgIGkrK1xyXG4gICAgICAgIH0pXHJcblxyXG4gICAgICAgIGVtYmVkLnNldERlc2NyaXB0aW9uKGRlc2NyaXB0aW9uTGlzdClcclxuICAgICAgICBjb25zdCBwcm9tcHQgPSBhd2FpdCBtZXNzYWdlLmNoYW5uZWwuc2VuZCh7ZW1iZWRzOltlbWJlZF19KVxyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZvdW5kTWVtYmVycy5zaXplOyBpKyspe1xyXG4gICAgICAgICBhd2FpdCBwcm9tcHQucmVhY3QoZW1vdGVPcHRpb25zW2ldKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYXdhaXQgQ29sbGVjdG9yVXRpbHMuY29sbGVjdEJ5UmVhY3Rpb24oXHJcbiAgICAgICAgICBwcm9tcHQsXHJcbiAgICAgICAgICAobXNnUmVhY3Rpb24sIHJlYWN0b3IpID0+IHJlYWN0b3IuaWQgPT09IG1lc3NhZ2UuYXV0aG9yLmlkLFxyXG4gICAgICAgICAgKG5leHRNc2cpID0+IG5leHRNc2cuYXV0aG9yLmlkID09PSBtZXNzYWdlLmF1dGhvci5pZCAmJiBuZXh0TXNnLmNvbnRlbnQgPT09ICdzdG9wJyxcclxuICAgICAgICAgIGFzeW5jIChtc2dSZWFjdGlvbiwgcmVhY3RvcikgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IGVtb3RlT3B0aW9ucy5pbmRleE9mKG1zZ1JlYWN0aW9uLmVtb2ppLm5hbWUgPz8gXCJcIilcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHVzZXIgPSBtZW1iZXJTZWxlY3Rpb25baW5kZXhdIGFzIERpc2NvcmQuR3VpbGRNZW1iZXJcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZXNvbHZlZCAtPiByZWFjdGlvblwiKVxyXG4gICAgICAgICAgICByZXNvbHZlKHVzZXIpXHJcbiAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgcmVqZWN0KCd0aW1lb3V0JylcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB7dGltZTogMTAwMDAsIHJlc2V0OiB0cnVlfVxyXG4gICAgICAgIClcclxuXHJcbiAgICAgIH0gZWxzZSBpZiAoZm91bmRNZW1iZXJzICYmIGZvdW5kTWVtYmVycz8uc2l6ZSA9PT0gMSkge1xyXG4gICAgICAgIC8vQHRzLWV4cGVjdC1lcnJvciB5ZXNcclxuICAgICAgICByZXNvbHZlKGZvdW5kTWVtYmVycz8uZmlyc3QoKSlcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBcclxuICB9KVxyXG5cclxuICByZXR1cm4gcHJvbWlzZVxyXG59Il0sCiAgIm1hcHBpbmdzIjogIkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBRUEsNEJBQW1DLE9BQTZCLE1BQWM7QUFDNUUsTUFBSSxDQUFDLE9BQU87QUFBRSxXQUFPO0FBQUE7QUFFckIsU0FBTyxNQUFNLE9BQU8sTUFBTSxLQUFLLFdBQVMsTUFBTSxTQUFTO0FBQUE7QUFHbEQsdUJBQXVCLFdBQXNDO0FBQ2xFLFNBQU8sVUFBVSxJQUFJLFNBQVMsV0FBVyxVQUFVLElBQUksU0FBUyxXQUFXLFVBQVUsSUFBSSxTQUFTLFlBQVksVUFBVSxJQUFJLFNBQVMsWUFBWSxVQUFVLElBQUksU0FBUztBQUFBO0FBSTFLLE1BQU0sV0FBVyxVQUFVLE9BQU87QUFFbEMsNEJBQW1DLFNBQWlCLG9CQUEwQztBQUM1RixRQUFNLFNBQVMsa0JBQWtCO0FBQ2pDLFNBQU8sTUFBTTtBQUFBLElBQ1gsUUFBUTtBQUFBLElBQ1IsS0FBSztBQUFBLElBQ0wsY0FBYztBQUFBLEtBQ2IsS0FBSyxPQUFNLGFBQVk7QUFFeEIsYUFBUyxLQUFLLEtBQUs7QUFDbkIsV0FBTyxTQUFTO0FBQUE7QUFBQTtBQUliLHNCQUFzQixVQUFrQjtBQUM3QyxTQUFPLFNBQVMsVUFBVSxTQUFTLFlBQVksT0FBTyxHQUFHLFNBQVMsV0FBVztBQUFBO0FBRy9FLCtCQUFzQyxTQUEwQixNQUFzQztBQUNwRyxRQUFNLGVBQWUsQ0FBQyxpQkFBTyxpQkFBTyxpQkFBTyxpQkFBTyxpQkFBTyxpQkFBTyxpQkFBTyxpQkFBTyxpQkFBTztBQUNyRixRQUFNLGtCQUF1QjtBQUU3QixRQUFNLFVBQVUsSUFBSSxRQUFRLE9BQU8sU0FBZ0QsV0FBVztBQUU1RixRQUFJLFFBQVEsU0FBUyxTQUFTLFFBQVEsUUFBUSxTQUFTLFNBQVMsUUFBUSxHQUFJO0FBQzFFLGNBQVEsSUFBSTtBQUdaLGNBQVMsUUFBUSxTQUFTLFFBQVE7QUFBQTtBQUlwQyxRQUFJLE9BQU8sUUFBUSxVQUFVO0FBRTNCLFlBQU0sZUFBZSxNQUFNLFFBQVEsT0FBTyxRQUFRLE9BQU87QUFBQSxRQUN2RCxPQUFPO0FBQUEsUUFDUCxPQUFPLGFBQWE7QUFBQTtBQUl0QixVQUFJLGdCQUFnQixjQUFjLE9BQU8sR0FBRztBQUMxQyxjQUFNLFFBQVEsSUFBSSxRQUFRO0FBQzFCLFlBQUksa0JBQWtCO0FBRXRCLFlBQUksSUFBSTtBQUNSLHFCQUFhLFFBQVMsT0FBTyxRQUFRLFVBQVU7QUFDN0MsNEJBQWtCLGtCQUFrQixHQUFHLGFBQWEsVUFBVSxPQUFPLEtBQUssUUFBUSxPQUFPLEtBQUs7QUFBQTtBQUM5RiwwQkFBZ0IsS0FBSztBQUNyQjtBQUFBO0FBR0YsY0FBTSxlQUFlO0FBQ3JCLGNBQU0sU0FBUyxNQUFNLFFBQVEsUUFBUSxLQUFLLEVBQUMsUUFBTyxDQUFDO0FBRW5ELGlCQUFTLEtBQUksR0FBRyxLQUFJLGFBQWEsTUFBTSxNQUFJO0FBQzFDLGdCQUFNLE9BQU8sTUFBTSxhQUFhO0FBQUE7QUFHakMsY0FBTSxlQUFlLGtCQUNuQixRQUNBLENBQUMsYUFBYSxZQUFZLFFBQVEsT0FBTyxRQUFRLE9BQU8sSUFDeEQsQ0FBQyxZQUFZLFFBQVEsT0FBTyxPQUFPLFFBQVEsT0FBTyxNQUFNLFFBQVEsWUFBWSxRQUM1RSxPQUFPLGFBQWEsWUFBWTtBQUM5QixnQkFBTSxRQUFRLGFBQWEsUUFBUSxZQUFZLE1BQU0sUUFBUTtBQUU3RCxnQkFBTSxPQUFPLGdCQUFnQjtBQUM3QixrQkFBUSxJQUFJO0FBQ1osa0JBQVE7QUFDUjtBQUFBLFdBRUYsWUFBWTtBQUNWLGlCQUFPO0FBQUEsV0FFVCxFQUFDLE1BQU0sS0FBTyxPQUFPO0FBQUEsaUJBR2QsZ0JBQWdCLGNBQWMsU0FBUyxHQUFHO0FBRW5ELGdCQUFRLGNBQWM7QUFBQTtBQUFBO0FBQUE7QUFPNUIsU0FBTztBQUFBOyIsCiAgIm5hbWVzIjogW10KfQo=
