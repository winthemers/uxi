import * as app from "../app.js"

export interface Artists {
  // type of table
}

export default new app.Table<Artists>({
  name: "artists",
  description: "The artists table",
  setup: (table) => {
    table.string('user_id').unique().notNullable().primary()
    table.string('profile_link').unique().notNullable()
  },
})