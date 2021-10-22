import * as app from "../app.js"

export default new app.Command({
  name: "gnu",
  description: "Interjects for a moment.",
  channelType: "all",
  async run(message) {
    // todo: code here
    return message.send("**I'd just like to interject for a moment.**\nWhat you're refering to as Linux, is in fact, **GNU/Linux**, or as I've recently taken to calling it, **GNU plus Linux**.\nLinux is not an operating system unto itself, but rather another free component of a fully functioning GNU system made useful by the GNU corelibs, shell utilities and vital system components comprising a full OS as defined by POSIX.")
  }
})