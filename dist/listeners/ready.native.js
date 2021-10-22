import figlet from "figlet";
import boxen from "boxen";
import chalk from "chalk";
import contexts, { Cache as ContextCache } from "../tables/contexts.js";
import * as app from "../app.js";
const listener = {
  event: "ready",
  description: "Prepares bot cache and information after log-in",
  once: true,
  async run() {
    app.log(`Ok i'm ready! ${chalk.blue("My default prefix is")} ${chalk.bgBlueBright.black(process.env.BOT_PREFIX)}`);
    figlet(app.fetchPackageJson().name, (err, value) => {
      if (err)
        return;
      console.log(boxen(chalk.blueBright(value), {
        float: "center",
        borderStyle: {
          topLeft: " ",
          topRight: " ",
          bottomLeft: " ",
          bottomRight: " ",
          horizontal: " ",
          vertical: " "
        }
      }));
    });
    contexts.query.select("*").then(async (rows) => {
      for (const i in rows) {
        const row = rows[i];
        ContextCache.push({ keyword: row.keyword, response: row.response });
      }
    });
  }
};
var ready_native_default = listener;
export {
  ready_native_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2xpc3RlbmVycy9yZWFkeS5uYXRpdmUudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCBmaWdsZXQgZnJvbSBcImZpZ2xldFwiXHJcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCJcclxuaW1wb3J0IGJveGVuIGZyb20gXCJib3hlblwiXHJcbmltcG9ydCBjaGFsayBmcm9tIFwiY2hhbGtcIlxyXG5pbXBvcnQgY29udGV4dHMsIHtDYWNoZSBhcyBDb250ZXh0Q2FjaGV9IGZyb20gXCIuLi90YWJsZXMvY29udGV4dHMuanNcIlxyXG5cclxuaW1wb3J0ICogYXMgYXBwIGZyb20gXCIuLi9hcHAuanNcIlxyXG5cclxuY29uc3QgbGlzdGVuZXI6IGFwcC5MaXN0ZW5lcjxcInJlYWR5XCI+ID0ge1xyXG4gIGV2ZW50OiBcInJlYWR5XCIsXHJcbiAgZGVzY3JpcHRpb246IFwiUHJlcGFyZXMgYm90IGNhY2hlIGFuZCBpbmZvcm1hdGlvbiBhZnRlciBsb2ctaW5cIixcclxuICBvbmNlOiB0cnVlLFxyXG4gIGFzeW5jIHJ1bigpIHtcclxuICAgIGFwcC5sb2coXHJcbiAgICAgIGBPayBpJ20gcmVhZHkhICR7Y2hhbGsuYmx1ZShcclxuICAgICAgICBcIk15IGRlZmF1bHQgcHJlZml4IGlzXCJcclxuICAgICAgKX0gJHtjaGFsay5iZ0JsdWVCcmlnaHQuYmxhY2socHJvY2Vzcy5lbnYuQk9UX1BSRUZJWCl9YFxyXG4gICAgKVxyXG4gICAgZmlnbGV0KGFwcC5mZXRjaFBhY2thZ2VKc29uKCkubmFtZSwgKGVyciwgdmFsdWUpID0+IHtcclxuICAgICAgaWYgKGVycikgcmV0dXJuXHJcbiAgICAgIGNvbnNvbGUubG9nKFxyXG4gICAgICAgIGJveGVuKGNoYWxrLmJsdWVCcmlnaHQodmFsdWUpLCB7XHJcbiAgICAgICAgICBmbG9hdDogXCJjZW50ZXJcIixcclxuICAgICAgICAgIGJvcmRlclN0eWxlOiB7XHJcbiAgICAgICAgICAgIHRvcExlZnQ6IFwiIFwiLFxyXG4gICAgICAgICAgICB0b3BSaWdodDogXCIgXCIsXHJcbiAgICAgICAgICAgIGJvdHRvbUxlZnQ6IFwiIFwiLFxyXG4gICAgICAgICAgICBib3R0b21SaWdodDogXCIgXCIsXHJcbiAgICAgICAgICAgIGhvcml6b250YWw6IFwiIFwiLFxyXG4gICAgICAgICAgICB2ZXJ0aWNhbDogXCIgXCIsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0pXHJcbiAgICAgIClcclxuICAgIH0pXHJcblxyXG4gICAgLy8gU2VlZHMgY29udGV4dCBjYWNoZVxyXG4gICAgY29udGV4dHMucXVlcnlcclxuICAgICAgLnNlbGVjdCgnKicpXHJcbiAgICAgIC50aGVuKCBhc3luYyByb3dzID0+IHtcclxuICAgICAgICBmb3IoIGNvbnN0IGkgaW4gcm93cykge1xyXG4gICAgICAgICAgY29uc3Qgcm93ID0gcm93c1tpXVxyXG4gICAgICAgICAgQ29udGV4dENhY2hlLnB1c2goe2tleXdvcmQ6IHJvdy5rZXl3b3JkLCByZXNwb25zZTogcm93LnJlc3BvbnNlfSlcclxuICAgICAgICB9XHJcbiAgICAgIH0pXHJcbiAgICBcclxuICAgIFxyXG4gIH0sXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGxpc3RlbmVyXHJcbiJdLAogICJtYXBwaW5ncyI6ICJBQUFBO0FBRUE7QUFDQTtBQUNBO0FBRUE7QUFFQSxNQUFNLFdBQWtDO0FBQUEsRUFDdEMsT0FBTztBQUFBLEVBQ1AsYUFBYTtBQUFBLEVBQ2IsTUFBTTtBQUFBLFFBQ0EsTUFBTTtBQUNWLFFBQUksSUFDRixpQkFBaUIsTUFBTSxLQUNyQiwyQkFDRyxNQUFNLGFBQWEsTUFBTSxRQUFRLElBQUk7QUFFNUMsV0FBTyxJQUFJLG1CQUFtQixNQUFNLENBQUMsS0FBSyxVQUFVO0FBQ2xELFVBQUk7QUFBSztBQUNULGNBQVEsSUFDTixNQUFNLE1BQU0sV0FBVyxRQUFRO0FBQUEsUUFDN0IsT0FBTztBQUFBLFFBQ1AsYUFBYTtBQUFBLFVBQ1gsU0FBUztBQUFBLFVBQ1QsVUFBVTtBQUFBLFVBQ1YsWUFBWTtBQUFBLFVBQ1osYUFBYTtBQUFBLFVBQ2IsWUFBWTtBQUFBLFVBQ1osVUFBVTtBQUFBO0FBQUE7QUFBQTtBQU9sQixhQUFTLE1BQ04sT0FBTyxLQUNQLEtBQU0sT0FBTSxTQUFRO0FBQ25CLGlCQUFXLEtBQUssTUFBTTtBQUNwQixjQUFNLE1BQU0sS0FBSztBQUNqQixxQkFBYSxLQUFLLEVBQUMsU0FBUyxJQUFJLFNBQVMsVUFBVSxJQUFJO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFRakUsSUFBTyx1QkFBUTsiLAogICJuYW1lcyI6IFtdCn0K
