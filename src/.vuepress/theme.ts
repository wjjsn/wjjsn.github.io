import { hopeTheme } from "vuepress-theme-hope";

import navbar from "./navbar.js";
import sidebar from "./sidebar.js";

export default hopeTheme({
  hostname: "https://wjjsn.github.io",

  author: {
    name: "wjjsn",
    url: "https://wjjsn.github.io",
  },

  logo: "/assets/images/logo.png",

  repo: "wjjsn/wjjsn.github.io",

  docsDir: "src",

  navbar,
  sidebar,

  footer: "CC BY-NC-SA 4.0 | Copyright © 2026-present wjjsn",
  displayFooter: true,

  blog: {
    description: "踩坑折腾捣鼓瞎记录喵",
    intro: "/intro.html",
    medias: {
      GitHub: "https://github.com/wjjsn",
      Email: "mailto:wjjsn@qq.com",
    },
  },

  encrypt: {
    config: {},
  },

  metaLocales: {
    editLink: "在 GitHub 上编辑此页",
  },

  markdown: {
    align: true,
    attrs: true,
    codeTabs: true,
    component: true,
    demo: true,
    figure: true,
    gfm: true,
    imgLazyload: true,
    imgSize: true,
    include: true,
    mark: true,
    plantuml: true,
    spoiler: true,
    stylize: [
      {
        matcher: "Recommended",
        replacer: ({ tag }) => {
          if (tag === "em")
            return {
              tag: "Badge",
              attrs: { type: "tip" },
              content: "Recommended",
            };
        },
      },
    ],
    sub: true,
    sup: true,
    tabs: true,
    tasklist: true,
    vPre: true,
  },

  plugins: {
    blog: true,
    comment: {
      provider: "Giscus",
      repo: "wjjsn/wjjsn.github.io",       // 你的 GitHub 仓库
      repoId: "R_kgDOQfwz7A",                // 填入你在 giscus 官网生成的 Repo ID
      category: "Announcements",           // 你的讨论区分类，推荐 Announcements
      categoryId: "DIC_kwDOQfwz7M4C8_rc",        // 填入你在 giscus 官网生成的 Category ID
      mapping: "pathname",                 // 默认用路径映射
      lazyLoading: true,                   // 懒加载
      reactionsEnabled: true,              // 开启点赞表情
    },
    components: {
      components: ["Badge", "VPCard"],
    },

    icon: {
      prefix: "fa6-solid:",
    },
  },
});
