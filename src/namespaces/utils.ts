import Discord, { Application, Client, MessageReaction } from 'discord.js'
import {createWriteStream} from 'fs'
import * as stream from 'stream'
import { promisify } from 'util'
import axios from 'axios'
import { GuildMessage } from '../app/command';
import { CollectorUtils } from 'discord.js-collector-utils';
import nodeCanvas from 'canvas'

export async function resolveEmoji(guild: Discord.Guild | null, name: string) {
  if (!guild) { return "" }

  return guild.emojis.cache.find(emoji => emoji.name === name);
}

export function attachIsImage(msgAttach: Discord.MessageAttachment) {
  return msgAttach.url.includes(".png") || msgAttach.url.includes(".jpg") || msgAttach.url.includes(".webp") || msgAttach.url.includes(".webm") || msgAttach.url.includes(".mp4") // MP4 And Webm are also gifs, and we are not agains videos.... But the function name is now incorrect.
}


const finished = promisify(stream.finished);

export async function downloadFile(fileUrl: string, outputLocationPath: string): Promise<any> {
  const writer = createWriteStream(outputLocationPath);
  return axios({
    method: 'get',
    url: fileUrl,
    responseType: 'stream',
  }).then(async response => {
    //@ts-expect-error
    response.data.pipe(writer)
    return finished(writer)
  });
}

export function getExtension(fileName: string) {
  return fileName.substring(fileName.lastIndexOf('.') + 1, fileName.length) || fileName;
}

export async function resolveUsername(message: Discord.Message, name: string | Discord.MemberMention) {
  const emoteOptions = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟']
  const memberSelection: any = {}

  const promise = new Promise(async (resolve: (member: Discord.GuildMember) => void, reject) => {

    if (message.mentions.members?.size && message.mentions.members?.size >= 1 ) { // He mentioned :bless:
      console.log("Resolving -> mention")

      //@ts-expect-error -- DiscordJS types are not helping...
      resolve( message.mentions.members.first() )

    }
  
    if (typeof name == "string") { // Is this check really needed? no, but this makes typescript compiled happy :)

      const foundMembers = await message.guild?.members.search({
        query: name,
        limit: emoteOptions.length
      })
      

      if (foundMembers && foundMembers?.size > 1) {
        const embed = new Discord.MessageEmbed()
        let descriptionList = ""
        
        let i = 0
        foundMembers.forEach( async (member, index) => {
          descriptionList = descriptionList + `${emoteOptions[i]} - <@${member.user.id}> (${member.user.tag})\n`
          memberSelection[i] = member // Why? because it's easier, discord changed the guild.member and .user twice between v10 and v13, in case they change again i prefer to change this line and the loop above it than everything else....
          i++
        })

        embed.setDescription(descriptionList)
        const prompt = await message.channel.send({embeds:[embed]})

        for (let i = 0; i < foundMembers.size; i++){
         await prompt.react(emoteOptions[i])
        }

        await CollectorUtils.collectByReaction(
          prompt,
          (msgReaction, reactor) => reactor.id === message.author.id,
          (nextMsg) => nextMsg.author.id === message.author.id && nextMsg.content === 'stop',
          async (msgReaction, reactor) => {
            const index = emoteOptions.indexOf(msgReaction.emoji.name ?? "")

            const user = memberSelection[index] as Discord.GuildMember
            console.log("Resolved -> reaction")
            resolve(user)
            return
          },
          async () => {
            reject('timeout')
          },
          {time: 10000, reset: true}
        )

      } else if (foundMembers && foundMembers?.size === 1) {
        //@ts-expect-error yes
        resolve(foundMembers?.first())
      }
    }
    
    
  })

  return promise
}

export function applyCanvasText(canvas: nodeCanvas.Canvas, text: string, font: {family: string, path: string, weight?: string, size: number}) {
	const ctx = canvas.getContext('2d');
  nodeCanvas.registerFont(font.path, { family: font.family, weight: font.weight })

	let fontSize = font.size;

	do {
		ctx.font = `${fontSize}px ${font.family}`;
	} while (ctx.measureText(text).width > canvas.width - 300);

	return ctx.font;
};