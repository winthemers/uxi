import * as app from "../app.js"
import contexts, {Cache as ContextCache} from '../tables/contexts.js'
import { attachIsImage, attachIsVideo } from '../namespaces/utils.js'

const listener: app.Listener<"messageCreate"> = {
  event: "messageCreate",
  description: "A messageCreate listener",
  async run(message) {
    if (!message.guild) {
      return
    }

    if (message.author.bot) {
      return
    }
    
    if ( message.content.startsWith( await app.prefix(message.guild ?? undefined) ) ) {
      return
    }

    // Check if context keywords matches the content of the message.
    for( const i in ContextCache) {
      const row = ContextCache[i]

      if (message.content.toLowerCase().includes(row.keyword.toLowerCase())) {
        message.channel.send(row.response)
      }

    }

    // Check if the message contains a mention to another message.
    const mentionRegex = new RegExp("https://(?:canary|ptb\\.)?discord(?:app)?\\.com/channels/(\\d+)/(\\d+)/(\\d+)")
    const mentionMatch = message.content.match(mentionRegex)
    // [0] = Original link
    // [1] = Match <discordlink>/¹<result>/² : Guild ID
    // [2] = Match <discordlink>/¹<guild id>/²<result> : Channel ID 
    // [3] = Match <discordlink>/¹<guild id>/²<channel id>/³<result> : Message ID

    const embed = new app.MessageEmbed()

    if (mentionMatch){
      const channelManager = await message.guild.channels.fetch(mentionMatch[2]) as app.TextChannel
      const messageManager = await channelManager.messages.fetch(mentionMatch[3])
      const attachment = messageManager.attachments.first()

      const avatar = messageManager.author.avatarURL()

      if (attachment && attachIsImage(attachment) && !attachIsVideo(attachment)) {
        embed.setImage(attachment.url)
      }

      if (messageManager.embeds) {
        console.log("Message has embeds")
        
        for (let contentEmbed of messageManager.embeds) {
          console.log("Embed", contentEmbed)
          contentEmbed.fields.forEach( field => {
            embed.addField(field.name, field.value, field.inline)
          })
          embed.setDescription(contentEmbed.description ?? '')
          embed.setColor( contentEmbed.color ?? 'AQUA')
          if (contentEmbed.image) { embed.setImage( contentEmbed.image.url )}
          if (contentEmbed.thumbnail) { embed.setThumbnail( contentEmbed.thumbnail.url ) }
        }

      }
      embed.setColor('AQUA')
      // Discord has video property in their embeds, but they don't let anyone else use it
      // So we just send the video link in the message body...
      embed.setDescription(`${embed.description ? embed.description : ''} ${messageManager.content}`)
      embed.setAuthor({
        name: messageManager.author.tag,
        iconURL: messageManager.author.avatarURL() ?? undefined,
        url: message.url
      })
      embed.setFooter({
        text: `Mentioned by ${message.author.tag}`,
        iconURL: message.author.avatarURL() ?? undefined
      })
      if (attachment && attachIsVideo(attachment) ) {
        message.channel.send(attachment.url)
        embed.addField('[VIDEO ABOVE]', `[Download link](${attachment.url})`, true)
      }
      message.channel.send({embeds:[embed]})
    }

  }
}

export default listener