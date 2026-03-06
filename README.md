# V2ET Security Middleware

V2Board 免登中间件服务 - 专为分销商兑换场景设计

## 功能特性

- ✅ 免登查询用户信息
- ✅ 免登创建订单 + 自动注册
- ✅ 免登结算订单（支持 0 元兑换）
- ✅ 管理员权限代客操作
- ✅ 支持加密转发（可选）
- ✅ 支持邮件通知（可选）

## 快速部署

### 方式一：Docker Compose（推荐）

```bash
# 1. 复制环境变量配置
cp .env.example .env

# 2. 编辑 .env 文件
vim .env
# 必须配置：
# - BACKEND_DOMAIN=https://your-v2board.com
# - ADMIN_API_PREFIX=admin  # V2Board 后台路径
# - ADMIN_EMAIL=admin@example.com
# - ADMIN_PASSWORD=your_password

# 3. 启动服务
docker-compose up -d

# 4. 查看日志
docker-compose logs -f
```

### 方式二：Node.js 直接运行

```bash
# 1. 安装依赖
yarn install

# 2. 配置环境变量
cp .env.example .env
vim .env

# 3. 开发模式
yarn dev

# 4. 生产模式
yarn build
yarn start
```

## API 接口

### 1. 查询用户信息
```bash
POST /api/v1/distributor/user/query
Content-Type: application/json

{
  "email": "user@example.com"
}

# 响应
{
  "success": true,
  "data": {
    "id": 123,
    "email": "user@example.com",
    "plan_id": 1,
    "transfer_enable": 32212254720,
    "used": 10737418240,
    "expired_at": 1712345678
  }
}
```

### 2. 获取套餐列表
```bash
POST /api/v1/distributor/plan/fetch

# 响应
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "月费套餐",
      "month_price": 3000,
      "quarter_price": null,
      "year_price": 30000
    }
  ]
}
```

### 3. 验证优惠券
```bash
POST /api/v1/distributor/coupon/check
{
  "code": "COUPON123",
  "plan_id": 1,
  "period": "month_price"
}
```

### 4. 执行兑换（核心接口）
```bash
POST /api/v1/distributor/exchange
{
  "email": "user@example.com",
  "plan_id": 1,
  "period": "month_price",
  "coupon_code": "COUPON123"
}

# 响应
{
  "success": true,
  "message": "兑换成功",
  "data": {
    "userId": 123,
    "tradeNo": "20260305123456789"
  }
}
```

## 环境变量说明

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `PORT` | 否 | 服务端口，默认 3001 |
| `BACKEND_DOMAIN` | 是 | V2Board 后端地址 |
| `ADMIN_API_PREFIX` | 是 | V2Board 后台路径（如 admin） |
| `ADMIN_EMAIL` | 是 | V2Board 管理员邮箱 |
| `ADMIN_PASSWORD` | 是 | V2Board 管理员密码 |
| `MAIL_HOST` | 否 | SMTP 服务器地址 |
| `MAIL_PORT` | 否 | SMTP 端口 |
| `MAIL_USER` | 否 | SMTP 用户名 |
| `MAIL_PASS` | 否 | SMTP 密码 |

## 安全说明

⚠️ **重要**: 本中间件需要 V2Board 管理员权限，请妥善保管管理员账号信息！

### 🔒 安全最佳实践

1. **不要将 `.env` 文件提交到 Git**
   - 项目已配置 `.gitignore`，自动忽略 `.env`
   - 推送代码前请确认：`git status` 中不显示 `.env`

2. **生产环境部署**
   - 建议使用 Docker 部署，通过环境变量注入配置
   - 配置防火墙，只允许信任的 IP 访问中间件端口
   - 使用 HTTPS 反向代理（Nginx/Caddy）

3. **管理员账号权限收敛**（推荐）
   - 创建专用的分销商管理员账号
   - 仅授予订单相关权限，不开放其他管理功能

4. **网络隔离**
   - 中间件服务不要直接暴露在公网
   - 通过内网或 VPN 访问

### 🛡️ 检查清单

部署前请确认：
- [ ] `.env` 文件已添加到 `.gitignore`
- [ ] `git status` 不显示 `.env` 文件
- [ ] 管理员账号密码已修改为强密码
- [ ] 防火墙已配置（如 UFW/iptables）
- [ ] 生产环境使用 HTTPS

## 开发说明

### 项目结构
```
src/
├── index.ts              # 入口文件
├── env.ts                # 环境变量配置
├── routes.ts             # 路由定义
└── services/
    └── backend.ts        # V2Board API 对接
```

### 本地调试
```bash
yarn dev
# 访问 http://localhost:3001/api/v1/distributor/status
```

## License

MIT
