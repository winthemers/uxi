import * as app from "../app.js"

export default new app.Command({
  name: "artist",
  description: "Manages server artists",
  channelType: "guild",
  async run(message) {
    // todo: code here
    return message.send("WIP")
  }
})