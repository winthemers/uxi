import * as app from "../app.js";
const listener = {
  event: "messageReactionAdd",
  description: "Handle reaction for paginator",
  async run(_reaction, _user) {
    const reaction = await _reaction.fetch();
    const user = await _user.fetch();
    if (!user.bot) {
      const message = reaction.message;
      const guild = message.guild;
      if (guild) {
        const paginator = app.Paginator.getByMessage(message);
        if (paginator) {
          paginator.handleReaction(reaction, user);
        }
      }
    }
  }
};
var messageReactionAdd_native_default = listener;
export {
  messageReactionAdd_native_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2xpc3RlbmVycy9tZXNzYWdlUmVhY3Rpb25BZGQubmF0aXZlLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgKiBhcyBhcHAgZnJvbSBcIi4uL2FwcC5qc1wiXHJcblxyXG5jb25zdCBsaXN0ZW5lcjogYXBwLkxpc3RlbmVyPFwibWVzc2FnZVJlYWN0aW9uQWRkXCI+ID0ge1xyXG4gIGV2ZW50OiBcIm1lc3NhZ2VSZWFjdGlvbkFkZFwiLFxyXG4gIGRlc2NyaXB0aW9uOiBcIkhhbmRsZSByZWFjdGlvbiBmb3IgcGFnaW5hdG9yXCIsXHJcbiAgYXN5bmMgcnVuKF9yZWFjdGlvbiwgX3VzZXIpIHtcclxuICAgIGNvbnN0IHJlYWN0aW9uID0gYXdhaXQgX3JlYWN0aW9uLmZldGNoKClcclxuICAgIGNvbnN0IHVzZXIgPSBhd2FpdCBfdXNlci5mZXRjaCgpXHJcblxyXG4gICAgaWYgKCF1c2VyLmJvdCkge1xyXG4gICAgICBjb25zdCBtZXNzYWdlID0gcmVhY3Rpb24ubWVzc2FnZVxyXG4gICAgICBjb25zdCBndWlsZCA9IG1lc3NhZ2UuZ3VpbGRcclxuICAgICAgaWYgKGd1aWxkKSB7XHJcbiAgICAgICAgY29uc3QgcGFnaW5hdG9yID0gYXBwLlBhZ2luYXRvci5nZXRCeU1lc3NhZ2UobWVzc2FnZSlcclxuICAgICAgICBpZiAocGFnaW5hdG9yKSB7XHJcbiAgICAgICAgICBwYWdpbmF0b3IuaGFuZGxlUmVhY3Rpb24ocmVhY3Rpb24sIHVzZXIpXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSxcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgbGlzdGVuZXJcclxuIl0sCiAgIm1hcHBpbmdzIjogIkFBQUE7QUFFQSxNQUFNLFdBQStDO0FBQUEsRUFDbkQsT0FBTztBQUFBLEVBQ1AsYUFBYTtBQUFBLFFBQ1AsSUFBSSxXQUFXLE9BQU87QUFDMUIsVUFBTSxXQUFXLE1BQU0sVUFBVTtBQUNqQyxVQUFNLE9BQU8sTUFBTSxNQUFNO0FBRXpCLFFBQUksQ0FBQyxLQUFLLEtBQUs7QUFDYixZQUFNLFVBQVUsU0FBUztBQUN6QixZQUFNLFFBQVEsUUFBUTtBQUN0QixVQUFJLE9BQU87QUFDVCxjQUFNLFlBQVksSUFBSSxVQUFVLGFBQWE7QUFDN0MsWUFBSSxXQUFXO0FBQ2Isb0JBQVUsZUFBZSxVQUFVO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQU83QyxJQUFPLG9DQUFROyIsCiAgIm5hbWVzIjogW10KfQo=
