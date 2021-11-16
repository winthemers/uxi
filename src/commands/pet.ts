import * as app from "../app.js"
import {resolveEmoji} from '../namespaces/utils.js'

export default new app.Command({
  name: "pet",
  description: "The pet command",
  channelType: "all",
  async run(message) {
    const emoji =  resolveEmoji(message.guild, "blush")
    message.send(`${emoji} T-T-Thank you\n~~Uxi received pet~~`)
  }
})