import { Client } from "discord.js"
import * as app from "../app.js"
import { attachIsImage, resolveUsername, resolveEmoji } from '../namespaces/utils.js'
import Fetches from '../tables/fetches.js'

interface FetchData {
  message: app.GuildMessage
  osVersion?: string
  osArchitecture?: string
  osBuildVersion?: string
  theme?: string
  monitor?: string
  gpu?: string
  cpu?: string
  ram?: string
  disks?: string[]
  computer?: string
  image?: string
  member?: app.GuildMember
}

async function sendFetchEmbed({osVersion, osArchitecture, osBuildVersion, theme, monitor, gpu, cpu, ram, disks, computer, image, message, member}: FetchData) {
  const embed = new app.MessageEmbed()

  embed.setTitle(`Fetch ${member ? member.user.tag : message.author.tag} - ${computer}`)
  embed.setColor('GREEN')
  embed.addField("OS", `${osVersion} ${osArchitecture}`, true)
  embed.addField("Build", osBuildVersion ?? 'Not identified', true)
  embed.addField("Visual Style", theme ?? 'Not identified')
  embed.addField("GPU", gpu ?? 'Not identified', true)
  embed.addField("Resolution", monitor ? monitor.split(', ').join('\n') : 'Not identified', true)
  embed.addField("Disks", disks ? disks.join('\n') : 'Not identified')
  embed.addField("Memory", ram ?? 'Not identified', true)
  embed.addField("CPU", cpu ?? 'Not identified', true)

  if (image) {
    embed.setImage(image)
  }

  if (osVersion?.includes("Windows 10")) {
    embed.setThumbnail('https://media.discordapp.net/attachments/763858681909477437/898683533659344926/Windows_logo_-_2012_dark_blue.svg.png')
  }

  if (osVersion?.includes("Windows 11")) {
    embed.setThumbnail('https://media.discordapp.net/attachments/763858681909477437/898683748952989716/windows-11-logo.png')
  }

  embed.setFooter(`Requested by ${message.author.tag}`, message.author.displayAvatarURL())

  message.send({embeds:[embed]})
}

