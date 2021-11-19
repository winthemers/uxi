import * as app from "../app.js"
import {resolveEmoji} from '../namespaces/utils.js'

const petPhrases = [
  "**Uxi got some scratches**",
  "T T Thank you...",
  "Uxi is happy now",
  "**If Uxi had a tail, it would be wagging**",
  "uwu",
  "https://cdn.discordapp.com/attachments/763858663583776778/911138076489838602/Uxi_petpet.gif"
]
export default new app.Command({
  name: "pet",
  description: "Pet's me uwu",
  channelType: "all",
  async run(message) {
    const emoji =  await resolveEmoji(message.guild, "uxiblush")
    message.send(`${emoji} ${petPhrases[Math.floor(Math.random() * petPhrases.length)]}`)
  }
})