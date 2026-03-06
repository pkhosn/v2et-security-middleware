# V2ET Security Middleware

V2Board 免登中间件服务 - 专为分销商兑换场景设计

## 功能特性

- ✅ 免登查询用户信息
- ✅ 免登创建订单 + 自动注册
- ✅ 免登结算订单（支持 0 元兑换）
- ✅ 管理员权限代客操作
- ✅ 访问密码保护
- ✅ 支持加密转发（可选）

---

## 🚀 快速部署

### 前提条件

- ✅ 已有一台 Linux 服务器（Ubuntu/CentOS）
- ✅ 已安装 Docker 和 Docker Compose
- ✅ 已准备好 V2Board 管理员账号

### 步骤 1：拉取代码

```bash
# 克隆代码
git clone https://github.com/pkhosn/v2et-security-middleware 
cd /root/v2et-security-middleware
```

### 步骤 2：配置环境变量

```bash
# 复制示例配置
cp .env.example .env

# 编辑配置文件
vim .env
```

**必填配置：**
```bash
# 服务端口
PORT=3001

# V2Board 后端地址（必填）
BACKEND_DOMAIN=https://cs.example.com

# V2Board 后台管理路径（必填）
ADMIN_API_PREFIX=admin

# V2Board 管理员账号（必填）
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_secure_password

# 分销商后台访问密码（推荐设置）
DISTRIBUTOR_ACCESS_PASSWORD=YourAccessPassword123
```

### 步骤 3：启动服务 ⭐

```bash
# 启动容器
docker compose up -d

# 查看日志
docker compose logs -f

# 检查服务状态
curl http://localhost:3001/api/v1/distributor/status
```

预期响应：
```json
{
  "status": "ok",
  "tokenValid": true,
  "passwordProtected": true,
  "timestamp": 1234567890
}
```

---

## 🔄 更新与维护

### 可能需要修改的文件

| 文件 | 用途 | 修改后操作 |
|------|------|-----------|
| `.env` | 修改 V2Board 地址、管理员账号、访问密码等 | 重启容器 |
| `docker compose.yml` | 修改端口、环境变量等 | 重新部署 |
| 源代码 | 修改 API 逻辑、功能等 | 重新构建并部署 |

### 场景 1：修改 `.env` 配置

```bash
# 1. 编辑配置
cd /opt/v2et-security-middleware
vim .env

# 2. 重启容器（让新配置生效）
docker compose restart

# 3. 验证
curl http://localhost:3001/api/v1/distributor/status
```

**常见修改：**
- 修改 V2Board 后端地址 → `BACKEND_DOMAIN`
- 修改访问密码 → `DISTRIBUTOR_ACCESS_PASSWORD`
- 修改管理员账号 → `ADMIN_EMAIL` / `ADMIN_PASSWORD`

---

### 场景 2：修改 `docker compose.yml`

```bash
# 1. 编辑配置
vim docker compose.yml

# 2. 重新部署（让新配置生效）
docker compose down
docker compose up -d

# 3. 验证
docker compose ps
```

**常见修改：**
- 修改端口映射（如 `3001:3001` → `8080:3001`）
- 添加/修改环境变量

---

### 场景 3：更新代码（拉取最新代码）

```bash
# 1. 进入项目目录
cd /opt/v2et-security-middleware

# 2. 备份 .env 文件（重要！）
cp .env .env.backup

# 3. 拉取最新代码
git pull

# 4. 恢复 .env 文件
cp .env.backup .env

# 5. 重新构建并启动
docker compose down
docker compose up -d --build

# 6. 验证
docker compose logs -f
```

---

### 场景 4：修改源代码后部署

```bash
# 1. 在本地修改代码
# 编辑 src/ 目录下的文件

# 2. 提交并推送到 GitHub
git add .
git commit -m "修改说明"
git push

# 3. 在服务器上更新
cd /opt/v2et-security-middleware
git pull
docker compose down
docker compose up -d --build

# 4. 验证
curl http://localhost:3001/api/v1/distributor/status
```

---

### 常用命令速查

