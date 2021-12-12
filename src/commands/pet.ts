import * as app from "../app.js"
import {resolveEmoji, resolveUsername} from '../namespaces/utils.js'
import petpet from 'pet-pet-gif'

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
  positional: [
    {
      name: "target",
      description: "Who will uxi pet?",
      required: false
    },
  ],
  async run(message) {
    const emoji =  await resolveEmoji(message.guild, "uxiblush")

    if (message.args.target){
      const member = await resolveUsername(message, message.args.target)
      let animatedGif = await petpet(member.user.avatarURL)

      const attach = new app.MessageAttachment(animatedGif, 'petpet.gif')

      const resultEmbed = new app.MessageEmbed()
      .setImage('attachment://petpet.gif')
      .setTitle("Nodge is about to kill himself because of this stupid library")
      .setColor("GREEN")

      message.send({embeds:[resultEmbed],  files: [{ attachment: attach }]})

      message.send("I TRIED SO HARD...")

    } else {
      message.send(`${emoji}`)
      message.send(`${petPhrases[Math.floor(Math.random() * petPhrases.length)]}`)
    }
  }
})
