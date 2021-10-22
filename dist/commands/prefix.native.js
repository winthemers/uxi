import * as app from "../app.js";
import guilds from "../tables/guilds.native.js";
var prefix_native_default = new app.Command({
  name: "prefix",
  guildOwnerOnly: true,
  channelType: "guild",
  description: "Edit or show the bot prefix",
  positional: [
    {
      name: "prefix",
      checkValue: (value) => value.length < 10 && /^\S/.test(value),
      description: "The new prefix"
    }
  ],
  async run(message) {
    const prefix = message.args.prefix;
    if (!prefix)
      return message.channel.send(`My current prefix for "**${message.guild}**" is \`${await app.prefix(message.guild)}\``);
    await guilds.query.insert({
      id: message.guild.id,
      prefix
    }).onConflict("id").merge();
    await message.channel.send(`My new prefix for "**${message.guild}**" is \`${prefix}\``);
  }
});
export {
  prefix_native_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2NvbW1hbmRzL3ByZWZpeC5uYXRpdmUudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCAqIGFzIGFwcCBmcm9tIFwiLi4vYXBwLmpzXCJcclxuXHJcbmltcG9ydCBndWlsZHMgZnJvbSBcIi4uL3RhYmxlcy9ndWlsZHMubmF0aXZlLmpzXCJcclxuXHJcbmV4cG9ydCBkZWZhdWx0IG5ldyBhcHAuQ29tbWFuZCh7XHJcbiAgbmFtZTogXCJwcmVmaXhcIixcclxuICBndWlsZE93bmVyT25seTogdHJ1ZSxcclxuICBjaGFubmVsVHlwZTogXCJndWlsZFwiLFxyXG4gIGRlc2NyaXB0aW9uOiBcIkVkaXQgb3Igc2hvdyB0aGUgYm90IHByZWZpeFwiLFxyXG4gIHBvc2l0aW9uYWw6IFtcclxuICAgIHtcclxuICAgICAgbmFtZTogXCJwcmVmaXhcIixcclxuICAgICAgY2hlY2tWYWx1ZTogKHZhbHVlKSA9PiB2YWx1ZS5sZW5ndGggPCAxMCAmJiAvXlxcUy8udGVzdCh2YWx1ZSksXHJcbiAgICAgIGRlc2NyaXB0aW9uOiBcIlRoZSBuZXcgcHJlZml4XCIsXHJcbiAgICB9LFxyXG4gIF0sXHJcbiAgYXN5bmMgcnVuKG1lc3NhZ2UpIHtcclxuICAgIGNvbnN0IHByZWZpeCA9IG1lc3NhZ2UuYXJncy5wcmVmaXhcclxuXHJcbiAgICBpZiAoIXByZWZpeClcclxuICAgICAgcmV0dXJuIG1lc3NhZ2UuY2hhbm5lbC5zZW5kKFxyXG4gICAgICAgIGBNeSBjdXJyZW50IHByZWZpeCBmb3IgXCIqKiR7bWVzc2FnZS5ndWlsZH0qKlwiIGlzIFxcYCR7YXdhaXQgYXBwLnByZWZpeChcclxuICAgICAgICAgIG1lc3NhZ2UuZ3VpbGRcclxuICAgICAgICApfVxcYGBcclxuICAgICAgKVxyXG5cclxuICAgIGF3YWl0IGd1aWxkcy5xdWVyeVxyXG4gICAgICAuaW5zZXJ0KHtcclxuICAgICAgICBpZDogbWVzc2FnZS5ndWlsZC5pZCxcclxuICAgICAgICBwcmVmaXg6IHByZWZpeCxcclxuICAgICAgfSlcclxuICAgICAgLm9uQ29uZmxpY3QoXCJpZFwiKVxyXG4gICAgICAubWVyZ2UoKVxyXG5cclxuICAgIGF3YWl0IG1lc3NhZ2UuY2hhbm5lbC5zZW5kKFxyXG4gICAgICBgTXkgbmV3IHByZWZpeCBmb3IgXCIqKiR7bWVzc2FnZS5ndWlsZH0qKlwiIGlzIFxcYCR7cHJlZml4fVxcYGBcclxuICAgIClcclxuICB9LFxyXG59KVxyXG4iXSwKICAibWFwcGluZ3MiOiAiQUFBQTtBQUVBO0FBRUEsSUFBTyx3QkFBUSxJQUFJLElBQUksUUFBUTtBQUFBLEVBQzdCLE1BQU07QUFBQSxFQUNOLGdCQUFnQjtBQUFBLEVBQ2hCLGFBQWE7QUFBQSxFQUNiLGFBQWE7QUFBQSxFQUNiLFlBQVk7QUFBQSxJQUNWO0FBQUEsTUFDRSxNQUFNO0FBQUEsTUFDTixZQUFZLENBQUMsVUFBVSxNQUFNLFNBQVMsTUFBTSxNQUFNLEtBQUs7QUFBQSxNQUN2RCxhQUFhO0FBQUE7QUFBQTtBQUFBLFFBR1gsSUFBSSxTQUFTO0FBQ2pCLFVBQU0sU0FBUyxRQUFRLEtBQUs7QUFFNUIsUUFBSSxDQUFDO0FBQ0gsYUFBTyxRQUFRLFFBQVEsS0FDckIsNEJBQTRCLFFBQVEsaUJBQWlCLE1BQU0sSUFBSSxPQUM3RCxRQUFRO0FBSWQsVUFBTSxPQUFPLE1BQ1YsT0FBTztBQUFBLE1BQ04sSUFBSSxRQUFRLE1BQU07QUFBQSxNQUNsQjtBQUFBLE9BRUQsV0FBVyxNQUNYO0FBRUgsVUFBTSxRQUFRLFFBQVEsS0FDcEIsd0JBQXdCLFFBQVEsaUJBQWlCO0FBQUE7QUFBQTsiLAogICJuYW1lcyI6IFtdCn0K