```bash
# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f

# 重启服务
docker compose restart

# 停止服务
docker compose down

# 启动服务
docker compose up -d

# 重新构建
docker compose up -d --build

# 删除容器和数据
docker compose down -v
```

---

### 步骤 4：Node.js 部署（备选）⚠️

> ⚠️ 此方式作为备选方案，推荐优先使用 Docker Compose

```bash
# 1. 安装依赖
npm install

# 2. 编译
npm run build

# 3. 启动服务
npm start
```

**后台运行（使用 PM2）：**

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start dist/index.js --name v2et-middleware

# 开机自启
pm2 startup
pm2 save

# 查看日志
pm2 logs v2et-middleware
```

---

## 📡 API 接口

### 1. 检查服务状态
```bash
GET /api/v1/distributor/status

# 响应
{
  "status": "ok",
  "tokenValid": true,
  "passwordProtected": true,
  "timestamp": 1234567890
}
```

### 2. 访问验证
```bash
POST /api/v1/distributor/auth
Content-Type: application/json

{
  "password": "your_access_password"
}

# 响应
{
  "success": true,
  "token": "sess_xxx"
}
```

### 3. 查询用户信息
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

### 4. 获取套餐列表
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

### 5. 验证优惠券
```bash
POST /api/v1/distributor/coupon/check
Content-Type: application/json

{
  "code": "COUPON123",
  "plan_id": 1,
  "period": "month_price"
}
```

### 6. 执行兑换（核心接口）
```bash
POST /api/v1/distributor/exchange
Content-Type: application/json

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

---

## ⚙️ 环境变量说明

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `PORT` | 否 | 服务端口，默认 3001 |
| `BACKEND_DOMAIN` | 是 | V2Board 后端地址 |
| `ADMIN_API_PREFIX` | 是 | V2Board 后台路径（如 admin） |
| `ADMIN_EMAIL` | 是 | V2Board 管理员邮箱 |
| `ADMIN_PASSWORD` | 是 | V2Board 管理员密码 |
| `DISTRIBUTOR_ACCESS_PASSWORD` | 否 | 分销商后台访问密码 |

---

## 🔒 安全说明

⚠️ **重要**: 本中间件需要 V2Board 管理员权限，请妥善保管管理员账号信息！

### 安全最佳实践

1. **不要将 `.env` 文件提交到 Git**
   - 项目已配置 `.gitignore`，自动忽略 `.env`
   - 推送代码前请确认：`git status` 中不显示 `.env`

2. **防火墙配置**
   - 只允许信任的 IP 访问中间件端口
   ```bash
   # UFW 示例
   ufw allow from 192.168.1.0/24 to any port 3001
   ```

3. **管理员账号权限收敛**（推荐）
   - 创建专用的分销商管理员账号
   - 仅授予「订单管理」和「用户管理」权限

4. **网络隔离**
   - 中间件服务不要直接暴露在公网
   - 通过内网或 VPN 访问

### 🛡️ 检查清单

部署前请确认：
- [ ] `.env` 文件未提交到 Git
- [ ] 服务状态接口返回正常
- [ ] 管理员 Token 初始化成功（日志显示 `SUCCESS`）
- [ ] 防火墙已配置
- [ ] 已备份 `.env` 配置文件

---

## 🩺 故障排查

### 1. 服务无法启动

```bash
# Docker 方式
docker compose logs -f

# Node.js 方式
pm2 logs v2et-middleware
```

### 2. Token 初始化失败

检查：
- `ADMIN_EMAIL` 和 `ADMIN_PASSWORD` 是否正确
- `ADMIN_API_PREFIX` 路径是否正确
- 管理员能否正常登录 V2Board 后台

### 3. 端口被占用

```bash
# 查看占用端口的进程
lsof -ti:3001

# 杀死进程
lsof -ti:3001 | xargs kill -9

# 重启服务
docker compose restart
```

---

## 💻 开发说明

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
# 安装依赖
npm install

# 开发模式
npm run dev

# 访问 http://localhost:3001/api/v1/distributor/status
```

---

## 🆘 需要帮助？

遇到问题请提供：
1. 部署方式（Docker/Node.js）
2. 错误日志
3. V2Board 版本

---

## License

MIT
