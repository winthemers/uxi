import * as app from "../app.js"

export default new app.Command({
  name: "makevote",
  description: "The makevote command",
  channelType: "all",
  async run(message) {
    // todo: code here
    return message.send("makevote command is not yet implemented.")
  }
})