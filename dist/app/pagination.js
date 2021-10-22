import events from "events";
import * as core from "./core.js";
import * as logger from "./logger.js";
const _Paginator = class extends events.EventEmitter {
  constructor(options) {
    super();
    this.options = options;
    this._pageIndex = 0;
    this.emojis = {
      previous: "\u25C0\uFE0F",
      next: "\u25B6\uFE0F",
      start: "\u23EA",
      end: "\u23E9"
    };
    options.idleTime ??= 6e4;
    if (Array.isArray(options.pages)) {
      if (options.pages.length === 0) {
        options.pages.push(options.placeHolder ?? "Oops, no data found.");
      }
    }
    if (options.customEmojis)
      Object.assign(this.emojis, options.customEmojis);
    this._deactivation = this.resetDeactivationTimeout();
    this.getCurrentPage().then(async (page) => {
      const message = typeof page === "string" ? await options.channel.send(page) : await options.channel.send({ embeds: [page] });
      this._messageID = message.id;
      if (this.pageCount > 1 || this.pageCount === -1)
        for (const key of ["start", "previous", "next", "end"])
          await message.react(this.emojis[key]);
    });
    _Paginator.instances.push(this);
  }
  get pageIndex() {
    return this._pageIndex;
  }
  get messageID() {
    return this._messageID;
  }
  get pageCount() {
    return Array.isArray(this.options.pages) ? this.options.pages.length : this.options.pageCount ?? -1;
  }
  render() {
    this.getCurrentPage().then((page) => {
      if (this.messageID)
        if (typeof page === "string") {
          this.options.channel.messages.cache.get(this.messageID)?.edit(page).catch(logger.error);
        } else {
          this.options.channel.messages.cache.get(this.messageID)?.edit({ embeds: [page] }).catch(logger.error);
        }
    });
  }
  handleReaction(reaction, user) {
    if (this.options.filter && !this.options.filter(reaction, user))
      return;
    const { emoji } = reaction;
    const emojiID = emoji.id || emoji.name;
    let currentKey = null;
    for (const key in this.emojis) {
      if (this.emojis[key] === emojiID) {
        currentKey = key;
      }
    }
    if (currentKey) {
      switch (currentKey) {
        case "start":
          this._pageIndex = 0;
          break;
        case "end":
          if (this.pageCount === -1)
            return;
          this._pageIndex = this.pageCount - 1;
          break;
        case "next":
          this._pageIndex++;
          if (this.pageCount !== -1 && this.pageIndex > this.pageCount - 1) {
            this._pageIndex = 0;
          }
          break;
        case "previous":
          this._pageIndex--;
          if (this.pageCount !== -1) {
            if (this.pageIndex < 0) {
              this._pageIndex = this.pageCount - 1;
            }
          } else {
            this._pageIndex = 0;
          }
      }
      this.render();
      this._deactivation = this.resetDeactivationTimeout();
      reaction.users.remove(user).catch();
    }
  }
  resetDeactivationTimeout() {
    if (this.options.idleTime === "none")
      return;
    clearTimeout(this._deactivation);
    return setTimeout(() => this.deactivate().catch(), this.options.idleTime);
  }
  async getCurrentPage() {
    if (Array.isArray(this.options.pages)) {
      return this.options.pages[this.pageIndex];
    }
    const page = await this.options.pages(this.pageIndex, this.options.data);
    return page || this.options.placeHolder || "Oops, no data found";
  }
  async deactivate() {
    if (!this.messageID)
      return;
    clearTimeout(this._deactivation);
    const message = await this.options.channel.messages.cache.get(this.messageID);
    if (message && message.channel.isText())
      await message.reactions?.removeAll();
    _Paginator.instances = _Paginator.instances.filter((paginator) => {
      return paginator.messageID !== this.messageID;
    });
  }
  static getByMessage(message) {
    return this.instances.find((paginator) => {
      return paginator.messageID === message.id;
    });
  }
};
let Paginator = _Paginator;
Paginator.instances = [];
Paginator.divider = core.divider;
export {
  Paginator
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2FwcC9wYWdpbmF0aW9uLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgZXZlbnRzIGZyb20gXCJldmVudHNcIlxyXG5pbXBvcnQgZGlzY29yZCBmcm9tIFwiZGlzY29yZC5qc1wiXHJcbmltcG9ydCAqIGFzIGNvcmUgZnJvbSBcIi4vY29yZS5qc1wiXHJcbmltcG9ydCAqIGFzIGxvZ2dlciBmcm9tIFwiLi9sb2dnZXIuanNcIlxyXG5cclxuLyoqIEFzIFNub3dmbGFrZXMgb3IgaWNvbnMgKi9cclxuZXhwb3J0IGludGVyZmFjZSBQYWdpbmF0b3JFbW9qaXMge1xyXG4gIHByZXZpb3VzOiBzdHJpbmdcclxuICBuZXh0OiBzdHJpbmdcclxuICBzdGFydDogc3RyaW5nXHJcbiAgZW5kOiBzdHJpbmdcclxufVxyXG5cclxuZXhwb3J0IHR5cGUgUGFnZSA9IGRpc2NvcmQuTWVzc2FnZUVtYmVkIHwgc3RyaW5nXHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFBhZ2luYXRvck9wdGlvbnM8RGF0YSA9IHVuZGVmaW5lZD4ge1xyXG4gIGRhdGE/OiBEYXRhXHJcbiAgcGFnZXM6IFBhZ2VbXSB8ICgocGFnZUluZGV4OiBudW1iZXIsIGRhdGE6IERhdGEpID0+IFByb21pc2U8UGFnZT4gfCBQYWdlKVxyXG4gIHBhZ2VDb3VudD86IG51bWJlclxyXG4gIGNoYW5uZWw6XHJcbiAgICB8IGRpc2NvcmQuVGV4dENoYW5uZWxcclxuICAgIHwgZGlzY29yZC5ETUNoYW5uZWxcclxuICAgIHwgZGlzY29yZC5OZXdzQ2hhbm5lbFxyXG4gICAgfCBkaXNjb3JkLlRleHRCYXNlZENoYW5uZWxzXHJcbiAgZmlsdGVyPzogKFxyXG4gICAgcmVhY3Rpb246IGRpc2NvcmQuTWVzc2FnZVJlYWN0aW9uIHwgZGlzY29yZC5QYXJ0aWFsTWVzc2FnZVJlYWN0aW9uLFxyXG4gICAgdXNlcjogZGlzY29yZC5Vc2VyIHwgZGlzY29yZC5QYXJ0aWFsVXNlclxyXG4gICkgPT4gYm9vbGVhblxyXG4gIGlkbGVUaW1lPzogbnVtYmVyIHwgXCJub25lXCJcclxuICBjdXN0b21FbW9qaXM/OiBQYXJ0aWFsPFBhZ2luYXRvckVtb2ppcz5cclxuICBwbGFjZUhvbGRlcj86IFBhZ2VcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFBhZ2luYXRvciBleHRlbmRzIGV2ZW50cy5FdmVudEVtaXR0ZXIge1xyXG4gIHN0YXRpYyBpbnN0YW5jZXM6IFBhZ2luYXRvcltdID0gW11cclxuXHJcbiAgcHJpdmF0ZSBfcGFnZUluZGV4ID0gMFxyXG4gIHByaXZhdGUgX2RlYWN0aXZhdGlvbj86IE5vZGVKUy5UaW1lb3V0XHJcbiAgcHJpdmF0ZSBfbWVzc2FnZUlEOiBzdHJpbmcgfCB1bmRlZmluZWRcclxuXHJcbiAgcHVibGljIGVtb2ppczogUGFnaW5hdG9yRW1vamlzID0ge1xyXG4gICAgcHJldmlvdXM6IFwiXHUyNUMwXHVGRTBGXCIsXHJcbiAgICBuZXh0OiBcIlx1MjVCNlx1RkUwRlwiLFxyXG4gICAgc3RhcnQ6IFwiXHUyM0VBXCIsXHJcbiAgICBlbmQ6IFwiXHUyM0U5XCIsXHJcbiAgfVxyXG5cclxuICBnZXQgcGFnZUluZGV4KCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5fcGFnZUluZGV4XHJcbiAgfVxyXG5cclxuICBnZXQgbWVzc2FnZUlEKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuX21lc3NhZ2VJRFxyXG4gIH1cclxuXHJcbiAgZ2V0IHBhZ2VDb3VudCgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIEFycmF5LmlzQXJyYXkodGhpcy5vcHRpb25zLnBhZ2VzKVxyXG4gICAgICA/IHRoaXMub3B0aW9ucy5wYWdlcy5sZW5ndGhcclxuICAgICAgOiB0aGlzLm9wdGlvbnMucGFnZUNvdW50ID8/IC0xXHJcbiAgfVxyXG5cclxuICBjb25zdHJ1Y3RvcihwdWJsaWMgcmVhZG9ubHkgb3B0aW9uczogUGFnaW5hdG9yT3B0aW9ucykge1xyXG4gICAgc3VwZXIoKVxyXG5cclxuICAgIG9wdGlvbnMuaWRsZVRpbWUgPz89IDYwMDAwXHJcblxyXG4gICAgaWYgKEFycmF5LmlzQXJyYXkob3B0aW9ucy5wYWdlcykpIHtcclxuICAgICAgaWYgKG9wdGlvbnMucGFnZXMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgb3B0aW9ucy5wYWdlcy5wdXNoKG9wdGlvbnMucGxhY2VIb2xkZXIgPz8gXCJPb3BzLCBubyBkYXRhIGZvdW5kLlwiKVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKG9wdGlvbnMuY3VzdG9tRW1vamlzKSBPYmplY3QuYXNzaWduKHRoaXMuZW1vamlzLCBvcHRpb25zLmN1c3RvbUVtb2ppcylcclxuXHJcbiAgICB0aGlzLl9kZWFjdGl2YXRpb24gPSB0aGlzLnJlc2V0RGVhY3RpdmF0aW9uVGltZW91dCgpXHJcblxyXG4gICAgdGhpcy5nZXRDdXJyZW50UGFnZSgpLnRoZW4oYXN5bmMgKHBhZ2UpID0+IHtcclxuICAgICAgY29uc3QgbWVzc2FnZSA9XHJcbiAgICAgICAgdHlwZW9mIHBhZ2UgPT09IFwic3RyaW5nXCJcclxuICAgICAgICAgID8gYXdhaXQgb3B0aW9ucy5jaGFubmVsLnNlbmQocGFnZSlcclxuICAgICAgICAgIDogYXdhaXQgb3B0aW9ucy5jaGFubmVsLnNlbmQoeyBlbWJlZHM6IFtwYWdlXSB9KVxyXG5cclxuICAgICAgdGhpcy5fbWVzc2FnZUlEID0gbWVzc2FnZS5pZFxyXG5cclxuICAgICAgaWYgKHRoaXMucGFnZUNvdW50ID4gMSB8fCB0aGlzLnBhZ2VDb3VudCA9PT0gLTEpXHJcbiAgICAgICAgZm9yIChjb25zdCBrZXkgb2YgW1wic3RhcnRcIiwgXCJwcmV2aW91c1wiLCBcIm5leHRcIiwgXCJlbmRcIl0pXHJcbiAgICAgICAgICBhd2FpdCBtZXNzYWdlLnJlYWN0KHRoaXMuZW1vamlzW2tleSBhcyBrZXlvZiBQYWdpbmF0b3JFbW9qaXNdKVxyXG4gICAgfSlcclxuXHJcbiAgICBQYWdpbmF0b3IuaW5zdGFuY2VzLnB1c2godGhpcylcclxuICB9XHJcblxyXG4gIHByaXZhdGUgcmVuZGVyKCkge1xyXG4gICAgdGhpcy5nZXRDdXJyZW50UGFnZSgpLnRoZW4oKHBhZ2UpID0+IHtcclxuICAgICAgaWYgKHRoaXMubWVzc2FnZUlEKVxyXG4gICAgICAgIGlmICh0eXBlb2YgcGFnZSA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICAgICAgdGhpcy5vcHRpb25zLmNoYW5uZWwubWVzc2FnZXMuY2FjaGVcclxuICAgICAgICAgICAgLmdldCh0aGlzLm1lc3NhZ2VJRClcclxuICAgICAgICAgICAgPy5lZGl0KHBhZ2UpXHJcbiAgICAgICAgICAgIC5jYXRjaChsb2dnZXIuZXJyb3IpXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHRoaXMub3B0aW9ucy5jaGFubmVsLm1lc3NhZ2VzLmNhY2hlXHJcbiAgICAgICAgICAgIC5nZXQodGhpcy5tZXNzYWdlSUQpXHJcbiAgICAgICAgICAgID8uZWRpdCh7IGVtYmVkczogW3BhZ2VdIH0pXHJcbiAgICAgICAgICAgIC5jYXRjaChsb2dnZXIuZXJyb3IpXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxuICB9XHJcblxyXG4gIHB1YmxpYyBoYW5kbGVSZWFjdGlvbihcclxuICAgIHJlYWN0aW9uOiBkaXNjb3JkLk1lc3NhZ2VSZWFjdGlvbiB8IGRpc2NvcmQuUGFydGlhbE1lc3NhZ2VSZWFjdGlvbixcclxuICAgIHVzZXI6IGRpc2NvcmQuVXNlciB8IGRpc2NvcmQuUGFydGlhbFVzZXJcclxuICApIHtcclxuICAgIGlmICh0aGlzLm9wdGlvbnMuZmlsdGVyICYmICF0aGlzLm9wdGlvbnMuZmlsdGVyKHJlYWN0aW9uLCB1c2VyKSkgcmV0dXJuXHJcblxyXG4gICAgY29uc3QgeyBlbW9qaSB9ID0gcmVhY3Rpb25cclxuICAgIGNvbnN0IGVtb2ppSUQgPSBlbW9qaS5pZCB8fCBlbW9qaS5uYW1lXHJcblxyXG4gICAgbGV0IGN1cnJlbnRLZXk6IGtleW9mIFBhZ2luYXRvckVtb2ppcyB8IG51bGwgPSBudWxsXHJcbiAgICBmb3IgKGNvbnN0IGtleSBpbiB0aGlzLmVtb2ppcykge1xyXG4gICAgICBpZiAodGhpcy5lbW9qaXNba2V5IGFzIGtleW9mIFBhZ2luYXRvckVtb2ppc10gPT09IGVtb2ppSUQpIHtcclxuICAgICAgICBjdXJyZW50S2V5ID0ga2V5IGFzIGtleW9mIFBhZ2luYXRvckVtb2ppc1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGN1cnJlbnRLZXkpIHtcclxuICAgICAgc3dpdGNoIChjdXJyZW50S2V5KSB7XHJcbiAgICAgICAgY2FzZSBcInN0YXJ0XCI6XHJcbiAgICAgICAgICB0aGlzLl9wYWdlSW5kZXggPSAwXHJcbiAgICAgICAgICBicmVha1xyXG4gICAgICAgIGNhc2UgXCJlbmRcIjpcclxuICAgICAgICAgIGlmICh0aGlzLnBhZ2VDb3VudCA9PT0gLTEpIHJldHVyblxyXG4gICAgICAgICAgdGhpcy5fcGFnZUluZGV4ID0gdGhpcy5wYWdlQ291bnQgLSAxXHJcbiAgICAgICAgICBicmVha1xyXG4gICAgICAgIGNhc2UgXCJuZXh0XCI6XHJcbiAgICAgICAgICB0aGlzLl9wYWdlSW5kZXgrK1xyXG4gICAgICAgICAgaWYgKHRoaXMucGFnZUNvdW50ICE9PSAtMSAmJiB0aGlzLnBhZ2VJbmRleCA+IHRoaXMucGFnZUNvdW50IC0gMSkge1xyXG4gICAgICAgICAgICB0aGlzLl9wYWdlSW5kZXggPSAwXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBicmVha1xyXG4gICAgICAgIGNhc2UgXCJwcmV2aW91c1wiOlxyXG4gICAgICAgICAgdGhpcy5fcGFnZUluZGV4LS1cclxuICAgICAgICAgIGlmICh0aGlzLnBhZ2VDb3VudCAhPT0gLTEpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMucGFnZUluZGV4IDwgMCkge1xyXG4gICAgICAgICAgICAgIHRoaXMuX3BhZ2VJbmRleCA9IHRoaXMucGFnZUNvdW50IC0gMVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLl9wYWdlSW5kZXggPSAwXHJcbiAgICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMucmVuZGVyKClcclxuXHJcbiAgICAgIHRoaXMuX2RlYWN0aXZhdGlvbiA9IHRoaXMucmVzZXREZWFjdGl2YXRpb25UaW1lb3V0KClcclxuXHJcbiAgICAgIHJlYWN0aW9uLnVzZXJzLnJlbW92ZSh1c2VyIGFzIGRpc2NvcmQuVXNlcikuY2F0Y2goKVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSByZXNldERlYWN0aXZhdGlvblRpbWVvdXQoKSB7XHJcbiAgICBpZiAodGhpcy5vcHRpb25zLmlkbGVUaW1lID09PSBcIm5vbmVcIikgcmV0dXJuXHJcbiAgICBjbGVhclRpbWVvdXQodGhpcy5fZGVhY3RpdmF0aW9uIGFzIE5vZGVKUy5UaW1lb3V0KVxyXG4gICAgcmV0dXJuIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5kZWFjdGl2YXRlKCkuY2F0Y2goKSwgdGhpcy5vcHRpb25zLmlkbGVUaW1lKVxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBhc3luYyBnZXRDdXJyZW50UGFnZSgpIHtcclxuICAgIGlmIChBcnJheS5pc0FycmF5KHRoaXMub3B0aW9ucy5wYWdlcykpIHtcclxuICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5wYWdlc1t0aGlzLnBhZ2VJbmRleF1cclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBwYWdlID0gYXdhaXQgdGhpcy5vcHRpb25zLnBhZ2VzKHRoaXMucGFnZUluZGV4LCB0aGlzLm9wdGlvbnMuZGF0YSlcclxuXHJcbiAgICByZXR1cm4gcGFnZSB8fCB0aGlzLm9wdGlvbnMucGxhY2VIb2xkZXIgfHwgXCJPb3BzLCBubyBkYXRhIGZvdW5kXCJcclxuICB9XHJcblxyXG4gIHB1YmxpYyBhc3luYyBkZWFjdGl2YXRlKCkge1xyXG4gICAgaWYgKCF0aGlzLm1lc3NhZ2VJRCkgcmV0dXJuXHJcblxyXG4gICAgY2xlYXJUaW1lb3V0KHRoaXMuX2RlYWN0aXZhdGlvbiBhcyBOb2RlSlMuVGltZW91dClcclxuXHJcbiAgICAvLyByZW1vdmUgcmVhY3Rpb25zIGlmIG1lc3NhZ2UgaXMgbm90IGRlbGV0ZWQgYW5kIGlmIGlzIGluIGd1aWxkXHJcbiAgICBjb25zdCBtZXNzYWdlID0gYXdhaXQgdGhpcy5vcHRpb25zLmNoYW5uZWwubWVzc2FnZXMuY2FjaGUuZ2V0KFxyXG4gICAgICB0aGlzLm1lc3NhZ2VJRFxyXG4gICAgKVxyXG4gICAgaWYgKG1lc3NhZ2UgJiYgbWVzc2FnZS5jaGFubmVsLmlzVGV4dCgpKVxyXG4gICAgICBhd2FpdCBtZXNzYWdlLnJlYWN0aW9ucz8ucmVtb3ZlQWxsKClcclxuXHJcbiAgICBQYWdpbmF0b3IuaW5zdGFuY2VzID0gUGFnaW5hdG9yLmluc3RhbmNlcy5maWx0ZXIoKHBhZ2luYXRvcikgPT4ge1xyXG4gICAgICByZXR1cm4gcGFnaW5hdG9yLm1lc3NhZ2VJRCAhPT0gdGhpcy5tZXNzYWdlSURcclxuICAgIH0pXHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc3RhdGljIGdldEJ5TWVzc2FnZShcclxuICAgIG1lc3NhZ2U6IGRpc2NvcmQuTWVzc2FnZSB8IGRpc2NvcmQuUGFydGlhbE1lc3NhZ2VcclxuICApOiBQYWdpbmF0b3IgfCB1bmRlZmluZWQge1xyXG4gICAgcmV0dXJuIHRoaXMuaW5zdGFuY2VzLmZpbmQoKHBhZ2luYXRvcikgPT4ge1xyXG4gICAgICByZXR1cm4gcGFnaW5hdG9yLm1lc3NhZ2VJRCA9PT0gbWVzc2FnZS5pZFxyXG4gICAgfSlcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzdGF0aWMgZGl2aWRlciA9IGNvcmUuZGl2aWRlclxyXG59XHJcbiJdLAogICJtYXBwaW5ncyI6ICJBQUFBO0FBRUE7QUFDQTtBQThCTyxpQ0FBd0IsT0FBTyxhQUFhO0FBQUEsRUE0QmpELFlBQTRCLFNBQTJCO0FBQ3JEO0FBRDBCO0FBekJwQixzQkFBYTtBQUlkLGtCQUEwQjtBQUFB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
