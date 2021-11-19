import * as app from "../app.js"
import {resolveEmoji} from '../namespaces/utils.js'

export default new app.Command({
  name: "clear",
  description: "The clear command",
  channelType: "guild",
  positional: [
    {
      name: "amount",
      required: true,
      description: "Amount of messages to be deleted (max 99)",
      castValue: "number"
    }
  ],
  userPermissions: ['MANAGE_MESSAGES'],
  async run(message) {
    if (Number(message.args.amount) + 1 > 100 || message.args.amount < 1) {
      const embed = new app.MessageEmbed()
      embed.setTitle(`${await resolveEmoji(message.guild, "no")} Please select a number *between* 1 and 99`)
      embed.setColor("RED")

      message.send({embeds:[embed]})
      return 
    }

    await message.channel.bulkDelete(Number(message.args.amount) + 1)
      .catch(async err => {
        message.send(`${await resolveEmoji(message.guild, "no")} I cannot delete messages older than 14 days`) 
      })

    const embed = new app.MessageEmbed()
    .setTitle(`${await resolveEmoji(message.guild, "check")} Cleared \`${message.args.amount + 1}\` messages.`)
    .setColor("GREEN")

    const log = await message.send({embeds:[embed]})

    setInterval( ()=> {
      if (log && !log.deleted) {
        log.delete()
        .catch(()=>{})
      }
    }, 1000 * 10)
  }
})