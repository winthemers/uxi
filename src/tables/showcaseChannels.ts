import * as app from "../app.js"

export interface ShowcaseChannels {
  // type of table
}

export default new app.Table<ShowcaseChannels>({
  name: "showcaseChannels",
  description: "The showcaseChannels table",
  setup: (table) => {
    // setup table columns => http://knexjs.org/#Schema-Building
  },
})