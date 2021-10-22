import * as app from "../app.js";
var dotfiles_default = new app.Table({
  name: "dotfiles",
  description: "The dotfiles table",
  setup: (table) => {
    table.string("showcase_id").notNullable().unique().primary();
    table.string("user_id").notNullable();
    table.string("artist_id").nullable();
    table.string("deviantart").nullable();
    table.string("message_id").notNullable();
    table.string("theme").nullable();
    table.string("theme_url").nullable();
    table.string("icon").nullable();
    table.string("icon_url").nullable();
    table.string("wallpaper_url").nullable();
    table.string("extras").nullable();
    table.increments("showcase_id");
  }
});
export {
  dotfiles_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL3RhYmxlcy9kb3RmaWxlcy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0ICogYXMgYXBwIGZyb20gXCIuLi9hcHAuanNcIlxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBEb3RmaWxlcyB7XHJcbiAgLy8gdHlwZSBvZiB0YWJsZVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBuZXcgYXBwLlRhYmxlPERvdGZpbGVzPih7XHJcbiAgbmFtZTogXCJkb3RmaWxlc1wiLFxyXG4gIGRlc2NyaXB0aW9uOiBcIlRoZSBkb3RmaWxlcyB0YWJsZVwiLFxyXG4gIHNldHVwOiAodGFibGUpID0+IHtcclxuICAgIHRhYmxlLnN0cmluZygnc2hvd2Nhc2VfaWQnKS5ub3ROdWxsYWJsZSgpLnVuaXF1ZSgpLnByaW1hcnkoKVxyXG4gICAgdGFibGUuc3RyaW5nKCd1c2VyX2lkJykubm90TnVsbGFibGUoKVxyXG4gICAgdGFibGUuc3RyaW5nKCdhcnRpc3RfaWQnKS5udWxsYWJsZSgpXHJcbiAgICB0YWJsZS5zdHJpbmcoJ2RldmlhbnRhcnQnKS5udWxsYWJsZSgpXHJcbiAgICB0YWJsZS5zdHJpbmcoJ21lc3NhZ2VfaWQnKS5ub3ROdWxsYWJsZSgpXHJcbiAgICB0YWJsZS5zdHJpbmcoJ3RoZW1lJykubnVsbGFibGUoKVxyXG4gICAgdGFibGUuc3RyaW5nKCd0aGVtZV91cmwnKS5udWxsYWJsZSgpXHJcbiAgICB0YWJsZS5zdHJpbmcoJ2ljb24nKS5udWxsYWJsZSgpXHJcbiAgICB0YWJsZS5zdHJpbmcoJ2ljb25fdXJsJykubnVsbGFibGUoKVxyXG4gICAgdGFibGUuc3RyaW5nKCd3YWxscGFwZXJfdXJsJykubnVsbGFibGUoKVxyXG4gICAgdGFibGUuc3RyaW5nKCdleHRyYXMnKS5udWxsYWJsZSgpXHJcblxyXG4gICAgdGFibGUuaW5jcmVtZW50cygnc2hvd2Nhc2VfaWQnKVxyXG4gIH0sXHJcbn0pIl0sCiAgIm1hcHBpbmdzIjogIkFBQUE7QUFNQSxJQUFPLG1CQUFRLElBQUksSUFBSSxNQUFnQjtBQUFBLEVBQ3JDLE1BQU07QUFBQSxFQUNOLGFBQWE7QUFBQSxFQUNiLE9BQU8sQ0FBQyxVQUFVO0FBQ2hCLFVBQU0sT0FBTyxlQUFlLGNBQWMsU0FBUztBQUNuRCxVQUFNLE9BQU8sV0FBVztBQUN4QixVQUFNLE9BQU8sYUFBYTtBQUMxQixVQUFNLE9BQU8sY0FBYztBQUMzQixVQUFNLE9BQU8sY0FBYztBQUMzQixVQUFNLE9BQU8sU0FBUztBQUN0QixVQUFNLE9BQU8sYUFBYTtBQUMxQixVQUFNLE9BQU8sUUFBUTtBQUNyQixVQUFNLE9BQU8sWUFBWTtBQUN6QixVQUFNLE9BQU8saUJBQWlCO0FBQzlCLFVBQU0sT0FBTyxVQUFVO0FBRXZCLFVBQU0sV0FBVztBQUFBO0FBQUE7IiwKICAibmFtZXMiOiBbXQp9Cg==
