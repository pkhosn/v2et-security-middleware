import dotenv from 'dotenv'
dotenv.config()

export const port = Number(process.env.PORT) || 3001
export const backendDomain = process.env.BACKEND_DOMAIN || ''
export const adminApiPrefix = process.env.ADMIN_API_PREFIX || ''
export const adminEmail = process.env.ADMIN_EMAIL || ''
export const adminPassword = process.env.ADMIN_PASSWORD || ''

// 分销商后台访问密码（可选）
// 只有当环境变量明确设置且非空时才启用密码验证
export const distributorAccessPassword = process.env.DISTRIBUTOR_ACCESS_PASSWORD?.trim() || undefined

// 可选配置
export const mailHost = process.env.MAIL_HOST || ''
export const mailPort = process.env.MAIL_PORT || ''
export const mailUser = process.env.MAIL_USER || ''
export const mailPass = process.env.MAIL_PASS || ''

// 验证必要环境变量
if (!backendDomain) {
  console.warn('⚠️  警告：BACKEND_DOMAIN 未设置，中间件无法工作')
}
if (!adminApiPrefix || !adminEmail || !adminPassword) {
  console.warn('⚠️  警告：管理员配置未设置，免登功能将不可用')
}

// 检查访问密码设置
if (distributorAccessPassword) {
  console.log('🔒 分销商后台访问密码已启用')
} else {
  console.log('🔓 分销商后台访问密码未设置（无需验证）')
}
