import * as app from "../app.js"

export default new app.Command({
  name: "colour",
  description: "The colour command",
  channelType: "all",
  async run(message) {
    // todo: code here
    return message.send("colour command is not yet implemented.")
  }
})