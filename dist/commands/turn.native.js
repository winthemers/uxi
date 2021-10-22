import * as app from "../app.js";
var turn_native_default = new app.Command({
  name: "turn",
  description: "Turn on/off command handling",
  aliases: ["power"],
  channelType: "all",
  botOwnerOnly: true,
  positional: [
    {
      name: "activated",
      description: "Is command handling activated",
      default: () => String(!app.cache.ensure("turn", true)),
      castValue: "boolean"
    }
  ],
  async run(message) {
    app.cache.set("turn", message.args.activated);
    return message.channel.send(`Command handling ${message.args.activated ? "activated" : "disabled"} `);
  }
});
export {
  turn_native_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2NvbW1hbmRzL3R1cm4ubmF0aXZlLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgKiBhcyBhcHAgZnJvbSBcIi4uL2FwcC5qc1wiXHJcblxyXG5leHBvcnQgZGVmYXVsdCBuZXcgYXBwLkNvbW1hbmQoe1xyXG4gIG5hbWU6IFwidHVyblwiLFxyXG4gIGRlc2NyaXB0aW9uOiBcIlR1cm4gb24vb2ZmIGNvbW1hbmQgaGFuZGxpbmdcIixcclxuICBhbGlhc2VzOiBbXCJwb3dlclwiXSxcclxuICBjaGFubmVsVHlwZTogXCJhbGxcIixcclxuICBib3RPd25lck9ubHk6IHRydWUsXHJcbiAgcG9zaXRpb25hbDogW1xyXG4gICAge1xyXG4gICAgICBuYW1lOiBcImFjdGl2YXRlZFwiLFxyXG4gICAgICBkZXNjcmlwdGlvbjogXCJJcyBjb21tYW5kIGhhbmRsaW5nIGFjdGl2YXRlZFwiLFxyXG4gICAgICBkZWZhdWx0OiAoKSA9PiBTdHJpbmcoIWFwcC5jYWNoZS5lbnN1cmU8Ym9vbGVhbj4oXCJ0dXJuXCIsIHRydWUpKSxcclxuICAgICAgY2FzdFZhbHVlOiBcImJvb2xlYW5cIixcclxuICAgIH0sXHJcbiAgXSxcclxuICBhc3luYyBydW4obWVzc2FnZSkge1xyXG4gICAgYXBwLmNhY2hlLnNldChcInR1cm5cIiwgbWVzc2FnZS5hcmdzLmFjdGl2YXRlZClcclxuICAgIHJldHVybiBtZXNzYWdlLmNoYW5uZWwuc2VuZChcclxuICAgICAgYENvbW1hbmQgaGFuZGxpbmcgJHttZXNzYWdlLmFyZ3MuYWN0aXZhdGVkID8gXCJhY3RpdmF0ZWRcIiA6IFwiZGlzYWJsZWRcIn0gYFxyXG4gICAgKVxyXG4gIH0sXHJcbn0pXHJcbiJdLAogICJtYXBwaW5ncyI6ICJBQUFBO0FBRUEsSUFBTyxzQkFBUSxJQUFJLElBQUksUUFBUTtBQUFBLEVBQzdCLE1BQU07QUFBQSxFQUNOLGFBQWE7QUFBQSxFQUNiLFNBQVMsQ0FBQztBQUFBLEVBQ1YsYUFBYTtBQUFBLEVBQ2IsY0FBYztBQUFBLEVBQ2QsWUFBWTtBQUFBLElBQ1Y7QUFBQSxNQUNFLE1BQU07QUFBQSxNQUNOLGFBQWE7QUFBQSxNQUNiLFNBQVMsTUFBTSxPQUFPLENBQUMsSUFBSSxNQUFNLE9BQWdCLFFBQVE7QUFBQSxNQUN6RCxXQUFXO0FBQUE7QUFBQTtBQUFBLFFBR1QsSUFBSSxTQUFTO0FBQ2pCLFFBQUksTUFBTSxJQUFJLFFBQVEsUUFBUSxLQUFLO0FBQ25DLFdBQU8sUUFBUSxRQUFRLEtBQ3JCLG9CQUFvQixRQUFRLEtBQUssWUFBWSxjQUFjO0FBQUE7QUFBQTsiLAogICJuYW1lcyI6IFtdCn0K
