import * as app from "../app.js";
const Cache = [];
var contexts_default = new app.Table({
  name: "contexts",
  description: "The contexts table",
  setup: (table) => {
    table.string("keyword").unique();
    table.string("response").notNullable();
  }
});
export {
  Cache,
  contexts_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL3RhYmxlcy9jb250ZXh0cy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0ICogYXMgYXBwIGZyb20gXCIuLi9hcHAuanNcIlxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBDb250ZXh0cyB7XHJcbiAga2V5d29yZDogc3RyaW5nXHJcbiAgcmVzcG9uc2U6IHN0cmluZ1xyXG59XHJcblxyXG5leHBvcnQgdHlwZSBDb250ZXh0c0NhY2hlID0gQ29udGV4dHNbXVxyXG5cclxuZXhwb3J0IGNvbnN0IENhY2hlOiBDb250ZXh0c0NhY2hlID0gW11cclxuXHJcbmV4cG9ydCBkZWZhdWx0IG5ldyBhcHAuVGFibGU8Q29udGV4dHM+KHtcclxuICBuYW1lOiBcImNvbnRleHRzXCIsXHJcbiAgZGVzY3JpcHRpb246IFwiVGhlIGNvbnRleHRzIHRhYmxlXCIsXHJcbiAgc2V0dXA6ICh0YWJsZSkgPT4ge1xyXG4gICAgdGFibGUuc3RyaW5nKCdrZXl3b3JkJykudW5pcXVlKClcclxuICAgIHRhYmxlLnN0cmluZygncmVzcG9uc2UnKS5ub3ROdWxsYWJsZSgpXHJcbiAgfSxcclxufSkiXSwKICAibWFwcGluZ3MiOiAiQUFBQTtBQVNPLE1BQU0sUUFBdUI7QUFFcEMsSUFBTyxtQkFBUSxJQUFJLElBQUksTUFBZ0I7QUFBQSxFQUNyQyxNQUFNO0FBQUEsRUFDTixhQUFhO0FBQUEsRUFDYixPQUFPLENBQUMsVUFBVTtBQUNoQixVQUFNLE9BQU8sV0FBVztBQUN4QixVQUFNLE9BQU8sWUFBWTtBQUFBO0FBQUE7IiwKICAibmFtZXMiOiBbXQp9Cg==