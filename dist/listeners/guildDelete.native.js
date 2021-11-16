import guilds from "../tables/guilds.native.js";
const listener = {
  event: "guildDelete",
  description: "Remove guild from db",
  async run(guild) {
    await guilds.query.delete().where("id", guild.id);
  }
};
var guildDelete_native_default = listener;
export {
  guildDelete_native_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2xpc3RlbmVycy9ndWlsZERlbGV0ZS5uYXRpdmUudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCAqIGFzIGFwcCBmcm9tIFwiLi4vYXBwLmpzXCJcclxuXHJcbmltcG9ydCBndWlsZHMgZnJvbSBcIi4uL3RhYmxlcy9ndWlsZHMubmF0aXZlLmpzXCJcclxuXHJcbmNvbnN0IGxpc3RlbmVyOiBhcHAuTGlzdGVuZXI8XCJndWlsZERlbGV0ZVwiPiA9IHtcclxuICBldmVudDogXCJndWlsZERlbGV0ZVwiLFxyXG4gIGRlc2NyaXB0aW9uOiBcIlJlbW92ZSBndWlsZCBmcm9tIGRiXCIsXHJcbiAgYXN5bmMgcnVuKGd1aWxkKSB7XHJcbiAgICBhd2FpdCBndWlsZHMucXVlcnkuZGVsZXRlKCkud2hlcmUoXCJpZFwiLCBndWlsZC5pZClcclxuICB9LFxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBsaXN0ZW5lclxyXG4iXSwKICAibWFwcGluZ3MiOiAiQUFFQTtBQUVBLE1BQU0sV0FBd0M7QUFBQSxFQUM1QyxPQUFPO0FBQUEsRUFDUCxhQUFhO0FBQUEsUUFDUCxJQUFJLE9BQU87QUFDZixVQUFNLE9BQU8sTUFBTSxTQUFTLE1BQU0sTUFBTSxNQUFNO0FBQUE7QUFBQTtBQUlsRCxJQUFPLDZCQUFROyIsCiAgIm5hbWVzIjogW10KfQo=