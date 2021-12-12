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

      console.log(animatedGif)

      channel.send('Pet pet', {
        embed: {
          thumbnail: {
               url: 'attachment://pet.gif'
            }
         },
         files: [{
            attachment: animatedGif,
            name: 'pet.gif'
         }]
      })

    } else {
      message.send(`${emoji}`)
      message.send(`${petPhrases[Math.floor(Math.random() * petPhrases.length)]}`)
    }
  }
})
