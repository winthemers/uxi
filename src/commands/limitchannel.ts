import * as app from "../app.js"

export default new app.Command({
  name: "limitchannel",
  description: "The limitchannel command",
  channelType: "guild",
  async run(message) {
    // todo: code here
    return message.send("limitchannel command is not yet implemented.")
  }
})