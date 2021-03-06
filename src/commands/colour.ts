import * as app from '../app.js'
import Vibrant from 'node-vibrant'
import { attachIsImage, resolveEmoji, downloadFile, getExtension, applyCanvasText } from '../namespaces/utils.js'
import nodeCanvas from 'canvas'
import fs from 'fs'

export default new app.Command({
  name: 'colour',
  aliases: ['color', 'pallete', 'vibrant', 'colors'],
  description: 'Generates a color palette suggestion based on the image original colors [Format is accent + 4 suggestions]',
  channelType: 'guild',
  coolDown: 1000 * 30, // 30 seconds between each color pallet request
  async run(message) {
    const okEmoji = await resolveEmoji(message.guild, "check")
    const loadEmoji = await resolveEmoji(message.guild, "loading")
    const errEmoji = await resolveEmoji(message.guild, "linus")
    const madEmoji = await resolveEmoji(message.guild, "angry")
    const blushEmoji = await resolveEmoji(message.guild, "uxiblush")
    
    const attachment = message.attachments.first()
    const hasImage = attachment && attachIsImage(attachment)

    if (!hasImage || attachment?.url.includes('.mp4') || attachment?.url.includes('.webp')  ) {
      const embed = new app.MessageEmbed()
      .setColor('RED')
      .setTitle(`${madEmoji} Where am i supposed to take colors from?`)
      .setDescription('You need to upload an image with this command.\n- Uxi can\'t speak webp yet :(\n- Gif\'s are not allowed\n- Avoid files with ambiguous extensions (ex: image.mp4.png')
      message.send({embeds:[embed]})
      return
    }

    /* Let's tell the use we are making some progress */
    const updateEmbed = new app.MessageEmbed()
    .setColor('YELLOW')
    .setTitle(`${loadEmoji} Processing image`)
    .setDescription('Adding image to Uxi\'s cache')
    .setFooter(`Requested by ${message.author.tag}`, message.author.displayAvatarURL())

    const updateMessage = await message.send({embeds:[updateEmbed]})

    /* Saving image to cache */
    await downloadFile(attachment.url, `./cache/${message.id}.${getExtension(attachment.url)}`)

    updateEmbed.setDescription('Retrieving image from cache')
    .setDescription('I\'M WORKING HARD!')
    updateMessage.edit({embeds:[updateEmbed]})

    /* Reading image from cache */
    fs.readFile(`./cache/${message.id}.${getExtension(attachment.url)}`, async (err, data) => {

      if (err) {
        const embed = new app.MessageEmbed()
        .setColor('RED')
        .setTitle(`${errEmoji}`)
        .setDescription(String(err))
        await updateMessage.delete()
        message.send({embeds:[embed]})
        return
      }

      updateEmbed.setDescription('Processing image colors')
      .setDescription('My dream is to become a real artist') // I just became insane to this point, uxi literally speaks in my head...
      updateMessage.edit({embeds:[updateEmbed]})

      const vibrant = new Vibrant(data)

      vibrant.getPalette(async (err, palette) => {
        const canvas = nodeCanvas.createCanvas(1080, 360)
        const ctx = canvas.getContext('2d')

        nodeCanvas.loadImage('./extras/colour/baseframe.png')
        .then( baseImage => {
          
          // Start the embed with image shit
          const resultEmbed = new app.MessageEmbed()
          .setTitle(`${okEmoji} I worked very hard!`)
          .setDescription('Calling ?colors for the same image will always have the same result!')
          .setFooter(`Requested by ${message.author.tag}`, message.author.displayAvatarURL())

          // Drawing base image
          ctx.drawImage(baseImage, 0, 0, 1080, 360)

          // Originally, this code looped all colors and made everything by itself, but now we have a limited number of colors and a nice base image to go with it.
          // For this reason, keep this code with your layout changes manually.

          // Drawing the accent color : 1
          if (palette?.Vibrant) { 
            ctx.fillStyle = palette.Vibrant.getHex()
            ctx.fillRect(0, 155, 154.12, 86.13)
            applyCanvasText(canvas, palette.Vibrant.getHex().toUpperCase(), {
              family: 'Product Sans',
              path: './extras/fonts/productsansbold.ttf',
              size: 14
            })
            ctx.fillText(palette.Vibrant.getHex().toUpperCase(), 5, 279)
            let rgbArray = palette.Vibrant.getRgb().map(function(col){
              return Number(col.toFixed(0));
            });
            ctx.fillText(rgbArray.join(', '), 5, 337)
            resultEmbed.addField("Accent", `HEX: ${palette.Vibrant.getHex()}\nGRB: ${rgbArray.join(', ')}`, true)
            resultEmbed.setColor( palette.Vibrant.getRgb() )
          } 

          // Drawing Muted color : 2
          if (palette?.Muted) { 
            ctx.fillStyle = palette.Muted.getHex()
            ctx.fillRect(184.72, 155, 154.26, 86.13)
            applyCanvasText(canvas, palette.Muted.getHex().toUpperCase(), {
              family: 'Product Sans',
              path: './extras/fonts/productsansbold.ttf',
              size: 14
            })
            ctx.fillText(palette.Muted.getHex().toUpperCase(), 190, 279)
            let rgbArray = palette.Muted.getRgb().map(function(col){
              return Number(col.toFixed(0));
            });
            ctx.fillText(rgbArray.join(', '), 190, 337)
            resultEmbed.addField("Muted accent", `HEX: ${palette.Muted.getHex()}\nGRB: ${rgbArray.join(', ')}`, true)
          } 

          // Drawing Dark Accent : 3
          if (palette?.DarkVibrant) { 
            ctx.fillStyle = palette.DarkVibrant.getHex()
            ctx.fillRect(370.58, 155, 154.12, 86.13)
            applyCanvasText(canvas, palette.DarkVibrant.getHex().toUpperCase(), {
              family: 'Product Sans',
              path: './extras/fonts/productsansbold.ttf',
              size: 14
            })
            ctx.fillText(palette.DarkVibrant.getHex().toUpperCase(), 375, 279)
            let rgbArray = palette.DarkVibrant.getRgb().map(function(col){
              return Number(col.toFixed(0));
            });
            ctx.fillText(rgbArray.join(', '), 375, 337)
            resultEmbed.addField("Dark accent", `HEX: ${palette.DarkVibrant.getHex()}\nGRB: ${rgbArray.join(', ')}`, true)
          } 

          // Drawing Dark Muted : 4
          if (palette?.DarkMuted) { 
            ctx.fillStyle = palette.DarkMuted.getHex()
            ctx.fillRect(555.12, 155, 154.12, 86.13)
            applyCanvasText(canvas, palette.DarkMuted.getHex().toUpperCase(), {
              family: 'Product Sans',
              path: './extras/fonts/productsansbold.ttf',
              size: 14
            })
            ctx.fillText(palette.DarkMuted.getHex().toUpperCase(), 563, 279)
            let rgbArray = palette.DarkMuted.getRgb().map(function(col){
              return Number(col.toFixed(0));
            });
            ctx.fillText(rgbArray.join(', '), 563, 337)
            resultEmbed.addField("Dark muted accent", `HEX: ${palette.DarkMuted.getHex()}\nGRB: ${rgbArray.join(', ')}`, true)
          }
          
          // Drawing Accent Light : 5
          if (palette?.LightVibrant) { 
            ctx.fillStyle = palette.LightVibrant.getHex()
            ctx.fillRect(740, 155, 154, 86.13)
            applyCanvasText(canvas, palette.LightVibrant.getHex().toUpperCase(), {
              family: 'Product Sans',
              path: './extras/fonts/productsansbold.ttf',
              size: 14
            })
            ctx.fillText(palette.LightVibrant.getHex().toUpperCase(), 745, 279)
            let rgbArray = palette.LightVibrant.getRgb().map(function(col){
              return Number(col.toFixed(0));
            });
            ctx.fillText(rgbArray.join(', '), 745, 337)
            resultEmbed.addField("Light accent", `HEX: ${palette.LightVibrant.getHex()}\nGRB: ${rgbArray.join(', ')}`, true)
          } 

          // Drawing Muted Light : 6
          if (palette?.LightMuted) { 
            ctx.fillStyle = palette.LightMuted.getHex()
            ctx.fillRect(925.88, 155, 153.12, 86.13)
            applyCanvasText(canvas, palette.LightMuted.getHex().toUpperCase(), {
              family: 'Product Sans',
              path: './extras/fonts/productsansbold.ttf',
              size: 14
            })
            ctx.fillText(palette.LightMuted.getHex().toUpperCase(), 929, 279)
            let rgbArray = palette.LightMuted.getRgb().map(function(col){
              return Number(col.toFixed(0));
            });
            ctx.fillText(rgbArray.join(', '), 929, 337)
            resultEmbed.addField("Muted light accent", `HEX: ${palette.LightMuted.getHex()}\nGRB: ${rgbArray.join(', ')}`, true)
          } 

          canvas.toBuffer( (err, result)=>{
            const attach = new app.MessageAttachment(result, 'palette.png')
            canvas.toBuffer( (err, result)=>{
              resultEmbed.setImage('attachment://palette.png')
              .setThumbnail(attachment.url)
              
              message.send({embeds:[resultEmbed],  files: [{ attachment: result }]})

              message.delete()
            })
          })

        })

        // YO, WE NOW DELETE SHIT!
        updateEmbed.setTitle(`${okEmoji} Palette generated.`)
        .setDescription('I worked really hard on it!') // Yeah....... i really did.... maybe uxi is just me not being harsh? who knows
        updateMessage.edit({embeds:[updateEmbed]})

        setTimeout( () =>{
          updateMessage.delete()
          fs.unlink(`./cache/${message.id}.${getExtension(attachment.url)}`, (err) =>{
            if (err) {
              const embed = new app.MessageEmbed()
              .setColor('RED')
              .setTitle(`${blushEmoji} uxi did upsie`)
              .setDescription('Call any staff to help me out.')
              message.send({embeds:[embed]})
            }
          })
        }, 4000)


      })
      
    })

  }
})