import * as app from "../app.js"
import {resolveEmoji} from '../namespaces/utils.js'
import { MessageButton } from "discord.js"

export default new app.Command({
  name: "move",
  description: "Moves conversation to another channel.",
  channelType: "guild",
  positional: [
    {
      name: "channel",
      required: true,
      description: "Channel to continue the conversation",
      castValue: "channel"
    }
  ],
  userPermissions: ["MANAGE_MESSAGES"],
  async run(message) {
    const newChannel = message.args.channel as app.TextChannel
    const angryEmote = await resolveEmoji(message.guild, 'reee')
    const errEmoji = await resolveEmoji(message.guild, "linus")

    if (message.channel.id == newChannel.id) {
      const embed = new app.MessageEmbed()
      embed.setColor('RED')
      embed.setTitle(`${errEmoji} Where do you think we are?...`)
      message.send({embeds:[embed]})
      return
    }

    // Sends the target channel message
    const targetEmbed = new app.MessageEmbed()
    .setDescription(`This is the continuation of a conversation that was being held at ${message.channel}\n\nPlease, use this cannel instead.`)
    .setFooter(`Requested by ${message.author.tag}`, message.author.displayAvatarURL())

    const targetRow = new app.MessageActionRow()
    .addComponents(
      new MessageButton()
        .setLabel('Conversation')
        .setURL(message.url)
        .setStyle('LINK')
    )

    const target = await newChannel.send({embeds:[targetEmbed], components:[targetRow]})

    // Sends the origin channel notification about the new conversation place
    const originEmbed = new app.MessageEmbed()
    .setDescription(`${angryEmote} **MOVE THIS CONVERSATION**\n\nThis conversation was moved to ${newChannel}.`)
    .setFooter(`Requested by ${message.author.tag}`, message.author.displayAvatarURL())

    const originRow = new app.MessageActionRow()
    .addComponents(
      new MessageButton()
        .setLabel('Conversation')
        .setURL(target.url)
        .setStyle('LINK')
    )

    const origin = await message.send({embeds:[originEmbed], components:[originRow]})

    await message.delete()
  }
})