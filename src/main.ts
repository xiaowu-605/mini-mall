import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { registerDirectives } from './directives/permission'
import 'element-plus/theme-chalk/el-message.css'
import 'element-plus/theme-chalk/el-message-box.css'
import './styles/index.less'

const app = createApp(App)
app.use(createPinia())
app.use(router)
registerDirectives(app)
app.mount('#app')
