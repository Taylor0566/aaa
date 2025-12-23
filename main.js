// main.js - 应用入口（精简版）
import { createSSRApp } from 'vue'
import App from './App.uvue'

// 如果你后续需要状态管理（Pinia/Vuex），再取消下面的注释
// import store from './store'
// import api from './utils/api'

export function createApp() {
  const app = createSSRApp(App)
  
  // ===== 暂时禁用：状态管理 =====
  // app.use(store)

  // ===== 暂时禁用：全局 API =====
  // app.config.globalProperties.$api = api

  // ===== 暂时禁用：全局过滤器 =====
  // app.config.globalProperties.$filters = {
  //   formatTime(timestamp) {
  //     if (!timestamp) return ''
  //     const date = new Date(timestamp)
  //     return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
  //   },
  //   formatSize(bytes) {
  //     if (bytes === 0) return '0 B'
  //     const k = 1024
  //     const sizes = ['B', 'KB', 'MB', 'GB']
  //     const i = Math.floor(Math.log(bytes) / Math.log(k))
  //     return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  //   },
  //   truncate(text, length = 50) {
  //     if (!text) return ''
  //     if (text.length <= length) return text
  //     return text.substring(0, length) + '...'
  //   }
  // }

  // ===== 暂时禁用：自动注册 components/*.vue =====
  // const components = import.meta.globEager('./components/*.vue')
  // Object.entries(components).forEach(([path, component]) => {
  //   const name = path.split('/').pop().replace('.vue', '')
  //   app.component(name, component.default)
  // })

  return { app }
}