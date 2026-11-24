import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Aim, Plus, View, Download, Delete } from '@element-plus/icons-vue'
// 函数式组件 ElMessage 的样式需手动引入（模板内组件样式由按需解析器自动注入）
import 'element-plus/es/components/message/style/css'
import App from './App.vue'
import router from './router'
import './assets/main.css'

const app = createApp(App)

// 仅注册实际用到的图标，避免全量打包图标库
const icons = { Aim, Plus, View, Download, Delete }
for (const [name, comp] of Object.entries(icons)) {
  app.component(name, comp)
}

app.use(createPinia())
app.use(router)

app.mount('#app')
