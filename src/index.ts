import Koa from 'koa'
import cors from '@koa/cors'
import bodyParser from 'koa-bodyparser'
import chalk from 'chalk'
import { router } from './routes'
import { port } from './env'
import { BackendService } from './services/backend'

// 创建 Koa 应用
const app = new Koa()

// 中间件
app.use(cors())  // 允许跨域
app.use(bodyParser())  // 解析请求体

// 路由
app.use(router.routes())
app.use(router.allowedMethods())

// 启动服务
app.listen(port, () => {
  console.log(chalk.bgGreen(' V2ET Security Middleware '), chalk.green('running on port'), port)
  console.log(chalk.gray('Backend Domain:'), process.env.BACKEND_DOMAIN)
  console.log(chalk.gray('Admin API Prefix:'), process.env.ADMIN_API_PREFIX)
  console.log(chalk.gray('Admin Email:'), process.env.ADMIN_EMAIL)
  
  // 初始化 BackendService（登录获取 admin token）
  BackendService.instance
})

// 优雅关闭
process.on('SIGTERM', () => {
  console.log(chalk.yellow('收到 SIGTERM 信号，正在关闭...'))
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log(chalk.yellow('收到 SIGINT 信号，正在关闭...'))
  process.exit(0)
})
