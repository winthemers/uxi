import * as app from "../app.js"

export interface RestrictChannels {
  // type of table
}

export default new app.Table<RestrictChannels>({
  name: "restrictChannels",
  description: "The restrictChannels table",
  setup: (table) => {
    // setup table columns => http://knexjs.org/#Schema-Building
  },
})