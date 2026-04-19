import { defineUserConfig } from "vuepress";

import theme from "./theme.js";

export default defineUserConfig({
  base: "/",

  lang: "zh-CN",
  title: "嵌入式技术栈",
  description: "嵌入式开发学习笔记，涵盖ARM、RTOS、驱动开发、工具链等",

  head: [
    ["meta", { name: "google-site-verification", content: "nrt68nTtYzrWxAOALgMvQRyaJS1N0fcnotfgfR0Iyxk" }],
  ],

  theme,
});
