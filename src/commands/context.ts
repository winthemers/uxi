import * as app from "../app.js"
import contexts, {Cache} from '../tables/contexts.js'

export default new app.Command({
  name: "context",
  description: "Manages context detection to automatically reply kewords",
  channelType: "guild",
  userPermissions: ['ADMINISTRATOR'],
  positional: [
    {
      name: "operation",
      description: "The desired operation <`add`|`remove`|`list`>",
      required: true
    },
    {
      name: "message",
      description: "The context we should search for between user messages"
    },
    {
      name: "response",
      description: "The content to be inserted when context is detected",
    }
  ],
  async run(message) {
    switch (message.args.operation) {
      case "add" : {
        const log = new app.MessageEmbed()
          .setTitle("Adding new context keyword to database")
          .addField("Keyword / Phrase", message.args.message)
          .addField("Response", message.args.response)
          .setColor("YELLOW")

        const logMessage = await message.send({embeds: [log]})

        await contexts.query.insert({
          keyword: message.args.message,
          response: message.args.response
        }).then( () => {
          Cache.push({
            keyword: message.args.message,
            response: message.args.response
          })

          log
            .setTitle("Added new context keyword to database")
            .setColor("GREEN")
          
          logMessage.edit({embeds: [log]})
          .catch(err => {app.error(err)})
        })


        break;
      }

      case "remove" : {
        const log = new app.MessageEmbed()
        .setTitle(`Searching for \`${message.args.message}\` context on database`)
        .setColor("YELLOW")

        
        const logMessage =  await message.send({ embeds: [log] })

        await contexts.query
          .select('*')
          .where('keyword', 'like', message.args.message.toLowerCase())
          .then( async rows => {
            if (rows.length === 0 ) {
              log.setTitle(`I couldn't find \`${message.args.message}\` context on database`)
              log.setColor("RED")

              logMessage.edit({embeds: [log]})
              return
            } 

            for (const i in rows) {
              const row = rows[i]

              log.addField("Keyword", row.keyword, true)
              log.addField("Response", row.response, true)

              await contexts.query
                .delete()
                .where('keyword', '=', row.keyword)
                .then( () => {
                  Cache.map( (context, index) => {
                    if (row.keyword !== context.keyword) { return }
                    delete Cache[index]
                  })

                  log.setTitle(`Removed \`${row.keyword}\` context from database`)
                  log.setColor("GREEN")

                  logMessage.edit({embeds: [log]})
                })
                .catch( () => {
                  log.setTitle(`Error while removing \`${message.args.message}\` context from database\nPlease check the developer console.`)
                  log.setColor("RED")

                  logMessage.edit({embeds: [log]})
                })
            }
          })
          .catch( err => {
            log.setTitle(`Error while searching for \`${message.args.message}\` context on database\nPlease check the developer console.`)
            log.setColor("RED")

            logMessage.edit({embeds: [log]})
          })


        break;
      }

      case "list" : {
        const log = new app.MessageEmbed()
        log.setTitle("Indexing all context keywords from database...")
        log.setColor("YELLOW")
        const logMessage = await message.send({embeds: [log]})

        contexts.query
        .select('*')
        .then( async rows => {
          if (rows.length === 0){
            log.setTitle("There's no keywords on database.")
            log.setColor("GREEN")

            logMessage.edit({embeds:[log]})
            return
          }

          log.setTitle("Here's a list of all registered context keywords")
          log.setColor("GREEN")

          for( const i in rows) {
            const row = rows[i]
            log.addField("Keyword", row.keyword)
            log.addField("Response", row.response)

            logMessage.edit({embeds:[log]})
          }
        })

        break;
      }
    }

  }
})