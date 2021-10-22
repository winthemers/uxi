import * as app from "../app.js"

export interface Users {
  // type of table
}

export default new app.Table<Users>({
  name: "users",
  description: "Winthemers registered users",
  setup: (table) => {
    table.string('id').unique().notNullable().primary()
  },
})