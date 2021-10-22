import * as app from "../app.js"

export interface Fetches {
  user_id: string;
  os: string;
  build: string;
  arch: string;
  ram: string;
  cpu: string;
  theme: string;
  gpu: string;
  disks: string;
  monitor: string;
  computer: string;
  image: string
}

export default new app.Table<Fetches>({
  name: "fetches",
  description: "The fetches table",
  setup: (table) => {
    table.string('user_id').unique()
    table.foreign('user_id').references('users.id').deferrable('deferred')
    table.string('os')
    table.string('arch')
    table.string('build')
    table.string('cpu')
    table.string('ram')
    table.string('gpu')
    table.string('disks')
    table.string('monitor')
    table.string('theme')
    table.string('computer')
    table.string('image')
  },
})