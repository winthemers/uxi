import * as app from "../app.js"

export interface Contexts {
  keyword: string
  response: string
}

export type ContextsCache = Contexts[]

export const Cache: ContextsCache = []

export default new app.Table<Contexts>({
  name: "contexts",
  description: "The contexts table",
  setup: (table) => {
    table.string('keyword').unique()
    table.string('response').notNullable()
  },
})