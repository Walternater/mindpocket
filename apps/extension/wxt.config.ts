import { defineConfig } from "wxt"

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  dev: {
    server: {
      port: 3001,
    },
  },
  manifest: {
    name: "MindPocket",
    description: "Save web pages to MindPocket",
    // alarms/tabs：后台定时抓取 pending_browser 队列
    permissions: ["activeTab", "storage", "notifications", "alarms", "tabs"],
    host_permissions: ["<all_urls>"],
  },
})
