import * as app from "../app.js"
import contexts, {Cache as ContextCache} from '../tables/contexts.js'
import { attachIsImage } from '../namespaces/utils.js'

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
      if (attachment && attachIsImage(attachment)) {
        embed.setImage(attachment.url)
      }
      embed.setColor('AQUA')
      embed.setDescription(messageManager.content)
      embed.setAuthor(messageManager.author.tag, avatar ?? "")
      embed.setFooter(`Mentioned by ${message.author.tag}`, message.author.avatarURL() ?? "" ) // I hate DiscordJS as much as i love it, IF IT MAY BE NULL, WHY NOT CASTING IT?

      message.channel.send({embeds:[embed]})
    }

  }
}

export default listener