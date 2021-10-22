import figlet from "figlet"
import path from "path"
import boxen from "boxen"
import chalk from "chalk"
import contexts, {Cache as ContextCache} from "../tables/contexts.js"

import * as app from "../app.js"

const listener: app.Listener<"ready"> = {
  event: "ready",
  description: "Prepares bot cache and information after log-in",
  once: true,
  async run() {
    app.log(
      `Ok i'm ready! ${chalk.blue(
        "My default prefix is"
      )} ${chalk.bgBlueBright.black(process.env.BOT_PREFIX)}`
    )
    figlet(app.fetchPackageJson().name, (err, value) => {
      if (err) return
      console.log(
        boxen(chalk.blueBright(value), {
          float: "center",
          borderStyle: {
            topLeft: " ",
            topRight: " ",
            bottomLeft: " ",
            bottomRight: " ",
            horizontal: " ",
            vertical: " ",
          },
        })
      )
    })

    // Seeds context cache
    contexts.query
      .select('*')
      .then( async rows => {
        for( const i in rows) {
          const row = rows[i]
          ContextCache.push({keyword: row.keyword, response: row.response})
        }
      })
    
    
  },
}

export default listener
