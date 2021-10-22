import * as app from "../app.js";
import contexts, { Cache } from "../tables/contexts.js";
var context_default = new app.Command({
  name: "context",
  description: "Manages context detection to automatically reply kewords",
  channelType: "guild",
  userPermissions: ["ADMINISTRATOR"],
  positional: [
    {
      name: "operation",
      description: "The desired operation <`add`|`remove`|`list`>",
      required: true
    },
    {
      name: "message",
      description: "The context we should search for between user messages"
    },
    {
      name: "response",
      description: "The content to be inserted when context is detected"
    }
  ],
  async run(message) {
    switch (message.args.operation) {
      case "add": {
        const log = new app.MessageEmbed().setTitle("Adding new context keyword to database").addField("Keyword / Phrase", message.args.message).addField("Response", message.args.response).setColor("YELLOW");
        const logMessage = await message.send({ embeds: [log] });
        await contexts.query.insert({
          keyword: message.args.message,
          response: message.args.response
        }).then(() => {
          Cache.push({
            keyword: message.args.message,
            response: message.args.response
          });
          log.setTitle("Added new context keyword to database").setColor("GREEN");
          logMessage.edit({ embeds: [log] }).catch((err) => {
            app.error(err);
          });
        });
        break;
      }
      case "remove": {
        const log = new app.MessageEmbed().setTitle(`Searching for \`${message.args.message}\` context on database`).setColor("YELLOW");
        const logMessage = await message.send({ embeds: [log] });
        await contexts.query.select("*").where("keyword", "like", message.args.message.toLowerCase()).then(async (rows) => {
          if (rows.length === 0) {
            log.setTitle(`I couldn't find \`${message.args.message}\` context on database`);
            log.setColor("RED");
            logMessage.edit({ embeds: [log] });
            return;
          }
          for (const i in rows) {
            const row = rows[i];
            log.addField("Keyword", row.keyword, true);
            log.addField("Response", row.response, true);
            await contexts.query.delete().where("keyword", "=", row.keyword).then(() => {
              Cache.map((context, index) => {
                if (row.keyword !== context.keyword) {
                  return;
                }
                delete Cache[index];
              });
              log.setTitle(`Removed \`${row.keyword}\` context from database`);
              log.setColor("GREEN");
              logMessage.edit({ embeds: [log] });
            }).catch(() => {
              log.setTitle(`Error while removing \`${message.args.message}\` context from database
Please check the developer console.`);
              log.setColor("RED");
              logMessage.edit({ embeds: [log] });
            });
          }
        }).catch((err) => {
          log.setTitle(`Error while searching for \`${message.args.message}\` context on database
Please check the developer console.`);
          log.setColor("RED");
          logMessage.edit({ embeds: [log] });
        });
        break;
      }
      case "list": {
        const log = new app.MessageEmbed();
        log.setTitle("Indexing all context keywords from database...");
        log.setColor("YELLOW");
        const logMessage = await message.send({ embeds: [log] });
        contexts.query.select("*").then(async (rows) => {
          if (rows.length === 0) {
            log.setTitle("There's no keywords on database.");
            log.setColor("GREEN");
            logMessage.edit({ embeds: [log] });
            return;
          }
          log.setTitle("Here's a list of all registered context keywords");
          log.setColor("GREEN");
          for (const i in rows) {
            const row = rows[i];
            log.addField("Keyword", row.keyword);
            log.addField("Response", row.response);
            logMessage.edit({ embeds: [log] });
          }
        });
        break;
      }
    }
  }
});
export {
  context_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2NvbW1hbmRzL2NvbnRleHQudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCAqIGFzIGFwcCBmcm9tIFwiLi4vYXBwLmpzXCJcclxuaW1wb3J0IGNvbnRleHRzLCB7Q2FjaGV9IGZyb20gJy4uL3RhYmxlcy9jb250ZXh0cy5qcydcclxuXHJcbmV4cG9ydCBkZWZhdWx0IG5ldyBhcHAuQ29tbWFuZCh7XHJcbiAgbmFtZTogXCJjb250ZXh0XCIsXHJcbiAgZGVzY3JpcHRpb246IFwiTWFuYWdlcyBjb250ZXh0IGRldGVjdGlvbiB0byBhdXRvbWF0aWNhbGx5IHJlcGx5IGtld29yZHNcIixcclxuICBjaGFubmVsVHlwZTogXCJndWlsZFwiLFxyXG4gIHVzZXJQZXJtaXNzaW9uczogWydBRE1JTklTVFJBVE9SJ10sXHJcbiAgcG9zaXRpb25hbDogW1xyXG4gICAge1xyXG4gICAgICBuYW1lOiBcIm9wZXJhdGlvblwiLFxyXG4gICAgICBkZXNjcmlwdGlvbjogXCJUaGUgZGVzaXJlZCBvcGVyYXRpb24gPGBhZGRgfGByZW1vdmVgfGBsaXN0YD5cIixcclxuICAgICAgcmVxdWlyZWQ6IHRydWVcclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgIG5hbWU6IFwibWVzc2FnZVwiLFxyXG4gICAgICBkZXNjcmlwdGlvbjogXCJUaGUgY29udGV4dCB3ZSBzaG91bGQgc2VhcmNoIGZvciBiZXR3ZWVuIHVzZXIgbWVzc2FnZXNcIlxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgbmFtZTogXCJyZXNwb25zZVwiLFxyXG4gICAgICBkZXNjcmlwdGlvbjogXCJUaGUgY29udGVudCB0byBiZSBpbnNlcnRlZCB3aGVuIGNvbnRleHQgaXMgZGV0ZWN0ZWRcIixcclxuICAgIH1cclxuICBdLFxyXG4gIGFzeW5jIHJ1bihtZXNzYWdlKSB7XHJcbiAgICBzd2l0Y2ggKG1lc3NhZ2UuYXJncy5vcGVyYXRpb24pIHtcclxuICAgICAgY2FzZSBcImFkZFwiIDoge1xyXG4gICAgICAgIGNvbnN0IGxvZyA9IG5ldyBhcHAuTWVzc2FnZUVtYmVkKClcclxuICAgICAgICAgIC5zZXRUaXRsZShcIkFkZGluZyBuZXcgY29udGV4dCBrZXl3b3JkIHRvIGRhdGFiYXNlXCIpXHJcbiAgICAgICAgICAuYWRkRmllbGQoXCJLZXl3b3JkIC8gUGhyYXNlXCIsIG1lc3NhZ2UuYXJncy5tZXNzYWdlKVxyXG4gICAgICAgICAgLmFkZEZpZWxkKFwiUmVzcG9uc2VcIiwgbWVzc2FnZS5hcmdzLnJlc3BvbnNlKVxyXG4gICAgICAgICAgLnNldENvbG9yKFwiWUVMTE9XXCIpXHJcblxyXG4gICAgICAgIGNvbnN0IGxvZ01lc3NhZ2UgPSBhd2FpdCBtZXNzYWdlLnNlbmQoe2VtYmVkczogW2xvZ119KVxyXG5cclxuICAgICAgICBhd2FpdCBjb250ZXh0cy5xdWVyeS5pbnNlcnQoe1xyXG4gICAgICAgICAga2V5d29yZDogbWVzc2FnZS5hcmdzLm1lc3NhZ2UsXHJcbiAgICAgICAgICByZXNwb25zZTogbWVzc2FnZS5hcmdzLnJlc3BvbnNlXHJcbiAgICAgICAgfSkudGhlbiggKCkgPT4ge1xyXG4gICAgICAgICAgQ2FjaGUucHVzaCh7XHJcbiAgICAgICAgICAgIGtleXdvcmQ6IG1lc3NhZ2UuYXJncy5tZXNzYWdlLFxyXG4gICAgICAgICAgICByZXNwb25zZTogbWVzc2FnZS5hcmdzLnJlc3BvbnNlXHJcbiAgICAgICAgICB9KVxyXG5cclxuICAgICAgICAgIGxvZ1xyXG4gICAgICAgICAgICAuc2V0VGl0bGUoXCJBZGRlZCBuZXcgY29udGV4dCBrZXl3b3JkIHRvIGRhdGFiYXNlXCIpXHJcbiAgICAgICAgICAgIC5zZXRDb2xvcihcIkdSRUVOXCIpXHJcbiAgICAgICAgICBcclxuICAgICAgICAgIGxvZ01lc3NhZ2UuZWRpdCh7ZW1iZWRzOiBbbG9nXX0pXHJcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHthcHAuZXJyb3IoZXJyKX0pXHJcbiAgICAgICAgfSlcclxuXHJcblxyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjYXNlIFwicmVtb3ZlXCIgOiB7XHJcbiAgICAgICAgY29uc3QgbG9nID0gbmV3IGFwcC5NZXNzYWdlRW1iZWQoKVxyXG4gICAgICAgIC5zZXRUaXRsZShgU2VhcmNoaW5nIGZvciBcXGAke21lc3NhZ2UuYXJncy5tZXNzYWdlfVxcYCBjb250ZXh0IG9uIGRhdGFiYXNlYClcclxuICAgICAgICAuc2V0Q29sb3IoXCJZRUxMT1dcIilcclxuXHJcbiAgICAgICAgXHJcbiAgICAgICAgY29uc3QgbG9nTWVzc2FnZSA9ICBhd2FpdCBtZXNzYWdlLnNlbmQoeyBlbWJlZHM6IFtsb2ddIH0pXHJcblxyXG4gICAgICAgIGF3YWl0IGNvbnRleHRzLnF1ZXJ5XHJcbiAgICAgICAgICAuc2VsZWN0KCcqJylcclxuICAgICAgICAgIC53aGVyZSgna2V5d29yZCcsICdsaWtlJywgbWVzc2FnZS5hcmdzLm1lc3NhZ2UudG9Mb3dlckNhc2UoKSlcclxuICAgICAgICAgIC50aGVuKCBhc3luYyByb3dzID0+IHtcclxuICAgICAgICAgICAgaWYgKHJvd3MubGVuZ3RoID09PSAwICkge1xyXG4gICAgICAgICAgICAgIGxvZy5zZXRUaXRsZShgSSBjb3VsZG4ndCBmaW5kIFxcYCR7bWVzc2FnZS5hcmdzLm1lc3NhZ2V9XFxgIGNvbnRleHQgb24gZGF0YWJhc2VgKVxyXG4gICAgICAgICAgICAgIGxvZy5zZXRDb2xvcihcIlJFRFwiKVxyXG5cclxuICAgICAgICAgICAgICBsb2dNZXNzYWdlLmVkaXQoe2VtYmVkczogW2xvZ119KVxyXG4gICAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgICAgICB9IFxyXG5cclxuICAgICAgICAgICAgZm9yIChjb25zdCBpIGluIHJvd3MpIHtcclxuICAgICAgICAgICAgICBjb25zdCByb3cgPSByb3dzW2ldXHJcblxyXG4gICAgICAgICAgICAgIGxvZy5hZGRGaWVsZChcIktleXdvcmRcIiwgcm93LmtleXdvcmQsIHRydWUpXHJcbiAgICAgICAgICAgICAgbG9nLmFkZEZpZWxkKFwiUmVzcG9uc2VcIiwgcm93LnJlc3BvbnNlLCB0cnVlKVxyXG5cclxuICAgICAgICAgICAgICBhd2FpdCBjb250ZXh0cy5xdWVyeVxyXG4gICAgICAgICAgICAgICAgLmRlbGV0ZSgpXHJcbiAgICAgICAgICAgICAgICAud2hlcmUoJ2tleXdvcmQnLCAnPScsIHJvdy5rZXl3b3JkKVxyXG4gICAgICAgICAgICAgICAgLnRoZW4oICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgQ2FjaGUubWFwKCAoY29udGV4dCwgaW5kZXgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAocm93LmtleXdvcmQgIT09IGNvbnRleHQua2V5d29yZCkgeyByZXR1cm4gfVxyXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBDYWNoZVtpbmRleF1cclxuICAgICAgICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgICAgICAgIGxvZy5zZXRUaXRsZShgUmVtb3ZlZCBcXGAke3Jvdy5rZXl3b3JkfVxcYCBjb250ZXh0IGZyb20gZGF0YWJhc2VgKVxyXG4gICAgICAgICAgICAgICAgICBsb2cuc2V0Q29sb3IoXCJHUkVFTlwiKVxyXG5cclxuICAgICAgICAgICAgICAgICAgbG9nTWVzc2FnZS5lZGl0KHtlbWJlZHM6IFtsb2ddfSlcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAuY2F0Y2goICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgbG9nLnNldFRpdGxlKGBFcnJvciB3aGlsZSByZW1vdmluZyBcXGAke21lc3NhZ2UuYXJncy5tZXNzYWdlfVxcYCBjb250ZXh0IGZyb20gZGF0YWJhc2VcXG5QbGVhc2UgY2hlY2sgdGhlIGRldmVsb3BlciBjb25zb2xlLmApXHJcbiAgICAgICAgICAgICAgICAgIGxvZy5zZXRDb2xvcihcIlJFRFwiKVxyXG5cclxuICAgICAgICAgICAgICAgICAgbG9nTWVzc2FnZS5lZGl0KHtlbWJlZHM6IFtsb2ddfSlcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pXHJcbiAgICAgICAgICAuY2F0Y2goIGVyciA9PiB7XHJcbiAgICAgICAgICAgIGxvZy5zZXRUaXRsZShgRXJyb3Igd2hpbGUgc2VhcmNoaW5nIGZvciBcXGAke21lc3NhZ2UuYXJncy5tZXNzYWdlfVxcYCBjb250ZXh0IG9uIGRhdGFiYXNlXFxuUGxlYXNlIGNoZWNrIHRoZSBkZXZlbG9wZXIgY29uc29sZS5gKVxyXG4gICAgICAgICAgICBsb2cuc2V0Q29sb3IoXCJSRURcIilcclxuXHJcbiAgICAgICAgICAgIGxvZ01lc3NhZ2UuZWRpdCh7ZW1iZWRzOiBbbG9nXX0pXHJcbiAgICAgICAgICB9KVxyXG5cclxuXHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNhc2UgXCJsaXN0XCIgOiB7XHJcbiAgICAgICAgY29uc3QgbG9nID0gbmV3IGFwcC5NZXNzYWdlRW1iZWQoKVxyXG4gICAgICAgIGxvZy5zZXRUaXRsZShcIkluZGV4aW5nIGFsbCBjb250ZXh0IGtleXdvcmRzIGZyb20gZGF0YWJhc2UuLi5cIilcclxuICAgICAgICBsb2cuc2V0Q29sb3IoXCJZRUxMT1dcIilcclxuICAgICAgICBjb25zdCBsb2dNZXNzYWdlID0gYXdhaXQgbWVzc2FnZS5zZW5kKHtlbWJlZHM6IFtsb2ddfSlcclxuXHJcbiAgICAgICAgY29udGV4dHMucXVlcnlcclxuICAgICAgICAuc2VsZWN0KCcqJylcclxuICAgICAgICAudGhlbiggYXN5bmMgcm93cyA9PiB7XHJcbiAgICAgICAgICBpZiAocm93cy5sZW5ndGggPT09IDApe1xyXG4gICAgICAgICAgICBsb2cuc2V0VGl0bGUoXCJUaGVyZSdzIG5vIGtleXdvcmRzIG9uIGRhdGFiYXNlLlwiKVxyXG4gICAgICAgICAgICBsb2cuc2V0Q29sb3IoXCJHUkVFTlwiKVxyXG5cclxuICAgICAgICAgICAgbG9nTWVzc2FnZS5lZGl0KHtlbWJlZHM6W2xvZ119KVxyXG4gICAgICAgICAgICByZXR1cm5cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBsb2cuc2V0VGl0bGUoXCJIZXJlJ3MgYSBsaXN0IG9mIGFsbCByZWdpc3RlcmVkIGNvbnRleHQga2V5d29yZHNcIilcclxuICAgICAgICAgIGxvZy5zZXRDb2xvcihcIkdSRUVOXCIpXHJcblxyXG4gICAgICAgICAgZm9yKCBjb25zdCBpIGluIHJvd3MpIHtcclxuICAgICAgICAgICAgY29uc3Qgcm93ID0gcm93c1tpXVxyXG4gICAgICAgICAgICBsb2cuYWRkRmllbGQoXCJLZXl3b3JkXCIsIHJvdy5rZXl3b3JkKVxyXG4gICAgICAgICAgICBsb2cuYWRkRmllbGQoXCJSZXNwb25zZVwiLCByb3cucmVzcG9uc2UpXHJcblxyXG4gICAgICAgICAgICBsb2dNZXNzYWdlLmVkaXQoe2VtYmVkczpbbG9nXX0pXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgfVxyXG59KSJdLAogICJtYXBwaW5ncyI6ICJBQUFBO0FBQ0E7QUFFQSxJQUFPLGtCQUFRLElBQUksSUFBSSxRQUFRO0FBQUEsRUFDN0IsTUFBTTtBQUFBLEVBQ04sYUFBYTtBQUFBLEVBQ2IsYUFBYTtBQUFBLEVBQ2IsaUJBQWlCLENBQUM7QUFBQSxFQUNsQixZQUFZO0FBQUEsSUFDVjtBQUFBLE1BQ0UsTUFBTTtBQUFBLE1BQ04sYUFBYTtBQUFBLE1BQ2IsVUFBVTtBQUFBO0FBQUEsSUFFWjtBQUFBLE1BQ0UsTUFBTTtBQUFBLE1BQ04sYUFBYTtBQUFBO0FBQUEsSUFFZjtBQUFBLE1BQ0UsTUFBTTtBQUFBLE1BQ04sYUFBYTtBQUFBO0FBQUE7QUFBQSxRQUdYLElBQUksU0FBUztBQUNqQixZQUFRLFFBQVEsS0FBSztBQUFBLFdBQ2QsT0FBUTtBQUNYLGNBQU0sTUFBTSxJQUFJLElBQUks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
