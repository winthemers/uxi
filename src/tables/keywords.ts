import * as app from "../app.js"

export interface Keywords {
  // type of table
}

export default new app.Table<Keywords>({
  name: "keywords",
  description: "The keywords table",
  setup: (table) => {
    // setup table columns => http://knexjs.org/#Schema-Building
  },
})