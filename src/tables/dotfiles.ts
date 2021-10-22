import * as app from "../app.js"

export interface Dotfiles {
  // type of table
}

export default new app.Table<Dotfiles>({
  name: "dotfiles",
  description: "The dotfiles table",
  setup: (table) => {
    table.string('showcase_id').notNullable().unique().primary()
    table.string('user_id').notNullable()
    table.string('artist_id').nullable()
    table.string('deviantart').nullable()
    table.string('message_id').notNullable()
    table.string('theme').nullable()
    table.string('theme_url').nullable()
    table.string('icon').nullable()
    table.string('icon_url').nullable()
    table.string('wallpaper_url').nullable()
    table.string('extras').nullable()

    table.increments('showcase_id')
  },
})