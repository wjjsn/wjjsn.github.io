import { sidebar } from "vuepress-theme-hope";

export default sidebar({
  "/posts/": [
    {
      text: "技术文章",
      icon: "book",
      prefix: "",
      children: "structure",
    },
    "intro",
  ],
  "/": ["intro"],
});
