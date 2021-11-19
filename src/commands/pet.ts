import * as app from "../app.js"
import {resolveEmoji} from '../namespaces/utils.js'

const petPhrases = [
  "**Uxi got some scratches**",
  "T T Thank you...",
  "Uxi is now happy",
  "**If Uxi had a tail, it would be wagging**",
  "uwu"
]
export default new app.Command({
  name: "pet",
  description: "Pet's me uwu",
  channelType: "all",
  async run(message) {
    const emoji =  await resolveEmoji(message.guild, "uxiblush")
    message.send(`${emoji} ${petPhrases[Math.random() * petPhrases.length]}`)
  }
})