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
    
    message.send('TIME TO DEBUG HARD WAY!')

    if (message.args.target){
      const member = await resolveUsername(message, message.args.target)

      message.send("MEMBER AVATAR: " + member.avatarURL)

      let animatedGif = await petpet(member.avatarURL)
      
      message.send('FUCKING animatedGif: ' + JSON.stringify(animatedGif))

      new app.MessageEmbed()
      embed.setColor('GREEN')
      embed.setTitle(`${emoji} Here, some scratches.`)
      embed.setImage('attachment://pet.gif')
      message.send({
        embeds:[embed], 
      })
      // message.send({
      //     "embed": {
      //       "image": {
      //         "url": 'attachment://pet.gif',
      //       }
      //     }
      //   },
      //   {
      //       file: animatedGif,
      //       name: 'pet.gif'
      //   })
    } else {
      message.send(`${emoji}`)
      message.send(`${petPhrases[Math.floor(Math.random() * petPhrases.length)]}`)
    }
  }
})