export default new app.Command({
  name: "fetch",
  description: "Manages fetch information from user",
  channelType: "guild",
  options: [
    {
      name: "update",
      description: "Data to replace fetch information"
    },
    {
      name: "set",
      description: "Manually set a new value on your fetch information.",
    }
  ],
  positional: [
    {
      name: "target",
      description: "Fetch target `<username or @username>` to get someone else's fetch" 
      // it's actually the set value as well, but the user doesn't need to know technical shit :)
    }
  ],
  async run(message) {
    const okEmoji = await resolveEmoji(message.guild, "check")
    const errEmoji = await resolveEmoji(message.guild, "linus")
    const sadEmoji = await resolveEmoji(message.guild, "sadcat")

    if (message.args.set) {
      const allowedFields = ["os", "arch", "build", "theme", "monitor", "gpu", "cpu", "disks", "ram", "computer", "image"]
      const attachment = message.attachments.first()
      
      const db = Fetches.query
      
      if (message.args.set == "" || message.args.set == "image") { // We are allowing it to be empty only for images.
        db.insert({
          user_id: message.author.id,
          image: (attachment && attachIsImage(attachment)) ? attachment.url : ""
        })
        .onConflict('user_id')
        .merge()
        .then( () =>{
            const embed = new app.MessageEmbed()
            embed.setColor('GREEN')
            embed.setTitle(`${okEmoji} Updated fetch field ${message.args.set} to ${message.args.target}`)
            message.send({embeds:[embed]})
        })
        .catch( () => {
          const embed = new app.MessageEmbed()
          embed.setColor('RED')
          embed.setTitle(`${errEmoji} Oops, something went wrong.`)
          message.send({embeds:[embed]})
        })


        return
      }

      if (allowedFields.includes(message.args.set)) {
        db.insert({
          user_id: message.author.id,
          [message.args.set]: message.args.target
        })
        .onConflict('user_id')
        .merge()
        .then( () =>{
          const embed = new app.MessageEmbed()
          embed.setColor('GREEN')
          embed.setTitle(`${okEmoji} Updated fetch field ${message.args.set} to ${message.args.target}`)
          message.send({embeds:[embed]})
        })
        .catch( () => {
          const embed = new app.MessageEmbed()
          embed.setColor('RED')
          embed.setTitle(`${errEmoji} Oops, something went wrong.`)
          message.send({embeds:[embed]})
        })

        return
      } else  {
        const embed = new app.MessageEmbed()
        embed.setColor('RED')
        embed.setTitle(`${errEmoji} Invalid field selected (${message.args.set}).`)
        embed.setDescription(`Valid fields: ${allowedFields.join(', ')}`)
        message.send({embeds:[embed]})

        return
      }

      return
    }

    if (message.args.update) {
      const attachment = message.attachments.first()
      let decodedFetch = Buffer.from(message.args.update, 'base64').toString().replace("  ", "")
      decodedFetch = decodedFetch.substring(0, decodedFetch.length - 1)
      console.log(decodedFetch)
      const encodedJSON = JSON.parse(decodedFetch)
      console.log(encodedJSON)

      const db = Fetches.query
      db.insert({
        user_id: message.author.id,
        os: encodedJSON.OS.Version,
        arch: encodedJSON.OS.Architecture,
        build: encodedJSON.OS.BuildVersion,
        theme: encodedJSON.Theme,
        monitor: encodedJSON.Monitors,
        gpu: encodedJSON.GPU.Name,
        cpu: encodedJSON.CPU,
        disks: encodedJSON.Disks.join('\n'),
        ram: encodedJSON.RAM,
        computer: encodedJSON.Name,
        image: (attachment && attachIsImage(attachment)) ? attachment.url : ""
      })
      .onConflict('user_id')
      .merge()
      .then( () =>{
      })
      .catch( err => {
      })
  

      sendFetchEmbed({
        osVersion: encodedJSON.OS.Version, 
        osArchitecture: encodedJSON.OS.Architecture, 
        osBuildVersion: encodedJSON.OS.BuildVersion, 
        theme: encodedJSON.Theme, 
        monitor: encodedJSON.Monitors, 
        gpu: encodedJSON.CPU, 
        cpu: encodedJSON.CPU, 
        ram: encodedJSON.RAM, 
        disks: encodedJSON.Disks, 
        computer: encodedJSON.Name, 
        image: (attachment && attachIsImage(attachment)) ? attachment.url : undefined, 
        message
      })

      return 
    }

    if (message.args.target) {
      const catAngry = await resolveEmoji(message.guild, 'woes')

      const member = await resolveUsername(message, message.args.target)
      .then( member => {
        Fetches.query
        .select("*")
        .where('user_id', '=',member.id)
        .then( async rows => {
          if (rows.length == 0) {
            const embed = new app.MessageEmbed().setTitle(`${sadEmoji} I don't have fetch information about this user yet :(`)
            .setColor('YELLOW')
            .addField("How to fetch", "[Download](https://cdn.discordapp.com/attachments/763858761571500042/898706430322946089/Winthemers_UxiFetch.exe) our fetcher and paste the fetch result here.")
            .addField("How to add a picture", "Just upload the desired image when sending the fetcher message.")
            message.send({embeds: [embed]})
  
          } else {
            
            for (const i in rows) {
              const row = rows[i]
              if (!row) { return }

              const target = await message.guild.members.fetch(row.user_id)

              sendFetchEmbed({
                osVersion: row.os ?? 'Unknown', 
                osArchitecture: row.arch ?? 'Unknown', 
                osBuildVersion: row.build ?? 'Unknown', 
                theme: row.theme ?? 'Unknown', 
                monitor: row.monitor ?? 'Unknown', 
                gpu: row.gpu ?? 'Unknown', 
                cpu: row.cpu ?? 'Unknown', 
                ram: row.ram ?? 'Unknown', 
                disks: row?.disks?.split("\n") ?? 'Unknown', 
                computer: row.computer ?? 'Unknown', 
                image: row.image, 
                message,
                member: target
              })
            }
          }
        })
      })
      .catch( () =>{ 
        message.channel.send(`${catAngry} Got tired of waiting, you can call me again when decided.`);
      })


      // message.reply(JSON.stringify(user))
    } else if(!message.args.target) {
      Fetches.query
      .select("*")
      .where('user_id', '=', message.author.id)
      .then( rows => {
        if (rows.length == 0) {
          const embed = new app.MessageEmbed().setTitle(`${sadEmoji} I don't have your fetch information yet :(`)
          .setColor('YELLOW')
          .addField("How to fetch", "[download](https://cdn.discordapp.com/attachments/763858761571500042/898706430322946089/Winthemers_UxiFetch.exe) Our fetcher and paste the fetch result here.")
          .addField("How to add a picture", "Just upload the desired image when sending the fetcher message.")
          message.send({embeds: [embed]})

        } else {
          
          for (const i in rows) {
            const row = rows[i]
            if (!row) { return }
            
            sendFetchEmbed({
              osVersion: row.os, 
              osArchitecture: row.arch, 
              osBuildVersion: row.build, 
              theme: row.theme, 
              monitor: row.monitor, 
              gpu: row.gpu, 
              cpu: row.cpu, 
              ram: row.ram, 
              disks: row.disks.split("\n"), 
              computer: row.computer, 
              image: row.image, 
              message
            })
          
          }

        }

      })

    }

  }
})
