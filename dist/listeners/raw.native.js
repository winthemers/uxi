import * as app from "../app.js";
const listener = {
  event: "raw",
  description: "Inject uncached reactions in client",
  async run({ d, t: type }) {
    if (type === "MESSAGE_REACTION_ADD" || type === "MESSAGE_REACTION_REMOVE") {
      const data = d;
      const channel = await this.channels.fetch(data.channel_id);
      if (!channel || !channel.isText())
        return;
      if (channel.messages.cache.has(data.message_id))
        return;
      const message = await channel.messages.fetch(data.message_id);
      const emoji = data.emoji.id ? `${data.emoji.name}:${data.emoji.id}` : data.emoji.name;
      const reaction = message.reactions.resolve(emoji);
      const user = await this.users.fetch(data.user_id);
      if (!reaction || !user)
        return app.error(`${reaction ? "" : "MessageReaction"}${!reaction && !user ? " and " : ""}${user ? "" : "User"} object is undefined.`, "raw.native");
      reaction.users.cache.set(user.id, user);
      this.emit({
        MESSAGE_REACTION_ADD: "messageReactionAdd",
        MESSAGE_REACTION_REMOVE: "messageReactionRemove"
      }[type], reaction, user);
    }
  }
};
var raw_native_default = listener;
export {
  raw_native_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2xpc3RlbmVycy9yYXcubmF0aXZlLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgKiBhcyBhcHAgZnJvbSBcIi4uL2FwcC5qc1wiXHJcbmltcG9ydCBhcGlUeXBlcyBmcm9tIFwiZGlzY29yZC1hcGktdHlwZXMvdjkuanNcIlxyXG5cclxuY29uc3QgbGlzdGVuZXI6IGFwcC5MaXN0ZW5lcjxcInJhd1wiPiA9IHtcclxuICBldmVudDogXCJyYXdcIixcclxuICBkZXNjcmlwdGlvbjogXCJJbmplY3QgdW5jYWNoZWQgcmVhY3Rpb25zIGluIGNsaWVudFwiLFxyXG4gIGFzeW5jIHJ1bih7IGQsIHQ6IHR5cGUgfSkge1xyXG4gICAgaWYgKHR5cGUgPT09IFwiTUVTU0FHRV9SRUFDVElPTl9BRERcIiB8fCB0eXBlID09PSBcIk1FU1NBR0VfUkVBQ1RJT05fUkVNT1ZFXCIpIHtcclxuICAgICAgY29uc3QgZGF0YSA9IGQgYXNcclxuICAgICAgICB8IGFwaVR5cGVzLkdhdGV3YXlNZXNzYWdlUmVhY3Rpb25BZGREaXNwYXRjaERhdGFcclxuICAgICAgICB8IGFwaVR5cGVzLkdhdGV3YXlNZXNzYWdlUmVhY3Rpb25SZW1vdmVEaXNwYXRjaERhdGFcclxuXHJcbiAgICAgIGNvbnN0IGNoYW5uZWwgPSBhd2FpdCB0aGlzLmNoYW5uZWxzLmZldGNoKGRhdGEuY2hhbm5lbF9pZClcclxuXHJcbiAgICAgIGlmICghY2hhbm5lbCB8fCAhY2hhbm5lbC5pc1RleHQoKSkgcmV0dXJuXHJcblxyXG4gICAgICBpZiAoY2hhbm5lbC5tZXNzYWdlcy5jYWNoZS5oYXMoZGF0YS5tZXNzYWdlX2lkKSkgcmV0dXJuXHJcblxyXG4gICAgICBjb25zdCBtZXNzYWdlID0gYXdhaXQgY2hhbm5lbC5tZXNzYWdlcy5mZXRjaChkYXRhLm1lc3NhZ2VfaWQpXHJcblxyXG4gICAgICBjb25zdCBlbW9qaSA9IGRhdGEuZW1vamkuaWRcclxuICAgICAgICA/IGAke2RhdGEuZW1vamkubmFtZX06JHtkYXRhLmVtb2ppLmlkfWBcclxuICAgICAgICA6IChkYXRhLmVtb2ppLm5hbWUgYXMgc3RyaW5nKVxyXG5cclxuICAgICAgY29uc3QgcmVhY3Rpb24gPSBtZXNzYWdlLnJlYWN0aW9ucy5yZXNvbHZlKGVtb2ppKVxyXG5cclxuICAgICAgY29uc3QgdXNlciA9IGF3YWl0IHRoaXMudXNlcnMuZmV0Y2goZGF0YS51c2VyX2lkKVxyXG5cclxuICAgICAgaWYgKCFyZWFjdGlvbiB8fCAhdXNlcilcclxuICAgICAgICByZXR1cm4gYXBwLmVycm9yKFxyXG4gICAgICAgICAgYCR7cmVhY3Rpb24gPyBcIlwiIDogXCJNZXNzYWdlUmVhY3Rpb25cIn0ke1xyXG4gICAgICAgICAgICAhcmVhY3Rpb24gJiYgIXVzZXIgPyBcIiBhbmQgXCIgOiBcIlwiXHJcbiAgICAgICAgICB9JHt1c2VyID8gXCJcIiA6IFwiVXNlclwifSBvYmplY3QgaXMgdW5kZWZpbmVkLmAsXHJcbiAgICAgICAgICBcInJhdy5uYXRpdmVcIlxyXG4gICAgICAgIClcclxuXHJcbiAgICAgIHJlYWN0aW9uLnVzZXJzLmNhY2hlLnNldCh1c2VyLmlkLCB1c2VyKVxyXG5cclxuICAgICAgdGhpcy5lbWl0KFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIE1FU1NBR0VfUkVBQ1RJT05fQUREOiBcIm1lc3NhZ2VSZWFjdGlvbkFkZFwiLFxyXG4gICAgICAgICAgTUVTU0FHRV9SRUFDVElPTl9SRU1PVkU6IFwibWVzc2FnZVJlYWN0aW9uUmVtb3ZlXCIsXHJcbiAgICAgICAgfVt0eXBlXSxcclxuICAgICAgICByZWFjdGlvbixcclxuICAgICAgICB1c2VyXHJcbiAgICAgIClcclxuICAgIH1cclxuICB9LFxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBsaXN0ZW5lclxyXG4iXSwKICAibWFwcGluZ3MiOiAiQUFBQTtBQUdBLE1BQU0sV0FBZ0M7QUFBQSxFQUNwQyxPQUFPO0FBQUEsRUFDUCxhQUFhO0FBQUEsUUFDUCxJQUFJLEVBQUUsR0FBRyxHQUFHLFFBQVE7QUFDeEIsUUFBSSxTQUFTLDBCQUEwQixTQUFTLDJCQUEyQjtBQUN6RSxZQUFNLE9BQU87QUFJYixZQUFNLFVBQVUsTUFBTSxLQUFLLFNBQVMsTUFBTSxLQUFLO0FBRS9DLFVBQUksQ0FBQyxXQUFXLENBQUMsUUFBUTtBQUFVO0FBRW5DLFVBQUksUUFBUSxTQUFTLE1BQU0sSUFBSSxLQUFLO0FBQWE7QUFFakQsWUFBTSxVQUFVLE1BQU0sUUFBUSxTQUFTLE1BQU0sS0FBSztBQUVsRCxZQUFNLFFBQVEsS0FBSyxNQUFNLEtBQ3JCLEdBQUcsS0FBSyxNQUFNLFFBQVEsS0FBSyxNQUFNLE9BQ2hDLEtBQUssTUFBTTtBQUVoQixZQUFNLFdBQVcsUUFBUSxVQUFVLFFBQVE7QUFFM0MsWUFBTSxPQUFPLE1BQU0sS0FBSyxNQUFNLE1BQU0sS0FBSztBQUV6QyxVQUFJLENBQUMsWUFBWSxDQUFDO0FBQ2hCLGVBQU8sSUFBSSxNQUNULEdBQUcsV0FBVyxLQUFLLG9CQUNqQixDQUFDLFlBQVksQ0FBQyxPQUFPLFVBQVUsS0FDOUIsT0FBTyxLQUFLLCtCQUNmO0FBR0osZUFBUyxNQUFNLE1BQU0sSUFBSSxLQUFLLElBQUk7QUFFbEMsV0FBSyxLQUNIO0FBQUEsUUFDRSxzQkFBc0I7QUFBQSxRQUN0Qix5QkFBeUI7QUFBQSxRQUN6QixPQUNGLFVBQ0E7QUFBQTtBQUFBO0FBQUE7QUFNUixJQUFPLHFCQUFROyIsCiAgIm5hbWVzIjogW10KfQo=
