import * as app from "../app.js";
var gnu_default = new app.Command({
  name: "gnu",
  description: "Interjects for a moment.",
  channelType: "all",
  async run(message) {
    return message.send("**I'd just like to interject for a moment.**\nWhat you're refering to as Linux, is in fact, **GNU/Linux**, or as I've recently taken to calling it, **GNU plus Linux**.\nLinux is not an operating system unto itself, but rather another free component of a fully functioning GNU system made useful by the GNU corelibs, shell utilities and vital system components comprising a full OS as defined by POSIX.");
  }
});
export {
  gnu_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2NvbW1hbmRzL2dudS50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0ICogYXMgYXBwIGZyb20gXCIuLi9hcHAuanNcIlxyXG5cclxuZXhwb3J0IGRlZmF1bHQgbmV3IGFwcC5Db21tYW5kKHtcclxuICBuYW1lOiBcImdudVwiLFxyXG4gIGRlc2NyaXB0aW9uOiBcIkludGVyamVjdHMgZm9yIGEgbW9tZW50LlwiLFxyXG4gIGNoYW5uZWxUeXBlOiBcImFsbFwiLFxyXG4gIGFzeW5jIHJ1bihtZXNzYWdlKSB7XHJcbiAgICAvLyB0b2RvOiBjb2RlIGhlcmVcclxuICAgIHJldHVybiBtZXNzYWdlLnNlbmQoXCIqKkknZCBqdXN0IGxpa2UgdG8gaW50ZXJqZWN0IGZvciBhIG1vbWVudC4qKlxcbldoYXQgeW91J3JlIHJlZmVyaW5nIHRvIGFzIExpbnV4LCBpcyBpbiBmYWN0LCAqKkdOVS9MaW51eCoqLCBvciBhcyBJJ3ZlIHJlY2VudGx5IHRha2VuIHRvIGNhbGxpbmcgaXQsICoqR05VIHBsdXMgTGludXgqKi5cXG5MaW51eCBpcyBub3QgYW4gb3BlcmF0aW5nIHN5c3RlbSB1bnRvIGl0c2VsZiwgYnV0IHJhdGhlciBhbm90aGVyIGZyZWUgY29tcG9uZW50IG9mIGEgZnVsbHkgZnVuY3Rpb25pbmcgR05VIHN5c3RlbSBtYWRlIHVzZWZ1bCBieSB0aGUgR05VIGNvcmVsaWJzLCBzaGVsbCB1dGlsaXRpZXMgYW5kIHZpdGFsIHN5c3RlbSBjb21wb25lbnRzIGNvbXByaXNpbmcgYSBmdWxsIE9TIGFzIGRlZmluZWQgYnkgUE9TSVguXCIpXHJcbiAgfVxyXG59KSJdLAogICJtYXBwaW5ncyI6ICJBQUFBO0FBRUEsSUFBTyxjQUFRLElBQUksSUFBSSxRQUFRO0FBQUEsRUFDN0IsTUFBTTtBQUFBLEVBQ04sYUFBYTtBQUFBLEVBQ2IsYUFBYTtBQUFBLFFBQ1AsSUFBSSxTQUFTO0FBRWpCLFdBQU8sUUFBUSxLQUFLO0FBQUE7QUFBQTsiLAogICJuYW1lcyI6IFtdCn0K